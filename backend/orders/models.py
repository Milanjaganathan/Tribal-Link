"""
Orders App — Models
Order management with UPI and banking payment system.
"""
import uuid
from django.db import models
from django.conf import settings


class Order(models.Model):
    """A customer order containing one or more items."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        PROCESSING = 'processing', 'Processing'
        SHIPPED = 'shipped', 'Shipped'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'
        REFUNDED = 'refunded', 'Refunded'

    class PaymentMethod(models.TextChoices):
        UPI = 'upi', 'UPI'
        BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
        COD = 'cod', 'Cash on Delivery'
        CARD = 'card', 'Credit/Debit Card'

    class PaymentStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    # Order identification
    order_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
    )

    # Status tracking
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING,
    )

    # Payment information
    payment_method = models.CharField(
        max_length=15,
        choices=PaymentMethod.choices,
        default=PaymentMethod.COD,
    )
    payment_status = models.CharField(
        max_length=10,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    transaction_id = models.CharField(max_length=200, blank=True)

    # Financial
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Commission — platform keeps this percentage
    commission_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=10.00,
        help_text='Platform commission percentage (e.g. 10.00 = 10%)',
    )
    platform_commission = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text='Amount kept by the platform',
    )
    seller_payout = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text='Amount to be paid to the seller(s)',
    )
    payout_status = models.CharField(
        max_length=15, default='pending',
        choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed')],
    )

    # Shipping address
    shipping_name = models.CharField(max_length=200)
    shipping_phone = models.CharField(max_length=15)
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_pincode = models.CharField(max_length=10)

    # Notes
    notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Order {self.order_id} — {self.user.email}'

    def calculate_total(self):
        """Recalculate order total from items and compute commission split."""
        from decimal import Decimal
        self.subtotal = sum(item.subtotal for item in self.items.all())
        self.tax = self.subtotal * 0  # Set to 0 or configure GST
        self.total = self.subtotal + self.shipping_cost + self.tax
        # Calculate commission split
        self.platform_commission = (self.total * self.commission_rate / Decimal('100')).quantize(Decimal('0.01'))
        self.seller_payout = self.total - self.platform_commission
        self.save(update_fields=['subtotal', 'tax', 'total', 'platform_commission', 'seller_payout'])


class OrderItem(models.Model):
    """Individual item within an order."""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        related_name='order_items',
    )
    # Snapshot product data at time of order
    product_name = models.CharField(max_length=300)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    product_image = models.URLField(blank=True)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.product_name} x{self.quantity}'

    @property
    def subtotal(self):
        return self.product_price * self.quantity


class Payment(models.Model):
    """Payment record for an order."""

    class Status(models.TextChoices):
        INITIATED = 'initiated', 'Initiated'
        SUCCESS = 'success', 'Success'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='payments',
    )
    payment_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    method = models.CharField(max_length=15, choices=Order.PaymentMethod.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.INITIATED,
    )
    transaction_id = models.CharField(max_length=200, blank=True)

    # UPI specific
    upi_id = models.CharField(max_length=100, blank=True)

    # Bank transfer specific
    bank_name = models.CharField(max_length=200, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    ifsc_code = models.CharField(max_length=20, blank=True)

    # Metadata
    response_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Payment {self.payment_id} — ₹{self.amount} ({self.status})'


class SellerPayout(models.Model):
    """Tracks payouts from the platform to individual sellers."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    payout_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='seller_payouts',
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='payouts',
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    seller_upi_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.PENDING,
    )
    transaction_id = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Payout {self.payout_id} — ₹{self.amount} to {self.seller.email}'

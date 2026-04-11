"""
Notifications App — Models
In-app and email notification system with broadcast support.
"""
from django.db import models
from django.conf import settings


class Notification(models.Model):
    """In-app notification for users."""

    class NotificationType(models.TextChoices):
        ORDER_PLACED = 'order_placed', 'Order Placed'
        ORDER_CONFIRMED = 'order_confirmed', 'Order Confirmed'
        ORDER_SHIPPED = 'order_shipped', 'Order Shipped'
        ORDER_DELIVERED = 'order_delivered', 'Order Delivered'
        ORDER_CANCELLED = 'order_cancelled', 'Order Cancelled'
        PAYMENT_SUCCESS = 'payment_success', 'Payment Successful'
        PAYMENT_FAILED = 'payment_failed', 'Payment Failed'
        SELLER_APPROVED = 'seller_approved', 'Seller Approved'
        SELLER_REJECTED = 'seller_rejected', 'Seller Rejected'
        NEW_ORDER = 'new_order', 'New Order Received'
        NEW_REVIEW = 'new_review', 'New Review'
        PRODUCT_APPROVED = 'product_approved', 'Product Approved'
        PRODUCT_REJECTED = 'product_rejected', 'Product Rejected'
        BROADCAST = 'broadcast', 'Admin Broadcast'
        SYSTEM = 'system', 'System Notification'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )
    title = models.CharField(max_length=300)
    message = models.TextField()
    link = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} — {self.title}'

    @classmethod
    def send(cls, user, notification_type, title, message, link=''):
        """Helper to create and send a notification."""
        return cls.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            link=link,
        )

    @classmethod
    def broadcast(cls, title, message, link='', role=None):
        """Send notification to all users or users of a specific role."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.all()
        if role:
            users = users.filter(role=role)
        notifications = [
            cls(
                user=user,
                notification_type=cls.NotificationType.BROADCAST,
                title=title,
                message=message,
                link=link,
            )
            for user in users
        ]
        return cls.objects.bulk_create(notifications)

"""
Orders App — Admin Configuration
"""
from django.contrib import admin
from .models import Order, OrderItem, Payment, SellerPayout


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'product_name', 'product_price', 'product_image', 'quantity']


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ['payment_id', 'method', 'amount', 'status', 'transaction_id', 'created_at']


class SellerPayoutInline(admin.TabularInline):
    model = SellerPayout
    extra = 0
    readonly_fields = ['payout_id', 'seller', 'amount', 'commission_amount', 'commission_rate', 'seller_upi_id', 'status', 'created_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_id', 'user', 'status', 'payment_method',
        'payment_status', 'total', 'platform_commission', 'seller_payout',
        'payout_status', 'created_at',
    ]
    list_filter = ['status', 'payment_method', 'payment_status', 'payout_status', 'created_at']
    search_fields = ['order_id', 'user__email', 'shipping_name', 'shipping_phone']
    list_editable = ['status', 'payout_status']
    readonly_fields = [
        'order_id', 'user', 'subtotal', 'tax', 'total',
        'platform_commission', 'seller_payout', 'commission_rate',
        'created_at', 'updated_at',
    ]
    inlines = [OrderItemInline, PaymentInline, SellerPayoutInline]

    actions = ['mark_shipped', 'mark_delivered', 'mark_payouts_completed']

    @admin.action(description='Mark as Shipped')
    def mark_shipped(self, request, queryset):
        from django.utils import timezone
        queryset.filter(status__in=['confirmed', 'processing']).update(
            status='shipped', shipped_at=timezone.now()
        )

    @admin.action(description='Mark as Delivered')
    def mark_delivered(self, request, queryset):
        from django.utils import timezone
        queryset.filter(status='shipped').update(
            status='delivered', delivered_at=timezone.now()
        )

    @admin.action(description='Mark Seller Payouts as Completed')
    def mark_payouts_completed(self, request, queryset):
        from django.utils import timezone
        for order in queryset.filter(payout_status='pending'):
            order.payout_status = 'completed'
            order.save(update_fields=['payout_status'])
            order.seller_payouts.filter(status='pending').update(
                status='completed', completed_at=timezone.now()
            )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_id', 'order', 'method', 'amount', 'status', 'created_at']
    list_filter = ['status', 'method', 'created_at']
    search_fields = ['payment_id', 'transaction_id', 'order__order_id']
    readonly_fields = ['payment_id', 'created_at']


@admin.register(SellerPayout)
class SellerPayoutAdmin(admin.ModelAdmin):
    list_display = [
        'payout_id', 'order', 'seller', 'amount',
        'commission_amount', 'commission_rate', 'seller_upi_id',
        'status', 'created_at', 'completed_at',
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['payout_id', 'seller__email', 'seller__username', 'seller_upi_id', 'order__order_id']
    list_editable = ['status']
    readonly_fields = ['payout_id', 'created_at']

    actions = ['mark_completed']

    @admin.action(description='Mark Payouts as Completed')
    def mark_completed(self, request, queryset):
        from django.utils import timezone
        queryset.filter(status='pending').update(
            status='completed', completed_at=timezone.now()
        )


"""
Orders App — Serializers
"""
from rest_framework import serializers
from .models import Order, OrderItem, Payment


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_price',
            'product_image', 'quantity', 'subtotal',
        ]
        read_only_fields = ['id', 'product_name', 'product_price', 'product_image']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_id', 'method', 'amount', 'status',
            'transaction_id', 'upi_id', 'bank_name',
            'account_number', 'ifsc_code', 'created_at',
        ]
        read_only_fields = ['id', 'payment_id', 'status', 'created_at']


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for order listings."""

    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'status', 'payment_method',
            'payment_status', 'total', 'items_count', 'created_at',
        ]

    def get_items_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    """Full order detail with items and payments."""

    items = OrderItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'status', 'payment_method',
            'payment_status', 'transaction_id',
            'subtotal', 'shipping_cost', 'tax', 'total',
            'shipping_name', 'shipping_phone', 'shipping_address',
            'shipping_city', 'shipping_state', 'shipping_pincode',
            'notes', 'items', 'payments',
            'created_at', 'updated_at', 'paid_at',
            'shipped_at', 'delivered_at',
        ]


class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating an order from cart items."""

    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    shipping_name = serializers.CharField(max_length=200)
    shipping_phone = serializers.CharField(max_length=15)
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_state = serializers.CharField(max_length=100)
    shipping_pincode = serializers.CharField(max_length=10)
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    # Optional: specify product items directly (for buy-now without cart)
    items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
    )


class PaymentProcessSerializer(serializers.Serializer):
    """Serializer for processing a payment."""

    method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)

    # UPI fields
    upi_id = serializers.CharField(required=False, allow_blank=True)

    # Bank transfer fields
    bank_name = serializers.CharField(required=False, allow_blank=True)
    account_number = serializers.CharField(required=False, allow_blank=True)
    ifsc_code = serializers.CharField(required=False, allow_blank=True)

    # Card fields (simplified)
    transaction_id = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        method = attrs.get('method')
        if method == 'upi' and not attrs.get('upi_id'):
            raise serializers.ValidationError({'upi_id': 'UPI ID is required for UPI payments.'})
        if method == 'bank_transfer':
            if not attrs.get('bank_name'):
                raise serializers.ValidationError({'bank_name': 'Bank name is required.'})
            if not attrs.get('account_number'):
                raise serializers.ValidationError({'account_number': 'Account number is required.'})
            if not attrs.get('ifsc_code'):
                raise serializers.ValidationError({'ifsc_code': 'IFSC code is required.'})
        return attrs

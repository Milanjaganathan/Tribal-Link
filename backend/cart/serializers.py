"""
Cart App — Serializers
"""
from rest_framework import serializers
from products.serializers import ProductListSerializer
from .models import CartItem


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items with nested product data."""

    product_detail = ProductListSerializer(source='product', read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_detail', 'quantity', 'subtotal', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1.')
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        product = validated_data['product']
        quantity = validated_data.get('quantity', 1)

        # Update quantity if item already exists
        cart_item, created = CartItem.objects.get_or_create(
            user=user,
            product=product,
            defaults={'quantity': quantity},
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        return cart_item


class CartSummarySerializer(serializers.Serializer):
    """Summary of the entire cart."""

    items = CartItemSerializer(many=True)
    total_items = serializers.IntegerField()
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2)

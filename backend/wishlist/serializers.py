"""
Wishlist App — Serializers
"""
from rest_framework import serializers
from products.serializers import ProductListSerializer
from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source='product', read_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_detail', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        product = validated_data['product']

        item, created = WishlistItem.objects.get_or_create(
            user=user,
            product=product,
        )
        if not created:
            raise serializers.ValidationError('Product already in wishlist.')
        return item

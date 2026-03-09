"""
Products App — Serializers
"""
from rest_framework import serializers
from accounts.serializers import UserMinimalSerializer
from .models import Category, Product, ProductImage, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'product_count']

    def get_product_count(self, obj):
        return obj.products.filter(status='approved').count()


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary']


class ProductReviewSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ProductReview
        fields = ['id', 'user', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product listings."""

    category_name = serializers.CharField(source='category.name', read_only=True)
    seller_name = serializers.CharField(source='seller.shop_name', read_only=True)
    display_image = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'price', 'compare_price',
            'display_image', 'image', 'image_url',
            'category', 'category_name', 'seller_name',
            'stock', 'is_featured', 'discount_percentage',
            'average_rating', 'created_at',
        ]

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full product detail serializer."""

    category = CategorySerializer(read_only=True)
    seller = UserMinimalSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    display_image = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'compare_price',
            'display_image', 'image', 'image_url', 'images',
            'category', 'seller', 'stock', 'status',
            'is_featured', 'discount_percentage', 'views_count',
            'average_rating', 'review_count', 'reviews',
            'created_at', 'updated_at',
        ]

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return None

    def get_review_count(self, obj):
        return obj.reviews.count()


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for sellers to create/update products."""

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'compare_price',
            'category', 'stock', 'image', 'image_url', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user
        validated_data['status'] = Product.Status.PENDING
        return super().create(validated_data)

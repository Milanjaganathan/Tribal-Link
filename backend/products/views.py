"""
Products App — Views
CRUD for products, categories, seller dashboard, and reviews.
"""
from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category, Product, ProductReview
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateSerializer,
    ProductReviewSerializer,
)


# ── Permission Classes ──

class IsSellerOrReadOnly(permissions.BasePermission):
    """Allow sellers to create; anyone can read."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated
            and request.user.role in ('seller', 'admin')
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Only the product owner can modify it."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller == request.user


# ── Category Views ──

class CategoryListView(generics.ListAPIView):
    """
    GET /api/products/categories/
    List all active categories with product counts.
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Return all categories


# ── Product Views ──

class ProductListView(generics.ListAPIView):
    """
    GET /api/products/
    List approved products with filtering, search, and ordering.

    Query params:
      - category: filter by category id
      - category__slug: filter by category slug
      - search: search in name, description
      - ordering: price, -price, created_at, -created_at, views_count
      - min_price / max_price: price range filter
      - is_featured: true/false
    """
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'category__slug', 'is_featured']
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'created_at', 'views_count', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Product.objects.filter(status='approved').select_related('category', 'seller')

        # Price range filtering
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)

        return qs


class ProductDetailView(generics.RetrieveAPIView):
    """
    GET /api/products/<id>/
    Retrieve full product details. Increments view count.
    """
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pk'

    def get_queryset(self):
        return Product.objects.filter(status='approved').select_related(
            'category', 'seller'
        ).prefetch_related('images', 'reviews__user')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        Product.objects.filter(pk=instance.pk).update(
            views_count=instance.views_count + 1
        )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ProductBySlugView(generics.RetrieveAPIView):
    """
    GET /api/products/slug/<slug>/
    Retrieve product by slug.
    """
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return Product.objects.filter(status='approved').select_related(
            'category', 'seller'
        ).prefetch_related('images', 'reviews__user')


# ── Seller Dashboard Views ──

class SellerProductListView(generics.ListCreateAPIView):
    """
    GET  /api/products/seller/  — List seller's own products
    POST /api/products/seller/  — Create a new product
    """
    permission_classes = [permissions.IsAuthenticated, IsSellerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateSerializer
        return ProductListSerializer

    def get_queryset(self):
        return Product.objects.filter(
            seller=self.request.user
        ).select_related('category')


class SellerProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/DELETE /api/products/seller/<id>/
    Seller manages their own product.
    """
    serializer_class = ProductCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user)


# ── Review Views ──

class ProductReviewListCreateView(generics.ListCreateAPIView):
    """
    GET /api/products/<product_id>/reviews/  — List reviews
    POST /api/products/<product_id>/reviews/ — Add review
    """
    serializer_class = ProductReviewSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return ProductReview.objects.filter(
            product_id=self.kwargs['product_id']
        ).select_related('user')

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            product_id=self.kwargs['product_id'],
        )


# ── Featured Products ──

class FeaturedProductsView(generics.ListAPIView):
    """
    GET /api/products/featured/
    List featured products.
    """
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Product.objects.filter(
            status='approved', is_featured=True
        ).select_related('category', 'seller')[:12]

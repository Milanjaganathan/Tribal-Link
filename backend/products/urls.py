"""
Products App — URL Configuration
"""
from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    # Public product endpoints
    path('', views.ProductListView.as_view(), name='product-list'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('featured/', views.FeaturedProductsView.as_view(), name='featured-list'),
    path('<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('slug/<slug:slug>/', views.ProductBySlugView.as_view(), name='product-by-slug'),

    # Reviews
    path('<int:product_id>/reviews/', views.ProductReviewListCreateView.as_view(), name='product-reviews'),

    # Seller dashboard
    path('seller/', views.SellerProductListView.as_view(), name='seller-products'),
    path('seller/<int:pk>/', views.SellerProductDetailView.as_view(), name='seller-product-detail'),
]

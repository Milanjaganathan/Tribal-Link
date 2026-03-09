"""
Products App — Admin Configuration
"""
from django.contrib import admin
from .models import Category, Product, ProductImage, ProductReview


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']
    list_filter = ['is_active']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'seller', 'category', 'price',
        'stock', 'status', 'is_featured', 'views_count', 'created_at',
    ]
    list_filter = ['status', 'category', 'is_featured', 'created_at']
    search_fields = ['name', 'description', 'seller__email', 'seller__shop_name']
    list_editable = ['status', 'is_featured']
    readonly_fields = ['views_count', 'created_at', 'updated_at']
    inlines = [ProductImageInline]
    prepopulated_fields = {'slug': ('name',)}

    actions = ['approve_products', 'reject_products']

    @admin.action(description='Approve selected products')
    def approve_products(self, request, queryset):
        count = queryset.update(status='approved')
        self.message_user(request, f'{count} products approved.')

    @admin.action(description='Reject selected products')
    def reject_products(self, request, queryset):
        count = queryset.update(status='rejected')
        self.message_user(request, f'{count} products rejected.')


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['product__name', 'user__email', 'comment']

"""
Accounts App — Admin Configuration
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for the User model."""

    list_display = [
        'email', 'username', 'first_name', 'last_name',
        'role', 'is_verified_seller', 'is_active', 'created_at',
    ]
    list_filter = ['role', 'is_verified_seller', 'is_active', 'is_staff']
    search_fields = ['email', 'username', 'first_name', 'last_name', 'phone']
    ordering = ['-created_at']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('TribalLink Profile', {
            'fields': (
                'phone', 'role', 'avatar', 'bio',
                'address', 'city', 'state', 'pincode',
                'shop_name', 'is_verified_seller',
            ),
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('TribalLink Profile', {
            'fields': ('email', 'phone', 'role'),
        }),
    )

    actions = ['verify_sellers', 'unverify_sellers']

    @admin.action(description='Verify selected sellers')
    def verify_sellers(self, request, queryset):
        queryset.filter(role='seller').update(is_verified_seller=True)

    @admin.action(description='Unverify selected sellers')
    def unverify_sellers(self, request, queryset):
        queryset.update(is_verified_seller=False)

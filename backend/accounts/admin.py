"""
Accounts App — Admin Configuration
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'email', 'username', 'first_name', 'last_name',
        'role', 'is_verified_seller', 'is_email_verified',
        'is_active', 'date_joined',
    ]
    list_filter = ['role', 'is_verified_seller', 'is_email_verified', 'is_active']
    search_fields = ['email', 'username', 'first_name', 'last_name', 'shop_name']
    ordering = ['-date_joined']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('TribalLink Profile', {
            'fields': (
                'phone', 'role', 'avatar', 'bio', 'address',
                'city', 'state', 'pincode',
            ),
        }),
        ('Seller Info', {
            'fields': (
                'shop_name', 'shop_description',
                'is_verified_seller', 'seller_approved_at',
            ),
        }),
        ('Verification', {
            'fields': (
                'is_email_verified', 'email_otp', 'email_otp_created_at',
            ),
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('TribalLink', {
            'fields': ('email', 'role', 'phone'),
        }),
    )

"""
Accounts App — Models
Custom User model with role-based access (customer, seller, admin)
and OTP email verification support.
"""
import random
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    """Extended user model with marketplace roles."""

    class Role(models.TextChoices):
        CUSTOMER = 'customer', 'Customer'
        SELLER = 'seller', 'Seller'
        ADMIN = 'admin', 'Admin'

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)

    # Seller-specific fields
    shop_name = models.CharField(max_length=200, blank=True)
    shop_description = models.TextField(blank=True)
    seller_upi_id = models.CharField(max_length=100, blank=True, help_text='Seller UPI ID for receiving payouts')
    is_verified_seller = models.BooleanField(default=False)
    seller_approved_at = models.DateTimeField(null=True, blank=True)

    # Email verification
    is_email_verified = models.BooleanField(default=False)
    email_otp = models.CharField(max_length=6, blank=True)
    email_otp_created_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.email} ({self.role})'

    @property
    def is_seller(self):
        return self.role == self.Role.SELLER

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    def generate_otp(self):
        """Generate a 6-digit OTP for email verification."""
        self.email_otp = str(random.randint(100000, 999999))
        self.email_otp_created_at = timezone.now()
        self.save(update_fields=['email_otp', 'email_otp_created_at'])
        return self.email_otp

    def verify_otp(self, otp):
        """Verify the OTP. Valid for 10 minutes."""
        if not self.email_otp or not self.email_otp_created_at:
            return False
        if self.email_otp != otp:
            return False
        if timezone.now() > self.email_otp_created_at + timedelta(minutes=10):
            return False
        self.is_email_verified = True
        self.email_otp = ''
        self.email_otp_created_at = None
        self.save(update_fields=['is_email_verified', 'email_otp', 'email_otp_created_at'])
        return True

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip() or self.username

"""
Cart App — Models
Shopping cart with per-user item tracking.
"""
from django.db import models
from django.conf import settings


class CartItem(models.Model):
    """Individual item in a user's shopping cart."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart_items',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='cart_entries',
    )
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'product']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} — {self.product.name} x{self.quantity}'

    @property
    def subtotal(self):
        return self.product.price * self.quantity

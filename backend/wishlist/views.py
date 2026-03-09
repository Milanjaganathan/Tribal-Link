"""
Wishlist App — Views
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response

from .models import WishlistItem
from .serializers import WishlistItemSerializer


class WishlistListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/wishlist/ — List wishlist items
    POST /api/wishlist/ — Add product to wishlist
    """
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WishlistItem.objects.filter(
            user=self.request.user
        ).select_related('product', 'product__category')


class WishlistItemDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/wishlist/<id>/
    Remove a product from the wishlist.
    """
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user)


class WishlistClearView(generics.GenericAPIView):
    """
    DELETE /api/wishlist/clear/
    Clear all wishlist items.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        count, _ = WishlistItem.objects.filter(user=request.user).delete()
        return Response(
            {'message': f'Wishlist cleared. {count} items removed.'},
            status=status.HTTP_204_NO_CONTENT,
        )

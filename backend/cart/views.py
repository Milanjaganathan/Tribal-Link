"""
Cart App — Views
Shopping cart CRUD operations.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CartItem
from .serializers import CartItemSerializer


class CartListView(APIView):
    """
    GET  /api/cart/ — Get all cart items with summary
    POST /api/cart/ — Add item to cart
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        items = CartItem.objects.filter(
            user=request.user
        ).select_related('product', 'product__category')

        serializer = CartItemSerializer(items, many=True, context={'request': request})

        total_items = sum(item.quantity for item in items)
        total_price = sum(item.subtotal for item in items)

        return Response({
            'items': serializer.data,
            'total_items': total_items,
            'total_price': str(total_price),
        })

    def post(self, request):
        serializer = CartItemSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PATCH/DELETE /api/cart/<id>/
    View, update quantity, or remove a cart item.
    """
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user)


class CartClearView(APIView):
    """
    DELETE /api/cart/clear/
    Remove all items from the cart.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        count, _ = CartItem.objects.filter(user=request.user).delete()
        return Response(
            {'message': f'Cart cleared. {count} items removed.'},
            status=status.HTTP_204_NO_CONTENT,
        )

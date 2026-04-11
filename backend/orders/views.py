"""
Orders App — Views
Order creation, management, payment processing, and notification triggers.
"""
import uuid
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import CartItem
from products.models import Product
from .models import Order, OrderItem, Payment
from .serializers import (
    OrderListSerializer,
    OrderDetailSerializer,
    OrderCreateSerializer,
    PaymentProcessSerializer,
)


def notify_order_event(order, event_type, title, message):
    """Helper to send order-related notifications."""
    try:
        from notifications.models import Notification
        Notification.send(
            user=order.user,
            notification_type=event_type,
            title=title,
            message=message,
            link=f'/orders/{order.order_id}',
        )
    except Exception:
        pass  # Notifications are best-effort


def notify_seller_new_order(order):
    """Notify sellers about new orders containing their products."""
    try:
        from notifications.models import Notification
        seller_ids = order.items.values_list(
            'product__seller', flat=True
        ).distinct()
        from django.contrib.auth import get_user_model
        User = get_user_model()
        for seller_id in seller_ids:
            if seller_id:
                try:
                    seller = User.objects.get(pk=seller_id)
                    Notification.send(
                        user=seller,
                        notification_type='new_order',
                        title='New Order Received!',
                        message=f'You have a new order #{str(order.order_id)[:8]}. Total: ₹{order.total}',
                        link=f'/seller/orders',
                    )
                except User.DoesNotExist:
                    pass
    except Exception:
        pass


class OrderCreateView(APIView):
    """
    POST /api/orders/create/
    Create an order from cart items or direct product list.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        direct_items = data.get('items', [])

        # Create the order
        order = Order.objects.create(
            user=user,
            payment_method=data['payment_method'],
            shipping_name=data['shipping_name'],
            shipping_phone=data['shipping_phone'],
            shipping_address=data['shipping_address'],
            shipping_city=data['shipping_city'],
            shipping_state=data['shipping_state'],
            shipping_pincode=data['shipping_pincode'],
            notes=data.get('notes', ''),
        )

        if direct_items:
            # Create from direct item list (buy-now flow)
            for item_data in direct_items:
                product_id = item_data.get('product_id')
                quantity = item_data.get('quantity', 1)

                try:
                    product = Product.objects.get(id=product_id, status='approved')
                except Product.DoesNotExist:
                    order.delete()
                    return Response(
                        {'error': f'Product {product_id} not found or not available.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if product.stock < quantity:
                    order.delete()
                    return Response(
                        {'error': f'Insufficient stock for {product.name}.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    product_price=product.price,
                    product_image=product.display_image,
                    quantity=quantity,
                )

                # Reduce stock
                product.stock -= quantity
                product.save(update_fields=['stock'])

        else:
            # Create from cart items
            cart_items = CartItem.objects.filter(
                user=user
            ).select_related('product')

            if not cart_items.exists():
                order.delete()
                return Response(
                    {'error': 'Cart is empty.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            for cart_item in cart_items:
                product = cart_item.product

                if not product.is_available:
                    order.delete()
                    return Response(
                        {'error': f'{product.name} is not available.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if product.stock < cart_item.quantity:
                    order.delete()
                    return Response(
                        {'error': f'Insufficient stock for {product.name}.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    product_price=product.price,
                    product_image=product.display_image,
                    quantity=cart_item.quantity,
                )

                # Reduce stock
                product.stock -= cart_item.quantity
                product.save(update_fields=['stock'])

            # Clear the cart
            cart_items.delete()

        # Calculate totals
        order.calculate_total()

        # Auto-confirm COD orders
        if order.payment_method == Order.PaymentMethod.COD:
            order.status = Order.Status.CONFIRMED
            order.save(update_fields=['status'])

        # Send notifications
        notify_order_event(
            order, 'order_placed', 'Order Placed!',
            f'Your order #{str(order.order_id)[:8]} has been placed successfully. Total: ₹{order.total}'
        )
        notify_seller_new_order(order)

        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class OrderListView(generics.ListAPIView):
    """
    GET /api/orders/
    List user's orders.
    """
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related('items')


class OrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/orders/<order_id>/
    Get detailed order information.
    """
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'order_id'

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related('items', 'payments')


class OrderCancelView(APIView):
    """
    POST /api/orders/<order_id>/cancel/
    Cancel a pending/confirmed order.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(
                order_id=order_id,
                user=request.user,
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.status not in ('pending', 'confirmed'):
            return Response(
                {'error': 'Order cannot be cancelled at this stage.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Restore stock
        for item in order.items.all():
            if item.product:
                item.product.stock += item.quantity
                item.product.save(update_fields=['stock'])

        order.status = Order.Status.CANCELLED
        order.save(update_fields=['status'])

        notify_order_event(
            order, 'order_cancelled', 'Order Cancelled',
            f'Your order #{str(order.order_id)[:8]} has been cancelled.'
        )

        return Response({'message': 'Order cancelled successfully.'})


class PaymentProcessView(APIView):
    """
    POST /api/orders/<order_id>/pay/
    Process payment for an order with UPI, bank transfer, or card.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(
                order_id=order_id,
                user=request.user,
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.payment_status == 'completed':
            return Response(
                {'error': 'Payment already completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PaymentProcessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Create payment record
        payment = Payment.objects.create(
            order=order,
            method=data['method'],
            amount=order.total,
            upi_id=data.get('upi_id', ''),
            bank_name=data.get('bank_name', ''),
            account_number=data.get('account_number', ''),
            ifsc_code=data.get('ifsc_code', ''),
            transaction_id=data.get('transaction_id', '') or str(uuid.uuid4())[:12].upper(),
        )

        # Simulate payment processing
        payment.status = Payment.Status.SUCCESS
        payment.save(update_fields=['status'])

        # Update order
        order.payment_status = Order.PaymentStatus.COMPLETED
        order.payment_method = data['method']
        order.transaction_id = payment.transaction_id
        order.paid_at = timezone.now()
        order.status = Order.Status.CONFIRMED
        order.save(update_fields=[
            'payment_status', 'payment_method',
            'transaction_id', 'paid_at', 'status',
        ])

        # Notify
        notify_order_event(
            order, 'payment_success', 'Payment Successful!',
            f'Payment of ₹{payment.amount} for order #{str(order.order_id)[:8]} was successful.'
        )

        return Response({
            'message': 'Payment processed successfully.',
            'payment_id': str(payment.payment_id),
            'transaction_id': payment.transaction_id,
            'amount': str(payment.amount),
            'method': payment.method,
            'status': payment.status,
            'order': OrderDetailSerializer(order).data,
        })


class OrderTrackView(APIView):
    """
    GET /api/orders/<order_id>/track/
    Track order status with timeline.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = Order.objects.get(
                order_id=order_id,
                user=request.user,
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        timeline = [
            {
                'status': 'Order Placed',
                'timestamp': order.created_at.isoformat(),
                'completed': True,
                'icon': 'fa-check-circle',
            },
        ]

        if order.paid_at:
            timeline.append({
                'status': 'Payment Confirmed',
                'timestamp': order.paid_at.isoformat(),
                'completed': True,
                'icon': 'fa-credit-card',
            })

        if order.status in ('confirmed', 'processing', 'shipped', 'delivered'):
            timeline.append({
                'status': 'Order Confirmed',
                'timestamp': order.updated_at.isoformat(),
                'completed': True,
                'icon': 'fa-clipboard-check',
            })

        if order.status in ('processing', 'shipped', 'delivered'):
            timeline.append({
                'status': 'Packed & Processing',
                'timestamp': order.updated_at.isoformat(),
                'completed': True,
                'icon': 'fa-box',
            })

        shipped_completed = order.status in ('shipped', 'delivered')
        timeline.append({
            'status': 'Shipped',
            'timestamp': order.shipped_at.isoformat() if order.shipped_at else None,
            'completed': shipped_completed,
            'icon': 'fa-shipping-fast',
        })

        delivered_completed = order.status == 'delivered'
        timeline.append({
            'status': 'Delivered',
            'timestamp': order.delivered_at.isoformat() if order.delivered_at else None,
            'completed': delivered_completed,
            'icon': 'fa-home',
        })

        if order.status == 'cancelled':
            timeline.append({
                'status': 'Cancelled',
                'timestamp': order.updated_at.isoformat(),
                'completed': True,
                'icon': 'fa-times-circle',
            })

        return Response({
            'order_id': str(order.order_id),
            'current_status': order.status,
            'payment_status': order.payment_status,
            'payment_method': order.payment_method,
            'total': str(order.total),
            'timeline': timeline,
        })


class UPIInfoView(APIView):
    """
    GET /api/orders/upi-info/
    Get UPI payment information (QR code details, UPI ID).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'upi_id': 'triballink@upi',
            'merchant_name': 'TribalLink Marketplace',
            'note': 'Payment for TribalLink order',
            'qr_data': 'upi://pay?pa=triballink@upi&pn=TribalLink&cu=INR',
        })

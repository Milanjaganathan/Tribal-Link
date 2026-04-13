"""
Accounts App — Views
User registration, OTP verification, profile management, JWT authentication,
admin dashboard, and seller management.
"""
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.core.mail import send_mail
from django.conf import settings as django_settings
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    CustomTokenObtainPairSerializer,
    OTPVerifySerializer,
    OTPResendSerializer,
    AdminUserSerializer,
    SellerApprovalSerializer,
)

User = get_user_model()


# ── Permission Classes ──

class IsAdminRole(permissions.BasePermission):
    """Only admin-role users or superusers."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.is_superuser)
        )


class IsSellerRole(permissions.BasePermission):
    """Only seller-role users."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'seller'
        )


# ── Auth Views ──

class RegisterView(generics.CreateAPIView):
    """
    POST /api/accounts/register/
    Register a new user (customer or seller).
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate OTP for email verification
        otp = user.generate_otp()

        # Try to send OTP email (best-effort)
        try:
            send_mail(
                subject='TribalLink - Verify Your Email',
                message=f'Your verification OTP is: {otp}\n\nThis code expires in 10 minutes.',
                from_email=getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'noreply@triballink.com'),
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass  # Email sending is best-effort

        # Generate JWT tokens for immediate login
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Registration successful. Please verify your email with the OTP sent.',
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'otp_sent': True,
            # In dev mode, return OTP for testing
            'debug_otp': otp if getattr(django_settings, 'DEBUG', False) else None,
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """
    POST /api/accounts/login/
    Obtain JWT token pair with user data.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    """
    POST /api/accounts/logout/
    Blacklist the refresh token on logout.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response(
                {'message': 'Logout successful'},
                status=status.HTTP_205_RESET_CONTENT,
            )
        except Exception:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ── OTP Verification ──

class VerifyOTPView(APIView):
    """
    POST /api/accounts/verify-otp/
    Verify email with OTP code.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(email=serializer.validated_data['email'])
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.is_email_verified:
            return Response({'message': 'Email already verified.'})

        if user.verify_otp(serializer.validated_data['otp']):
            return Response({'message': 'Email verified successfully.'})
        else:
            return Response(
                {'error': 'Invalid or expired OTP.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ResendOTPView(APIView):
    """
    POST /api/accounts/resend-otp/
    Resend OTP to the user's email.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPResendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(email=serializer.validated_data['email'])
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.is_email_verified:
            return Response({'message': 'Email already verified.'})

        otp = user.generate_otp()
        try:
            send_mail(
                subject='TribalLink - Verify Your Email',
                message=f'Your verification OTP is: {otp}\n\nThis code expires in 10 minutes.',
                from_email=getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'noreply@triballink.com'),
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        response_data = {'message': 'OTP resent successfully.'}
        if getattr(django_settings, 'DEBUG', False):
            response_data['debug_otp'] = otp
        return Response(response_data)


# ── Profile ──

class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET/PUT /api/accounts/profile/
    Retrieve or update the authenticated user's profile.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    POST /api/accounts/change-password/
    Change the authenticated user's password.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully'})


# ── Admin Dashboard Views ──

class AdminDashboardView(APIView):
    """
    GET /api/accounts/admin/dashboard/
    Admin analytics dashboard.
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        from orders.models import Order, Payment
        from products.models import Product, Category

        total_users = User.objects.count()
        total_customers = User.objects.filter(role='customer').count()
        total_sellers = User.objects.filter(role='seller').count()
        pending_sellers = User.objects.filter(role='seller', is_verified_seller=False).count()
        verified_sellers = User.objects.filter(role='seller', is_verified_seller=True).count()

        total_products = Product.objects.count()
        pending_products = Product.objects.filter(status='pending').count()
        approved_products = Product.objects.filter(status='approved').count()

        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status='pending').count()
        completed_orders = Order.objects.filter(status='delivered').count()

        total_revenue = Order.objects.filter(
            payment_status='completed'
        ).aggregate(total=Sum('total'))['total'] or 0

        total_categories = Category.objects.count()

        # Recent orders
        recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
        recent_orders_data = [
            {
                'order_id': str(o.order_id),
                'user_email': o.user.email,
                'total': str(o.total),
                'status': o.status,
                'payment_status': o.payment_status,
                'created_at': o.created_at.isoformat(),
            }
            for o in recent_orders
        ]

        return Response({
            'users': {
                'total': total_users,
                'customers': total_customers,
                'sellers': total_sellers,
                'pending_sellers': pending_sellers,
                'verified_sellers': verified_sellers,
            },
            'products': {
                'total': total_products,
                'pending': pending_products,
                'approved': approved_products,
            },
            'orders': {
                'total': total_orders,
                'pending': pending_orders,
                'completed': completed_orders,
            },
            'revenue': {
                'total': str(total_revenue),
            },
            'categories': total_categories,
            'recent_orders': recent_orders_data,
        })


class AdminUsersListView(generics.ListAPIView):
    """
    GET /api/accounts/admin/users/
    List all users with filtering.
    """
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(shop_name__icontains=search)
            )
        return qs


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """
    GET/PUT /api/accounts/admin/users/<id>/
    View or update a user.
    """
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]
    queryset = User.objects.all()


class AdminSellerApprovalView(APIView):
    """
    POST /api/accounts/admin/sellers/<id>/approve/
    Approve or reject a seller.
    """
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        try:
            seller = User.objects.get(pk=pk, role='seller')
        except User.DoesNotExist:
            return Response(
                {'error': 'Seller not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SellerApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        reason = serializer.validated_data.get('reason', '')

        if action == 'approve':
            seller.is_verified_seller = True
            seller.seller_approved_at = timezone.now()
            seller.save(update_fields=['is_verified_seller', 'seller_approved_at'])

            # Send notification
            from notifications.models import Notification
            Notification.send(
                user=seller,
                notification_type='seller_approved',
                title='Seller Account Approved!',
                message='Congratulations! Your seller account has been approved. You can now start listing products.',
            )
            return Response({'message': f'Seller {seller.email} approved successfully.'})

        elif action == 'reject':
            seller.is_verified_seller = False
            seller.save(update_fields=['is_verified_seller'])

            from notifications.models import Notification
            Notification.send(
                user=seller,
                notification_type='seller_rejected',
                title='Seller Account Rejected',
                message=f'Your seller account application was rejected. Reason: {reason or "Not specified"}',
            )
            return Response({'message': f'Seller {seller.email} rejected.'})


class AdminPendingSellersView(generics.ListAPIView):
    """
    GET /api/accounts/admin/sellers/pending/
    List sellers awaiting approval.
    """
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(role='seller', is_verified_seller=False)


class AdminProductsView(APIView):
    """
    GET /api/accounts/admin/products/
    List all products for admin management.
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        from products.models import Product
        from products.serializers import ProductListSerializer

        qs = Product.objects.select_related('category', 'seller').all()
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        serializer = ProductListSerializer(qs[:100], many=True)
        return Response({
            'count': qs.count(),
            'products': serializer.data,
        })


class AdminProductApprovalView(APIView):
    """
    POST /api/accounts/admin/products/<id>/approve/
    Approve or reject a product.
    """
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        from products.models import Product
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        action = request.data.get('action')  # 'approve' or 'reject'
        reason = request.data.get('reason', '')

        if action == 'approve':
            product.status = 'approved'
            product.rejection_reason = ''
            product.save(update_fields=['status', 'rejection_reason'])

            from notifications.models import Notification
            Notification.send(
                user=product.seller,
                notification_type='product_approved',
                title='Product Approved!',
                message=f'Your product "{product.name}" has been approved and is now live.',
            )
            return Response({'message': f'Product "{product.name}" approved.'})

        elif action == 'reject':
            product.status = 'rejected'
            product.rejection_reason = reason
            product.save(update_fields=['status', 'rejection_reason'])

            from notifications.models import Notification
            Notification.send(
                user=product.seller,
                notification_type='product_rejected',
                title='Product Rejected',
                message=f'Your product "{product.name}" was rejected. Reason: {reason or "Not specified"}',
            )
            return Response({'message': f'Product "{product.name}" rejected.'})

        return Response(
            {'error': 'Invalid action. Use "approve" or "reject".'},
            status=status.HTTP_400_BAD_REQUEST,
        )


class AdminOrdersView(APIView):
    """
    GET /api/accounts/admin/orders/
    List all orders for admin.
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        from orders.models import Order
        from orders.serializers import OrderListSerializer

        qs = Order.objects.select_related('user').all()
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        serializer = OrderListSerializer(qs[:100], many=True)
        return Response({
            'count': qs.count(),
            'orders': serializer.data,
        })


class AdminReviewsView(APIView):
    """
    GET /api/accounts/admin/reviews/
    DELETE /api/accounts/admin/reviews/<review_id>/
    Manage reviews (delete spam).
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        from products.models import ProductReview
        from products.serializers import ProductReviewSerializer

        reviews = ProductReview.objects.select_related('user', 'product').all()[:100]
        serializer = ProductReviewSerializer(reviews, many=True)
        return Response({'reviews': serializer.data})


class AdminReviewDeleteView(APIView):
    """
    DELETE /api/accounts/admin/reviews/<id>/
    Delete a spam review.
    """
    permission_classes = [IsAdminRole]

    def delete(self, request, pk):
        from products.models import ProductReview
        try:
            review = ProductReview.objects.get(pk=pk)
            review.delete()
            return Response({'message': 'Review deleted.'})
        except ProductReview.DoesNotExist:
            return Response(
                {'error': 'Review not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )


# ── Seller Dashboard Views ──

class SellerDashboardView(APIView):
    """
    GET /api/accounts/seller/dashboard/
    Seller earnings and overview dashboard with commission breakdown.
    """
    permission_classes = [IsSellerRole]

    def get(self, request):
        from orders.models import Order, OrderItem, SellerPayout
        from products.models import Product
        from decimal import Decimal

        seller = request.user
        products = Product.objects.filter(seller=seller)
        total_products = products.count()
        approved_products = products.filter(status='approved').count()
        pending_products = products.filter(status='pending').count()

        # Orders containing seller's products
        seller_order_items = OrderItem.objects.filter(
            product__seller=seller
        ).select_related('order')

        order_ids = seller_order_items.values_list('order_id', flat=True).distinct()
        seller_orders = Order.objects.filter(id__in=order_ids)

        total_orders = seller_orders.count()
        pending_seller_orders = seller_orders.filter(status__in=['pending', 'confirmed']).count()
        completed_seller_orders = seller_orders.filter(status='delivered').count()

        # Total gross sales (before commission)
        total_gross_sales = seller_order_items.filter(
            order__payment_status='completed'
        ).aggregate(
            total=Sum('product_price')
        )['total'] or Decimal('0')

        # Payout records — actual earnings after commission
        payouts = SellerPayout.objects.filter(seller=seller)
        total_net_earnings = payouts.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        total_commission_deducted = payouts.aggregate(total=Sum('commission_amount'))['total'] or Decimal('0')
        pending_payouts = payouts.filter(status='pending').aggregate(total=Sum('amount'))['total'] or Decimal('0')
        completed_payouts = payouts.filter(status='completed').aggregate(total=Sum('amount'))['total'] or Decimal('0')

        # Get the commission rate from the latest order or default
        latest_order = seller_orders.order_by('-created_at').first()
        commission_rate = latest_order.commission_rate if latest_order else Decimal('10.00')

        return Response({
            'seller_name': seller.full_name,
            'username': seller.username,
            'email': seller.email,
            'first_name': seller.first_name,
            'last_name': seller.last_name,
            'phone': seller.phone,
            'seller_upi_id': seller.seller_upi_id,
            'products': {
                'total': total_products,
                'approved': approved_products,
                'pending': pending_products,
            },
            'orders': {
                'total': total_orders,
                'pending': pending_seller_orders,
                'completed': completed_seller_orders,
            },
            'earnings': {
                'gross_sales': str(total_gross_sales),
                'total': str(total_net_earnings),
                'commission_deducted': str(total_commission_deducted),
                'commission_rate': str(commission_rate),
                'pending_payouts': str(pending_payouts),
                'completed_payouts': str(completed_payouts),
            },
            'shop_name': seller.shop_name,
            'is_verified': seller.is_verified_seller,
        })


class SellerOrdersView(APIView):
    """
    GET /api/accounts/seller/orders/
    List orders containing seller's products.
    """
    permission_classes = [IsSellerRole]

    def get(self, request):
        from orders.models import Order, OrderItem
        from orders.serializers import OrderDetailSerializer

        seller = request.user
        seller_order_items = OrderItem.objects.filter(
            product__seller=seller
        ).values_list('order_id', flat=True).distinct()

        orders = Order.objects.filter(
            id__in=seller_order_items
        ).prefetch_related('items').order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter:
            orders = orders.filter(status=status_filter)

        data = []
        for order in orders[:50]:
            seller_items = order.items.filter(product__seller=seller)
            data.append({
                'order_id': str(order.order_id),
                'customer_name': order.shipping_name,
                'customer_phone': order.shipping_phone,
                'status': order.status,
                'payment_status': order.payment_status,
                'payment_method': order.payment_method,
                'created_at': order.created_at.isoformat(),
                'items': [
                    {
                        'product_name': item.product_name,
                        'product_price': str(item.product_price),
                        'product_image': item.product_image,
                        'quantity': item.quantity,
                        'subtotal': str(item.subtotal),
                    }
                    for item in seller_items
                ],
                'shipping_address': f'{order.shipping_address}, {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}',
            })

        return Response({'orders': data, 'count': len(data)})


class SellerOrderUpdateView(APIView):
    """
    POST /api/accounts/seller/orders/<order_id>/update-status/
    Seller updates order status.
    """
    permission_classes = [IsSellerRole]

    def post(self, request, order_id):
        from orders.models import Order, OrderItem

        # Verify order contains seller's products
        seller = request.user
        try:
            from uuid import UUID
            order_uuid = UUID(str(order_id))
            order = Order.objects.get(order_id=order_uuid)
        except (Order.DoesNotExist, ValueError):
            return Response(
                {'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        has_seller_items = order.items.filter(product__seller=seller).exists()
        if not has_seller_items:
            return Response(
                {'error': 'You do not have items in this order.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = request.data.get('status')
        valid_transitions = {
            'pending': ['confirmed'],
            'confirmed': ['processing'],
            'processing': ['shipped'],
            'shipped': ['delivered'],
        }

        allowed = valid_transitions.get(order.status, [])
        if new_status not in allowed:
            return Response(
                {'error': f'Cannot transition from {order.status} to {new_status}. Allowed: {allowed}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = new_status
        update_fields = ['status']

        if new_status == 'shipped':
            order.shipped_at = timezone.now()
            update_fields.append('shipped_at')
        elif new_status == 'delivered':
            order.delivered_at = timezone.now()
            update_fields.append('delivered_at')

        order.save(update_fields=update_fields)

        # Notify customer
        from notifications.models import Notification
        status_messages = {
            'confirmed': 'Your order has been confirmed and is being prepared.',
            'processing': 'Your order is being processed and packed.',
            'shipped': 'Your order has been shipped!',
            'delivered': 'Your order has been delivered!',
        }
        Notification.send(
            user=order.user,
            notification_type=f'order_{new_status}',
            title=f'Order {new_status.title()}',
            message=status_messages.get(new_status, f'Order status updated to {new_status}.'),
            link=f'/orders/{order.order_id}',
        )

        return Response({
            'message': f'Order status updated to {new_status}.',
            'order_id': str(order.order_id),
            'status': order.status,
        })

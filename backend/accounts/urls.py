"""
Accounts App — URL Configuration
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = 'accounts'

urlpatterns = [
    # Auth
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # OTP Verification
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend-otp'),

    # Profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),

    # Admin Dashboard
    path('admin/dashboard/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/users/', views.AdminUsersListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/sellers/pending/', views.AdminPendingSellersView.as_view(), name='admin-pending-sellers'),
    path('admin/sellers/<int:pk>/approve/', views.AdminSellerApprovalView.as_view(), name='admin-seller-approve'),
    path('admin/products/', views.AdminProductsView.as_view(), name='admin-products'),
    path('admin/products/<int:pk>/approve/', views.AdminProductApprovalView.as_view(), name='admin-product-approve'),
    path('admin/orders/', views.AdminOrdersView.as_view(), name='admin-orders'),
    path('admin/reviews/', views.AdminReviewsView.as_view(), name='admin-reviews'),
    path('admin/reviews/<int:pk>/', views.AdminReviewDeleteView.as_view(), name='admin-review-delete'),

    # Seller Dashboard
    path('seller/dashboard/', views.SellerDashboardView.as_view(), name='seller-dashboard'),
    path('seller/orders/', views.SellerOrdersView.as_view(), name='seller-orders'),
    path('seller/orders/<str:order_id>/update-status/', views.SellerOrderUpdateView.as_view(), name='seller-order-update'),
]

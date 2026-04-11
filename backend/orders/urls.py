"""
Orders App — URL Configuration
"""
from django.urls import path
from . import views

app_name = 'orders'

urlpatterns = [
    path('', views.OrderListView.as_view(), name='order-list'),
    path('create/', views.OrderCreateView.as_view(), name='order-create'),
    path('upi-info/', views.UPIInfoView.as_view(), name='upi-info'),
    path('<uuid:order_id>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<uuid:order_id>/pay/', views.PaymentProcessView.as_view(), name='order-pay'),
    path('<uuid:order_id>/cancel/', views.OrderCancelView.as_view(), name='order-cancel'),
    path('<uuid:order_id>/track/', views.OrderTrackView.as_view(), name='order-track'),
]

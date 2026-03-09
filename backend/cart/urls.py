"""
Cart App — URL Configuration
"""
from django.urls import path
from . import views

app_name = 'cart'

urlpatterns = [
    path('', views.CartListView.as_view(), name='cart-list'),
    path('<int:pk>/', views.CartItemDetailView.as_view(), name='cart-item-detail'),
    path('clear/', views.CartClearView.as_view(), name='cart-clear'),
]

"""
Wishlist App — URL Configuration
"""
from django.urls import path
from . import views

app_name = 'wishlist'

urlpatterns = [
    path('', views.WishlistListCreateView.as_view(), name='wishlist-list'),
    path('<int:pk>/', views.WishlistItemDeleteView.as_view(), name='wishlist-delete'),
    path('clear/', views.WishlistClearView.as_view(), name='wishlist-clear'),
]

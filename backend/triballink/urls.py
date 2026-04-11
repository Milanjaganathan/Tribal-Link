"""
TribalLink URL Configuration
Root URL router that includes all app-level URLs.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.generic import TemplateView


def api_root(request):
    """API root endpoint with available routes."""
    return JsonResponse({
        'message': 'Welcome to TribalLink API',
        'version': '2.0.0',
        'endpoints': {
            'admin': '/admin/',
            'accounts': '/api/accounts/',
            'products': '/api/products/',
            'cart': '/api/cart/',
            'wishlist': '/api/wishlist/',
            'orders': '/api/orders/',
            'search': '/api/search/',
            'notifications': '/api/notifications/',
        }
    })


urlpatterns = [
    path('api/', api_root, name='api-root'),
    path('', TemplateView.as_view(template_name='index.html'), name='frontend'),
    path('admin/', admin.site.urls),

    # API endpoints
    path('api/accounts/', include('accounts.urls')),
    path('api/products/', include('products.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/wishlist/', include('wishlist.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/search/', include('search.urls')),
    path('api/notifications/', include('notifications.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

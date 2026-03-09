"""
Search App — URL Configuration
"""
from django.urls import path
from . import views

app_name = 'search'

urlpatterns = [
    path('', views.SearchView.as_view(), name='search'),
    path('voice/', views.VoiceSearchView.as_view(), name='voice-search'),
    path('suggestions/', views.SearchSuggestionsView.as_view(), name='search-suggestions'),
]

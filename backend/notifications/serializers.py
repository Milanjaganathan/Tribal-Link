"""
Notifications App — Serializers
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'link', 'is_read', 'created_at',
        ]
        read_only_fields = ['id', 'notification_type', 'title', 'message', 'link', 'created_at']


class BroadcastSerializer(serializers.Serializer):
    """Serializer for admin broadcast notifications."""
    title = serializers.CharField(max_length=300)
    message = serializers.CharField()
    link = serializers.CharField(required=False, allow_blank=True, default='')
    role = serializers.ChoiceField(
        choices=[('', 'All Users'), ('customer', 'Customers'), ('seller', 'Sellers')],
        required=False,
        allow_blank=True,
        default='',
    )

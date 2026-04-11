"""
Notifications App — Views
In-app notification management.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer, BroadcastSerializer


class NotificationListView(generics.ListAPIView):
    """
    GET /api/notifications/
    List user's notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class UnreadCountView(APIView):
    """
    GET /api/notifications/unread-count/
    Get count of unread notifications.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return Response({'unread_count': count})


class MarkReadView(APIView):
    """
    POST /api/notifications/<id>/read/
    Mark a notification as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.is_read = True
            notification.save(update_fields=['is_read'])
            return Response({'message': 'Marked as read.'})
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )


class MarkAllReadView(APIView):
    """
    POST /api/notifications/mark-all-read/
    Mark all notifications as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return Response({'message': f'{count} notifications marked as read.'})


class BroadcastView(APIView):
    """
    POST /api/notifications/broadcast/
    Admin-only: broadcast notification to all users.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        serializer = BroadcastSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        role = data.get('role', '') or None
        notifications = Notification.broadcast(
            title=data['title'],
            message=data['message'],
            link=data.get('link', ''),
            role=role,
        )
        return Response({
            'message': f'Broadcast sent to {len(notifications)} users.',
            'count': len(notifications),
        })

"""
Search App — Views
Text and voice search for products.
"""
import os
import tempfile
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q

from products.models import Product, Category
from products.serializers import ProductListSerializer, CategorySerializer


class SearchView(APIView):
    """
    GET /api/search/?q=<query>&category=<id>&min_price=<>&max_price=<>
    Full-text search across products.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        category_id = request.query_params.get('category')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        sort_by = request.query_params.get('sort', '-created_at')

        if not query:
            return Response(
                {'error': 'Search query is required. Use ?q=<query>'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Search in product name, description, and category name
        products = Product.objects.filter(
            status='approved',
        ).filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(category__name__icontains=query)
        ).select_related('category', 'seller')

        # Optional filters
        if category_id:
            products = products.filter(category_id=category_id)
        if min_price:
            products = products.filter(price__gte=min_price)
        if max_price:
            products = products.filter(price__lte=max_price)

        # Sorting
        allowed_sorts = ['price', '-price', 'name', '-name', 'created_at', '-created_at']
        if sort_by in allowed_sorts:
            products = products.order_by(sort_by)

        # Matching categories
        matching_categories = Category.objects.filter(
            name__icontains=query, is_active=True
        )

        serializer = ProductListSerializer(products[:50], many=True)
        cat_serializer = CategorySerializer(matching_categories, many=True)

        return Response({
            'query': query,
            'count': products.count(),
            'products': serializer.data,
            'matching_categories': cat_serializer.data,
        })


class VoiceSearchView(APIView):
    """
    POST /api/search/voice/
    Accept audio file, convert to text, and search products.

    Accepts: audio file in 'audio' field (WAV, MP3, WEBM, OGG).
    """
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        audio_file = request.FILES.get('audio')

        if not audio_file:
            return Response(
                {'error': 'Audio file is required. Upload in "audio" field.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            import speech_recognition as sr

            # Save uploaded file to temporary location
            suffix = os.path.splitext(audio_file.name)[1] or '.wav'
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=suffix
            ) as tmp_file:
                for chunk in audio_file.chunks():
                    tmp_file.write(chunk)
                tmp_path = tmp_file.name

            # Convert to WAV if needed (for non-WAV formats)
            wav_path = tmp_path
            if suffix.lower() not in ('.wav',):
                try:
                    from pydub import AudioSegment
                    audio = AudioSegment.from_file(tmp_path)
                    wav_path = tmp_path.replace(suffix, '.wav')
                    audio.export(wav_path, format='wav')
                except Exception:
                    # If conversion fails, try with original
                    wav_path = tmp_path

            # Recognize speech
            recognizer = sr.Recognizer()
            with sr.AudioFile(wav_path) as source:
                audio_data = recognizer.record(source)
                text = recognizer.recognize_google(audio_data, language='en-IN')

            # Clean up temp files
            try:
                os.unlink(tmp_path)
                if wav_path != tmp_path:
                    os.unlink(wav_path)
            except OSError:
                pass

            # Search with recognized text
            products = Product.objects.filter(
                status='approved',
            ).filter(
                Q(name__icontains=text) |
                Q(description__icontains=text) |
                Q(category__name__icontains=text)
            ).select_related('category', 'seller')[:20]

            serializer = ProductListSerializer(products, many=True)

            return Response({
                'recognized_text': text,
                'count': len(serializer.data),
                'products': serializer.data,
            })

        except ImportError:
            return Response(
                {'error': 'Speech recognition not available. Install SpeechRecognition package.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except sr.UnknownValueError:
            return Response(
                {'error': 'Could not understand audio. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except sr.RequestError as e:
            return Response(
                {'error': f'Speech recognition service error: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as e:
            return Response(
                {'error': f'Voice search error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SearchSuggestionsView(APIView):
    """
    GET /api/search/suggestions/?q=<partial_query>
    Auto-complete suggestions for search.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()

        if len(query) < 2:
            return Response({'suggestions': []})

        # Get product name suggestions
        products = Product.objects.filter(
            status='approved',
            name__icontains=query,
        ).values_list('name', flat=True).distinct()[:8]

        # Get category suggestions
        categories = Category.objects.filter(
            name__icontains=query,
            is_active=True,
        ).values_list('name', flat=True)[:4]

        suggestions = list(categories) + list(products)

        return Response({'suggestions': suggestions[:10]})

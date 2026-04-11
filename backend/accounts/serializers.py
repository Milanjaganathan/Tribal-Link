"""
Accounts App — Serializers
Handles user registration, login, OTP verification, and profile serialization.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with password confirmation."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
    )

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'password', 'password2',
            'first_name', 'last_name', 'phone', 'role',
            'shop_name', 'shop_description',
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {'password': 'Passwords do not match.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        # Sellers need admin approval
        if user.role == User.Role.SELLER:
            user.is_verified_seller = False
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Full user profile serializer."""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'phone', 'role', 'avatar', 'bio', 'address',
            'city', 'state', 'pincode', 'shop_name', 'shop_description',
            'is_verified_seller', 'is_email_verified',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'email', 'role', 'is_verified_seller',
            'is_email_verified', 'created_at', 'updated_at',
        ]


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user info for embedding in other serializers."""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'full_name',
            'avatar', 'shop_name', 'email', 'phone',
        ]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that includes user data in the response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserProfileSerializer(self.user).data
        return data


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for OTP verification."""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)


class OTPResendSerializer(serializers.Serializer):
    """Serializer for resending OTP."""
    email = serializers.EmailField()


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user management."""
    full_name = serializers.ReadOnlyField()
    products_count = serializers.SerializerMethodField()
    orders_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'phone', 'role', 'avatar', 'shop_name',
            'shop_description', 'is_verified_seller', 'is_email_verified',
            'is_active', 'date_joined', 'products_count', 'orders_count',
        ]

    def get_products_count(self, obj):
        if obj.role == 'seller':
            return obj.products.count()
        return 0

    def get_orders_count(self, obj):
        return obj.orders.count()


class SellerApprovalSerializer(serializers.Serializer):
    """Serializer for seller approval/rejection."""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    reason = serializers.CharField(required=False, allow_blank=True, default='')

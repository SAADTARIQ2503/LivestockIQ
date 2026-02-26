"""
Authentication API Views for LivestockIQ
Handles user registration, login, logout, and profile management
"""

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User

# Import serializers (these would be in a separate serializers.py file)
from ..serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer,
    ChangePasswordSerializer
)


class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration
    POST /api/v1/auth/register/
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'User created successfully! Please sign in.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token obtain view that includes user data
    POST /api/v1/auth/login/
    
    Request body:
    {
        "username": "string",
        "email": "string",  
        "password": "string"
    }
    
    Response:
    {
        "refresh": "token",
        "access": "token",
        "user": {
            "id": 1,
            "username": "string",
            "email": "string",
            "first_name": "string",
            "last_name": "string"
        }
    }
    """
    permission_classes = (AllowAny,)
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    API endpoint for logout (blacklist refresh token)
    POST /api/v1/auth/logout/
    
    Request body:
    {
        "refresh": "refresh_token"
    }
    """
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response(
            {'message': 'Successfully logged out'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Get current user profile
    GET /api/v1/auth/user/
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """
    Update user profile
    PUT/PATCH /api/v1/auth/user/
    
    Request body:
    {
        "first_name": "string",
        "last_name": "string",
        "email": "string"
    }
    """
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Profile updated successfully',
            'user': serializer.data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Change user password
    POST /api/v1/auth/change-password/
    
    Request body:
    {
        "old_password": "string",
        "new_password": "string",
        "new_password2": "string"
    }
    """
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats_view(request):
    """
    Get dashboard statistics for the current user
    GET /api/v1/auth/dashboard/
    """
    from animals.models import Animal
    from health.models import VaccinationSchedule
    from django.db.models import Count, Q
    from datetime import datetime, timedelta
    
    user = request.user
    
    # Animal statistics
    total_animals = Animal.objects.filter(user=user).count()
    healthy_animals = Animal.objects.filter(user=user, is_healthy=True).count()
    unhealthy_animals = total_animals - healthy_animals
    
    # Vaccination statistics
    total_schedules = VaccinationSchedule.objects.filter(
        Q(animal__user=user) | Q(is_group=True)
    ).count()
    completed_vaccinations = VaccinationSchedule.objects.filter(
        Q(animal__user=user) | Q(is_group=True),
        is_completed=True
    ).count()
    pending_vaccinations = total_schedules - completed_vaccinations
    
    # Upcoming vaccinations (next 7 days)
    today = datetime.now().date()
    next_week = today + timedelta(days=7)
    upcoming_vaccinations = VaccinationSchedule.objects.filter(
        Q(animal__user=user) | Q(is_group=True),
        schedule_date__range=[today, next_week],
        is_completed=False
    ).count()
    
    # Animals by type
    animals_by_type = Animal.objects.filter(user=user).values('animal_type').annotate(
        count=Count('id')
    )
    
    return Response({
        'animals': {
            'total': total_animals,
            'healthy': healthy_animals,
            'unhealthy': unhealthy_animals,
            'by_type': list(animals_by_type)
        },
        'vaccinations': {
            'total': total_schedules,
            'completed': completed_vaccinations,
            'pending': pending_vaccinations,
            'upcoming': upcoming_vaccinations
        },
        'vaccination_chart': {
            'labels': ['Vaccinated', 'Unvaccinated', 'Overdue'],
            'data': [
                completed_vaccinations,
                pending_vaccinations,
                0  # You can calculate overdue based on dates
            ],
            'colors': ["#28a745", '#ffc107', '#dc3545']
        }
    })

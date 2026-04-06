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
    from animals.models import Animal, MortalityRecord
    from health.models import VaccinationSchedule
    from django.db.models import Count
    from datetime import timedelta, date as date_obj

    user = request.user
    today = date_obj.today()

    # ── Animal statistics (exclude dead animals) ─────────────────────────────
    live_animals = Animal.objects.filter(user=user).exclude(mortality_record__isnull=False)
    total_animals     = live_animals.count()
    healthy_animals   = live_animals.filter(is_healthy=True).count()
    unhealthy_animals = total_animals - healthy_animals

    animals_by_type = list(
        live_animals
        .values('animal_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # ── Vaccination statistics (only this user's animals) ────────────────────
    user_schedules = VaccinationSchedule.objects.filter(animal__user=user)

    total_schedules       = user_schedules.count()
    completed_vaccinations = user_schedules.filter(is_completed=True).count()
    overdue_vaccinations  = user_schedules.filter(
        is_completed=False,
        schedule_date__lt=today,
    ).count()
    # pending = not completed and not overdue (due today or in the future)
    pending_vaccinations  = user_schedules.filter(
        is_completed=False,
        schedule_date__gte=today,
    ).count()
    upcoming_vaccinations = user_schedules.filter(
        is_completed=False,
        schedule_date__range=[today, today + timedelta(days=7)],
    ).count()

    # ── Mortality statistics ─────────────────────────────────────────────────
    this_month_start = today.replace(day=1)
    total_deaths      = MortalityRecord.objects.filter(farm__user=user).count()
    deaths_this_month = MortalityRecord.objects.filter(
        farm__user=user,
        date_of_death__gte=this_month_start,
    ).count()

    return Response({
        'animals': {
            'total':     total_animals,
            'healthy':   healthy_animals,
            'unhealthy': unhealthy_animals,
            'by_type':   animals_by_type,
        },
        'vaccinations': {
            'total':     total_schedules,
            'completed': completed_vaccinations,
            'pending':   pending_vaccinations,
            'overdue':   overdue_vaccinations,
            'upcoming':  upcoming_vaccinations,
        },
        'mortality': {
            'total':      total_deaths,
            'this_month': deaths_this_month,
        },
    })

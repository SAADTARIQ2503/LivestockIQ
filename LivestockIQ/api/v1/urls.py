"""
API V1 URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
# from .views import animals, health, auth, environment, alerts, costs
from .views import animals
from .views import health
from .views import auth
from .views import environment
from .views import alerts
from .views import costs
from rest_framework_simplejwt.views import TokenRefreshView
# from api.v1.views import alerts

# Create router for viewsets
router = DefaultRouter()
router.register(r'animals', animals.AnimalViewSet, basename='animal')
router.register(r'health/schedules', health.VaccinationScheduleViewSet, basename='vaccination-schedule')

app_name = 'v1'


urlpatterns = [
    # Authentication endpoints
    path('auth/register/', auth.RegisterView.as_view(), name='register'),
    path('auth/login/', auth.CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/logout/', auth.logout_view, name='logout'),
    path('auth/user/', auth.user_profile_view, name='user-profile'),
    path('auth/user/update/', auth.update_profile_view, name='update-profile'),
    path('auth/change-password/', auth.change_password_view, name='change-password'),
    path('auth/dashboard/', auth.dashboard_stats_view, name='dashboard-stats'),
    
    # JWT token endpoints
    
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Health/Vaccination endpoints
    path('health/vaccines/', health.VaccineListView.as_view(), name='vaccine-list'),
    path('health/vaccines/recommended/', health.RecommendedVaccinesView.as_view(), name='recommended-vaccines'),
    path('health/vaccines/<slug:slug>/', health.VaccineDetailView.as_view(), name='vaccine-detail'),
    path('health/vaccines/by-species/', health.VaccinesBySpeciesView.as_view(), name='vaccines-by-species'),
    
    
    # Router URLs (includes animals and schedules)
    path('', include(router.urls)),


    path('environment/weather/', environment.get_weather_data, name='weather-data'),
    path('environment/status/', environment.get_environment_status, name='environment-status'),
    path('environment/coordinates/', environment.get_coordinates_for_location, name='coordinates'),
    
    # # Alerts endpoints
    # path('alerts/', alerts.get_anomalies, name='anomalies-list'),
    # path('alerts/<str:anomaly_id>/', alerts.get_anomaly_detail, name='anomaly-detail'),
    # path('alerts/<str:anomaly_id>/acknowledge/', alerts.acknowledge_anomaly, name='anomaly-acknowledge'),
    # path('alerts/statistics/', alerts.get_anomaly_statistics, name='anomaly-statistics'),
    # path('alerts/unacknowledged/', alerts.get_unacknowledged_anomalies, name='unacknowledged-anomalies'),

    # Alerts
    path('alerts/', alerts.AlertListCreateView.as_view(), name='alert-list-create'),
    path('alerts/<int:pk>/', alerts.AlertDetailView.as_view(), name='alert-detail'),
    path('alerts/<int:pk>/resolve/', alerts.ResolveAlertView.as_view(), name='resolve-alert'),
    path('alerts/active/', alerts.ActiveAlertsView.as_view(), name='active-alerts'),

    # AI Detection
    path('ai/detect/', alerts.DetectDiseaseView.as_view(), name='ai-detect'),
    path('ai/history/', alerts.DetectionHistoryView.as_view(), name='detection-history'),
    path('ai/detections/<int:pk>/', alerts.DetectionDetailView.as_view(), name='detection-detail'),
    
    path('costs/transactions/', costs.TransactionListCreateView.as_view(), name='transaction-list-create'),
    path('costs/transactions/<int:pk>/', costs.TransactionDetailView.as_view(), name='transaction-detail'),
    path('costs/summary/', costs.SummaryView.as_view(), name='costs-summary'),
    path('costs/report/', costs.ReportView.as_view(), name='costs-report'),
    path('costs/breakdown/', costs.CategoryBreakdownView.as_view(), name='costs-breakdown'),
]
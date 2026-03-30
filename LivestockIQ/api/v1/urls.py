"""
API V1 URL Configuration
Place at: LivestockIQ/api/v1/urls.py
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import animals, health, auth, environment, alerts, costs, farms, mortality
from .views.health import LamenessDetectView, LamenessHistoryView
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'animals', animals.AnimalViewSet, basename='animal')
router.register(r'health/schedules', health.VaccinationScheduleViewSet, basename='vaccination-schedule')
router.register(r'health/vaccines', health.VaccineDatasetViewSet, basename='vaccine')

app_name = 'v1'

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('auth/register/',        auth.RegisterView.as_view(),           name='register'),
    path('auth/login/',           auth.CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/logout/',          auth.logout_view,                      name='logout'),
    path('auth/user/',            auth.user_profile_view,                name='user-profile'),
    path('auth/user/update/',     auth.update_profile_view,              name='update-profile'),
    path('auth/change-password/', auth.change_password_view,             name='change-password'),
    path('auth/dashboard/',       auth.dashboard_stats_view,             name='dashboard-stats'),
    path('auth/refresh/',         TokenRefreshView.as_view(),            name='token-refresh'),

    # ── Farms ─────────────────────────────────────────────────────────────────
    path('farms/',              farms.FarmListCreateView.as_view(), name='farm-list-create'),
    path('farms/geocode/',      farms.FarmGeocodeView.as_view(),   name='farm-geocode'),
    path('farms/<int:pk>/',     farms.FarmDetailView.as_view(),    name='farm-detail'),

    # ── Router (animals, schedules, vaccines) ─────────────────────────────────
    # This provides:
    # - GET/POST /api/v1/animals/
    # - GET/PUT/PATCH/DELETE /api/v1/animals/{id}/
    # - GET /api/v1/animals/search/
    # - GET /api/v1/animals/statistics/
    # - GET /api/v1/animals/vaccines-by-species/
    
    # - GET/POST /api/v1/health/schedules/
    # - GET/PUT/PATCH/DELETE /api/v1/health/schedules/{id}/
    # - POST /api/v1/health/schedules/{id}/complete/
    # - GET /api/v1/health/schedules/upcoming/
    # - GET /api/v1/health/schedules/overdue/
    # - GET /api/v1/health/schedules/by_animal/
    
    # - GET /api/v1/health/vaccines/
    # - GET /api/v1/health/vaccines/{id}/
    # - GET /api/v1/health/vaccines/by_species/
    # - GET /api/v1/health/vaccines/recommended/
    path('', include(router.urls)),

    # ── Environment ───────────────────────────────────────────────────────────
    path('environment/weather/',       environment.get_weather_data,              name='weather-data'),
    path('environment/status/',        environment.get_environment_status,        name='environment-status'),
    path('environment/coordinates/',   environment.get_coordinates_for_location,  name='coordinates'),
    path('environment/statistics/',    environment.EnvironmentStatisticsView.as_view(), name='environment-statistics'),
    path('environment/forecast/',      environment.EnvironmentForecastView.as_view(),   name='environment-forecast'),
    path('environment/alerts/',        environment.EnvironmentAlertsView.as_view(),     name='environment-alerts'),
    path('environment/farms-weather/', farms.FarmsWeatherView.as_view(),          name='farms-weather'),

    # ── Alerts ────────────────────────────────────────────────────────────────
    path('alerts/',                  alerts.AlertListCreateView.as_view(),  name='alert-list-create'),
    path('alerts/<int:pk>/',         alerts.AlertDetailView.as_view(),      name='alert-detail'),
    path('alerts/<int:pk>/resolve/', alerts.ResolveAlertView.as_view(),     name='resolve-alert'),
    path('alerts/active/',           alerts.ActiveAlertsView.as_view(),     name='active-alerts'),

    # Specialized alert feeds
    path('alerts/environmental/',                  alerts.EnvironmentalAlertListView.as_view(),    name='environmental-alerts'),
    path('alerts/environmental/<int:pk>/resolve/', alerts.ResolveEnvironmentalAlertView.as_view(), name='resolve-environmental-alert'),
    path('alerts/vaccination/',                    alerts.VaccinationAlertListView.as_view(),      name='vaccination-alerts'),
    path('alerts/vaccination/<int:pk>/resolve/',   alerts.ResolveVaccinationAlertView.as_view(),   name='resolve-vaccination-alert'),
    path('alerts/health/',                         alerts.HealthAlertListView.as_view(),           name='health-alerts'),
    path('alerts/health/<int:pk>/resolve/',        alerts.ResolveHealthAlertView.as_view(),        name='resolve-health-alert'),

    # ── AI Detection ──────────────────────────────────────────────────────────
    path('ai/detect/',               alerts.DetectDiseaseView.as_view(),    name='ai-detect'),
    path('ai/history/',              alerts.DetectionHistoryView.as_view(), name='detection-history'),
    path('ai/detections/<int:pk>/',  alerts.DetectionDetailView.as_view(), name='detection-detail'),

    # ── Lameness Detection ────────────────────────────────────────────────────
    path('health/lameness/detect/',  LamenessDetectView.as_view(),  name='lameness-detect'),
    path('health/lameness/history/', LamenessHistoryView.as_view(), name='lameness-history'),

    # ── Costs ─────────────────────────────────────────────────────────────────
    path('costs/transactions/',          costs.TransactionListCreateView.as_view(), name='transaction-list-create'),
    path('costs/transactions/<int:pk>/', costs.TransactionDetailView.as_view(),     name='transaction-detail'),
    path('costs/summary/',               costs.SummaryView.as_view(),               name='costs-summary'),
    path('costs/report/',                costs.ReportView.as_view(),                name='costs-report'),
    path('costs/breakdown/',             costs.CategoryBreakdownView.as_view(),     name='costs-breakdown'),

    # ── Mortality ─────────────────────────────────────────────────────────────
    path('mortality/',             mortality.MortalityListCreateView.as_view(), name='mortality-list-create'),
    path('mortality/<int:pk>/',    mortality.MortalityDetailView.as_view(),     name='mortality-detail'),
    path('mortality/summary/',     mortality.MortalitySummaryView.as_view(),    name='mortality-summary'),
]
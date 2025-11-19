from django.urls import path
from . import views

# New Namespace
app_name = 'alerts' 

urlpatterns = [
    # Anomaly List View
    path('list/', views.anomalies_view, name='anomalies'),
    
    # Anomaly Detail View (Dynamic URL)
    path('<str:anomaly_id>/', views.anomaly_detail_view, name='anomaly_detail'),
]
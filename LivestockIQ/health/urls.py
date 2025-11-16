from django.urls import path
from . import views

# CRITICAL: Define the app namespace
app_name = 'health' 

urlpatterns = [
    path('vaccine-schedule/', views.vaccination_schedule_view, name='vaccination_schedule'),
     # New: Recommended vaccines list
    path('recommendations/', views.recommended_vaccines_view, name='recommended_vaccines'),
    
    # New: Form to add a new schedule/vaccine record
    path('schedule/new/', views.schedule_form_view, name='schedule_form'),
    
]
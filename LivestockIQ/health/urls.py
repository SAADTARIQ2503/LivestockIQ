from django.urls import path
from . import views


app_name = 'health' 

urlpatterns = [
    path('vaccine-schedule/', views.vaccination_schedule_view, name='vaccination_schedule'),
    path('recommendations/', views.recommended_vaccines_view, name='recommended_vaccines'),
    path('schedule/new/', views.schedule_form_view, name='schedule_form'),
    
]
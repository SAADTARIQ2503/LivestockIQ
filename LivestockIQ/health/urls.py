from django.urls import path
from . import views


app_name = 'health' 

urlpatterns = [
    # path('vaccine-schedule/', views.vaccination_schedule_view, name='vaccination_schedule'),
    # Specifics first:
    path('schedule/new/', views.schedule_form_view, name='schedule_form'),
    path('schedule/complete/<int:schedule_id>/', views.mark_vaccine_completed, name='mark_vaccine_completed'),
    path('schedule/delete/<int:schedule_id>/', views.delete_vaccine_schedule, name='delete_vaccine_schedule'),
    
    # Generic schedule view last:
    path('schedule/', views.vaccination_schedule_view, name='vaccination_schedule'),
    
    # Other paths:
    path('recommendations/', views.recommended_vaccines_view, name='recommended_vaccines'),
    path('recommendations/<str:vaccine_name_slug>/', views.vaccine_detail_view, name='vaccine_detail'),
    path('ajax/vaccines/', views.get_vaccines_by_species, name='ajax_vaccines_by_species'),
]
    

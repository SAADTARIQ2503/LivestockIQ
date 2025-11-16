from django.urls import path
from . import views

app_name = 'environment'

urlpatterns = [
    # This creates a URL for your view_data function
    path('view/', views.view_data, name='view_data'),
]
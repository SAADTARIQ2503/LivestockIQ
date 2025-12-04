from django.urls import path
from . import views

app_name = 'calculate_cost'

urlpatterns = [
    # Use an empty string '' here, NOT 'calculate_cost/'
    path('', views.calculator_view, name='calculator'),
]
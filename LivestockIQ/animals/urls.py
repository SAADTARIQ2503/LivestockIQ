from django.urls import path
from . import views

# This is important for "namespacing"
# It lets us use 'animals:add_animal'
app_name = 'animals' 

urlpatterns = [
    # This will be the URL: .../animals/add/
    path('add/', views.add_animal, name='add_animal'),
]
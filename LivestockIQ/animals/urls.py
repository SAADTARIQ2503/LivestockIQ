from django.urls import path
from . import views

app_name = 'animals' 

urlpatterns = [
    # This will be the URL: .../animals/add/
    path('add_animal/', views.add_animal, name='add_animal'),
    path('search/', views.search_animal, name='search_livestock'),
]
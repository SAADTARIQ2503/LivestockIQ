from django.urls import path
from . import views

app_name = 'animals' 

urlpatterns = [
    # This will be the URL: .../animals/add/
    path('add_animal/', views.add_animal, name='add_animal'),
    path('search/', views.search_animal, name='search_livestock'),
    path('select/', views.select_method, name='select_method'),
    path('auto_add/', views.auto_add, name='auto_add'),
    path('ajax/vaccines/', views.get_vaccines_by_species_for_animal_add, name='ajax_vaccines_by_species_add'),
]
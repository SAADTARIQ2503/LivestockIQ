from django.urls import path
from . import views

urlpatterns = [
    path('',views.temp , name='temp') ,
    path('home/',views.home , name='home') ,
    path('add_animal/',views.addAnimal , name='add_animal') ,
    path('signup/' , views.signup , name = 'signup'),
    path('signin/',views.signin , name= 'signin'),
]

from django.urls import path
from . import views

urlpatterns = [
    path('home/',views.home , name='home') ,
    path('',views.temp , name='temp') ,
    path('signup/' , views.signup , name = 'signup'),
    path('signin/',views.signin , name= 'signin'),
]

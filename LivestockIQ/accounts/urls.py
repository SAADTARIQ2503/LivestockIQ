from django.urls import path
from . import views
app_name = 'accounts'
urlpatterns = [
    path('',views.temp , name='temp') ,
    path('home/',views.home , name='home') ,
    # path('add_animal/',views.addAnimal , name='add_animal') ,
    path('signup/' , views.signup , name = 'signup'),
    path('signin/',views.signin , name= 'signin'),
]

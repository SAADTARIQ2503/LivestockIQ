from django.urls import path
from . import views
app_name = 'accounts'
urlpatterns = [
    path('',views.home , name='home') ,
    path('temp/',views.temp , name='temp') ,
    path('signup/' , views.signup , name = 'signup'),
    path('signin/',views.signin , name= 'signin'),
]

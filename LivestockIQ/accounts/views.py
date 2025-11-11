from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages, auth


def home(request):
    return render(request , 'home.html')

def signup(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST['password']
        
        user = User.objects.create_user(username = username ,email = email , password= password)
        user.save()
        messages.success(request , 'ho gia')
        return redirect('signin')
    return render(request ,'signup.html')

def sigin(request):
    if request.method == 'POST' :
        email = request.POST['email']
        password = request.POST['password']
        
        user = auth.authenticate(email = email ,password = password)
        
        if user is not None :
            auth.login(request , user)
            redirect ('home')
            
        else:
            messages.error(request , 'nhi hoaa')
    return (request , render('sign.html'))
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages, auth

def temp(request):
    return render(request , 'temp.html')

def home(request):
    return render(request , 'home.html')

def signup(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST['password']
        
        user = User.objects.create_user(username = username ,email = email , password= password)
        user.save()
        messages.success(request , 'Successful')
        return redirect('accounts:signin')
    return render(request ,'signup.html')

def signin(request):
    if request.method == 'POST' :
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST['password']

        user = auth.authenticate(username=username, email=email, password=password)

        if user is not None :
            auth.login(request, user)
            return redirect('accounts:home')
            
        else:
            messages.error(request , 'not successful')
    return render(request , 'signin.html')


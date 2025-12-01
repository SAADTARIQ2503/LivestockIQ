from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages, auth
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
import json
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.contrib.auth import logout

def temp(request):
    return render(request , 'temp.html')

@login_required
def home(request):
    # Dummy data for Herd Health Chart 1 (Doughnut Chart: Vaccinated vs. Unvaccinated)
    vaccination_data = {
        'labels': ['Vaccinated', 'Unvaccinated', 'Overdue'],
        'data': [78, 15, 7],
        'colors': ["#28a745", '#ffc107', '#dc3545']
    }

    # Dummy data for Herd Health Chart 2 (Bar Chart: Mortality Rate by Type)
    mortality_data = {
        'labels': ['Cows', 'Sheep', 'Goats'],
        'data': [3, 1, 5], # Number of mortalities last 30 days
        'colors': ['#dc3545', '#dc3545', '#dc3545']
    }

    context = {
        'vaccination_data_json': json.dumps(vaccination_data),
        'mortality_data_json': json.dumps(mortality_data),
    }

    return render(request , 'home.html', context)

@csrf_exempt
def signup(request):
    
    if request.method == 'POST':
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')

        if password != password2:
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'Passwords do not match.'})
            messages.error(request, "Passwords do not match.")
            return redirect('accounts:signup')

        if User.objects.filter(username=username).exists():
            if is_ajax:
                return JsonResponse({'status': 'error', 'mesername=username)ssage': f"Username '{username}' is already taken."})
            messages.error(request, f"Username '{username}' is already taken.")
            return redirect('accounts:signup')

        if User.objects.filter(email=email).exists():
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': f"An account with email '{email}' already exists."})
            messages.error(request, f"An account with email '{email}' already exists.")
            return redirect('accounts:signup')
        
        try:
            user = User.objects.create_user(username = username ,email = email , password= password)
            user.save()
            if is_ajax:
                return JsonResponse({'status': 'success', 'message': 'User created successfully! Please sign in.', 'redirect_url': reverse('accounts:signin')})
            messages.success(request , 'User created successfully! Please sign in.')
            return redirect('accounts:signin')
        except Exception as e:
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': f'An error occurred: {e}'})
            messages.error(request, f'An error occurred: {e}')
            return redirect('accounts:signup')
            
    return render(request ,'signup.html')

@csrf_exempt
def signin(request):
    
    if request.method == 'POST':
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        username = request.POST.get('username')
        password = request.POST.get('password')

        if not username or not password:
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'Please provide both username and password.'})
            messages.error(request, 'Please provide both username and password.')
            return render(request, 'signin.html')

        user = auth.authenticate(request, username=username, password=password)

        if user is not None:
            auth.login(request, user)
            if is_ajax:
                return JsonResponse({'status': 'success', 'message': f'Welcome back, {username}!', 'redirect_url': reverse('accounts:home')})
            messages.success(request, f'Welcome back, {username}!')
            return redirect('accounts:home')
            
        else:
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'Invalid credentials. Please try again.'})
            messages.error(request , 'Invalid credentials. Please try again.')
    return render(request , 'signin.html')


@login_required
def logout_view(request):
    """Logs out the current user and redirects to the sign-in page."""
    
    messages.success(request, "You have been successfully logged out.")
    auth.logout(request)

    return redirect('accounts:signin')
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages, auth
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
import json
import re 

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
        
        # --- Username Validation Implementation ---
        username_error = None
        
        # 1. Check length (5 to 25 characters)
        if not (5 <= len(username) <= 25):
            username_error = 'Username must be between 5 and 25 characters long.'
        
        # 2. Check for allowed characters (A-z, 0-9, and only '_')
     
        elif not re.match(r'^[a-zA-Z0-9_]+$', username):
            username_error = 'Username can only contain letters, numbers, and the underscore (_).'
            
        # Handle username validation error
        if username_error:
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': username_error})
            messages.error(request, username_error)
            return redirect('accounts:signup')
        
        # --- End of Username Validation Implementation ---
        
        if User.objects.filter(username=username).exists():
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': f"Username '{username}' is already taken."})
            messages.error(request, f"Username '{username}' is already taken.")
            return redirect('accounts:signup')
            
        # --- Password Validation Implementation ---
        
        validation_error = None
        
        # 1. Check if passwords match
        if password != password2:
            validation_error = 'Passwords do not match.'
        
        # 2. Check minimum length (8 characters)
        elif len(password) < 8:
            validation_error = 'Password must be at least 8 characters long.'

        # 3. Check for at least 1 uppercase character
        elif not re.search(r'[A-Z]', password):
            validation_error = 'Password must contain at least one uppercase letter.'
            
        # 4. Check for at least 1 special character (non-alphanumeric)
        elif not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            validation_error = 'Password must contain at least one special character (e.g., !@#$%^&*).'
        
        # Handle password validation error
        if validation_error:
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': validation_error}) 
            messages.error(request, validation_error)
            return redirect('accounts:signup')
        
        # --- End of Password Validation Implementation ---

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
        email = request.POST.get('email')

        # --- Basic Validation ---
        if not username or not password or not email:
            msg = 'Please provide username, email, and password.'
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': msg})
            messages.error(request, msg)
            return render(request, 'signin.html')
        
        # --- Username Existence Check ---
        try:
            user_obj = User.objects.get(username=username)
        except User.DoesNotExist:
            msg = 'Username does not exist.'
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': msg})
            messages.error(request, msg)
            return render(request, 'signin.html')

        # --- New: Link Email to Username Check ---
        # Ensure the provided email matches the email linked to the retrieved username object.
        if user_obj.email.lower() != email.lower():
            msg = 'The provided email does not match the username.'
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': msg})
            messages.error(request, msg)
            return render(request, 'signin.html')

        # --- Authentication Attempt ---
        user = auth.authenticate(request, username=username, password=password)

        if user is not None:
            auth.login(request, user)
            if is_ajax:
                return JsonResponse({
                    'status': 'success', 
                    'message': f'Welcome back, {username}!', 
                    'redirect_url': reverse('accounts:home')
                })
            messages.success(request, f'Welcome back, {username}!')
            return redirect('accounts:home')
            
        else:
            msg = 'Incorrect password. Please try again.'
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': msg})
            messages.error(request, msg)

    return render(request, 'signin.html')

@login_required
def logout_view(request):
    """Logs out the current user and redirects to the sign-in page."""
    
    messages.success(request, "You have been successfully logged out.")
    auth.logout(request)

    return redirect('accounts:signin')
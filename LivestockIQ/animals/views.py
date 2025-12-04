from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render, redirect
from django.contrib import messages
from django.db.models import Q 
from .models import Animal 
from django.contrib.auth.decorators import login_required

@login_required
@csrf_exempt
def add_animal(request):
    if request.method == 'POST':
        a_id = request.POST.get('animal_id')
        a_type = request.POST.get('type')
        a_age = request.POST.get('age')
        a_sex = request.POST.get('sex')
        a_vax = request.POST.get('vaccination_detail')

        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

        if not all([a_id, a_type, a_age, a_sex]):
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'Please fill out all required fields.'})
            messages.error(request, 'Please fill out all required fields.')
            return redirect('animals:add_animal')

        if Animal.objects.filter(animal_id=a_id).exists():
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'Animal ID already exists.'})
            messages.error(request, 'Animal ID already exists.')
            return redirect('animals:add_animal')

        try:
            # UPDATED: We now pass 'user=request.user' to create()
            new_animal = Animal.objects.create(
                user=request.user,  # <--- Assumes the logged-in user owns this animal
                animal_id=a_id,
                animal_type=a_type,
                age=a_age,
                sex=a_sex,
                vaccination_detail=a_vax
            )
            new_animal.save()
            
            if is_ajax:
                return JsonResponse({'status': 'success', 'message': 'Animal added successfully!'})
            messages.success(request, 'Animal added successfully!')
            return redirect('accounts:home')
        except Exception as e:
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': f"An unexpected error occurred: {e}"})
            messages.error(request, f"An unexpected error occurred: {e}")
            return redirect('animals:add_animal')

    else:
        return render(request, 'add_animal.html')

@login_required # Added login_required so we can access request.user safely
def search_animal(request):
    # Start with an empty queryset
    animals = Animal.objects.none()  
    query_set = {}

    try:
        # UPDATED: Only fetch animals belonging to the current user
        animals = Animal.objects.filter(user=request.user)

        if request.method == 'POST':
            filters = Q()
            animal_id = request.POST.get('animal_id')
            if animal_id:
                filters &= Q(animal_id__icontains=animal_id)
                query_set['Animal ID'] = animal_id

            animal_type = request.POST.get('type')
            if animal_type:
                filters &= Q(animal_type__icontains=animal_type)
                query_set['Type'] = animal_type
            
            sex = request.POST.get('sex')
            if sex:
                filters &= Q(sex__iexact=sex)
                query_set['Sex'] = sex
            
            age = request.POST.get('age')
            if age:
                filters &= Q(age__exact=age)
                query_set['Age'] = age

            # Apply the combined filters to the user's animals
            animals = animals.filter(filters)
            
            if not animals.exists():
                messages.info(request, "No animals matched your search criteria.")
    
    except Exception as e:
        messages.error(request, f"A database error occurred: {e}")
        return redirect('accounts:home')

    context = {
        'animals': animals,
        'filters': query_set,
    }
    return render(request, 'search_animal.html', context)


# ... existing imports ...

def select_method(request):
    """Renders the page to choose between Manual or Auto"""
    return render(request, 'select_method.html')

def auto_add(request):
    """Renders the RFID/Camera simulation page"""
    return render(request, 'auto_add.html')
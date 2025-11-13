from django.shortcuts import render, redirect
from django.contrib import messages
from django.db.models import Q 
from .models import Animal 

def add_animal(request):
    if request.method == 'POST':
        # Get data from the form
        a_id = request.POST['animal_id']
        a_type = request.POST['type']
        a_age = request.POST['age']
        a_sex = request.POST['sex']
        a_vax = request.POST['vaccination_detail']

        # Check for duplicate ID
        if Animal.objects.filter(animal_id=a_id).exists():
            messages.error(request, 'Animal ID already exists.')
            return redirect('animals:add_animal') # Stay on the same page

        # Create and save the new animal
        new_animal = Animal.objects.create(
            animal_id=a_id,
            animal_type=a_type,
            age=a_age,
            sex=a_sex,
            vaccination_detail=a_vax
        )
        new_animal.save()
        
        messages.success(request, 'Animal added successfully!')
        # Go back to the 'home' page (in the 'accounts' app)
        return redirect('accounts:home') 

    else:
        # Just show the blank form
        return render(request, 'add_animal.html')
    
def search_animal(request):
    animals = Animal.objects.all()
    query_set = {} # Dictionary to store filters applied

    if request.method == 'POST':
        # Start with an empty Q object
        # The Q object is used to build complex filters (AND/OR logic)
        filters = Q() 

        # 1. Filter by Animal ID (Exact Match or Contains)
        animal_id = request.POST.get('animal_id')
        if animal_id:
            # We use '__icontains' for a flexible, case-insensitive partial match
            filters &= Q(animal_id__icontains=animal_id)
            query_set['Animal ID'] = animal_id

        # 2. Filter by Type (Exact Match or Contains)
        animal_type = request.POST.get('type')
        if animal_type:
            filters &= Q(animal_type__icontains=animal_type)
            query_set['Type'] = animal_type
        
        # 3. Filter by Sex (Exact Match)
        sex = request.POST.get('sex')
        if sex:
            # Assumes sex is 'M' or 'F' and we want an exact match
            filters &= Q(sex__iexact=sex) 
            query_set['Sex'] = sex
        
        # 4. Filter by Age (Greater Than or Equal to)
        # We need to handle potential conversion errors
        age_min_str = request.POST.get('age_min')
        if age_min_str:
            try:
                age_min = int(age_min_str)
                # Finds animals GREATER THAN OR EQUAL TO the minimum age entered
                filters &= Q(age__gte=age_min)
                query_set['Minimum Age'] = age_min
            except ValueError:
                messages.error(request, "Age must be a valid number.")
                return redirect('animals:search_livestock')

        # Apply the combined filters to the queryset
        animals = animals.filter(filters)
        
        if not animals.exists():
            messages.info(request, "No animals matched your search criteria.")
    
    context = {
        'animals': animals,
        'filters': query_set,
    }
    return render(request, 'search_animal.html', context)
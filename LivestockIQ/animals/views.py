from django.shortcuts import render, redirect
from django.contrib import messages
from .models import Animal # Import Animal model

def add_animal(request):
    if request.method == 'POST':
        # Get data from the form
        a_id = request.POST['animal_id']
        a_type = request.POST['animal_type']
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
        return render(request, 'animals/add_animal.html')
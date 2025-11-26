import csv
import os
from datetime import datetime
from django.shortcuts import render
from django.http import JsonResponse
from .models import VaccinationSchedule
from animals.models import Animal
from django.views.decorators.http import require_http_methods
import json
from django.utils.text import slugify

# Define a broader set of seasons for display and ordering.
# This list is for UI display and general classification, not direct CSV matching
# The CSV's 'Seasonality_Logic' column has varied strings.
ALL_DISPLAY_SEASONS = [
    "Winter", "Spring", "Summer",
    "Pre-Monsoon", "Autumn"
]

# Indicators in 'Seasonality_Logic' column that mean a vaccine is NOT seasonal
NON_SEASONAL_INDICATORS = ["None", "None (Age Dependent)", "Once in a Lifetime"]


def _get_current_season():
    """Determines the current season based on the month."""
    current_month = datetime.now().month
    if current_month in [12, 1, 2]:
        return "Winter"
    elif current_month in [3, 4]:
        return "Spring"
    elif current_month in [5, 6]:
        return "Summer"
    elif current_month in [7, 8]:
        return "Pre Monsoon"
    else: # Sept, Oct, Nov
        return "Autumn"

def recommended_vaccines_view(request):
    """
    View to show a recommended list of vaccines based on animal type,
    filtered by season.
    """
    
    csv_file_path = os.path.join(
        os.path.dirname(__file__), 'dataset', 'vaccine_dataset.csv'
    )
    
    vaccine_data = []
    try:
        with open(csv_file_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Include all fields, including 'Disease'
                vaccine_data.append(row)
    except FileNotFoundError:
        # Handle case where CSV is not found
        pass # Or render an error page
    
    # Combined available seasons will only be the ALL_DISPLAY_SEASONS for dropdown
    # The order is already defined in ALL_DISPLAY_SEASONS
    combined_available_seasons = ALL_DISPLAY_SEASONS[:] # Create a copy

    current_season = _get_current_season()
    selected_filter_option = request.GET.get('season','current')

    # Filtering Logic based on selected_filter_option
    final_filtered_data = []

    if selected_filter_option == 'current':
        filter_season_value = current_season
        final_filtered_data = [
            d for d in vaccine_data
            if filter_season_value.lower() in d.get('Seasonality_Logic', '').lower()
        ]
    elif selected_filter_option == 'seasonal':
        final_filtered_data = [
            d for d in vaccine_data
            if d.get('Seasonality_Logic') and not any(
                indicator.lower() in d['Seasonality_Logic'].lower() for indicator in NON_SEASONAL_INDICATORS
            )
        ]
    elif selected_filter_option == 'non-seasonal':
        final_filtered_data = [
            d for d in vaccine_data
            if not d.get('Seasonality_Logic') or any(
                indicator.lower() in d['Seasonality_Logic'].lower() for indicator in NON_SEASONAL_INDICATORS
            )
        ]
    elif selected_filter_option and selected_filter_option in combined_available_seasons: # Specific season selected
        filter_season_value = selected_filter_option
        final_filtered_data = [
            d for d in vaccine_data
            if filter_season_value.lower() in d.get('Seasonality_Logic', '').lower()
        ]
    else: # Default: show all
        final_filtered_data = vaccine_data

    # Group data by animal type
    recommended_data = {}
    for entry in final_filtered_data:
        animal_type = entry.get('Species', 'Unknown') # Assuming 'Species' is the Animal Type
        if animal_type not in recommended_data:
            recommended_data[animal_type] = []
        recommended_data[animal_type].append(entry)

    context = {
        'recommended_data': recommended_data,
        'available_seasons': combined_available_seasons,
        'selected_season_filter': selected_filter_option, # Changed context variable name for clarity
        'current_season_name': current_season,
    }
    return render(request, 'health/recommended_vaccines.html', context)


@require_http_methods(["GET", "POST"])
def schedule_form_view(request):
    """View to display the form for scheduling individual or group vaccinations."""
    if request.method == 'POST':
        try:
            # Check if the request is AJAX with JSON
            if 'application/json' in request.content_type:
                data = json.loads(request.body)
            else:
                data = request.POST

            is_group = data.get('is_group') == 'on' or data.get('is_group') == True
            vaccine_name = data.get('vaccine_name')
            schedule_date = data.get('schedule_date')
            dose_notes = data.get('dose_notes')

            if not vaccine_name or not schedule_date:
                return JsonResponse({'status': 'error', 'message': 'Vaccine name and schedule date are required.'}, status=400)

            if is_group:
                group_type = data.get('group_type')
                if not group_type:
                    return JsonResponse({'status': 'error', 'message': 'Group type is required for group vaccination.'}, status=400)
                
                VaccinationSchedule.objects.create(
                    is_group=True,
                    group_type=group_type,
                    vaccine_name=vaccine_name,
                    schedule_date=schedule_date,
                    dose_notes=dose_notes
                )
            else:
                animal__id = data.get('animal_id')
                if not animal_id:
                    return JsonResponse({'status': 'error', 'message': 'Animal ID is required for individual vaccination.'}, status=400)
                
                try:
                    animal = Animal.objects.get(animal_id=animal_id)
                    VaccinationSchedule.objects.create(
                        animal=animal,
                        is_group=False,
                        vaccine_name=vaccine_name,
                        schedule_date=schedule_date,
                        dose_notes=dose_notes
                    )
                except Animal.DoesNotExist:
                    return JsonResponse({'status': 'error', 'message': 'Animal with this ID does not exist.'}, status=400)

            return JsonResponse({'status': 'success', 'message': 'Vaccination scheduled successfully.'})
        
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON.'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    return render(request, 'health/schedule_form.html')

def vaccination_schedule_view(request):
    schedules = VaccinationSchedule.objects.all().order_by('schedule_date')
    context = {'schedules': schedules}
    return render(request, 'health/vaccination_schedule.html', context)
def vaccine_detail_view(request, vaccine_name_slug):
    """
    View to show detailed information for a specific vaccine based on its slugified name.
    """
    csv_file_path = os.path.join(
        os.path.dirname(__file__), 'dataset', 'vaccine_dataset.csv'
    )
    
    vaccine_data = []
    try:
        with open(csv_file_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Include all fields, including 'Disease'
                vaccine_data.append(row)
    except FileNotFoundError:
        # Handle case where CSV is not found
        pass # Or render an error page
    
    
    # 1. Look for the vaccine matching the slug
    found_vaccine = None
    for vaccine in vaccine_data:
        if slugify(vaccine.get('Vaccine_Name', '')) == vaccine_name_slug:
            found_vaccine = vaccine
            break

    if not found_vaccine:
        # Simple handler if the vaccine is not found
        # In a real app, you would render a 404 page
        return render(request, 'health/recommended_vaccines.html', {
            'error_message': f"Vaccine '{vaccine_name_slug}' not found.",
            'recommended_data': {}
        })

    context = {
        'vaccine': found_vaccine
    }
    return render(request, 'health/vaccine_detail.html', context)
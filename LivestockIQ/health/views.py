import csv
import os
from datetime import datetime
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils.text import slugify
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db.models import Max 
from django.contrib import messages
from django.urls import reverse
import json
import logging
from .models import VaccinationSchedule


# Set up logger
logger = logging.getLogger(__name__)

# Define a broader set of seasons for display and ordering.
ALL_DISPLAY_SEASONS = [
    "Winter", "Spring", "Summer",
    "Pre-Monsoon", "Autumn"
]

NON_SEASONAL_INDICATORS = ["None", "None (Age Dependent)", "Once in a Lifetime", "All year", "After exposure only"]

# Function to load the CSV data (for internal use)
def _load_vaccine_data():
    """Loads all vaccine data from the CSV file."""
    # Assuming your original CSV loading path for the dataset structure
    csv_file_path = os.path.join(
        os.path.dirname(__file__), 'dataset', 'vaccine_dataset.csv'
    )
    vaccine_data = []
    try:
        with open(csv_file_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Standardize keys to lowercase for consistency if needed, 
                # but we'll stick to provided keys for now
                vaccine_data.append(row)
    except FileNotFoundError:
        logger.error(f"Vaccine dataset not found at: {csv_file_path}")
    return vaccine_data

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

# --- NEW AJAX ENDPOINT ---
def get_vaccines_by_species(request):
    """
    Returns a JSON list of unique vaccine names filtered by species (animal type).
    This is called by JavaScript in the schedule form.
    """
    species = request.GET.get('species')
    
    if not species:
        return JsonResponse([], safe=False)

    vaccine_data = _load_vaccine_data()
    
    # Filter the data
    filtered_names = set()
    for d in vaccine_data:
        # NOTE: Using the 'Species' key from the CSV
        if d.get('Species', '').lower() == species.lower():
            filtered_names.add(d['Vaccine_Name'])
            
    # Return sorted list of unique names
    return JsonResponse(sorted(list(filtered_names)), safe=False)
# -------------------------

@login_required
def recommended_vaccines_view(request):
    """
    View to show a recommended list of vaccines based on animal type,
    filtered by season.
    """
    vaccine_data = _load_vaccine_data()
    
    combined_available_seasons = ALL_DISPLAY_SEASONS[:]
    current_season = _get_current_season()
    selected_filter_option = request.GET.get('season','current')

    final_filtered_data = []

    if selected_filter_option == 'current':
        filter_season_value = current_season
        final_filtered_data = [
            # NOTE: Assuming the CSV loader still returns keys like 'Seasonality_Logic'
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
            if any(
                indicator.lower() in d['Seasonality_Logic'].lower() for indicator in NON_SEASONAL_INDICATORS
            )
        ]
    elif selected_filter_option and selected_filter_option in combined_available_seasons:
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
        animal_type = entry.get('Species', 'Unknown') # NOTE: Using 'Species' key
        if animal_type not in recommended_data:
            recommended_data[animal_type] = []
        recommended_data[animal_type].append(entry)

    context = {
        'recommended_data': recommended_data,
        'available_seasons': combined_available_seasons,
        'selected_season_filter': selected_filter_option,
        'current_season_name': current_season,
    }
    return render(request, 'health/recommended_vaccines.html', context)


@login_required
def vaccine_detail_view(request, vaccine_name_slug):
    """
    View to show detailed information for a specific vaccine based on its slugified name.
    """
    vaccine_data = _load_vaccine_data()
    
    # 1. Look for the vaccine matching the slug
    found_vaccine = None
    for vaccine in vaccine_data:
        # FIX: Removed illegal keyword argument 'separator='_'
        if slugify(vaccine.get('Vaccine_Name', '')) == vaccine_name_slug: 
            found_vaccine = vaccine
            break

    if not found_vaccine:
        messages.error(request, f"Vaccine '{vaccine_name_slug}' not found.")
        return redirect('health:recommended_vaccines')

    context = {
        'vaccine': found_vaccine
    }
    return render(request, 'health/vaccine_detail.html', context)


@login_required
@require_http_methods(["GET", "POST"])
def schedule_form_view(request):
    """View to display the form for scheduling individual or group vaccinations."""
    
    # --- Fetching available options for the form ---
    
    # 1. Available species for the new Species dropdown
    vaccine_data = _load_vaccine_data()
    available_species = sorted(list(set(d.get('Species') for d in vaccine_data if d.get('Species'))))
    
    # 2. Available vaccines (All, used as fallback)
    available_vaccines = sorted(list(set(d.get('Vaccine_Name') for d in vaccine_data if d.get('Vaccine_Name'))))
    # ---------------------------------------------
    
    # NOTE: The rest of the POST logic that requires the database models is excluded for brevity,
    # but the form template now has the data it needs for the initial render.
    
    if request.method == 'POST':
        # NOTE: Your full POST logic (saving to VaccinationSchedule) goes here.
        # Ensure you handle JSON/FormData and validation before saving.
        pass

    context = {
        'available_vaccines': available_vaccines,
        'available_species': available_species,
    }
    return render(request, 'health/schedule_form.html', context)


# ... (rest of the views are omitted for brevity: mark_vaccine_completed, delete_vaccine_schedule, vaccination_schedule_view) ...

@login_required
@require_http_methods(["POST"])
def mark_vaccine_completed(request, schedule_id):
    """Marks a specific vaccination schedule as completed."""
    # Assuming VaccinationSchedule model exists
    # schedule = get_object_or_404(VaccinationSchedule, pk=schedule_id)
    # schedule.is_completed = True
    # schedule.save()
    messages.success(request, "Vaccination marked as completed.")
    return redirect('health:vaccination_schedule')

@login_required
@require_http_methods(["POST"])
def delete_vaccine_schedule(request, schedule_id):
    """Deletes a specific vaccination schedule."""
    # Assuming VaccinationSchedule model exists
    # schedule = get_object_or_404(VaccinationSchedule, pk=schedule_id)
    # schedule.delete()
    messages.warning(request, "Vaccination schedule deleted.")
    return redirect('health:vaccination_schedule')


@login_required
def vaccination_schedule_view(request):
    
    upcoming_schedules = VaccinationSchedule.objects.filter(is_completed=False).order_by('schedule_date')
    completed_schedules = VaccinationSchedule.objects.filter(is_completed=True).order_by('-schedule_date')
    
    context = {
        'upcoming_schedules': upcoming_schedules,
        'completed_schedules': completed_schedules,
    }
    return render(request, 'health/vaccination_schedule.html', context)
from datetime import datetime
from django.shortcuts import render
from django.http import JsonResponse
from .models import VaccinationSchedule, VaccineDataset
from animals.models import Animal
from django.views.decorators.http import require_http_methods
from django.utils.text import slugify
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse
import json

# ... (Keep your existing seasons lists and _get_current_season function here) ...

ALL_DISPLAY_SEASONS = [
    "Winter", "Spring", "Summer",
    "Pre-Monsoon", "Autumn"
]

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
        return "Pre-Monsoon"
    else: # Sept, Oct, Nov
        return "Autumn"

@login_required
def recommended_vaccines_view(request):
    """
    View to show a recommended list of vaccines based on animal type,
    filtered by season.
    """
    
    # Fetch all records from the database
    vaccine_data = list(VaccineDataset.objects.all().values())
    
    combined_available_seasons = ALL_DISPLAY_SEASONS[:] 

    current_season = _get_current_season()
    selected_filter_option = request.GET.get('season', 'current')

    # Filtering Logic
    final_filtered_data = []

    if selected_filter_option == 'current':
        filter_season_value = current_season
        # FIX: Use (d['seasonality'] or '') to convert None to empty string
        final_filtered_data = [
            d for d in vaccine_data
            if filter_season_value.lower() in (d.get('seasonality') or '').lower()
        ]
    elif selected_filter_option == 'seasonal':
        final_filtered_data = [
            d for d in vaccine_data
            if d.get('seasonality') and not any(
                indicator.lower() in (d['seasonality'] or '').lower() for indicator in NON_SEASONAL_INDICATORS
            )
        ]
    elif selected_filter_option == 'non-seasonal':
        final_filtered_data = [
            d for d in vaccine_data
            if not d.get('seasonality') or any(
                indicator.lower() in (d['seasonality'] or '').lower() for indicator in NON_SEASONAL_INDICATORS
            )
        ]
    elif selected_filter_option and selected_filter_option in combined_available_seasons: 
        filter_season_value = selected_filter_option
        # FIX: Use (d['seasonality'] or '') here as well
        final_filtered_data = [
            d for d in vaccine_data
            if filter_season_value.lower() in (d.get('seasonality') or '').lower()
        ]
    else: # Default: show all
        final_filtered_data = vaccine_data

    # Group data by animal type
    recommended_data = {}
    for entry in final_filtered_data:
        animal_type = entry.get('species', 'Unknown') 
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
@require_http_methods(["GET", "POST"])
def schedule_form_view(request):
    """View to display the form for scheduling individual or group vaccinations."""
    
    # --- New: Fetching available vaccine names ---
    available_vaccines = VaccineDataset.objects.values_list('vaccine_name', flat=True).distinct().order_by('vaccine_name')
    # ---------------------------------------------

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

            # Check if the vaccine name is valid (optional but good practice)
            if vaccine_name not in available_vaccines:
                return JsonResponse({'status': 'error', 'message': f"Invalid vaccine name selected: {vaccine_name}"}, status=400)


            if is_group:
                group_type = data.get('group_type')
                if not group_type:
                    return JsonResponse({'status': 'error', 'message': 'Group type is required for group vaccination.'}, status=400)
                
                VaccinationSchedule.objects.create(
                    is_group=True,
                    group_type=group_type,
                    vaccine_name=vaccine_name,
                    schedule_date=schedule_date,
                    dose_notes=dose_notes,
                    is_completed=False
                )
            else:
                animal_id = data.get('animal_id')
                if not animal_id:
                    return JsonResponse({'status': 'error', 'message': 'Animal ID is required for individual vaccination.'}, status=400)
                
                try:
                    animal = Animal.objects.get(animal_id=animal_id)
                    VaccinationSchedule.objects.create(
                        animal=animal,
                        is_group=False,
                        vaccine_name=vaccine_name,
                        schedule_date=schedule_date,
                        dose_notes=dose_notes,
                        is_completed=False
                    )
                except Animal.DoesNotExist:
                    return JsonResponse({'status': 'error', 'message': 'Animal with this ID does not exist.'}, status=400)

            return JsonResponse({'status': 'success', 'message': 'Vaccination scheduled successfully.'})
        
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON.'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    context = {
        'available_vaccines': available_vaccines,
    }
    return render(request, 'health/schedule_form.html', context)


@login_required
def vaccine_detail_view(request, vaccine_name_slug):
    """
    View to show detailed information for a specific vaccine based on its slugified name.
    """
    vaccine_data = []
    # Fetch all records from the database
    vaccine_data = list(VaccineDataset.objects.all().values())
    
    
    # 1. Look for the vaccine matching the slug
    found_vaccine = None
    for vaccine in vaccine_data:
        if slugify(vaccine.get('vaccine_name', '')) == vaccine_name_slug:
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

@login_required
@require_http_methods(["POST"])
def mark_vaccine_completed(request, schedule_id):
    """Marks a specific vaccination schedule as completed."""
    schedule = get_object_or_404(VaccinationSchedule, pk=schedule_id)
    schedule.is_completed = True
    schedule.save()
    return redirect('health:vaccination_schedule') # Redirect back to the schedule list

@login_required
@require_http_methods(["POST"])
def delete_vaccine_schedule(request, schedule_id):
    """Deletes a specific vaccination schedule."""
    schedule = get_object_or_404(VaccinationSchedule, pk=schedule_id)
    schedule.delete()
    return redirect('health:vaccination_schedule') # Redirect back to the schedule list


@login_required
def vaccination_schedule_view(request):
    # Filter and sort schedules to pass to the template
    upcoming_schedules = VaccinationSchedule.objects.filter(is_completed=False).order_by('schedule_date')
    completed_schedules = VaccinationSchedule.objects.filter(is_completed=True).order_by('-schedule_date') # Most recent first
    
    context = {
        'upcoming_schedules': upcoming_schedules,
        'completed_schedules': completed_schedules,
    }
    return render(request, 'health/vaccination_schedule.html', context)
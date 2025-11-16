
# Create your views here.
from django.shortcuts import render



def recommended_vaccines_view(request):
    """View to show a recommended list of vaccines based on animal type."""
    # Placeholder data for demonstration
    recommended_data = {
        'Cattle': [
            {'name': 'IBR/BVD', 'age_range': '3-6 months', 'frequency': 'Annual'},
            {'name': 'Leptospirosis', 'age_range': '6 months+', 'frequency': 'Annual'},
            {'name': 'Clostridial', 'age_range': 'All ages', 'frequency': 'Biennial'},
        ],
        'Sheep': [
            {'name': 'Tetanus', 'age_range': 'Lambs', 'frequency': 'Booster at 4 weeks'},
            {'name': 'Ovine Enzootic Abortion', 'age_range': 'Breeding Ewes', 'frequency': 'Pre-mating'},
        ],
    }
    context = {'recommended_data': recommended_data}
    return render(request, 'health/recommended_vaccines.html', context)

def schedule_form_view(request):
    """View to display the form for scheduling individual or group vaccinations."""
    return render(request, 'health/schedule_form.html')

def vaccination_schedule_view(request):
    
    # Renders vaccination_schedule.html
    return render(request, 'health/vaccination_schedule.html')

from django.shortcuts import render

def calculator_view(request):
    # No backend logic needed here as the calculation is in JS
    return render(request, 'calculate_cost.html')
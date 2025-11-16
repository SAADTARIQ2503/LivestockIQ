from django.shortcuts import render

def view_data(request):
    # This function just renders your template.
    # We will add the API logic here later.
    return render(request, 'environment/view_data.html')
"""
Cost Calculation API Views
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_costs(request):
    """
    Calculate livestock farming costs
    POST /api/v1/costs/calculate/
    
    Body:
    {
        "animal_type": "Cow",
        "quantity": 50,
        "feed_cost_per_kg": 0.5,
        "feed_consumption_kg_per_day": 10,
        "veterinary_cost_per_month": 500,
        "labor_cost_per_month": 2000,
        "housing_cost_per_month": 1000,
        "other_costs_per_month": 300,
        "calculation_period_months": 12
    }
    """
    # Extract inputs
    animal_type = request.data.get('animal_type')
    quantity = int(request.data.get('quantity', 1))
    feed_cost_per_kg = float(request.data.get('feed_cost_per_kg', 0))
    feed_consumption_per_day = float(request.data.get('feed_consumption_kg_per_day', 0))
    vet_cost = float(request.data.get('veterinary_cost_per_month', 0))
    labor_cost = float(request.data.get('labor_cost_per_month', 0))
    housing_cost = float(request.data.get('housing_cost_per_month', 0))
    other_costs = float(request.data.get('other_costs_per_month', 0))
    period_months = int(request.data.get('calculation_period_months', 12))
    
    # Validate inputs
    if not animal_type or animal_type not in ['Cow', 'Goat', 'Sheep']:
        return Response({
            'error': 'Invalid animal_type. Must be Cow, Goat, or Sheep'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Calculate feed cost
    days_per_month = 30
    feed_cost_per_month = (
        feed_cost_per_kg * 
        feed_consumption_per_day * 
        days_per_month * 
        quantity
    )
    
    # Calculate monthly totals
    total_monthly = (
        feed_cost_per_month +
        vet_cost +
        labor_cost +
        housing_cost +
        other_costs
    )
    
    cost_per_animal_monthly = total_monthly / quantity if quantity > 0 else 0
    
    # Calculate yearly
    total_yearly = total_monthly * 12
    cost_per_animal_yearly = total_yearly / quantity if quantity > 0 else 0
    
    # Calculate for specified period
    total_period = total_monthly * period_months
    
    # Cost breakdown percentage
    cost_breakdown = {
        'feed': round((feed_cost_per_month / total_monthly * 100), 2) if total_monthly > 0 else 0,
        'veterinary': round((vet_cost / total_monthly * 100), 2) if total_monthly > 0 else 0,
        'labor': round((labor_cost / total_monthly * 100), 2) if total_monthly > 0 else 0,
        'housing': round((housing_cost / total_monthly * 100), 2) if total_monthly > 0 else 0,
        'other': round((other_costs / total_monthly * 100), 2) if total_monthly > 0 else 0,
    }
    
    response_data = {
        'animal_type': animal_type,
        'quantity': quantity,
        
        # Monthly
        'feed_cost_per_month': round(feed_cost_per_month, 2),
        'veterinary_cost_per_month': round(vet_cost, 2),
        'labor_cost_per_month': round(labor_cost, 2),
        'housing_cost_per_month': round(housing_cost, 2),
        'other_costs_per_month': round(other_costs, 2),
        'total_monthly_cost': round(total_monthly, 2),
        'cost_per_animal_per_month': round(cost_per_animal_monthly, 2),
        
        # Yearly
        'total_yearly_cost': round(total_yearly, 2),
        'cost_per_animal_per_year': round(cost_per_animal_yearly, 2),
        
        # Period
        'calculation_period_months': period_months,
        'total_period_cost': round(total_period, 2),
        
        # Breakdown
        'cost_breakdown': cost_breakdown,
    }
    
    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_default_costs(request):
    """
    Get default/recommended cost values by animal type
    GET /api/v1/costs/defaults/?animal_type=Cow
    """
    animal_type = request.query_params.get('animal_type', 'Cow')
    
    # Default values (these can be adjusted based on real data)
    defaults = {
        'Cow': {
            'feed_cost_per_kg': 0.5,
            'feed_consumption_kg_per_day': 10,
            'veterinary_cost_per_month': 500,
            'labor_cost_per_animal_per_month': 40,
            'housing_cost_per_animal_per_month': 20,
        },
        'Goat': {
            'feed_cost_per_kg': 0.4,
            'feed_consumption_kg_per_day': 2,
            'veterinary_cost_per_month': 200,
            'labor_cost_per_animal_per_month': 15,
            'housing_cost_per_animal_per_month': 10,
        },
        'Sheep': {
            'feed_cost_per_kg': 0.4,
            'feed_consumption_kg_per_day': 2.5,
            'veterinary_cost_per_month': 250,
            'labor_cost_per_animal_per_month': 15,
            'housing_cost_per_animal_per_month': 10,
        }
    }
    
    if animal_type not in defaults:
        return Response({
            'error': 'Invalid animal_type'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'animal_type': animal_type,
        'defaults': defaults[animal_type]
    })
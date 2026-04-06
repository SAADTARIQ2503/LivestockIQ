from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q, Count
from django.db.models.functions import TruncMonth
from costs.models import Transaction
from api.v1.serializers.costs import TransactionSerializer


class TransactionListCreateView(generics.ListCreateAPIView):
    """
    GET: List all transactions for the authenticated user
    POST: Create a new transaction
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user).select_related('farm')

        # Filter by farm
        farm_id = self.request.query_params.get('farm')
        if farm_id:
            queryset = queryset.filter(farm_id=farm_id)

        # Filter by type if provided
        transaction_type = self.request.query_params.get('type')
        if transaction_type in ['expense', 'revenue']:
            queryset = queryset.filter(type=transaction_type)

        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a transaction
    PUT/PATCH: Update a transaction
    DELETE: Delete a transaction
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


class SummaryView(APIView):
    """
    GET: Financial summary (total revenue, expenses, profit)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_transactions = Transaction.objects.filter(user=request.user)

        farm_id = request.query_params.get('farm')
        if farm_id:
            user_transactions = user_transactions.filter(farm_id=farm_id)

        # Get date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if start_date:
            user_transactions = user_transactions.filter(date__gte=start_date)
        if end_date:
            user_transactions = user_transactions.filter(date__lte=end_date)
        
        # Calculate totals
        total_revenue = user_transactions.filter(type='revenue').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_expenses = user_transactions.filter(type='expense').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        return Response({
            'total_revenue': float(total_revenue),
            'total_expenses': float(total_expenses),
            'net_profit': float(total_revenue - total_expenses),
        })


class ReportView(APIView):
    """
    GET: Generate detailed financial report
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'error': 'start_date and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_transactions = Transaction.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Total revenue and expenses
        total_revenue = user_transactions.filter(type='revenue').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_expenses = user_transactions.filter(type='expense').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Breakdown by category
        expense_by_category = list(
            user_transactions.filter(type='expense')
            .values('category')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        
        revenue_by_category = list(
            user_transactions.filter(type='revenue')
            .values('category')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        
        # Monthly summary
        monthly_summary = list(
            user_transactions
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(
                revenue=Sum('amount', filter=Q(type='revenue')),
                expenses=Sum('amount', filter=Q(type='expense'))
            )
            .order_by('month')
        )
        
        # Format monthly summary
        formatted_monthly = []
        for item in monthly_summary:
            formatted_monthly.append({
                'month': item['month'].strftime('%b %Y'),
                'revenue': float(item['revenue'] or 0),
                'expenses': float(item['expenses'] or 0),
            })
        
        # Top expenses and revenue
        top_expenses = list(
            user_transactions.filter(type='expense')
            .order_by('-amount')[:5]
            .values('id', 'description', 'category', 'amount', 'date')
        )
        
        top_revenue = list(
            user_transactions.filter(type='revenue')
            .order_by('-amount')[:5]
            .values('id', 'description', 'category', 'amount', 'date')
        )
        
        return Response({
            'total_revenue': float(total_revenue),
            'total_expenses': float(total_expenses),
            'net_profit': float(total_revenue - total_expenses),
            'expense_by_category': expense_by_category,
            'revenue_by_category': revenue_by_category,
            'monthly_summary': formatted_monthly,
            'top_expenses': top_expenses,
            'top_revenue': top_revenue,
        })


class CategoryBreakdownView(APIView):
    """
    GET: Breakdown of transactions by category
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        transaction_type = request.query_params.get('type')
        
        queryset = Transaction.objects.filter(user=request.user)
        
        if transaction_type:
            queryset = queryset.filter(type=transaction_type)
        
        breakdown = list(
            queryset
            .values('category', 'type')
            .annotate(
                total=Sum('amount'),
                count=Count('id')
            )
            .order_by('-total')
        )
        
        return Response(breakdown)
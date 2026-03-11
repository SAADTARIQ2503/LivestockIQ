from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from datetime import date, timedelta
from animals.models import MortalityRecord
from api.v1.serializers.mortality import MortalityRecordSerializer, MortalityRecordCreateSerializer


class MortalityListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = MortalityRecord.objects.filter(farm__user=self.request.user)
        farm_id = self.request.query_params.get('farm')
        if farm_id:
            qs = qs.filter(farm_id=farm_id)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MortalityRecordCreateSerializer
        return MortalityRecordSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        return Response(
            MortalityRecordSerializer(record).data,
            status=status.HTTP_201_CREATED
        )


class MortalityDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MortalityRecordSerializer

    def get_queryset(self):
        return MortalityRecord.objects.filter(farm__user=self.request.user)


class MortalitySummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = MortalityRecord.objects.filter(farm__user=request.user)
        today = date.today()
        this_month_start = today.replace(day=1)
        last_30_days = today - timedelta(days=30)

        total = qs.count()
        this_month = qs.filter(date_of_death__gte=this_month_start).count()
        last_30 = qs.filter(date_of_death__gte=last_30_days).count()

        by_cause = list(
            qs.values('cause_of_death').annotate(count=Count('id')).order_by('-count')
        )
        by_farm = list(
            qs.values('farm__name', 'farm_id').annotate(count=Count('id')).order_by('-count')
        )
        by_type = list(
            qs.values('animal_type').annotate(count=Count('id')).order_by('-count')
        )
        recent = MortalityRecordSerializer(qs[:5], many=True).data

        return Response({
            'total': total,
            'this_month': this_month,
            'last_30_days': last_30,
            'by_cause': by_cause,
            'by_farm': by_farm,
            'by_type': by_type,
            'recent': recent,
        })

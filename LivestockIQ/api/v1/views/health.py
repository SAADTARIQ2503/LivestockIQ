"""
Health/Vaccination API Views
"""
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime
from health.models import VaccinationSchedule, VaccineDataset
from api.v1.serializers import (
    VaccinationScheduleSerializer,
    VaccinationScheduleCreateSerializer,
    VaccineDatasetSerializer
)


from rest_framework.views import APIView
from health.lsh.vaccine_recommender  import VaccineRecommender

import os
import time
import uuid
import tempfile
import numpy as np
import cv2
import torch
import torch.nn as nn
from torchvision import models, transforms
from rest_framework import status
from django.conf import settings

class VaccinationScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Vaccination Schedule CRUD operations
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return schedules for user's animals or group schedules
        """
        return VaccinationSchedule.objects.filter(
            Q(animal__user=self.request.user) | Q(is_group=True)
        ).order_by('schedule_date')
    
    def get_serializer_class(self):
        """
        Use different serializers for different actions
        """
        if self.action in ['create', 'update', 'partial_update']:
            return VaccinationScheduleCreateSerializer
        return VaccinationScheduleSerializer
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming vaccinations (next 30 days)
        GET /api/v1/health/schedules/upcoming/
        """
        from datetime import timedelta
        today = datetime.now().date()
        next_month = today + timedelta(days=30)
        
        queryset = self.get_queryset().filter(
            schedule_date__range=[today, next_month],
            is_completed=False
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """
        Get overdue vaccinations
        GET /api/v1/health/schedules/overdue/
        """
        today = datetime.now().date()
        
        queryset = self.get_queryset().filter(
            schedule_date__lt=today,
            is_completed=False
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark a schedule as completed
        POST /api/v1/health/schedules/{id}/complete/
        """
        schedule = self.get_object()
        schedule.is_completed = True
        schedule.save()
        
        serializer = self.get_serializer(schedule)
        return Response({
            'message': 'Vaccination marked as completed',
            'data': serializer.data
        })


class VaccineListView(generics.ListAPIView):
    serializer_class = VaccineDatasetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = VaccineDataset.objects.all()
        species = self.request.query_params.get('species')
        vaccine_name = self.request.query_params.get('vaccine_name')
        disease = self.request.query_params.get('disease')
        if species:
            queryset = queryset.filter(animal_species__icontains=species)
        if vaccine_name:
            queryset = queryset.filter(vaccine_name__icontains=vaccine_name)
        if disease:
            queryset = queryset.filter(disease_name__icontains=disease)
        return queryset


class VaccineDetailView(generics.RetrieveAPIView):
    """
    Get vaccine details by slug
    GET /api/v1/health/vaccines/{slug}/
    """
    queryset = VaccineDataset.objects.all()
    serializer_class = VaccineDatasetSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'


class RecommendedVaccinesView(generics.ListAPIView):
    """
    Get recommended vaccines filtered by season
    GET /api/v1/health/vaccines/recommended/?season=Winter&species=Cow
    """
    serializer_class = VaccineDatasetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        season = self.request.query_params.get('season')
        species = self.request.query_params.get('species')
        queryset = VaccineDataset.objects.all()
        if species:
            queryset = queryset.filter(animal_species__icontains=species)  # was species__iexact
        if season:
            queryset = queryset.filter(vaccination_season__icontains=season)  # was seasonality__icontains
        return queryset

class VaccinesBySpeciesView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        species = request.query_params.get('species')
        if not species:
            return Response({'error': 'Species parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        vaccines = VaccineDataset.objects.filter(
            animal_species__icontains=species  # was species__iexact
        ).values_list('vaccine_name', flat=True).distinct().order_by('vaccine_name')

        return Response({'species': species, 'vaccines': list(vaccines)})
        
        
"""
LSH Vaccine Recommendation View
Adds to existing health views in api/v1/views/health.py
"""


class VaccineRecommendationView(APIView):
    """
    LSH-powered vaccine recommendations.

    GET /api/v1/health/vaccines/recommend/?q=foot+and+mouth+disease&species=cattle&top_n=5

    Query params:
        q        (required) : free-text search, e.g. "foot and mouth disease"
        species  (optional) : animal type to append to query for better recall
        season   (optional) : season/month to append, e.g. "Spring", "FEB-MAR"
        top_n    (optional) : number of results (default 5, max 20)
        min_score(optional) : minimum confidence threshold (default 0.01)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        species = request.query_params.get("species", "").strip()
        season = request.query_params.get("season", "").strip()

        if not q:
            return Response(
                {"error": "Query parameter 'q' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build enriched query string (mirrors notebook search_content weighting)
        query_parts = [q]
        if species:
            query_parts.append(species)
        if season:
            query_parts.append(season)
        full_query = " ".join(query_parts)

        try:
            top_n = min(int(request.query_params.get("top_n", 5)), 20)
        except (ValueError, TypeError):
            top_n = 5

        try:
            min_score = float(request.query_params.get("min_score", 0.01))
        except (ValueError, TypeError):
            min_score = 0.01

        try:
            recommender = VaccineRecommender.get_instance()

            if not recommender._ready:
                return Response(
                    {
                        "error": "Vaccine dataset not loaded yet. "
                                 "Run: python manage.py load_vaccine_dataset --file <path>"
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            results = recommender.recommend(full_query, top_n=top_n, min_score=min_score)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Recommendation engine error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({
            "query": full_query,
            "count": len(results),
            "results": results,
        })
        
        
"""

Place your trained model at:
  BASE_DIR / 'models' / 'best_livestock_lameness_model.pth'
"""


class LivestockViTLSTM(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.backbone = models.vit_b_16(weights=None)       # weights loaded from .pth
        self.feature_size = self.backbone.heads.head.in_features
        self.backbone.heads = nn.Identity()
        self.lstm = nn.LSTM(input_size=self.feature_size, hidden_size=256,
                            num_layers=1, batch_first=True)
        self.dropout = nn.Dropout(0.4)
        self.fc = nn.Linear(256, num_classes)

    def forward(self, x):
        batch_size, seq_len, c, h, w = x.shape
        x = x.view(batch_size * seq_len, c, h, w)
        features = self.backbone(x)
        features = features.view(batch_size, seq_len, -1)
        lstm_out, _ = self.lstm(features)
        out = self.dropout(lstm_out[:, -1, :])
        return self.fc(out)


# ─────────────────────────────────────────────
#  Singleton model loader
# ─────────────────────────────────────────────

_lameness_model = None

def get_lameness_model():
    global _lameness_model
    if _lameness_model is None:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = LivestockViTLSTM(num_classes=2)
        model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'best_livestock_lameness_model.pth')   
        state_dict = torch.load(model_path, map_location=device, weights_only=False)
        model.load_state_dict(state_dict)
        model.to(device)
        model.eval()
        _lameness_model = model
    return _lameness_model


# ─────────────────────────────────────────────
#  Inference helper
# ─────────────────────────────────────────────

NUM_FRAMES = 20
IMG_SIZE   = 224
CLASS_NAMES = {0: 'normal', 1: 'lameness'}

_inference_transforms = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])


def predict_lameness(video_path: str) -> dict:
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model  = get_lameness_model()

    cap   = cv2.VideoCapture(video_path)
    v_len = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if v_len == 0:
        raise ValueError("Could not read video or video has 0 frames.")

    indices = np.linspace(0, v_len - 1, NUM_FRAMES, dtype=int)
    frames  = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        success, frame = cap.read()
        if success:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(_inference_transforms(frame))
        else:
            frames.append(torch.zeros(3, IMG_SIZE, IMG_SIZE))
    cap.release()

    # Shape: [1, 20, 3, 224, 224]
    input_tensor = torch.stack(frames).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs       = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]
        confidence, predicted = torch.max(probabilities, 0)

    pred_idx  = predicted.item()
    pred_label = CLASS_NAMES[pred_idx]

    return {
        'disease':      pred_label,          # 'normal' | 'lameness'
        'confidence':   confidence.item(),
        'all_probabilities': {
            CLASS_NAMES[i]: probabilities[i].item()
            for i in range(len(CLASS_NAMES))
        },
        'model_used': 'ViT-LSTM (Lameness Detection)',
    }


# ─────────────────────────────────────────────
#  API Views
# ─────────────────────────────────────────────

class LamenessDetectionView(APIView):
    """
    POST /api/v1/health/lameness/detect/
    Body (multipart): file=<video>, animal_id=<optional>
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        video_file = request.FILES.get('file')
        if not video_file:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.wmv'}
        ext = os.path.splitext(video_file.name)[-1].lower()
        if ext not in allowed_extensions:
            return Response(
                {'error': 'Invalid file type. Please upload MP4, AVI, MOV, or MKV.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Write to temp file so OpenCV can open it
        suffix = os.path.splitext(video_file.name)[-1] or '.mp4'
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            for chunk in video_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            start_time  = time.time()
            result      = predict_lameness(tmp_path)
            result['processing_time'] = time.time() - start_time
        except Exception as e:
            os.unlink(tmp_path)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

        detection_id = str(uuid.uuid4())[:8].upper()
        animal_id    = request.data.get('animal_id')

        # # ── Optional: save to DB (same model as image detections) ──
        from alerts.models import Alert, Detection
        Detection.objects.create(
            user=request.user,
            animal_id=animal_id or None,
            predicted_disease=result['disease'],
            confidence=result['confidence'],
            all_probabilities=result['all_probabilities'],
            model_used=result['model_used'],
            processing_time=result['processing_time'],
        )
        # # ── Optional: auto-create alert if lameness detected ──
        if result['disease'] == 'lameness' and result['confidence'] >= 0.70:
            from alerts.models import Alert
            Alert.objects.create(
                user=request.user,
                title='Lameness Detected',
                message=f"Lameness detected with {result['confidence']*100:.0f}% confidence.",
                severity='warning',
            )

        return Response({
            'detection_id': detection_id,
            'animal_id':    animal_id,
            'result':       result,
        }, status=status.HTTP_200_OK)


class LamenessDetectionHistoryView(APIView):
    """
    GET /api/v1/health/lameness/history/
    Returns past lameness detections for the current user.
    (Wire to your Detection model filtered by model_used='ViT-LSTM')
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # from health.models import Detection
        # from health.serializers import DetectionSerializer
        # qs = Detection.objects.filter(
        #     user=request.user,
        #     model_used__icontains='Lameness'
        # ).order_by('-created_at')[:50]
        # return Response(DetectionSerializer(qs, many=True).data)
        return Response([])
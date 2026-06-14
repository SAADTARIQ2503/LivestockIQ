import os
import torch
from django.conf import settings

_disease_detector = None
_lameness_detector = None


def get_disease_detector():
    global _disease_detector
    if _disease_detector is None:
        from ai_service.disease_detector import DiseaseDetector
        model_path = os.path.join(
            settings.MEDIA_ROOT, 'models', 'livestock_disease_v2.pth'
        )
        print(f"[ModelRegistry] Loading disease model from {model_path}")
        _disease_detector = DiseaseDetector(model_path)
        print("[ModelRegistry] Disease model loaded.")
    return _disease_detector


def get_lameness_detector():
    global _lameness_detector
    if _lameness_detector is None:
        from ai_service.lameness_detector import LamenessDetector
        model_path = os.path.join(
            settings.MEDIA_ROOT, 'models', 'best_lameness_model.pth'
        )
        print(f"[ModelRegistry] Loading lameness model from {model_path}")
        _lameness_detector = LamenessDetector(model_path)
        print("[ModelRegistry] Lameness model loaded.")
    return _lameness_detector

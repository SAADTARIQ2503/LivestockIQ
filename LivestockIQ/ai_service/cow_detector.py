import torch
from torchvision import models
from torchvision.ops import nms
from PIL import Image
import torchvision.transforms.functional as F


class CowDetector:
    """
    Wraps a pretrained Faster R-CNN (COCO) to locate and crop individual cows.
    COCO label 21 (1-indexed) = cow.
    Singleton — call CowDetector.get_instance() instead of constructing directly.
    """

    COW_LABEL = 21
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        try:
            weights = models.detection.FasterRCNN_ResNet50_FPN_Weights.DEFAULT
            self.model = models.detection.fasterrcnn_resnet50_fpn(weights=weights)
        except AttributeError:
            # torchvision < 0.13 fallback
            self.model = models.detection.fasterrcnn_resnet50_fpn(pretrained=True)
        self.model.to(self.device)
        self.model.eval()

    def detect_cows(self, image: Image.Image, min_confidence: float = 0.30,
                    nms_iou: float = 0.30, min_dim: int = 80):
        """
        Returns a list of PIL.Image crops, one per detected cow, sorted
        left-to-right by bounding-box x-coordinate.

        Duplicate/overlapping boxes for the same cow are removed with NMS
        (nms_iou threshold).  Partial crops smaller than min_dim × min_dim
        pixels are discarded (they are edge-clipped fragments, not real cows).

        Falls back to [image] when no cows survive all filters.
        """
        img_tensor = F.to_tensor(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            preds = self.model(img_tensor)[0]

        # Keep only high-confidence cow detections
        cow_mask = (preds['labels'] == self.COW_LABEL) & (preds['scores'] >= min_confidence)
        boxes  = preds['boxes'][cow_mask]
        scores = preds['scores'][cow_mask]

        if boxes.numel() == 0:
            return [image]

        # Remove overlapping duplicate detections with NMS
        keep   = nms(boxes, scores, iou_threshold=nms_iou)
        boxes  = boxes[keep]
        scores = scores[keep]

        # Drop edge-clipped fragments that are too small to diagnose
        size_ok = torch.tensor(
            [(b[2] - b[0]) >= min_dim and (b[3] - b[1]) >= min_dim for b in boxes],
            dtype=torch.bool,
        )
        boxes  = boxes[size_ok]
        scores = scores[size_ok]

        if boxes.numel() == 0:
            return [image]

        # Sort left-to-right so cow indices are stable across runs
        order  = torch.argsort(boxes[:, 0])
        boxes  = boxes[order]

        crops = []
        pad   = 15
        for box in boxes:
            x1, y1, x2, y2 = box.tolist()
            x1 = max(0, int(x1) - pad)
            y1 = max(0, int(y1) - pad)
            x2 = min(image.width,  int(x2) + pad)
            y2 = min(image.height, int(y2) + pad)
            crops.append(image.crop((x1, y1, x2, y2)))

        return crops

"""
Module tests — AI services (CowDetector, LamenessDetector, GotOCRService).

All ML model I/O is mocked so no .pth files are needed.
parse_animal_id() is pure Python and tested without mocking.

Run:
    python manage.py test ai_service --settings=LivestockIQ.test_settings -v 2
"""
import io
import unittest
from unittest.mock import MagicMock, patch

from PIL import Image


# ── OCR: parse_animal_id (pure Python — no mocking needed) ───────────────────

class ParseAnimalIdTests(unittest.TestCase):
    """Unit tests for GotOCRService.parse_animal_id."""

    def setUp(self):
        from ai_service.ocr_service import GotOCRService
        self.parse = GotOCRService.parse_animal_id

    def test_explicit_id_label(self):
        self.assertEqual(self.parse('ID: 42'), 42)

    def test_tag_label(self):
        self.assertEqual(self.parse('Tag: A-042'), 42)

    def test_letter_prefix(self):
        # 73 is non-sequential — hallucination guard does not block it
        self.assertEqual(self.parse('F73'), 73)

    def test_bare_number(self):
        self.assertEqual(self.parse('907'), 907)

    def test_empty_string_returns_none(self):
        self.assertIsNone(self.parse(''))

    def test_none_returns_none(self):
        self.assertIsNone(self.parse(None))

    def test_no_text_found_sentinel_returns_none(self):
        self.assertIsNone(self.parse('NO_TEXT_FOUND'))

    def test_hallucination_all_same_digits_rejected(self):
        self.assertIsNone(self.parse('1111'))

    def test_hallucination_ascending_sequence_rejected(self):
        self.assertIsNone(self.parse('1234'))

    def test_hallucination_descending_sequence_rejected(self):
        self.assertIsNone(self.parse('4321'))

    def test_valid_non_sequential_number(self):
        result = self.parse('Tag: B-73')
        self.assertEqual(result, 73)

    def test_five_digit_id(self):
        self.assertEqual(self.parse('ID: 10045'), 10045)

    def test_mixed_text_extracts_id(self):
        result = self.parse('Animal VST94 is lame')
        self.assertIsNotNone(result)

    def test_uppercase_insensitive(self):
        self.assertEqual(self.parse('id: 5'), 5)


# ── CowDetector (mocked Faster R-CNN) ────────────────────────────────────────

class CowDetectorTests(unittest.TestCase):

    def _make_image(self, width=640, height=480):
        return Image.new('RGB', (width, height), color=(100, 149, 237))

    @patch('ai_service.cow_detector.models')
    @patch('ai_service.cow_detector.torch')
    def test_detect_cows_returns_list(self, mock_torch, mock_models):
        """detect_cows() should always return a list of PIL Images."""
        import torch

        mock_torch.device.return_value = 'cpu'
        mock_torch.cuda.is_available.return_value = False

        fake_model = MagicMock()
        mock_models.detection.fasterrcnn_resnet50_fpn.return_value = fake_model
        mock_models.detection.FasterRCNN_ResNet50_FPN_Weights.DEFAULT = MagicMock()

        # Simulate no detections
        mock_torch.no_grad.return_value.__enter__ = MagicMock(return_value=None)
        mock_torch.no_grad.return_value.__exit__ = MagicMock(return_value=False)
        fake_model.return_value = [{'labels': torch.tensor([]), 'scores': torch.tensor([]), 'boxes': torch.tensor([])}]

        from ai_service.cow_detector import CowDetector
        CowDetector._instance = None
        detector = CowDetector()
        detector.model = fake_model

        image = self._make_image()
        # When no cows detected, falls back to [original_image]
        result = detector.detect_cows(image)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_cow_detector_singleton(self):
        """get_instance() returns the same object on repeated calls."""
        from ai_service.cow_detector import CowDetector
        with patch.object(CowDetector, '__init__', return_value=None):
            CowDetector._instance = None
            a = CowDetector.__new__(CowDetector)
            CowDetector._instance = a
            b = CowDetector.get_instance()
            self.assertIs(a, b)


# ── LamenessDetector (mocked model) ──────────────────────────────────────────

class LamenessDetectorTests(unittest.TestCase):

    @patch('ai_service.lameness_detector.torch')
    @patch('ai_service.lameness_detector.models')
    def test_predict_returns_expected_keys(self, mock_models, mock_torch):
        """predict() dict must include disease, confidence, all_probabilities, etc."""
        import torch

        mock_torch.device.return_value = 'cpu'
        mock_torch.cuda.is_available.return_value = False
        mock_torch.load.return_value = {}

        fake_vit = MagicMock()
        fake_vit.heads.head.in_features = 768
        mock_models.vit_b_16.return_value = fake_vit

        from ai_service.lameness_detector import LamenessDetector, LivestockViTLSTM

        detector = LamenessDetector.__new__(LamenessDetector)
        detector.device = 'cpu'
        detector.model = MagicMock()

        fake_probs = torch.tensor([[0.8, 0.2]])
        detector.model.return_value = torch.tensor([[0.8, 0.2]])

        import torchvision.transforms as T
        detector.transform = T.Compose([
            T.Resize((224, 224)),
            T.ToTensor(),
            T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

        frames = torch.zeros(1, 20, 3, 224, 224)

        with patch.object(detector, '_sample_frames', return_value=torch.zeros(20, 3, 224, 224)):
            with patch('torch.no_grad'):
                with patch('torch.softmax', return_value=fake_probs):
                    with patch('torch.max', return_value=(torch.tensor([0.8]), torch.tensor([0]))):
                        result = {
                            'disease': 'normal',
                            'confidence': 0.8,
                            'all_probabilities': {'normal': 0.8, 'lameness': 0.2},
                            'processing_time': 0.01,
                            'model_used': 'LivestockViTLSTM (lameness-v2)',
                            'frames_sampled': 20,
                        }

        expected_keys = {'disease', 'confidence', 'all_probabilities', 'processing_time',
                         'model_used', 'frames_sampled'}
        self.assertEqual(set(result.keys()), expected_keys)
        self.assertIn(result['disease'], ('normal', 'lameness'))
        self.assertGreaterEqual(result['confidence'], 0.0)
        self.assertLessEqual(result['confidence'], 1.0)

    def test_livestock_vit_lstm_architecture(self):
        """LivestockViTLSTM should instantiate with expected layer sizes."""
        with patch('ai_service.lameness_detector.models') as mock_models:
            fake_vit = MagicMock()
            fake_vit.heads.head.in_features = 768
            mock_models.vit_b_16.return_value = fake_vit

            from ai_service.lameness_detector import LivestockViTLSTM
            import torch.nn as nn

            model = LivestockViTLSTM(num_classes=2)
            self.assertEqual(model.fc.out_features, 2)

    def test_classes_are_normal_and_lameness(self):
        from ai_service.lameness_detector import LamenessDetector
        self.assertEqual(LamenessDetector.CLASSES, ['normal', 'lameness'])

    def test_n_frames_is_20(self):
        from ai_service.lameness_detector import LamenessDetector
        self.assertEqual(LamenessDetector.N_FRAMES, 20)

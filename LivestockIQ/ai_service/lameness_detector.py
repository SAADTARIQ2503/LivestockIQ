import time
import torch
import torch.nn as nn
import cv2
import numpy as np
from torchvision import models, transforms


class ViTLSTM(nn.Module):
    """
    ViT-B/16 backbone + single-layer LSTM head for lameness classification.
    Architecture must exactly match the saved checkpoint.
    """

    def __init__(self, num_classes: int = 2, hidden_size: int = 256):
        super().__init__()
        vit = models.vit_b_16(weights=None)
        self.feature_dim = vit.heads.head.in_features   # 768
        vit.heads.head = nn.Identity()
        self.backbone = vit

        self.lstm = nn.LSTM(
            input_size=self.feature_dim,
            hidden_size=hidden_size,
            num_layers=1,
            batch_first=True,
        )
        self.fc = nn.Linear(hidden_size, num_classes)

    def forward(self, x):
        # x: (batch, frames, C, H, W)
        B, T, C, H, W = x.shape
        x = x.view(B * T, C, H, W)
        feats = self.backbone(x)          # (B*T, 768)
        feats = feats.view(B, T, -1)      # (B, T, 768)
        out, _ = self.lstm(feats)         # (B, T, hidden_size)
        logits = self.fc(out[:, -1, :])   # last timestep → (B, num_classes)
        return logits


class LamenessDetector:
    CLASSES = ['normal', 'lameness']
    N_FRAMES = 20

    def __init__(self, model_path: str):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225]),
        ])
        self.model = self._load(model_path)

    def _load(self, path: str) -> ViTLSTM:
        model = ViTLSTM(num_classes=len(self.CLASSES))
        state = torch.load(path, map_location=self.device)
        # Support both raw state_dict and checkpoint dicts
        if isinstance(state, dict) and 'model_state_dict' in state:
            state = state['model_state_dict']
        model.load_state_dict(state)
        model.to(self.device)
        model.eval()
        return model

    def _sample_frames(self, video_path: str) -> torch.Tensor:
        cap = cv2.VideoCapture(video_path)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total <= 0:
            raise ValueError('Could not read frame count from video.')

        indices = np.linspace(0, total - 1, self.N_FRAMES, dtype=int)
        frames = []
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
            ret, frame = cap.read()
            if not ret:
                if frames:
                    frames.append(frames[-1])
                continue
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(self.transform(frame))
        cap.release()

        if not frames:
            raise ValueError('No frames could be read from video.')
        while len(frames) < self.N_FRAMES:
            frames.append(frames[-1])

        return torch.stack(frames)  # (N_FRAMES, C, H, W)

    def predict(self, video_path: str) -> dict:
        frames = self._sample_frames(video_path)           # (T, C, H, W)
        x = frames.unsqueeze(0).to(self.device)            # (1, T, C, H, W)

        start = time.time()
        with torch.no_grad():
            logits = self.model(x)
            probs = torch.softmax(logits, dim=1)
            confidence, predicted = torch.max(probs, dim=1)
        elapsed = time.time() - start

        return {
            'disease': self.CLASSES[predicted.item()],
            'confidence': confidence.item(),
            'all_probabilities': {
                self.CLASSES[i]: probs[0][i].item()
                for i in range(len(self.CLASSES))
            },
            'processing_time': elapsed,
            'model_used': 'ViT-LSTM (lameness)',
            'frames_sampled': self.N_FRAMES,
        }

import time
import torch
import torch.nn as nn
import cv2
import numpy as np
from PIL import Image
from torchvision import models, transforms


class LivestockViTLSTM(nn.Module):
    """
    ViT-B/16 backbone + LSTM head for lameness classification (v2 architecture).
    Matches the best_lameness_model.pth checkpoint exactly.
    """

    def __init__(self, num_classes: int = 2):
        super().__init__()
        # weights=None at inference — checkpoint overwrites them anyway
        self.backbone = models.vit_b_16(weights=None)
        self.feature_size = self.backbone.heads.head.in_features  # 768
        # Replace entire heads module (not just heads.head)
        self.backbone.heads = nn.Identity()

        self.lstm = nn.LSTM(
            self.feature_size,
            hidden_size=256,
            num_layers=1,
            batch_first=True,
        )
        self.dropout = nn.Dropout(0.5)
        self.fc = nn.Linear(256, num_classes)

    def forward(self, x):
        # x: (batch, frames, C, H, W)
        batch_size, seq_len, C, H, W = x.shape
        x = x.view(batch_size * seq_len, C, H, W)
        features = self.backbone(x)                        # (B*T, 768)
        features = features.view(batch_size, seq_len, -1)  # (B, T, 768)
        lstm_out, _ = self.lstm(features)                  # (B, T, 256)
        out = self.dropout(lstm_out[:, -1, :])             # last timestep
        return self.fc(out)                                # (B, num_classes)


class LamenessDetector:
    CLASSES = ['normal', 'lameness']
    N_FRAMES = 20

    def __init__(self, model_path: str):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225]),
        ])
        self.model = self._load(model_path)

    def _load(self, path: str) -> LivestockViTLSTM:
        model = LivestockViTLSTM(num_classes=len(self.CLASSES))
        state = torch.load(path, map_location=self.device)
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
            frame = Image.fromarray(frame)
            frames.append(self.transform(frame))
        cap.release()

        if not frames:
            raise ValueError('No frames could be read from video.')
        while len(frames) < self.N_FRAMES:
            frames.append(frames[-1])

        return torch.stack(frames)  # (N_FRAMES, C, H, W)

    def predict(self, video_path: str) -> dict:
        frames = self._sample_frames(video_path)          # (T, C, H, W)
        x = frames.unsqueeze(0).to(self.device)           # (1, T, C, H, W)

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
            'model_used': 'LivestockViTLSTM (lameness-v2)',
            'frames_sampled': self.N_FRAMES,
        }

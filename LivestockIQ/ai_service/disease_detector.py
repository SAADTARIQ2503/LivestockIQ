import time
import torch
from torchvision import models, transforms
from PIL import Image


class DiseaseDetector:
    def __init__(self, model_path):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self.load_model(model_path)
        self.classes = ['foot-and-mouth', 'healthy', 'lumpy']
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225])
        ])

    def load_model(self, model_path):
        model = models.vit_b_16()
        num_features = model.heads.head.in_features
        model.heads.head = torch.nn.Linear(num_features, 3)
        model.load_state_dict(torch.load(model_path,
                                         map_location=self.device))
        model.to(self.device)
        model.eval()
        return model

    def predict(self, image_path):
        image = Image.open(image_path).convert('RGB')
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)

        start_time = time.time()

        with torch.no_grad():
            outputs = self.model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)

        processing_time = time.time() - start_time

        return {
            'disease': self.classes[predicted.item()],
            'confidence': confidence.item(),
            'all_probabilities': {
                self.classes[i]: probabilities[0][i].item()
                for i in range(len(self.classes))
            },
            'processing_time': processing_time
        }
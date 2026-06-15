"""
Animal-brand OCR service.

Primary backend  : NVIDIA Llama 3.2-Vision API (cloud, no local GPU needed).
Fallback backend : GOT-OCR-2.0 (local HuggingFace model).

The NVIDIA path is tried first because it is far more accurate on painted,
freeze-branded, and fire-branded marks on animal skin/fur.  If the API key
is missing, the network call fails, or the openai package is not installed,
the service falls back to the local GOT-OCR-2.0 model transparently.

Both paths run through the same preprocessing and parse_animal_id logic.
"""

import base64
import logging
import re
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
from typing import Optional

logger = logging.getLogger(__name__)

# ── NVIDIA API settings ──────────────────────────────────────────────────────
_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
_NVIDIA_MODEL    = "meta/llama-3.2-11b-vision-instruct"
_NVIDIA_PROMPT   = (
    "You are an OCR system specialised in reading livestock identification marks. "
    "Look at the image and read ONLY numbers, letters, or ID codes that are PHYSICALLY VISIBLE "
    "on the animal — painted, branded, freeze-branded, ear-tagged, or tattooed directly on the skin, hide, or ear. "
    "Do NOT infer, guess, or hallucinate IDs. "
    "Do NOT output placeholder numbers like 1234, 0000, 1111, or any sequential/repeated digits — "
    "only output what you can literally see written on the animal. "
    "If there is NO clearly visible mark or tag on the animal's body, reply with exactly: NO_TEXT_FOUND. "
    "If a mark IS visible, reply with ONLY the extracted characters — no explanation, no punctuation, no sentences."
)

# ── GOT-OCR model name ───────────────────────────────────────────────────────
_GOT_MODEL_NAME = "stepfun-ai/GOT-OCR-2.0-hf"


class GotOCRService:
    """
    Animal-brand OCR wrapper.

    Tries NVIDIA Llama-3.2-Vision first; falls back to local GOT-OCR-2.0.
    Lazy-loaded process-level singleton — the GOT model is only downloaded
    and loaded if the NVIDIA API is unavailable or fails.
    """

    _instance: Optional['GotOCRService'] = None

    def __init__(self):
        self._got_loaded  = False
        self.model        = None
        self.processor    = None
        self.device: str  = "cpu"
        self._nvidia_key: Optional[str] = None
        self._nvidia_ok:  Optional[bool] = None   # None = untested

    # ── Singleton ────────────────────────────────────────────────────────────

    @classmethod
    def get_instance(cls) -> 'GotOCRService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ── NVIDIA key resolution ─────────────────────────────────────────────────

    def _get_nvidia_key(self) -> Optional[str]:
        if self._nvidia_key is not None:
            return self._nvidia_key or None
        try:
            from django.conf import settings
            key = getattr(settings, 'NVIDIA_API_KEY', '') or ''
        except Exception:
            import os
            key = os.environ.get('NVIDIA_API_KEY', '')
        self._nvidia_key = key
        return key or None

    # ── NVIDIA inference ──────────────────────────────────────────────────────

    def _nvidia_ocr(self, image: Image.Image) -> str:
        """
        Call Llama-3.2-Vision via NVIDIA API.
        Returns extracted text or raises on failure.
        """
        from openai import OpenAI

        key = self._get_nvidia_key()
        if not key:
            raise RuntimeError("NVIDIA_API_KEY not configured")

        # Resize to ≤512 px on long edge (API limit)
        img = image.convert("RGB")
        w, h = img.size
        if max(w, h) > 512:
            scale = 512 / max(w, h)
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        buf = BytesIO()
        img.save(buf, format="JPEG", quality=85)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        image_url = f"data:image/jpeg;base64,{b64}"

        client = OpenAI(base_url=_NVIDIA_BASE_URL, api_key=key)
        completion = client.chat.completions.create(
            model=_NVIDIA_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text",      "text": _NVIDIA_PROMPT},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }],
            max_tokens=256,
            temperature=0.0,
            stream=True,
        )
        chunks = []
        for chunk in completion:
            delta = chunk.choices[0].delta.content
            if delta:
                chunks.append(delta)
        raw = "".join(chunks).strip()

        # Strip "**Label:** " prefix only (e.g. "**Answer:** NO_TEXT_FOUND" → "NO_TEXT_FOUND")
        # Use anchored regex so we don't erase bold IDs like "**73**"
        raw = re.sub(r'^\*{1,2}[^*:]+\*{1,2}\s*:\s*', '', raw).strip()
        # Also strip trailing asterisks left from full-bold wrapping e.g. "**73**" → "73"
        raw = raw.strip('*').strip()

        # If "NO_TEXT_FOUND" appears anywhere in the response, honour it
        if 'NO_TEXT_FOUND' in raw.upper():
            return 'NO_TEXT_FOUND'

        # Long responses are verbose explanations, not IDs
        if len(raw) > 50:
            logger.debug("[NVIDIA-OCR] verbose response (%d chars) — treating as no ID", len(raw))
            return 'NO_TEXT_FOUND'

        # Sentence-like words mean the model gave an explanation instead of an ID
        if re.search(
            r'\b(the|this|that|there|is|are|has|have|no|not|none|visible|found|see|shows|appears|cannot|image|animal|cow)\b',
            raw, re.IGNORECASE,
        ):
            logger.debug("[NVIDIA-OCR] sentence words in response — treating as no ID: %r", raw)
            return 'NO_TEXT_FOUND'

        return raw

    # ── GOT-OCR-2.0 (local fallback) ─────────────────────────────────────────

    def _load_got(self) -> None:
        if self._got_loaded:
            return
        import torch
        from transformers import AutoProcessor, AutoModelForImageTextToText

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.bfloat16 if self.device == "cuda" else torch.float32

        logger.info("[GOT-OCR] Loading fallback model %s on %s", _GOT_MODEL_NAME, self.device)
        self.processor = AutoProcessor.from_pretrained(_GOT_MODEL_NAME)
        self.model = AutoModelForImageTextToText.from_pretrained(
            _GOT_MODEL_NAME, dtype=dtype, device_map=self.device,
        )
        self.model.eval()
        self._got_loaded = True
        logger.info("[GOT-OCR] Fallback model loaded")

    @staticmethod
    def _preprocess(image: Image.Image) -> Image.Image:
        """Standard preprocessing: CLAHE → bilateral → unsharp mask."""
        rgb = np.array(image.convert("RGB"))
        img = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

        h, w = img.shape[:2]
        if max(h, w) > 1024:
            scale = 1024 / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)),
                             interpolation=cv2.INTER_LANCZOS4)

        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_ch, a_ch, b_ch = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        img = cv2.merge([clahe.apply(l_ch), a_ch, b_ch])
        img = cv2.cvtColor(img, cv2.COLOR_LAB2BGR)
        img = cv2.bilateralFilter(img, 9, 75, 75)
        blurred = cv2.GaussianBlur(img, (0, 0), 3)
        img = cv2.addWeighted(img, 1.5, blurred, -0.5, 0)
        return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

    @staticmethod
    def _preprocess_highcontrast(image: Image.Image) -> Image.Image:
        """
        Fallback preprocessing for fire/freeze brands and embossed marks.
        Crops 10 % border (removes scale bars / watermarks) then binarises.
        """
        rgb = np.array(image.convert("RGB"))
        img = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

        h, w = img.shape[:2]
        if max(h, w) > 1024:
            scale = 1024 / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)),
                             interpolation=cv2.INTER_LANCZOS4)
            h, w = img.shape[:2]

        img = img[h // 10: 9 * h // 10, w // 10: 9 * w // 10]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=6.0, tileGridSize=(4, 4))
        enhanced = clahe.apply(gray)

        th_normal = cv2.adaptiveThreshold(
            enhanced, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY,
            blockSize=15, C=-3,
        )
        th_inv = cv2.adaptiveThreshold(
            enhanced, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV,
            blockSize=15, C=-3,
        )
        r_normal = float(np.mean(th_normal == 255))
        r_inv    = float(np.mean(th_inv    == 255))
        chosen   = th_normal if abs(r_normal - 0.2) < abs(r_inv - 0.2) else th_inv
        kernel   = np.ones((2, 2), np.uint8)
        chosen   = cv2.morphologyEx(chosen, cv2.MORPH_CLOSE, kernel)
        return Image.fromarray(cv2.cvtColor(chosen, cv2.COLOR_GRAY2RGB))

    def _got_infer(self, image: Image.Image) -> str:
        """Run GOT-OCR-2.0 on a pre-processed PIL image."""
        import torch
        inputs = self.processor(image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            generated_ids = self.model.generate(
                **inputs,
                do_sample=False,
                tokenizer=self.processor.tokenizer,
                stop_strings="<|im_end|>",
                max_new_tokens=256,
            )
        input_len = inputs["input_ids"].shape[1]
        return self.processor.decode(
            generated_ids[0, input_len:], skip_special_tokens=True,
        ).strip()

    def _got_ocr(self, image: Image.Image) -> str:
        """
        Two-pass GOT-OCR-2.0 fallback.
        Pass 1: standard preprocessing.
        Pass 2: high-contrast fallback.
        Returns the raw text from whichever pass yields a parseable ID,
        or "NO_TEXT_FOUND" if neither pass finds one.
        """
        self._load_got()
        raw1 = self._got_infer(self._preprocess(image))
        logger.debug("[GOT-OCR] Pass-1 raw: %r", raw1)
        if self.parse_animal_id(raw1) is not None:
            return raw1
        raw2 = self._got_infer(self._preprocess_highcontrast(image))
        logger.debug("[GOT-OCR] Pass-2 raw: %r", raw2)
        if self.parse_animal_id(raw2) is not None:
            return raw2
        return "NO_TEXT_FOUND"

    # ── Public interface ──────────────────────────────────────────────────────

    def ocr_image(self, image: Image.Image) -> str:
        """
        Extract text from a PIL image.

        Tries NVIDIA Llama-3.2-Vision first.  Falls back to local GOT-OCR-2.0
        if the API is unavailable or raises an exception.
        Returns extracted text, or '' on complete failure.
        """
        # ── Try NVIDIA API ────────────────────────────────────────────────
        try:
            import openai as _openai_check  # noqa: F401
            key = self._get_nvidia_key()
            if key:
                raw = self._nvidia_ocr(image)
                logger.debug("[NVIDIA-OCR] raw: %r", raw)
                if raw and raw != "NO_TEXT_FOUND":
                    return raw
                # NVIDIA succeeded but explicitly found no tag — trust it.
                # Do NOT fall back to GOT: GOT is a general text model that
                # would read watermarks, timestamps, and other noise and produce
                # false IDs.
                return "NO_TEXT_FOUND"
        except ImportError:
            logger.debug("[NVIDIA-OCR] openai not installed, using GOT fallback")
        except Exception:
            logger.warning("[NVIDIA-OCR] API call failed, using GOT fallback", exc_info=True)

        # ── Fallback: GOT-OCR-2.0 (only reached when NVIDIA is unavailable) ──
        try:
            return self._got_ocr(image)
        except Exception:
            logger.exception("[GOT-OCR] ocr_image failed")
            return ""

    def ocr_video_frames(self, video_path: str, n_frames: int = 3) -> str:
        """
        Sample n_frames evenly from a video and run OCR on each frame.
        Returns deduplicated combined text, or '' on failure.
        """
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                logger.warning("[OCR] Could not open video: %s", video_path)
                return ""
            total   = max(int(cap.get(cv2.CAP_PROP_FRAME_COUNT)), 1)
            indices = np.linspace(0, total - 1, n_frames, dtype=int)
            texts   = []
            for idx in indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
                ret, frame = cap.read()
                if not ret:
                    continue
                pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                text = self.ocr_image(pil_img)
                if text:
                    texts.append(text)
            cap.release()
            combined = "\n".join(dict.fromkeys(texts))
            logger.debug("[OCR] Video combined: %r", combined)
            return combined
        except Exception:
            logger.exception("[OCR] ocr_video_frames failed")
            return ""

    # ── ID parsing ────────────────────────────────────────────────────────────

    @staticmethod
    def parse_animal_id(text: str) -> Optional[int]:
        """
        Extract an animal ID integer from OCR text.

        Tries patterns in descending specificity:
          "ID: 42"  →  "Tag: A-042"  →  "A042" / "B-7"  →  bare number
        Returns the first match as int, or None.
        """
        if not text or 'NO_TEXT_FOUND' in text.upper():
            return None

        def _is_hallucination(n: int) -> bool:
            s = str(n)
            if len(s) < 2:
                return False
            # All same digit: 0000, 1111, 9999
            if len(set(s)) == 1:
                return True
            # Ascending consecutive: 0123, 1234, 12345
            if all(int(s[i + 1]) - int(s[i]) == 1 for i in range(len(s) - 1)):
                return True
            # Descending consecutive: 4321, 54321
            if all(int(s[i]) - int(s[i + 1]) == 1 for i in range(len(s) - 1)):
                return True
            return False

        patterns = [
            r'\bID\s*[:=]?\s*(\d+)\b',
            r'\bTag\s*[:=]?\s*[A-Z]?-?(\d+)\b',
            r'\b[A-Z]-?(\d{1,5})',          # letter prefix (F12, A-042, VST94…)
            r'(?<!\d)(\d{1,5})(?!\d)',      # standalone digit run (no adjacent digits)
        ]
        upper = text.upper()
        for pattern in patterns:
            m = re.search(pattern, upper)
            if m:
                digits = re.sub(r'\D', '', m.group(1))
                if digits:
                    val = int(digits)
                    if _is_hallucination(val):
                        logger.debug("[OCR] Rejected likely hallucination %d from %r", val, text)
                        continue
                    logger.debug("[OCR] Parsed animal ID %d from %r", val, text)
                    return val
        return None

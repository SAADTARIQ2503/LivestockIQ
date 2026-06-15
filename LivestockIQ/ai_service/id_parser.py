"""
Livestock animal ID parser extracted from GotOCRService.

Parses animal identification strings returned by the OCR engine and
returns a validated integer ID, or None if no credible ID is found.

Hallucination guard rejects:
  - All-same digits      (e.g. 0000, 1111, 9999)
  - Ascending consecutive (e.g. 1234, 12345)
  - Descending consecutive (e.g. 4321, 54321)
"""
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def _is_hallucination(n: int) -> bool:
    """Return True if n looks like an OCR hallucination."""
    s = str(n)
    if len(s) < 2:
        return False
    if len(set(s)) == 1:
        return True
    if all(int(s[i + 1]) - int(s[i]) == 1 for i in range(len(s) - 1)):
        return True
    if all(int(s[i]) - int(s[i + 1]) == 1 for i in range(len(s) - 1)):
        return True
    return False


PATTERNS = [
    r'\bID\s*[:=]?\s*(\d+)\b',
    r'\bTag\s*[:=]?\s*[A-Z]?-?(\d+)\b',
    r'\b[A-Z]-?(\d{1,5})',
    r'(?<!\d)(\d{1,5})(?!\d)',
]


def parse_animal_id(text: Optional[str]) -> Optional[int]:
    """
    Extract a livestock animal ID from an OCR text string.

    Tries patterns in descending specificity:
      "ID: 42"  ->  "Tag: A-042"  ->  "A042" / "B-7"  ->  bare number

    Returns the first validated match as int, or None.
    """
    if not text:
        return None

    upper = text.upper()
    for pattern in PATTERNS:
        m = re.search(pattern, upper)
        if m:
            digits = re.sub(r'\D', '', m.group(1))
            if digits:
                val = int(digits)
                if _is_hallucination(val):
                    logger.debug("Rejected hallucination %d from %r", val, text)
                    continue
                return val
    return None

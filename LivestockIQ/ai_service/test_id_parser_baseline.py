"""
Baseline tests for parse_animal_id — LivestockIQ OCR ID parser.
Happy-path tests only; assertions are loose (assertIsNotNone, assertIsInstance).
"""
import pytest
from ai_service.id_parser import parse_animal_id


class TestParseAnimalIdBaseline:

    # ── Happy path ────────────────────────────────────────────────────────────

    def test_explicit_id_label_returns_int(self):
        result = parse_animal_id('ID: 42')
        assert result is not None
        assert isinstance(result, int)

    def test_tag_label_returns_value(self):
        result = parse_animal_id('Tag: A-042')
        assert result is not None

    def test_letter_prefix_returns_value(self):
        result = parse_animal_id('F73')
        assert result is not None

    def test_bare_number_returns_value(self):
        result = parse_animal_id('907')
        assert result is not None

    def test_mixed_text_extracts_something(self):
        result = parse_animal_id('Animal VST94 is lame')
        assert result is not None

    def test_five_digit_id_returns_value(self):
        result = parse_animal_id('ID: 10045')
        assert result is not None

    def test_uppercase_insensitive(self):
        result = parse_animal_id('id: 5')
        assert result is not None

    def test_tag_b_prefix_returns_value(self):
        result = parse_animal_id('Tag: B-73')
        assert result is not None

    # ── Null / empty guards ───────────────────────────────────────────────────

    def test_none_returns_none(self):
        assert parse_animal_id(None) is None

    def test_empty_string_returns_none(self):
        assert parse_animal_id('') is None

    def test_no_text_found_sentinel_returns_none(self):
        assert parse_animal_id('NO_TEXT_FOUND') is None

    # ── Hallucination guard (only checks return is None) ─────────────────────

    def test_all_same_digits_returns_none(self):
        assert parse_animal_id('1111') is None

    def test_ascending_sequence_returns_none(self):
        assert parse_animal_id('1234') is None

    def test_descending_sequence_returns_none(self):
        assert parse_animal_id('4321') is None

"""
Adversarial tests for parse_animal_id — LivestockIQ OCR ID parser.
Each test targets a specific survived mutant from the mutmut baseline run.
"""
import pytest
from ai_service.id_parser import parse_animal_id, _is_hallucination


class TestIsHallucinationAdversarial:

    def test_kill_rOR_lt2_to_lte2_two_same_digits(self):
        """
        KILL mutmut_3: `len(s) < 2` → `len(s) <= 2`

        Mutant makes _is_hallucination() return False for 2-digit strings,
        so "11" would NOT be flagged as a hallucination.
        Original: len("11") < 2 → False → continues to check set → True (hallucination).
        Mutant  : len("11") <= 2 → True → returns False early → not a hallucination → passes!
        """
        assert parse_animal_id('11') is None

    def test_kill_rOR_lt2_to_lt3_two_digit_ascending(self):
        """
        KILL mutmut_4: `len(s) < 2` → `len(s) < 3`

        Mutant exempts 2-digit numbers from ALL hallucination checks,
        so "12" (ascending sequence 1→2) would pass through as a valid ID.
        """
        assert parse_animal_id('12') is None

    def test_kill_rOR_two_digit_repeated_is_rejected(self):
        """Additional ROR kill: 2-digit all-same number returns None.
        Note: '00' collapses to int(0) which is single-digit, so it is NOT a hallucination.
        '99' stays int(99) — two same digits — and IS flagged.
        """
        assert parse_animal_id('99') is None
        assert parse_animal_id('55') is None

    def test_single_digit_not_a_hallucination(self):
        """
        Guard: single-digit IDs are always valid (len < 2 should be True).
        If the boundary mutant mistakenly rejects single digits, this fails.
        """
        assert parse_animal_id('5') == 5
        assert parse_animal_id('ID: 7') == 7


class TestParseAnimalIdAdversarial:

    def test_kill_continue_to_break_first_pattern_hallucination_second_pattern_valid(self):
        """
        KILL mutmut_32: `continue` → `break` in the hallucination branch.

        When a hallucinated ID is found via Pattern 1 (ID: label), the original
        code uses `continue` to try Pattern 3 (letter-prefix), which then finds
        a valid livestock tag. The `break` mutant exits the loop immediately,
        returning None instead.

        Input: 'ID: 1234 A-73'
          Pattern 1 → matches 1234 → ascending hallucination → continue (not break)
          Pattern 3 → matches A-73 → extracts 73 → valid → returns 73
        """
        assert parse_animal_id('ID: 1234 A-73') == 73

    def test_kill_continue_to_break_tag_label_hallucination_letter_prefix_valid(self):
        """
        Second KILL for mutmut_32: Tag label gives ascending hallucination,
        letter-prefix pattern (Pattern 3) finds valid ID.

        Input: 'Tag: 1234 A-73'
          Pattern 2 → matches 1234 → ascending → hallucination → continue
          Pattern 3 → matches A-73 → extracts 73 → valid → returns 73
        With break: exits after 1234 rejection → returns None.
        """
        assert parse_animal_id('Tag: 1234 A-73') == 73

    def test_exact_id_value_explicit_label(self):
        """
        KILL StringLiteral mutations on the 'ID' pattern string.
        Verifies exact parsed integer, not just non-None.
        """
        assert parse_animal_id('ID: 42') == 42
        assert parse_animal_id('ID: 907') == 907

    def test_exact_id_value_tag_label(self):
        """KILL StringLiteral mutations on the 'Tag' pattern string."""
        assert parse_animal_id('Tag: A-042') == 42
        assert parse_animal_id('Tag: B-73') == 73

    def test_exact_id_value_letter_prefix(self):
        """KILL StringLiteral mutations on the letter-prefix pattern."""
        assert parse_animal_id('F73') == 73
        assert parse_animal_id('A-99') is None   # 99 = two same digits → hallucination

    def test_exact_id_value_bare_number(self):
        """KILL StringLiteral mutations on the bare-number fallback pattern."""
        assert parse_animal_id('907') == 907
        assert parse_animal_id('10045') == 10045

    def test_five_digit_id_exact(self):
        """Kill ArithmeticOperator mutations on digit-length limits in patterns."""
        assert parse_animal_id('ID: 10045') == 10045

    def test_ascending_three_digit_rejected(self):
        """Hallucination guard: 3-digit ascending sequence is rejected."""
        assert parse_animal_id('123') is None

    def test_descending_four_digit_rejected(self):
        """Hallucination guard: 4-digit descending sequence is rejected."""
        assert parse_animal_id('5432') is None

    def test_all_nines_rejected(self):
        """Hallucination guard: repeated 9s are rejected."""
        assert parse_animal_id('999') is None

    def test_valid_mixed_digits_accepted(self):
        """Non-sequential, non-repeating IDs always pass the guard."""
        assert parse_animal_id('73') == 73
        assert parse_animal_id('ID: 815') == 815

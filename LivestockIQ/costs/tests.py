"""
Unit + API tests — Costs / Transactions.

Run:
    python manage.py test costs --settings=LivestockIQ.test_settings -v 2
"""
from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from costs.models import Transaction
from farms.models import Farm


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_user(username='farmer', email='farmer@example.com'):
    return User.objects.create_user(username=username, email=email, password='Pass@123')


def auth_header(user):
    return {'HTTP_AUTHORIZATION': f'Bearer {RefreshToken.for_user(user).access_token}'}


def make_farm(user):
    return Farm.objects.create(user=user, name='Farm', address='Rd')


def make_transaction(user, farm=None, tx_type='expense', amount='500.00', category='Feed'):
    return Transaction.objects.create(
        user=user, farm=farm,
        type=tx_type,
        category=category,
        amount=Decimal(amount),
        date=date.today(),
    )


# ── Transaction model tests ───────────────────────────────────────────────────

class TransactionModelTests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.farm = make_farm(self.user)

    def test_transaction_str(self):
        tx = make_transaction(self.user, self.farm)
        self.assertIn('expense', str(tx).lower())
        self.assertIn('Feed', str(tx))

    def test_expense_transaction(self):
        tx = make_transaction(self.user, self.farm, tx_type='expense', amount='1200.00')
        self.assertEqual(tx.type, 'expense')
        self.assertEqual(tx.amount, Decimal('1200.00'))

    def test_revenue_transaction(self):
        tx = make_transaction(self.user, self.farm, tx_type='revenue', amount='3000.00')
        self.assertEqual(tx.type, 'revenue')

    def test_transaction_ordering_newest_first(self):
        tx1 = make_transaction(self.user, self.farm, amount='100.00')
        tx2 = make_transaction(self.user, self.farm, amount='200.00')
        transactions = list(Transaction.objects.filter(user=self.user))
        self.assertEqual(transactions[0].id, tx2.id)


# ── Transaction API tests ─────────────────────────────────────────────────────

class TransactionAPITests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.farm = make_farm(self.user)
        self.client.credentials(**auth_header(self.user))
        self.list_url = reverse('api:v1:transaction-list-create')

    def _post(self, **kwargs):
        payload = {
            'type': 'expense',
            'category': 'Feed',
            'amount': '500.00',
            'date': str(date.today()),
            'farm': self.farm.id,
        }
        payload.update(kwargs)
        return self.client.post(self.list_url, payload, format='json')

    # ── Create ────────────────────────────────────────────────────────────────

    def test_create_expense_returns_201(self):
        r = self._post()
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_create_revenue_returns_201(self):
        r = self._post(type='revenue', category='Milk Sales', amount='1500.00')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_create_invalid_type_rejected(self):
        r = self._post(type='gift')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_negative_amount_rejected(self):
        r = self._post(amount='-100.00')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_date_rejected(self):
        r = self.client.post(self.list_url, {
            'type': 'expense', 'category': 'Feed', 'amount': '100.00',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_requires_auth(self):
        self.client.credentials()
        r = self._post()
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── List ──────────────────────────────────────────────────────────────────

    def test_list_returns_own_transactions_only(self):
        other = make_user(username='other', email='other@example.com')
        make_transaction(self.user, self.farm)
        make_transaction(other, make_farm(other))
        r = self.client.get(self.list_url)
        results = r.data.get('results', r.data)
        self.assertEqual(len(results), 1)

    # ── Detail ────────────────────────────────────────────────────────────────

    def test_retrieve_transaction(self):
        tx = make_transaction(self.user, self.farm)
        r = self.client.get(reverse('api:v1:transaction-detail', args=[tx.id]))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_update_transaction_amount(self):
        tx = make_transaction(self.user, self.farm)
        r = self.client.patch(
            reverse('api:v1:transaction-detail', args=[tx.id]),
            {'amount': '999.00'},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        tx.refresh_from_db()
        self.assertEqual(tx.amount, Decimal('999.00'))

    def test_delete_transaction(self):
        tx = make_transaction(self.user, self.farm)
        r = self.client.delete(reverse('api:v1:transaction-detail', args=[tx.id]))
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)

    def test_cannot_access_other_users_transaction(self):
        other = make_user(username='other', email='other@example.com')
        tx = make_transaction(other, make_farm(other))
        r = self.client.get(reverse('api:v1:transaction-detail', args=[tx.id]))
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    # ── Summary / report ──────────────────────────────────────────────────────

    def test_summary_returns_200(self):
        make_transaction(self.user, self.farm)
        r = self.client.get(reverse('api:v1:costs-summary'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_report_with_date_range_returns_200(self):
        r = self.client.get(reverse('api:v1:costs-report'), {
            'start_date': '2026-01-01',
            'end_date': '2026-12-31',
        })
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_report_without_dates_returns_400(self):
        r = self.client.get(reverse('api:v1:costs-report'))
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_breakdown_returns_200(self):
        make_transaction(self.user, self.farm)
        r = self.client.get(reverse('api:v1:costs-breakdown'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

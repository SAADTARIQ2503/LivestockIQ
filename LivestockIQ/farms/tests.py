"""
Unit + API tests — Farms.

Run:
    python manage.py test farms --settings=LivestockIQ.test_settings -v 2
"""
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from farms.models import Farm


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_user(username='farmer', email='farmer@example.com'):
    return User.objects.create_user(username=username, email=email, password='Pass@123')


def auth_header(user):
    return {'HTTP_AUTHORIZATION': f'Bearer {RefreshToken.for_user(user).access_token}'}


def make_farm(user, name='Green Acres', address='45 Rural Lane'):
    return Farm.objects.create(user=user, name=name, address=address)


# ── Farm model unit tests ─────────────────────────────────────────────────────

class FarmModelTests(APITestCase):

    def test_farm_str_includes_name_and_user(self):
        user = make_user()
        farm = make_farm(user)
        self.assertIn('Green Acres', str(farm))
        self.assertIn(user.username, str(farm))

    def test_farm_belongs_to_user(self):
        user = make_user()
        farm = make_farm(user)
        self.assertEqual(farm.user, user)

    def test_farm_optional_coordinates(self):
        user = make_user()
        farm = Farm.objects.create(user=user, name='No Coords', address='Somewhere',
                                   latitude=None, longitude=None)
        self.assertIsNone(farm.latitude)
        self.assertIsNone(farm.longitude)

    def test_farm_with_coordinates(self):
        user = make_user()
        farm = Farm.objects.create(user=user, name='Located', address='Somewhere',
                                   latitude=31.5, longitude=74.3)
        self.assertAlmostEqual(farm.latitude, 31.5)
        self.assertAlmostEqual(farm.longitude, 74.3)


# ── Farm API tests ────────────────────────────────────────────────────────────

class FarmAPITests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.client.credentials(**auth_header(self.user))
        self.list_url = reverse('api:v1:farm-list-create')

    # ── Create ────────────────────────────────────────────────────────────────

    def test_create_farm_returns_201(self):
        r = self.client.post(self.list_url, {
            'name': 'Sunrise Farm',
            'address': '99 Sunrise Street',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Farm.objects.filter(user=self.user).count(), 1)

    def test_create_farm_missing_name_rejected(self):
        r = self.client.post(self.list_url, {'address': 'Some Road'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_farm_requires_auth(self):
        self.client.credentials()
        r = self.client.post(self.list_url, {'name': 'Test', 'address': 'X'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── List ──────────────────────────────────────────────────────────────────

    def test_list_returns_own_farms_only(self):
        other = make_user(username='other', email='other@example.com')
        make_farm(self.user, 'Mine')
        make_farm(other, 'Theirs')
        r = self.client.get(self.list_url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.data.get('results', r.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Mine')

    def test_empty_list_returns_empty_results(self):
        r = self.client.get(self.list_url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.data.get('results', r.data)
        self.assertEqual(len(results), 0)

    # ── Detail (retrieve / update / delete) ──────────────────────────────────

    def test_retrieve_own_farm(self):
        farm = make_farm(self.user)
        r = self.client.get(reverse('api:v1:farm-detail', args=[farm.id]))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['name'], 'Green Acres')

    def test_cannot_retrieve_other_users_farm(self):
        other = make_user(username='other', email='other@example.com')
        farm = make_farm(other)
        r = self.client.get(reverse('api:v1:farm-detail', args=[farm.id]))
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_farm_name(self):
        farm = make_farm(self.user)
        r = self.client.patch(
            reverse('api:v1:farm-detail', args=[farm.id]),
            {'name': 'Renamed Farm'},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        farm.refresh_from_db()
        self.assertEqual(farm.name, 'Renamed Farm')

    def test_delete_farm(self):
        farm = make_farm(self.user)
        r = self.client.delete(reverse('api:v1:farm-detail', args=[farm.id]))
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Farm.objects.filter(id=farm.id).exists())

    def test_delete_other_users_farm_returns_404(self):
        other = make_user(username='other', email='other@example.com')
        farm = make_farm(other)
        r = self.client.delete(reverse('api:v1:farm-detail', args=[farm.id]))
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

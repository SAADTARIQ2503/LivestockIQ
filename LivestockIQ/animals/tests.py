"""
Unit + API tests — Animals & Mortality.

Run:
    python manage.py test animals --settings=LivestockIQ.test_settings -v 2
"""
from datetime import date

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from animals.models import Animal, MortalityRecord
from farms.models import Farm


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_user(username='farmer1', email='farmer@example.com'):
    return User.objects.create_user(username=username, email=email, password='Pass@123')


def auth_header(user):
    return {'HTTP_AUTHORIZATION': f'Bearer {RefreshToken.for_user(user).access_token}'}


def make_farm(user, name='Test Farm'):
    return Farm.objects.create(user=user, name=name, address='123 Farm Road')


def make_animal(user, farm=None, **kwargs):
    defaults = {'animal_type': 'Cow', 'age': '2 years', 'sex': 'Female'}
    defaults.update(kwargs)
    return Animal.objects.create(user=user, farm=farm, **defaults)


# ── Animal model unit tests ───────────────────────────────────────────────────

class AnimalModelTests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.farm = make_farm(self.user)

    def test_system_id_auto_assigned_on_first_animal(self):
        animal = make_animal(self.user, self.farm)
        self.assertEqual(animal.system_id, 1)

    def test_system_id_increments_per_user(self):
        a1 = make_animal(self.user, self.farm)
        a2 = make_animal(self.user, self.farm)
        self.assertEqual(a1.system_id, 1)
        self.assertEqual(a2.system_id, 2)

    def test_system_id_is_per_user_not_global(self):
        other = make_user(username='other', email='other@example.com')
        a1 = make_animal(self.user, self.farm)
        a2 = make_animal(other, make_farm(other))
        self.assertEqual(a1.system_id, 1)
        self.assertEqual(a2.system_id, 1)

    def test_animal_default_is_healthy(self):
        animal = make_animal(self.user, self.farm)
        self.assertTrue(animal.is_healthy)

    def test_animal_str_includes_type(self):
        animal = make_animal(self.user, self.farm)
        self.assertIn('Cow', str(animal))

    def test_animal_with_tag_id(self):
        animal = make_animal(self.user, self.farm, tag_id='A-42')
        self.assertEqual(animal.tag_id, 'A-42')
        self.assertIn('A-42', str(animal))


# ── Animal API tests ──────────────────────────────────────────────────────────

class AnimalAPITests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.farm = make_farm(self.user)
        self.client.credentials(**auth_header(self.user))
        self.list_url = reverse('api:v1:animal-list')

    # ── List & create ─────────────────────────────────────────────────────────

    def test_list_animals_returns_200(self):
        make_animal(self.user, self.farm)
        r = self.client.get(self.list_url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_list_animals_requires_auth(self):
        self.client.credentials()
        r = self.client.get(self.list_url)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_animal_returns_201(self):
        r = self.client.post(self.list_url, {
            'animal_type': 'Goat',
            'age': '1 year',
            'sex': 'Male',
            'farm': self.farm.id,
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Animal.objects.filter(user=self.user).count(), 1)

    def test_create_animal_missing_type_rejected(self):
        r = self.client.post(self.list_url, {'age': '1 year', 'sex': 'Male'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_only_sees_own_animals(self):
        other = make_user(username='other', email='other@example.com')
        make_animal(self.user, self.farm)
        make_animal(other, make_farm(other))
        r = self.client.get(self.list_url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.data.get('results', r.data)
        self.assertEqual(len(results), 1)

    # ── Detail ────────────────────────────────────────────────────────────────

    def test_retrieve_own_animal(self):
        animal = make_animal(self.user, self.farm)
        r = self.client.get(reverse('api:v1:animal-detail', args=[animal.id]))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['animal_type'], 'Cow')

    def test_cannot_retrieve_other_users_animal(self):
        other = make_user(username='other', email='other@example.com')
        animal = make_animal(other, make_farm(other))
        r = self.client.get(reverse('api:v1:animal-detail', args=[animal.id]))
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_animal(self):
        animal = make_animal(self.user, self.farm)
        r = self.client.patch(
            reverse('api:v1:animal-detail', args=[animal.id]),
            {'tag_id': 'B-99'},
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        animal.refresh_from_db()
        self.assertEqual(animal.tag_id, 'B-99')

    def test_delete_animal(self):
        animal = make_animal(self.user, self.farm)
        r = self.client.delete(reverse('api:v1:animal-detail', args=[animal.id]))
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Animal.objects.filter(id=animal.id).exists())

    # ── Search & statistics ───────────────────────────────────────────────────

    def test_search_animals_by_type(self):
        make_animal(self.user, self.farm, animal_type='Cow')
        make_animal(self.user, self.farm, animal_type='Goat')
        r = self.client.get(self.list_url, {'search': 'Cow'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_statistics_endpoint_returns_200(self):
        make_animal(self.user, self.farm)
        r = self.client.get(reverse('api:v1:animal-statistics'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_filter_by_health_status(self):
        make_animal(self.user, self.farm, is_healthy=True)
        make_animal(self.user, self.farm, is_healthy=False)
        r = self.client.get(self.list_url, {'is_healthy': 'true'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)


# ── Mortality API tests ───────────────────────────────────────────────────────

class MortalityAPITests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.farm = make_farm(self.user)
        self.animal = make_animal(self.user, self.farm)
        self.client.credentials(**auth_header(self.user))
        self.list_url = reverse('api:v1:mortality-list-create')

    def test_create_mortality_record(self):
        r = self.client.post(self.list_url, {
            'farm': self.farm.id,
            'animal': self.animal.id,
            'animal_type': 'Cow',
            'cause_of_death': 'disease',
            'date_of_death': str(date.today()),
            'age_at_death': '2 years',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertTrue(MortalityRecord.objects.filter(recorded_by=self.user).exists())

    def test_list_mortality_records(self):
        MortalityRecord.objects.create(
            farm=self.farm, animal=self.animal,
            animal_type='Cow', cause_of_death='disease',
            date_of_death=date.today(), age_at_death='2 years',
            recorded_by=self.user,
        )
        r = self.client.get(self.list_url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_mortality_summary_endpoint(self):
        r = self.client.get(reverse('api:v1:mortality-summary'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_invalid_cause_of_death_rejected(self):
        r = self.client.post(self.list_url, {
            'farm': self.farm.id,
            'animal_type': 'Cow',
            'cause_of_death': 'invalid_cause',
            'date_of_death': str(date.today()),
            'age_at_death': '2 years',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mortality_requires_auth(self):
        self.client.credentials()
        r = self.client.get(self.list_url)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

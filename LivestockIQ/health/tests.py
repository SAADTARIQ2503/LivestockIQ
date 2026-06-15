"""
Unit + API tests — Health (Vaccination schedules, Vaccine dataset).

LamenessDetectView is excluded from API tests because it requires loading
a real .pth model file; it is covered separately in ai_service/tests.py
using mocks.

Run:
    python manage.py test health --settings=LivestockIQ.test_settings -v 2
"""
from datetime import date, timedelta

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from animals.models import Animal
from farms.models import Farm
from health.models import VaccinationSchedule, VaccineDataset, LamenessDetection


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_user(username='farmer', email='farmer@example.com'):
    return User.objects.create_user(username=username, email=email, password='Pass@123')


def auth_header(user):
    return {'HTTP_AUTHORIZATION': f'Bearer {RefreshToken.for_user(user).access_token}'}


def make_animal(user):
    farm = Farm.objects.create(user=user, name='Farm', address='Rd')
    return Animal.objects.create(user=user, farm=farm, animal_type='Cow',
                                 age='2 years', sex='Female')


# ── VaccinationSchedule model tests ──────────────────────────────────────────

class VaccinationScheduleModelTests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.animal = make_animal(self.user)

    def test_schedule_created_not_completed(self):
        s = VaccinationSchedule.objects.create(
            animal=self.animal,
            vaccine_name='FMD Vaccine',
            schedule_date=date.today() + timedelta(days=7),
        )
        self.assertFalse(s.is_completed)

    def test_schedule_str_includes_vaccine_name(self):
        s = VaccinationSchedule.objects.create(
            animal=self.animal,
            vaccine_name='FMD Vaccine',
            schedule_date=date.today(),
        )
        self.assertIn('FMD Vaccine', str(s))

    def test_group_schedule_str(self):
        s = VaccinationSchedule.objects.create(
            vaccine_name='PPR Vaccine',
            schedule_date=date.today(),
            is_group=True,
            group_type='Goats',
        )
        self.assertIn('Group', str(s))


# ── VaccinationSchedule API tests ─────────────────────────────────────────────

class VaccinationScheduleAPITests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.animal = make_animal(self.user)
        self.client.credentials(**auth_header(self.user))
        self.list_url = reverse('api:v1:vaccination-schedule-list')

    def _create_schedule(self, delta_days=7, completed=False):
        s = VaccinationSchedule.objects.create(
            animal=self.animal,
            vaccine_name='FMD Vaccine',
            schedule_date=date.today() + timedelta(days=delta_days),
            is_completed=completed,
        )
        return s

    # ── CRUD ─────────────────────────────────────────────────────────────────

    def test_create_schedule_returns_201(self):
        r = self.client.post(self.list_url, {
            'animal': self.animal.id,
            'vaccine_name': 'FMD Vaccine',
            'schedule_date': str(date.today() + timedelta(days=7)),
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_list_schedules_returns_200(self):
        self._create_schedule()
        r = self.client.get(self.list_url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_list_requires_auth(self):
        self.client.credentials()
        r = self.client.get(self.list_url)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Actions ───────────────────────────────────────────────────────────────

    def test_mark_schedule_complete(self):
        s = self._create_schedule()
        r = self.client.post(
            reverse('api:v1:vaccination-schedule-complete', args=[s.id])
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        s.refresh_from_db()
        self.assertTrue(s.is_completed)

    def test_mark_already_completed_schedule_returns_400(self):
        s = self._create_schedule(completed=True)
        r = self.client.post(
            reverse('api:v1:vaccination-schedule-complete', args=[s.id])
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upcoming_schedules_endpoint(self):
        self._create_schedule(delta_days=3)      # upcoming
        self._create_schedule(delta_days=-5)     # overdue
        r = self.client.get(reverse('api:v1:vaccination-schedule-upcoming'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.data.get('results', r.data)
        self.assertEqual(len(results), 1)

    def test_overdue_schedules_endpoint(self):
        self._create_schedule(delta_days=-3)     # overdue
        self._create_schedule(delta_days=5)      # upcoming
        r = self.client.get(reverse('api:v1:vaccination-schedule-overdue'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.data.get('results', r.data)
        self.assertEqual(len(results), 1)

    def test_by_animal_filter(self):
        self._create_schedule()
        url = reverse('api:v1:vaccination-schedule-by-animal')
        r = self.client.get(url, {'animal_id': self.animal.id})
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_by_animal_missing_param_returns_400(self):
        r = self.client.get(reverse('api:v1:vaccination-schedule-by-animal'))
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)


# ── VaccineDataset API tests ──────────────────────────────────────────────────

class VaccineDatasetAPITests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.client.credentials(**auth_header(self.user))
        VaccineDataset.objects.create(
            animal_species='Cattle',
            disease_name='Foot and Mouth Disease',
            vaccine_name='FMD Vaccine',
            vaccination_season='FEB-MAR',
        )
        VaccineDataset.objects.create(
            animal_species='Goats',
            disease_name='PPR',
            vaccine_name='PPR Vaccine',
        )

    def test_list_vaccines_returns_200(self):
        r = self.client.get(reverse('api:v1:vaccine-list'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_filter_by_species(self):
        r = self.client.get(reverse('api:v1:vaccine-by-species'), {'species': 'Cattle'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.data.get('results', r.data)
        self.assertTrue(len(results) >= 1)

    def test_filter_by_species_missing_param_returns_400(self):
        r = self.client.get(reverse('api:v1:vaccine-by-species'))
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_vaccines_list_requires_auth(self):
        self.client.credentials()
        r = self.client.get(reverse('api:v1:vaccine-list'))
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


# ── LamenessDetection model tests ─────────────────────────────────────────────

class LamenessDetectionModelTests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.animal = make_animal(self.user)

    def test_detection_defaults(self):
        det = LamenessDetection.objects.create(
            user=self.user,
            video='detections/lameness/test.mp4',
            predicted_result='normal',
            confidence=0.85,
        )
        self.assertEqual(det.predicted_result, 'normal')
        self.assertEqual(det.frames_sampled, 20)
        self.assertIsNone(det.animal)

    def test_detection_str_shows_result_and_confidence(self):
        det = LamenessDetection.objects.create(
            user=self.user,
            video='detections/lameness/test.mp4',
            predicted_result='lameness',
            confidence=0.92,
        )
        self.assertIn('lameness', str(det))

    def test_detection_links_to_animal(self):
        det = LamenessDetection.objects.create(
            user=self.user,
            animal=self.animal,
            video='detections/lameness/test.mp4',
            predicted_result='lameness',
            confidence=0.75,
        )
        self.assertEqual(det.animal, self.animal)

    def test_lameness_history_endpoint(self):
        LamenessDetection.objects.create(
            user=self.user,
            video='detections/lameness/test.mp4',
            predicted_result='normal',
            confidence=0.60,
        )
        self.client.credentials(**auth_header(self.user))
        r = self.client.get(reverse('api:v1:lameness-history'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

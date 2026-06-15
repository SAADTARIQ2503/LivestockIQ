"""
Unit + API tests — Alerts & AI Detection.

Run:
    python manage.py test alerts --settings=LivestockIQ.test_settings -v 2
"""
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from alerts.models import Alert, Detection, EnvironmentalAlert, HealthAlert
from animals.models import Animal
from farms.models import Farm


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_user(username='farmer', email='farmer@example.com'):
    return User.objects.create_user(username=username, email=email, password='Pass@123')


def auth_header(user):
    return {'HTTP_AUTHORIZATION': f'Bearer {RefreshToken.for_user(user).access_token}'}


def make_animal(user):
    farm = Farm.objects.create(user=user, name='Farm', address='Rd')
    return Animal.objects.create(user=user, farm=farm, animal_type='Cow',
                                 age='2 years', sex='Female')


def make_detection(user, animal=None, disease='healthy', confidence=0.95):
    return Detection.objects.create(
        user=user, animal=animal,
        predicted_disease=disease,
        confidence=confidence,
        model_used='vit_fold_1',
    )


def make_alert(user, animal=None, severity='warning'):
    return Alert.objects.create(
        user=user, animal=animal,
        title='Test Alert',
        message='Something happened.',
        severity=severity,
    )


# ── Alert model tests ─────────────────────────────────────────────────────────

class AlertModelTests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.animal = make_animal(self.user)

    def test_alert_created_unresolved(self):
        alert = make_alert(self.user)
        self.assertFalse(alert.is_resolved)
        self.assertIsNone(alert.resolved_at)

    def test_alert_str_includes_severity_and_title(self):
        alert = make_alert(self.user, severity='critical')
        self.assertIn('CRITICAL', str(alert))
        self.assertIn('Test Alert', str(alert))

    def test_alert_links_to_animal(self):
        alert = make_alert(self.user, animal=self.animal)
        self.assertEqual(alert.animal, self.animal)

    def test_detection_str(self):
        det = make_detection(self.user, disease='foot-and-mouth', confidence=0.88)
        self.assertIn('foot-and-mouth', str(det))


# ── Alert API tests ───────────────────────────────────────────────────────────

class AlertAPITests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.client.credentials(**auth_header(self.user))
        self.list_url = reverse('api:v1:alert-list-create')

    def test_list_alerts_returns_200(self):
        make_alert(self.user)
        r = self.client.get(self.list_url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_list_requires_auth(self):
        self.client.credentials()
        r = self.client.get(self.list_url)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_alert_returns_201(self):
        r = self.client.post(self.list_url, {
            'title': 'New Alert',
            'message': 'Test message.',
            'severity': 'info',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_retrieve_alert(self):
        alert = make_alert(self.user)
        r = self.client.get(reverse('api:v1:alert-detail', args=[alert.id]))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['title'], 'Test Alert')

    def test_cannot_access_other_users_alert(self):
        other = make_user(username='other', email='other@example.com')
        alert = make_alert(other)
        r = self.client.get(reverse('api:v1:alert-detail', args=[alert.id]))
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_resolve_alert(self):
        alert = make_alert(self.user)
        r = self.client.patch(reverse('api:v1:resolve-alert', args=[alert.id]))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        alert.refresh_from_db()
        self.assertTrue(alert.is_resolved)

    def test_active_alerts_filters_unresolved(self):
        make_alert(self.user, severity='critical')
        resolved = make_alert(self.user, severity='info')
        resolved.is_resolved = True
        resolved.save()
        r = self.client.get(reverse('api:v1:active-alerts'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        results = r.data.get('results', r.data)
        self.assertEqual(len(results), 1)

    def test_user_only_sees_own_alerts(self):
        other = make_user(username='other', email='other@example.com')
        make_alert(self.user)
        make_alert(other)
        r = self.client.get(self.list_url)
        results = r.data.get('results', r.data)
        self.assertEqual(len(results), 1)


# ── Detection history API tests ───────────────────────────────────────────────

class DetectionHistoryAPITests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.client.credentials(**auth_header(self.user))

    def test_detection_history_returns_200(self):
        make_detection(self.user)
        r = self.client.get(reverse('api:v1:detection-history'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_detection_detail_returns_200(self):
        det = make_detection(self.user)
        r = self.client.get(reverse('api:v1:detection-detail', args=[det.id]))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['predicted_disease'], 'healthy')

    def test_cannot_access_other_users_detection(self):
        other = make_user(username='other', email='other@example.com')
        det = make_detection(other)
        r = self.client.get(reverse('api:v1:detection-detail', args=[det.id]))
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_detection_history_requires_auth(self):
        self.client.credentials()
        r = self.client.get(reverse('api:v1:detection-history'))
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Environmental alert API tests ─────────────────────────────────────────────

class EnvironmentalAlertAPITests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.client.credentials(**auth_header(self.user))
        EnvironmentalAlert.objects.create(
            user=self.user,
            title='Heat Stress Risk',
            message='High temperature detected.',
            severity='critical',
            condition_type='heat_stress',
            temperature=40.5,
            humidity=55.0,
            wind_speed=10.0,
            location='Farm',
        )

    def test_environmental_alerts_returns_200(self):
        r = self.client.get(reverse('api:v1:environmental-alerts'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_resolve_environmental_alert(self):
        alert = EnvironmentalAlert.objects.filter(user=self.user).first()
        r = self.client.patch(
            reverse('api:v1:resolve-environmental-alert', args=[alert.id])
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        alert.refresh_from_db()
        self.assertTrue(alert.is_resolved)

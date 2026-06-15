"""
Unit + API tests — Authentication.

Run:
    python manage.py test accounts --settings=LivestockIQ.test_settings -v 2
"""
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

# ── Shared helpers ────────────────────────────────────────────────────────────

VALID_PAYLOAD = {
    'username': 'testuser',
    'email': 'test@example.com',
    'password': 'TestPass@123',
    'password2': 'TestPass@123',
    'first_name': 'Test',
    'last_name': 'User',
}


def make_user(username='testuser', email='test@example.com', password='TestPass@123'):
    return User.objects.create_user(
        username=username, email=email, password=password,
        first_name='Test', last_name='User',
    )


def auth_header(user):
    return {'HTTP_AUTHORIZATION': f'Bearer {RefreshToken.for_user(user).access_token}'}


# ── Registration ──────────────────────────────────────────────────────────────

class RegistrationTests(APITestCase):

    def setUp(self):
        self.url = reverse('api:v1:register')

    def test_valid_registration_returns_201(self):
        r = self.client.post(self.url, VALID_PAYLOAD, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', r.data)
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_duplicate_username_rejected(self):
        make_user()
        r = self.client.post(self.url, {**VALID_PAYLOAD, 'email': 'other@example.com'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_email_rejected(self):
        make_user()
        r = self.client.post(self.url, {**VALID_PAYLOAD, 'username': 'newuser1'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_mismatch_rejected(self):
        r = self.client.post(self.url, {**VALID_PAYLOAD, 'password2': 'Different@1'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_no_uppercase_rejected(self):
        r = self.client.post(self.url, {**VALID_PAYLOAD, 'password': 'nouppercas@1', 'password2': 'nouppercas@1'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_no_special_char_rejected(self):
        r = self.client.post(self.url, {**VALID_PAYLOAD, 'password': 'NoSpecial1', 'password2': 'NoSpecial1'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_username_too_short_rejected(self):
        r = self.client.post(self.url, {**VALID_PAYLOAD, 'username': 'ab'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_username_too_long_rejected(self):
        r = self.client.post(self.url, {**VALID_PAYLOAD, 'username': 'a' * 26}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_username_special_chars_rejected(self):
        r = self.client.post(self.url, {**VALID_PAYLOAD, 'username': 'user name!'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_required_fields_rejected(self):
        r = self.client.post(self.url, {'username': 'testuser'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginTests(APITestCase):

    def setUp(self):
        self.url = reverse('api:v1:login')
        self.user = make_user()

    def test_valid_login_returns_tokens(self):
        r = self.client.post(self.url, {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass@123',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn('access', r.data)
        self.assertIn('refresh', r.data)
        self.assertEqual(r.data['user']['username'], 'testuser')

    def test_wrong_password_rejected(self):
        r = self.client.post(self.url, {
            'username': 'testuser', 'email': 'test@example.com', 'password': 'Wrong@999',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_mismatch_rejected(self):
        r = self.client.post(self.url, {
            'username': 'testuser', 'email': 'wrong@example.com', 'password': 'TestPass@123',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nonexistent_username_rejected(self):
        r = self.client.post(self.url, {
            'username': 'nobody', 'email': 'nobody@example.com', 'password': 'TestPass@123',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_refresh(self):
        refresh = RefreshToken.for_user(self.user)
        r = self.client.post(reverse('api:v1:token-refresh'), {'refresh': str(refresh)}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn('access', r.data)


# ── Profile ───────────────────────────────────────────────────────────────────

class ProfileTests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.client.credentials(**auth_header(self.user))

    def test_get_profile_returns_user_data(self):
        r = self.client.get(reverse('api:v1:user-profile'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['username'], 'testuser')
        self.assertEqual(r.data['email'], 'test@example.com')

    def test_profile_requires_authentication(self):
        self.client.credentials()
        r = self.client.get(reverse('api:v1:user-profile'))
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_profile_succeeds(self):
        r = self.client.put(reverse('api:v1:update-profile'), {
            'first_name': 'Updated', 'last_name': 'Name', 'email': 'test@example.com',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_change_password_with_correct_old_password(self):
        r = self.client.post(reverse('api:v1:change-password'), {
            'old_password': 'TestPass@123',
            'new_password': 'NewPass@456',
            'new_password2': 'NewPass@456',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPass@456'))

    def test_change_password_wrong_old_password_rejected(self):
        r = self.client.post(reverse('api:v1:change-password'), {
            'old_password': 'BadOld@999',
            'new_password': 'NewPass@456',
            'new_password2': 'NewPass@456',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_mismatch_rejected(self):
        r = self.client.post(reverse('api:v1:change-password'), {
            'old_password': 'TestPass@123',
            'new_password': 'NewPass@456',
            'new_password2': 'Different@789',
        }, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardTests(APITestCase):

    def setUp(self):
        self.user = make_user()
        self.client.credentials(**auth_header(self.user))

    def test_dashboard_returns_200(self):
        r = self.client.get(reverse('api:v1:dashboard-stats'))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_dashboard_requires_authentication(self):
        self.client.credentials()
        r = self.client.get(reverse('api:v1:dashboard-stats'))
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

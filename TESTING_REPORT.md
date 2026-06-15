# LivestockIQ — Test Suite Report

---

## 1. Overview

| Layer | Framework | Test Count | Coverage Target |
|---|---|---|---|
| Backend Unit / Model | Django TestCase | 45+ | Models, serializers, helpers |
| Backend API (module) | DRF APITestCase | 60+ | All REST endpoints |
| AI Service Module | Python unittest + mock | 14 | OCR parsing, model wrappers |
| Frontend Unit (JS) | Vitest + Testing Library | 20+ | API clients, utility functions |
| Frontend Component | Vitest + Testing Library | 8 | StatCard, UI primitives |
| E2E (Selenium/Playwright) | Playwright | 25+ | Full user flows, navigation |

---

## 2. Files Created

### Backend — `LivestockIQ/`

| File | Purpose |
|---|---|
| `LivestockIQ/test_settings.py` | SQLite in-memory DB, faster password hashing, console email, temp MEDIA_ROOT |
| `accounts/tests.py` | Registration validation, login, token refresh, profile CRUD, password change |
| `animals/tests.py` | system_id auto-assignment, animal CRUD, search, statistics, mortality records |
| `farms/tests.py` | Farm model, CRUD endpoints, ownership isolation |
| `health/tests.py` | Vaccination schedules (create/complete/upcoming/overdue), vaccine dataset, lameness model |
| `alerts/tests.py` | Alert lifecycle, resolve flow, detection history, environmental alerts |
| `costs/tests.py` | Transaction CRUD, amount validation, summary/report/breakdown endpoints |
| `ai_service/tests.py` | `parse_animal_id` unit tests, CowDetector singleton, LamenessDetector (mocked) |

### Frontend — `frontend/`

| File | Purpose |
|---|---|
| `vite.config.js` | Added `test:` block — jsdom environment, JUnit reporter, v8 coverage |
| `package.json` | Added vitest, @testing-library/react, msw, @vitest/coverage-v8, jsdom |
| `src/tests/setup.js` | Global test setup: localStorage mock, MSW server lifecycle |
| `src/tests/mocks/handlers.js` | MSW request handlers — mocks all API endpoints |
| `src/tests/mocks/server.js` | MSW Node server factory |
| `src/tests/api/auth.test.js` | authAPI: register, login, getProfile, getDashboardStats |
| `src/tests/api/animals.test.js` | animalsAPI: getAll, getById, create |
| `src/tests/components/StatCard.test.jsx` | StatCard renders title/value/trend/color correctly |
| `src/tests/utils/constants.test.js` | ANIMAL_TYPES, ANIMAL_TYPE_OPTIONS, STORAGE_KEYS |
| `playwright.config.js` | Chromium + Firefox, JUnit + HTML reporter, auto-start Vite dev server |
| `tests/e2e/auth.spec.js` | Login form, registration form, protected route redirect |
| `tests/e2e/animals.spec.js` | Animals list, add animal form, animal detail |
| `tests/e2e/dashboard.spec.js` | Dashboard stats, sidebar navigation, AI detection page, profile |

---

## 3. How to Run

### Backend Tests

```bash
cd LivestockIQ

# All tests
python manage.py test --settings=LivestockIQ.test_settings -v 2

# Specific app
python manage.py test accounts  --settings=LivestockIQ.test_settings -v 2
python manage.py test animals   --settings=LivestockIQ.test_settings -v 2
python manage.py test farms     --settings=LivestockIQ.test_settings -v 2
python manage.py test health    --settings=LivestockIQ.test_settings -v 2
python manage.py test alerts    --settings=LivestockIQ.test_settings -v 2
python manage.py test costs     --settings=LivestockIQ.test_settings -v 2
python manage.py test ai_service --settings=LivestockIQ.test_settings -v 2
```

### Frontend Unit / Component Tests (Vitest)

```bash
cd frontend

# Install dependencies first
npm install

# Run all unit tests once (outputs JUnit XML to test-results/junit.xml)
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# Run with code coverage report
npm run test:coverage
# Coverage HTML report: test-results/coverage/index.html
```

### E2E Tests (Playwright)

```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests (Vite dev server starts automatically)
# ⚠️ Requires Django backend running at http://localhost:8000
# ⚠️ Requires a test user 'testuser' / 'TestPass@123' in the database
npx playwright test

# Run specific spec file
npx playwright test tests/e2e/auth.spec.js
npx playwright test tests/e2e/animals.spec.js
npx playwright test tests/e2e/dashboard.spec.js

# With headed browser (see what Playwright does)
npx playwright test --headed

# View HTML test report
npx playwright show-report test-results/playwright-report
```

---

## 4. Test Reports

### JUnit XML (for CI systems — Jenkins, GitHub Actions, GitLab CI)

| Report | Location |
|---|---|
| Frontend unit tests | `frontend/test-results/junit.xml` |
| E2E Playwright tests | `frontend/test-results/e2e-junit.xml` |

### HTML Reports

| Report | Command | Location |
|---|---|---|
| Coverage (Vitest) | `npm run test:coverage` | `test-results/coverage/index.html` |
| E2E (Playwright) | `npx playwright show-report` | `test-results/playwright-report/index.html` |

---

## 5. Test Architecture Decisions

### Why SQLite for backend tests?
The project uses MySQL in production. Django test settings override the DB to SQLite `:memory:` so tests run without any external database process. This makes tests portable and fast (no connection overhead).

### Why MSW (Mock Service Worker) for frontend?
MSW intercepts HTTP at the network level — the real axios client code runs unchanged, making tests realistic. No axios mocking, no manual `vi.mock()` per test.

### Why mock the AI models?
`best_lameness_model.pth` and `livestock_disease_v2.pth` are 330 MB each. Loading them in every test run would take 30–60 seconds and require a GPU. We mock `torch.load` and the model's forward pass to test the surrounding logic (input preprocessing, output parsing, result dict structure) in milliseconds.

### Why `parse_animal_id` is not mocked
It is pure Python with no external dependencies — no file I/O, no model loading. It is the highest-confidence unit to test without mocking and covers 13 distinct patterns and hallucination guards.

---

## 6. Test Cases — Summary Table

### accounts/tests.py

| Test | Description |
|---|---|
| `test_valid_registration_returns_201` | Happy-path registration |
| `test_duplicate_username_rejected` | Username uniqueness enforced |
| `test_duplicate_email_rejected` | Email uniqueness enforced |
| `test_password_mismatch_rejected` | Password confirmation check |
| `test_password_no_uppercase_rejected` | Password policy — uppercase required |
| `test_password_no_special_char_rejected` | Password policy — special char required |
| `test_username_too_short_rejected` | Username 5-char minimum |
| `test_username_too_long_rejected` | Username 25-char maximum |
| `test_username_special_chars_rejected` | Username alphanumeric-only rule |
| `test_missing_required_fields_rejected` | Missing fields return 400 |
| `test_valid_login_returns_tokens` | Login returns JWT access + refresh |
| `test_wrong_password_rejected` | Bad password returns 400 |
| `test_email_mismatch_rejected` | Email must match username record |
| `test_nonexistent_username_rejected` | Unknown username returns 400 |
| `test_token_refresh` | Refresh token produces new access token |
| `test_get_profile_returns_user_data` | Profile contains username + email |
| `test_profile_requires_authentication` | Unauthenticated → 401 |
| `test_update_profile_succeeds` | Profile fields can be updated |
| `test_change_password_with_correct_old_password` | Password change with valid old password |
| `test_change_password_wrong_old_password_rejected` | Wrong old password → 400 |
| `test_change_password_mismatch_rejected` | New password mismatch → 400 |
| `test_dashboard_returns_200` | Dashboard stats endpoint returns OK |
| `test_dashboard_requires_authentication` | Unauthenticated → 401 |

### animals/tests.py

| Test | Description |
|---|---|
| `test_system_id_auto_assigned_on_first_animal` | First animal gets system_id = 1 |
| `test_system_id_increments_per_user` | Second animal gets system_id = 2 |
| `test_system_id_is_per_user_not_global` | Each user has independent counter |
| `test_animal_default_is_healthy` | New animals are healthy by default |
| `test_list_animals_returns_200` | Authenticated list returns OK |
| `test_create_animal_returns_201` | Valid create returns 201 |
| `test_create_animal_missing_type_rejected` | Missing animal_type → 400 |
| `test_user_only_sees_own_animals` | Data isolation between users |
| `test_retrieve_own_animal` | Can get own animal detail |
| `test_cannot_retrieve_other_users_animal` | 404 for other user's animal |
| `test_update_animal` | PATCH tag_id succeeds |
| `test_delete_animal` | DELETE returns 204 and removes record |
| `test_statistics_endpoint_returns_200` | Stats endpoint works |
| `test_create_mortality_record` | Mortality record creation |
| `test_invalid_cause_of_death_rejected` | Invalid enum choice → 400 |

### farms/tests.py

| Test | Description |
|---|---|
| `test_create_farm_returns_201` | Happy-path farm creation |
| `test_create_farm_missing_name_rejected` | Missing name → 400 |
| `test_list_returns_own_farms_only` | User isolation |
| `test_retrieve_own_farm` | Can get own farm |
| `test_cannot_retrieve_other_users_farm` | 404 for other user's farm |
| `test_update_farm_name` | PATCH name succeeds |
| `test_delete_farm` | DELETE returns 204 |
| `test_delete_other_users_farm_returns_404` | Cannot delete other user's farm |

### health/tests.py

| Test | Description |
|---|---|
| `test_create_schedule_returns_201` | Schedule creation happy path |
| `test_mark_schedule_complete` | Complete action sets is_completed = True |
| `test_mark_already_completed_schedule_returns_400` | Double-complete → 400 |
| `test_upcoming_schedules_endpoint` | Upcoming filter returns future-only |
| `test_overdue_schedules_endpoint` | Overdue filter returns past-only |
| `test_filter_by_species` | Vaccine by_species filter works |
| `test_detection_defaults` | LamenessDetection default values |
| `test_lameness_history_endpoint` | History endpoint returns OK |

### alerts/tests.py

| Test | Description |
|---|---|
| `test_create_alert_returns_201` | Alert creation |
| `test_resolve_alert` | Resolve marks is_resolved = True |
| `test_active_alerts_filters_unresolved` | Active endpoint excludes resolved |
| `test_user_only_sees_own_alerts` | User isolation |
| `test_detection_history_requires_auth` | 401 without token |
| `test_resolve_environmental_alert` | Environmental alert resolve |

### costs/tests.py

| Test | Description |
|---|---|
| `test_create_expense_returns_201` | Expense creation |
| `test_create_revenue_returns_201` | Revenue creation |
| `test_create_invalid_type_rejected` | Invalid type enum → 400 |
| `test_create_negative_amount_rejected` | Negative amount → 400 |
| `test_update_transaction_amount` | PATCH amount |
| `test_summary_returns_200` | Summary endpoint works |
| `test_report_returns_200` | Report endpoint works |
| `test_breakdown_returns_200` | Breakdown endpoint works |

### ai_service/tests.py

| Test | Description |
|---|---|
| `test_explicit_id_label` | `ID: 42` → 42 |
| `test_tag_label` | `Tag: A-042` → 42 |
| `test_bare_number` | `907` → 907 |
| `test_empty_string_returns_none` | Empty → None |
| `test_hallucination_all_same_digits_rejected` | `1111` → None |
| `test_hallucination_ascending_sequence_rejected` | `1234` → None |
| `test_hallucination_descending_sequence_rejected` | `4321` → None |
| `test_classes_are_normal_and_lameness` | Model class labels correct |
| `test_n_frames_is_20` | 20 frames per video |
| `test_livestock_vit_lstm_architecture` | FC layer output = 2 classes |

---

## 7. E2E Test Setup for Selenium (Alternative)

If you prefer Selenium over Playwright, the same scenarios can be run with:

```bash
pip install selenium webdriver-manager pytest-selenium

# pytest.ini
[pytest]
addopts = --browser=chrome --base-url=http://localhost:5173
```

Equivalent Selenium test structure:

```python
# tests/selenium/test_auth.py
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestLoginSelenium:
    def test_valid_login(self, selenium, base_url):
        selenium.get(f"{base_url}/login")
        WebDriverWait(selenium, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name='username']"))
        )
        selenium.find_element(By.CSS_SELECTOR, "input[name='username']").send_keys("testuser")
        selenium.find_element(By.CSS_SELECTOR, "input[name='email']").send_keys("test@example.com")
        selenium.find_element(By.CSS_SELECTOR, "input[name='password']").send_keys("TestPass@123")
        selenium.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        WebDriverWait(selenium, 10).until(EC.url_contains("dashboard"))
        assert "dashboard" in selenium.current_url
```

**Recommendation**: Use Playwright over Selenium for this project because:
- Auto-waits on all assertions (no manual WebDriverWait)
- Built-in JUnit reporter
- Cross-browser (Chromium + Firefox + WebKit) in one command
- Faster and more stable on CI

---

## 8. CI Integration (GitHub Actions example)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.10' }
      - run: pip install -r LivestockIQ/requirements.txt
      - run: |
          cd LivestockIQ
          python manage.py test --settings=LivestockIQ.test_settings -v 2

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci
      - run: cd frontend && npm test
      - uses: actions/upload-artifact@v4
        with:
          name: junit-report
          path: frontend/test-results/junit.xml

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npx playwright install --with-deps
      - run: |
          # Start Django backend
          pip install -r LivestockIQ/requirements.txt
          cd LivestockIQ && python manage.py runserver &
          sleep 5
          cd ../frontend && npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: frontend/test-results/playwright-report
```

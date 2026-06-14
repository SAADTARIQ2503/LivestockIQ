import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:8000/api/v1';

export const handlers = [
  // ── Auth ────────────────────────────────────────────────────────────────────
  http.post(`${BASE}/auth/register/`, () =>
    HttpResponse.json({ message: 'User created successfully! Please sign in.' }, { status: 201 })
  ),

  http.post(`${BASE}/auth/login/`, async ({ request }) => {
    const body = await request.json();
    if (body.username === 'testuser' && body.password === 'TestPass@123') {
      return HttpResponse.json({
        access: 'fake-access-token',
        refresh: 'fake-refresh-token',
        user: { id: 1, username: 'testuser', email: 'test@example.com',
                first_name: 'Test', last_name: 'User' },
      });
    }
    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 400 });
  }),

  http.get(`${BASE}/auth/user/`, () =>
    HttpResponse.json({ id: 1, username: 'testuser', email: 'test@example.com',
                        first_name: 'Test', last_name: 'User' })
  ),

  http.get(`${BASE}/auth/dashboard/`, () =>
    HttpResponse.json({
      total_animals: 10, healthy_animals: 8, unhealthy_animals: 2,
      total_farms: 2, recent_alerts: 3,
    })
  ),

  // ── Animals ──────────────────────────────────────────────────────────────────
  http.get(`${BASE}/animals/`, () =>
    HttpResponse.json({
      count: 2,
      results: [
        { id: 1, system_id: 1, tag_id: 'A-01', animal_type: 'Cow',
          age: '2 years', sex: 'Female', is_healthy: true },
        { id: 2, system_id: 2, tag_id: 'A-02', animal_type: 'Goat',
          age: '1 year', sex: 'Male', is_healthy: false },
      ],
    })
  ),

  http.post(`${BASE}/animals/`, () =>
    HttpResponse.json(
      { id: 3, system_id: 3, animal_type: 'Sheep', age: '6 months', sex: 'Female', is_healthy: true },
      { status: 201 }
    )
  ),

  http.get(`${BASE}/animals/:id/`, ({ params }) =>
    HttpResponse.json({
      id: Number(params.id), system_id: 1, animal_type: 'Cow',
      age: '2 years', sex: 'Female', is_healthy: true,
    })
  ),

  // ── Farms ────────────────────────────────────────────────────────────────────
  http.get(`${BASE}/farms/`, () =>
    HttpResponse.json({
      count: 1,
      results: [{ id: 1, name: 'Green Acres', address: '45 Rural Lane' }],
    })
  ),

  // ── Alerts ───────────────────────────────────────────────────────────────────
  http.get(`${BASE}/alerts/`, () =>
    HttpResponse.json({
      count: 1,
      results: [{ id: 1, title: 'Heat Alert', severity: 'critical', is_resolved: false }],
    })
  ),

  // ── Costs ────────────────────────────────────────────────────────────────────
  http.get(`${BASE}/costs/summary/`, () =>
    HttpResponse.json({ total_expenses: 5000, total_revenue: 8000, net_profit: 3000 })
  ),

  // ── Health ───────────────────────────────────────────────────────────────────
  http.get(`${BASE}/health/schedules/`, () =>
    HttpResponse.json({ count: 0, results: [] })
  ),

  http.get(`${BASE}/health/lameness/history/`, () =>
    HttpResponse.json([])
  ),
];

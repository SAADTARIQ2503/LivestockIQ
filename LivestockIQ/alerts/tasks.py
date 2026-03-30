"""
Celery periodic tasks for the alerts app.

Registered in settings.CELERY_BEAT_SCHEDULE:
  - check_vaccination_schedules  → daily at 08:00 UTC
  - check_environmental_conditions → every hour on the hour
"""

import os
import requests
from datetime import timedelta, date

from celery import shared_task
from django.utils import timezone
from django.conf import settings


@shared_task
def check_vaccination_schedules():
    """
    Daily task: scan VaccinationSchedule for overdue and upcoming (≤7 days)
    entries, create VaccinationAlert records, send email, and ping the system.
    Skips schedules that already have an active (unresolved) alert of the same type.
    """
    from health.models import VaccinationSchedule
    from alerts.models import VaccinationAlert

    today = date.today()
    upcoming_cutoff = today + timedelta(days=7)
    stats = {'overdue': 0, 'upcoming': 0}

    # ── Overdue ──────────────────────────────────────────────────────────────
    overdue_qs = VaccinationSchedule.objects.filter(
        is_completed=False,
        schedule_date__lt=today,
        animal__isnull=False,
    ).select_related('animal__user')

    for schedule in overdue_qs:
        user = schedule.animal.user
        if not user:
            continue
        if VaccinationAlert.objects.filter(
            schedule=schedule, alert_type='overdue', is_resolved=False
        ).exists():
            continue

        days_overdue = (today - schedule.schedule_date).days
        alert = VaccinationAlert.objects.create(
            user=user,
            title=f"Overdue Vaccination: {schedule.vaccine_name}",
            message=(
                f"Vaccination '{schedule.vaccine_name}' for animal #{schedule.animal_id} "
                f"was due {days_overdue} day(s) ago on {schedule.schedule_date}. "
                f"Please administer as soon as possible."
            ),
            severity='critical' if days_overdue > 7 else 'warning',
            schedule=schedule,
            alert_type='overdue',
            days_until_due=-days_overdue,
        )
        alert.send_email_notification()
        alert.ping_system()
        stats['overdue'] += 1

    # ── Upcoming (within 7 days) ──────────────────────────────────────────────
    upcoming_qs = VaccinationSchedule.objects.filter(
        is_completed=False,
        schedule_date__gte=today,
        schedule_date__lte=upcoming_cutoff,
        animal__isnull=False,
    ).select_related('animal__user')

    for schedule in upcoming_qs:
        user = schedule.animal.user
        if not user:
            continue

        days_until = (schedule.schedule_date - today).days
        alert_type = 'due_today' if days_until == 0 else 'upcoming'

        if VaccinationAlert.objects.filter(
            schedule=schedule, alert_type=alert_type, is_resolved=False
        ).exists():
            continue

        alert = VaccinationAlert.objects.create(
            user=user,
            title=f"Upcoming Vaccination: {schedule.vaccine_name}",
            message=(
                f"Vaccination '{schedule.vaccine_name}' for animal #{schedule.animal_id} "
                f"is due {'today' if days_until == 0 else f'in {days_until} day(s) on {schedule.schedule_date}'}."
            ),
            severity='warning' if days_until <= 3 else 'info',
            schedule=schedule,
            alert_type=alert_type,
            days_until_due=days_until,
        )
        alert.send_email_notification()
        alert.ping_system()
        stats['upcoming'] += 1

    return stats


@shared_task
def check_environmental_conditions():
    """
    Hourly task: fetch current weather for the farm location and create
    EnvironmentalAlert records for any extreme conditions (heat, cold,
    humidity, wind).  De-duplicates within a 6-hour window per user
    per condition type.  Sends email + pings system for each new alert.
    """
    from alerts.models import EnvironmentalAlert
    from django.contrib.auth import get_user_model

    User = get_user_model()
    api_key = settings.API_KEYS.get('OPENWEATHERMAP')
    if not api_key:
        return {'error': 'OPENWEATHERMAP_KEY not configured'}

    lat      = float(os.environ.get('FARM_LATITUDE',  '31.4273'))
    lon      = float(os.environ.get('FARM_LONGITUDE', '73.1166'))
    location = os.environ.get('FARM_LOCATION_NAME', 'Farm')

    try:
        resp = requests.get(
            f"http://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}&lon={lon}&units=metric&appid={api_key}",
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        return {'error': str(e)}

    temp     = data['main']['temp']
    humidity = data['main']['humidity']
    wind_kmh = data['wind']['speed'] * 3.6   # convert m/s → km/h

    CONDITIONS = [
        (temp > 38,      'heat_stress',   'critical', 'Heat Stress Risk',
         f'Temperature is {temp:.1f}°C. Ensure adequate water and shade for livestock.'),
        (temp < 5,       'cold_stress',   'warning',  'Cold Stress Risk',
         f'Temperature is {temp:.1f}°C. Provide extra bedding and shelter.'),
        (humidity > 80,  'high_humidity', 'warning',  'High Humidity Alert',
         f'Humidity is {humidity}%. Monitor for respiratory issues and ensure ventilation.'),
        (wind_kmh > 15,  'strong_wind',   'info',     'Strong Winds',
         f'Wind speed is {wind_kmh:.1f} km/h. Secure loose structures and move animals to shelter.'),
    ]

    dedup_cutoff = timezone.now() - timedelta(hours=6)
    active_users = User.objects.filter(is_active=True)
    created = 0

    for triggered, cond_type, severity, title, message in CONDITIONS:
        if not triggered:
            continue
        for user in active_users:
            if EnvironmentalAlert.objects.filter(
                user=user,
                condition_type=cond_type,
                is_resolved=False,
                created_at__gte=dedup_cutoff,
            ).exists():
                continue

            alert = EnvironmentalAlert.objects.create(
                user=user,
                title=title,
                message=message,
                severity=severity,
                condition_type=cond_type,
                temperature=temp,
                humidity=humidity,
                wind_speed=wind_kmh,
                location=location,
            )
            alert.send_email_notification()
            alert.ping_system()
            created += 1

    return {
        'alerts_created': created,
        'temp': temp,
        'humidity': humidity,
        'wind_kmh': round(wind_kmh, 1),
    }

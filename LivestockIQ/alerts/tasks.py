"""
Celery periodic tasks for the alerts app.

Registered in settings.CELERY_BEAT_SCHEDULE:
  - check_vaccination_schedules  → daily at 08:00 UTC
  - check_environmental_conditions → every hour on the hour
"""

import os
import shutil
import requests
from concurrent.futures import ThreadPoolExecutor
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


# ─────────────────────────────────────────────────────────────────────────────
# Image / video file extensions the scanner will pick up
# ─────────────────────────────────────────────────────────────────────────────
_IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
_VIDEO_EXTS = {'.mp4', '.avi', '.mov', '.mkv', '.webm', '.m4v', '.3gp'}


def _get_system_user():
    """Return the first superuser (or first active user) for auto-scan records."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.filter(is_superuser=True, is_active=True).order_by('id').first()
    if user is None:
        user = User.objects.filter(is_active=True).order_by('id').first()
    return user


def _ocr_image_file(file_path: str) -> str:
    """Run GOT-OCR-2.0 on an image file. Returns text or '' on failure."""
    try:
        from PIL import Image
        from ai_service.ocr_service import GotOCRService
        pil = Image.open(file_path).convert('RGB')
        return GotOCRService.get_instance().ocr_image(pil)
    except Exception:
        return ''


def _ocr_video_file(file_path: str) -> str:
    """Run GOT-OCR-2.0 on key frames of a video. Returns text or '' on failure."""
    try:
        from ai_service.ocr_service import GotOCRService
        return GotOCRService.get_instance().ocr_video_frames(file_path, n_frames=3)
    except Exception:
        return ''


def _find_animal_by_ocr_id(ocr_text: str):
    """
    Parse an animal ID from OCR text and look it up across all animals.
    Returns the Animal instance or None.
    """
    from ai_service.ocr_service import GotOCRService
    from animals.models import Animal
    animal_id = GotOCRService.parse_animal_id(ocr_text)
    if animal_id is None:
        return None
    # Try tag_id (farmer's physical mark) first, then system_id
    return (
        Animal.objects.filter(tag_id=str(animal_id)).first()
        or Animal.objects.filter(system_id=animal_id).first()
    )


def _mark_animal_unhealthy(animal) -> None:
    """Set is_healthy=False on the given Animal instance if it exists."""
    if animal is None:
        return
    if animal.is_healthy:
        animal.is_healthy = False
        animal.save(update_fields=['is_healthy'])


def _copy_to_output(src_path, output_root, subfolder):
    """
    Copy *src_path* into *output_root/<today>/<subfolder>/* preserving the
    original filename.  Returns the destination path string.
    """
    today_str = date.today().isoformat()          # e.g. "2026-04-04"
    dest_dir  = os.path.join(output_root, today_str, subfolder)
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, os.path.basename(src_path))
    # Avoid clobbering an existing file with the same name
    if os.path.exists(dest_path):
        base, ext = os.path.splitext(os.path.basename(src_path))
        dest_path = os.path.join(dest_dir, f"{base}_{int(timezone.now().timestamp())}{ext}")
    shutil.copy2(src_path, dest_path)
    return dest_path


def _already_scanned(file_path, file_mtime):
    """True if an AutoScanLog row exists for this exact path + mtime."""
    from alerts.models import AutoScanLog
    return AutoScanLog.objects.filter(file_path=file_path, file_mtime=file_mtime).exists()


def _scan_image(file_path, system_user, output_root, threshold, stats):
    """
    Run DiseaseDetector + GOT-OCR-2.0 in parallel on one image.
    OCR result is used to identify the animal by its brand ID.
    Creates Detection (with image attached) + HealthAlert + AutoScanLog.
    Copies the file to the output folder if a disease is detected.
    """
    from django.core.files import File
    from alerts.models import AutoScanLog, HealthAlert, Detection

    file_mtime = os.path.getmtime(file_path)
    file_size  = os.path.getsize(file_path)

    if _already_scanned(file_path, file_mtime):
        stats['skipped'] += 1
        return

    log_kwargs = dict(
        file_path=file_path,
        file_mtime=file_mtime,
        file_size=file_size,
        file_type='image',
    )

    # Run disease detection + OCR in parallel
    try:
        from ai_service.disease_detector import DiseaseDetector
        model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'livestock_disease_v2.pth')
        detector = DiseaseDetector(model_path)

        with ThreadPoolExecutor(max_workers=2) as pool:
            det_future = pool.submit(detector.predict, file_path)
            ocr_future = pool.submit(_ocr_image_file, file_path)
            result   = det_future.result()
            ocr_text = ocr_future.result(timeout=180)
    except Exception as e:
        AutoScanLog.objects.get_or_create(
            file_path=file_path, file_mtime=file_mtime,
            defaults={**log_kwargs, 'predicted_result': f'error: {e}'},
        )
        stats['errors'] += 1
        return

    disease    = result.get('disease', 'unknown')
    confidence = result.get('confidence', 0.0)
    is_disease = disease not in ('healthy', 'not_cow') and confidence >= threshold

    # Resolve animal from OCR brand ID
    animal = _find_animal_by_ocr_id(ocr_text)

    output_path = ''
    detection   = None

    if is_disease:
        output_path = _copy_to_output(file_path, output_root, 'disease')

        # Create Detection record and attach the image file
        detection = Detection(
            user=system_user,
            animal=animal,
            predicted_disease=disease,
            confidence=confidence,
            all_probabilities=result.get('all_probabilities'),
            processing_time=result.get('processing_time'),
            model_used=result.get('model_used', 'vit'),
        )
        with open(file_path, 'rb') as f:
            detection.image.save(os.path.basename(file_path), File(f), save=False)
        detection.save()

        # Mark the identified animal as unhealthy
        _mark_animal_unhealthy(animal)

        # Build a human-readable animal reference for the alert message
        animal_ref = (
            f" Animal #{animal.tag_id or animal.system_id}" if animal else ""
        )

        # Create a HealthAlert for every active user
        from django.contrib.auth import get_user_model
        for user in get_user_model().objects.filter(is_active=True):
            ha = HealthAlert.objects.create(
                user=user,
                title=f"Auto-Scan: {disease.replace('-', ' ').title()} Detected{animal_ref}",
                message=(
                    f"Disease '{disease}' detected with {confidence:.0%} confidence "
                    f"in '{os.path.basename(file_path)}'.{animal_ref} has been marked as not healthy. "
                    f"The file has been saved to the output folder for review."
                ),
                severity='critical' if confidence >= 0.80 else 'warning',
                alert_type='disease',
                detection=detection,
                animal=animal,
            )
            ha.send_email_notification()
            ha.ping_system()

        stats['detected'] += 1
    else:
        stats['clean'] += 1

    AutoScanLog.objects.get_or_create(
        file_path=file_path, file_mtime=file_mtime,
        defaults={
            **log_kwargs,
            'detection_found': is_disease,
            'predicted_result': disease,
            'confidence': confidence,
            'output_path': output_path,
            'detection': detection,
        },
    )


def _scan_video(file_path, system_user, output_root, threshold, stats):
    """
    Run LamenessDetector + GOT-OCR-2.0 in parallel on one video.
    OCR result is used to identify the animal by its brand ID.
    Creates a LamenessDetection + HealthAlert + AutoScanLog.
    Copies the file to the output folder if lameness is detected.
    """
    from alerts.models import AutoScanLog, HealthAlert
    from health.models import LamenessDetection

    file_mtime = os.path.getmtime(file_path)
    file_size  = os.path.getsize(file_path)

    if _already_scanned(file_path, file_mtime):
        stats['skipped'] += 1
        return

    log_kwargs = dict(
        file_path=file_path,
        file_mtime=file_mtime,
        file_size=file_size,
        file_type='video',
    )

    # Run lameness detection + OCR in parallel
    try:
        from ai_service.model_registry import get_lameness_detector
        detector = get_lameness_detector()

        with ThreadPoolExecutor(max_workers=2) as pool:
            det_future = pool.submit(detector.predict, file_path)
            ocr_future = pool.submit(_ocr_video_file, file_path)
            result   = det_future.result()
            ocr_text = ocr_future.result(timeout=180)
    except Exception as e:
        AutoScanLog.objects.get_or_create(
            file_path=file_path, file_mtime=file_mtime,
            defaults={**log_kwargs, 'predicted_result': f'error: {e}'},
        )
        stats['errors'] += 1
        return

    label      = result.get('disease', 'unknown')    # 'normal' | 'lameness'
    confidence = result.get('confidence', 0.0)
    is_lame    = label == 'lameness' and confidence >= threshold

    # Resolve animal from OCR brand ID
    animal = _find_animal_by_ocr_id(ocr_text)

    output_path  = ''
    lameness_rec = None

    if is_lame:
        output_path = _copy_to_output(file_path, output_root, 'lameness')

        # Create LamenessDetection record and attach the video file
        from django.core.files import File
        lameness_rec = LamenessDetection(
            user=system_user,
            animal=animal,
            predicted_result=label,
            confidence=confidence,
            all_probabilities=result.get('all_probabilities'),
            processing_time=result.get('processing_time'),
            frames_sampled=result.get('frames_sampled') or 20,
        )
        with open(file_path, 'rb') as f:
            lameness_rec.video.save(os.path.basename(file_path), File(f), save=False)
        lameness_rec.save()

        # Mark the identified animal as unhealthy
        _mark_animal_unhealthy(animal)

        animal_ref = (
            f" Animal #{animal.tag_id or animal.system_id}" if animal else ""
        )

        from django.contrib.auth import get_user_model
        for user in get_user_model().objects.filter(is_active=True):
            ha = HealthAlert.objects.create(
                user=user,
                title=f"Auto-Scan: Lameness Detected{animal_ref}",
                message=(
                    f"Lameness detected with {confidence:.0%} confidence "
                    f"in video '{os.path.basename(file_path)}'.{animal_ref} has been marked as not healthy. "
                    f"The file has been saved to the output folder for review."
                ),
                severity='critical' if confidence >= 0.80 else 'warning',
                alert_type='lameness',
                lameness_detection=lameness_rec,
                animal=animal,
            )
            ha.send_email_notification()
            ha.ping_system()

        stats['detected'] += 1
    else:
        stats['clean'] += 1

    AutoScanLog.objects.get_or_create(
        file_path=file_path, file_mtime=file_mtime,
        defaults={
            **log_kwargs,
            'detection_found': is_lame,
            'predicted_result': label,
            'confidence': confidence,
            'output_path': output_path,
            'lameness_detection': lameness_rec,
        },
    )


@shared_task
def auto_scan_folders():
    """
    Periodic task (every 15 min by default) that scans two input folders:
      - AUTO_SCAN_INPUT_IMAGES → runs DiseaseDetector on each image
      - AUTO_SCAN_INPUT_VIDEOS → runs LamenessDetector on each video

    Files already scanned (same path + mtime) are skipped.
    If a disease or lameness is detected above the confidence threshold:
      - The file is copied to AUTO_SCAN_OUTPUT_DIR/<date>/<disease|lameness>/
      - A Detection / LamenessDetection record is created
      - A HealthAlert is created for every active user + email sent + system pinged

    Returns a stats dict summarising this run.
    """
    images_dir  = getattr(settings, 'AUTO_SCAN_INPUT_IMAGES',       '')
    videos_dir  = getattr(settings, 'AUTO_SCAN_INPUT_VIDEOS',       '')
    output_root = getattr(settings, 'AUTO_SCAN_OUTPUT_DIR',         '')
    dis_thresh  = getattr(settings, 'AUTO_SCAN_DISEASE_THRESHOLD',  0.60)
    lam_thresh  = getattr(settings, 'AUTO_SCAN_LAMENESS_THRESHOLD', 0.60)

    # Ensure input directories exist (create them if needed)
    for d in (images_dir, videos_dir, output_root):
        if d:
            os.makedirs(d, exist_ok=True)

    system_user = _get_system_user()
    if system_user is None:
        return {'error': 'No active user found — cannot create records'}

    stats = {'images_scanned': 0, 'videos_scanned': 0,
             'detected': 0, 'clean': 0, 'skipped': 0, 'errors': 0}

    # ── Scan images ──────────────────────────────────────────────────────────
    if images_dir and os.path.isdir(images_dir):
        for fname in os.listdir(images_dir):
            ext = os.path.splitext(fname)[1].lower()
            if ext not in _IMAGE_EXTS:
                continue
            full_path = os.path.join(images_dir, fname)
            if not os.path.isfile(full_path):
                continue
            stats['images_scanned'] += 1
            _scan_image(full_path, system_user, output_root, dis_thresh, stats)

    # ── Scan videos ──────────────────────────────────────────────────────────
    if videos_dir and os.path.isdir(videos_dir):
        for fname in os.listdir(videos_dir):
            ext = os.path.splitext(fname)[1].lower()
            if ext not in _VIDEO_EXTS:
                continue
            full_path = os.path.join(videos_dir, fname)
            if not os.path.isfile(full_path):
                continue
            stats['videos_scanned'] += 1
            _scan_video(full_path, system_user, output_root, lam_thresh, stats)

    return stats

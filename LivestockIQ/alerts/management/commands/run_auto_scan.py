"""
Management command: run_auto_scan

Usage:
    python manage.py run_auto_scan
    python manage.py run_auto_scan --disease-threshold 0.75
    python manage.py run_auto_scan --lameness-threshold 0.70
    python manage.py run_auto_scan --disease-threshold 0.75 --lameness-threshold 0.70

Runs the auto_scan_folders task synchronously and prints a formatted summary.
"""

from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Scan input folders for disease and lameness detections'

    def add_arguments(self, parser):
        parser.add_argument(
            '--disease-threshold', type=float, default=None,
            help='Minimum confidence to flag a disease detection (0.0–1.0). '
                 f'Default: {getattr(settings, "AUTO_SCAN_DISEASE_THRESHOLD", 0.60)}'
        )
        parser.add_argument(
            '--lameness-threshold', type=float, default=None,
            help='Minimum confidence to flag a lameness detection (0.0–1.0). '
                 f'Default: {getattr(settings, "AUTO_SCAN_LAMENESS_THRESHOLD", 0.60)}'
        )

    def handle(self, *args, **options):
        # Override thresholds at runtime if passed
        if options['disease_threshold'] is not None:
            settings.AUTO_SCAN_DISEASE_THRESHOLD = options['disease_threshold']
        if options['lameness_threshold'] is not None:
            settings.AUTO_SCAN_LAMENESS_THRESHOLD = options['lameness_threshold']

        self.stdout.write('\n' + '─' * 50)
        self.stdout.write(self.style.MIGRATE_HEADING('  LivestockIQ Auto-Scan'))
        self.stdout.write('─' * 50)
        self.stdout.write(f"  Images folder : {getattr(settings, 'AUTO_SCAN_INPUT_IMAGES', 'not set')}")
        self.stdout.write(f"  Videos folder : {getattr(settings, 'AUTO_SCAN_INPUT_VIDEOS', 'not set')}")
        self.stdout.write(f"  Output folder : {getattr(settings, 'AUTO_SCAN_OUTPUT_DIR',   'not set')}")
        self.stdout.write(f"  Disease thr.  : {getattr(settings, 'AUTO_SCAN_DISEASE_THRESHOLD',  0.60):.0%}")
        self.stdout.write(f"  Lameness thr. : {getattr(settings, 'AUTO_SCAN_LAMENESS_THRESHOLD', 0.60):.0%}")
        self.stdout.write('─' * 50 + '\n')

        self.stdout.write('  Scanning...\n')

        from alerts.tasks import auto_scan_folders
        stats = auto_scan_folders()

        if 'error' in stats:
            self.stdout.write(self.style.ERROR(f"  ERROR: {stats['error']}"))
            return

        self.stdout.write('─' * 50)
        self.stdout.write(self.style.MIGRATE_HEADING('  Results'))
        self.stdout.write('─' * 50)
        self.stdout.write(f"  Images scanned : {stats['images_scanned']}")
        self.stdout.write(f"  Videos scanned : {stats['videos_scanned']}")
        self.stdout.write('─' * 50)

        detected = stats['detected']
        if detected > 0:
            self.stdout.write(self.style.ERROR(  f"  Detected       : {detected}  ← alerts created"))
        else:
            self.stdout.write(self.style.SUCCESS(f"  Detected       : {detected}"))

        self.stdout.write(self.style.SUCCESS(    f"  Clean          : {stats['clean']}"))
        self.stdout.write(                       f"  Skipped        : {stats['skipped']}  (already scanned)")

        if stats['errors'] > 0:
            self.stdout.write(self.style.WARNING(f"  Errors         : {stats['errors']}  (check AutoScanLog)"))
        else:
            self.stdout.write(self.style.SUCCESS(f"  Errors         : {stats['errors']}"))

        self.stdout.write('─' * 50 + '\n')

        if detected > 0:
            self.stdout.write(self.style.ERROR(
                f"  {detected} detection(s) found — files saved to output folder, alerts sent.\n"
            ))
        else:
            self.stdout.write(self.style.SUCCESS('  All clear — no detections.\n'))

"""
Management command to load the Livestock_Vaccination_FINAL.xlsx dataset
into the VaccineDataset database table.

Usage:
    python manage.py load_vaccine_dataset --file path/to/Livestock_Vaccination_FINAL.xlsx
    python manage.py load_vaccine_dataset --file path/to/file.xlsx --clear
"""

import os
import pandas as pd
from django.core.management.base import BaseCommand, CommandError
from health.models import VaccineDataset
from health.lsh.vaccine_recommender import VaccineRecommender


class Command(BaseCommand):
    help = "Load vaccine dataset from Excel into the VaccineDataset table"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            required=True,
            help="Path to the Livestock_Vaccination_FINAL.xlsx file",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            default=False,
            help="Clear existing records before loading",
        )

    def handle(self, *args, **options):
        file_path = options["file"]

        if not os.path.exists(file_path):
            raise CommandError(f"File not found: {file_path}")

        self.stdout.write(f"Loading dataset from: {file_path}")

        try:
            df = pd.read_excel(file_path)
        except Exception as e:
            raise CommandError(f"Failed to read Excel file: {e}")

        # Clean column names
        df.columns = df.columns.str.strip()

        required_cols = [
            "Animal Species", "Disease Name", "Vaccine Name",
        ]
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise CommandError(f"Missing required columns: {missing}")

        if options["clear"]:
            deleted, _ = VaccineDataset.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Cleared {deleted} existing records."))

        def clean(val):
            if pd.isna(val) or str(val).strip() in ("nan", ""):
                return None
            return str(val).strip()

        created_count = 0
        skipped_count = 0

        for _, row in df.iterrows():
            animal_species = clean(row.get("Animal Species"))
            disease_name = clean(row.get("Disease Name"))
            vaccine_name = clean(row.get("Vaccine Name"))

            if not disease_name or not vaccine_name:
                skipped_count += 1
                continue

            VaccineDataset.objects.create(
                animal_species=animal_species or "",
                disease_name=disease_name,
                vaccine_name=vaccine_name,
                age_at_first_dose=clean(row.get("Age at First Dose")),
                booster_dose=clean(row.get("Booster Dose")),
                subsequent_dose=clean(row.get("Subsequent Dose")),
                vaccination_season=clean(row.get("Vaccination Season/Month")),
                related_information=clean(row.get("Related Information")),
            )
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created: {created_count} records. Skipped: {skipped_count} rows."
            )
        )

        # Rebuild LSH index so it's ready immediately
        self.stdout.write("Rebuilding LSH index...")
        VaccineRecommender.reset()
        VaccineRecommender.get_instance()
        self.stdout.write(self.style.SUCCESS("LSH index built successfully."))
import os
import django
from datetime import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'LivestockIQ.settings')
django.setup()

from django.contrib.auth.models import User
from health.models import Animal, VaccinationSchedule

# Clear existing data (optional - uncomment if you want to start fresh)
Animal.objects.all().delete()
VaccinationSchedule.objects.all().delete()

print("Starting data population...")

# Animal data
animals_data = [
    # User 1 Animals (Healthy)
    (1, 'Cow', '0–6 months', 'F', 1, True, None),
    (2, 'Cow', '6–12 months', 'M', 1, True, None),
    (3, 'Cow', '1–2 years', 'F', 1, True, None),
    (4, 'Cow', '2+ years', 'M', 1, True, None),
    (5, 'Goat', '0–6 months', 'F', 1, True, None),
    (6, 'Goat', '6–18 months', 'M', 1, True, None),
    (7, 'Sheep', '0–12 months', 'F', 1, True, None),
    
    # User 1 Animals (Unhealthy)
    (8, 'Cow', '6–12 months', 'F', 1, False, 'FMD Vaccine'),
    (9, 'Cow', '1–2 years', 'M', 1, False, 'HS Vaccine'),
    (10, 'Goat', '6–18 months', 'F', 1, False, 'PPR Vaccine'),
    
    # User 2 Animals (Healthy)
    (11, 'Cow', '0–6 months', 'M', 2, True, None),
    (12, 'Cow', '1–2 years', 'F', 2, True, None),
    (13, 'Cow', '2+ years', 'F', 2, True, None),
    (14, 'Sheep', '0–12 months', 'M', 2, True, None),
    (15, 'Sheep', '1–1.5 years', 'F', 2, True, None),
    (16, 'Goat', '0–6 months', 'F', 2, True, None),
    
    # User 2 Animals (Unhealthy)
    (17, 'Cow', '2+ years', 'F', 2, False, 'Brucellosis calfhood Vaccine'),
    (18, 'Sheep', '1.5+ years', 'M', 2, False, 'PPR Vaccine'),
    
    # User 3 Animals (Healthy)
    (19, 'Cow', '6–12 months', 'F', 3, True, None),
    (20, 'Cow', '1–2 years', 'M', 3, True, None),
    (21, 'Cow', '2+ years', 'F', 3, True, None),
    (22, 'Goat', '6–18 months', 'F', 3, True, None),
    (23, 'Goat', '1.5+ years', 'M', 3, True, None),
    (24, 'Sheep', '0–12 months', 'F', 3, True, None),
    (25, 'Sheep', '1–1.5 years', 'M', 3, True, None),
    
    # User 3 Animals (Unhealthy)
    (26, 'Cow', '0–6 months', 'M', 3, False, 'Rabies Vaccine'),
    (27, 'Goat', '0–6 months', 'F', 3, False, 'Goat Pox Vaccine'),
    (28, 'Sheep', '1.5+ years', 'F', 3, False, 'Bluetongue Multivalent Vaccine'),
]

print("Creating animals...")
animal_count = 0
for animal_data in animals_data:
    animal_id, animal_type, age, sex, user_id, is_healthy, required_vaccine = animal_data
    
    try:
        user = User.objects.get(id=user_id)
        Animal.objects.create(
            id=animal_id,
            animal_type=animal_type,
            age=age,
            sex=sex,
            user=user,
            is_healthy=is_healthy,
            required_vaccine=required_vaccine
        )
        animal_count += 1
    except User.DoesNotExist:
        print(f"Warning: User with id {user_id} does not exist. Skipping animal {animal_id}")
    except Exception as e:
        print(f"Error creating animal {animal_id}: {e}")

print(f"Created {animal_count} animals")

# Schedule data
schedules_data = [
    # Individual Animal Schedules (User 1)
    (1, None, 'FMD Vaccine', '2025-12-27', 'Initial dose - 4 months old', False, 1, False),
    (2, None, 'Rabies Vaccine', '2026-01-15', 'After exposure only if needed', False, 1, False),
    (3, None, 'FMD Vaccine', '2025-12-20', 'Every 6 months booster', False, 2, False),
    (4, None, 'BQ Vaccine', '2026-02-10', 'Annual booster', False, 2, False),
    (5, None, 'HS Vaccine', '2026-06-15', 'Summer annual booster', False, 3, False),
    (6, None, 'IBR/BVD/Parainfluenza Vaccine', '2025-12-25', 'Annual reproductive disease prevention', False, 3, False),
    (7, None, 'Leptospirosis 5-Way Vaccine', '2026-03-10', 'Annual booster', False, 4, True),
    (8, None, 'FMD Vaccine', '2026-01-20', 'Every 6 months', False, 4, False),
    
    # Goat Schedules (User 1)
    (9, None, 'ET Vaccine', '2026-01-05', 'Initial at 3 months', False, 5, False),
    (10, None, 'PPR Vaccine', '2025-12-28', 'Every 3 years', False, 6, False),
    (11, None, 'Goat Pox Vaccine', '2026-02-15', 'Annual booster', False, 6, False),
    
    # Sheep Schedules (User 1)
    (12, None, 'ET Vaccine', '2025-12-22', 'Initial at 3 months', False, 7, False),
    (13, None, 'Attenuated live virus cell culture', '2026-03-20', 'Spring annual booster', False, 7, False),
    
    # Unhealthy Animals - Required Vaccines (User 1)
    (14, None, 'FMD Vaccine', '2025-12-15', 'Required - unhealthy animal', False, 8, True),
    (15, None, 'FMD Vaccine', '2026-06-15', 'Follow-up booster every 6 months', False, 8, False),
    (16, None, 'HS Vaccine', '2026-06-20', 'Summer annual - required treatment', False, 9, False),
    (17, None, 'PPR Vaccine', '2025-12-18', 'Every 3 years - required', False, 10, False),
    
    # Individual Animal Schedules (User 2)
    (18, None, 'FMD Vaccine', '2026-01-10', 'Initial dose at 4 months', False, 11, False),
    (19, None, 'Clostridial Vaccine', '2026-02-20', 'Every 6 months', False, 12, False),
    (20, None, 'IBR/BVD/Parainfluenza Vaccine', '2025-12-30', 'Annual booster', False, 12, False),
    (21, None, 'Pre-breeding MLV Vaccine', '2026-04-15', 'At least 30 days before breeding', False, 13, False),
    (22, None, 'Scourguard Vaccine', '2026-01-25', 'Before calving', False, 13, False),
    
    # Sheep Schedules (User 2)
    (23, None, 'PPR Vaccine', '2026-01-08', 'Every 3 years', False, 14, False),
    (24, None, 'ET Vaccine', '2025-12-29', 'Annual booster', False, 15, False),
    (25, None, 'Attenuated live virus cell culture', '2026-09-10', 'Autumn annual', False, 15, False),
    
    # Goat Schedule (User 2)
    (26, None, 'Goat Pox Vaccine', '2026-01-12', 'Annual booster', False, 16, False),
    
    # Unhealthy Animals (User 2)
    (27, None, 'Brucellosis calfhood Vaccine', '2025-12-16', 'Once in lifetime - accredited vet only', False, 17, False),
    (28, None, 'PPR Vaccine', '2025-12-20', 'Every 3 years - required', False, 18, False),
    (29, None, 'Bluetongue Multivalent Vaccine', '2026-06-25', 'Summer annual booster', False, 18, False),
    
    # Individual Animal Schedules (User 3)
    (30, None, 'FMD Vaccine', '2025-12-24', 'Every 6 months', False, 19, False),
    (31, None, 'BQ Vaccine', '2026-02-05', 'Annual booster', False, 19, False),
    (32, None, 'HS Vaccine', '2026-06-10', 'Summer annual', False, 20, False),
    (33, None, 'Clostridial Vaccine', '2026-01-18', 'Every 6 months', False, 20, False),
    (34, None, 'Pre-calving booster Vaccines', '2026-02-28', 'Before calving - colostral antibody', False, 21, False),
    (35, None, 'Campylobacter fetus Vaccine', '2026-04-20', 'Before breeding season', False, 21, False),
    
    # Goat Schedules (User 3)
    (36, None, 'PPR Vaccine', '2025-12-21', 'Every 3 years', False, 22, False),
    (37, None, 'FMD Vaccine', '2026-01-15', 'Every 6 months', False, 22, False),
    (38, None, 'PPR Vaccine', '2026-03-12', 'Every 3 years', False, 23, False),
    (39, None, 'CCPP Inactivated Vaccine', '2026-12-05', 'Winter annual booster', False, 23, False),
    
    # Sheep Schedules (User 3)
    (40, None, 'ET Vaccine', '2026-01-20', 'Initial at 3 months', False, 24, False),
    (41, None, 'Inactivated FMD Vaccine', '2026-02-15', 'Every 6 months', False, 25, False),
    (42, None, 'PPR Vaccine', '2025-12-26', 'Every 3 years', False, 25, False),
    
    # Unhealthy Animals (User 3)
    (43, None, 'Rabies Vaccine', '2025-12-14', 'After exposure - required', False, 26, True),
    (44, None, 'Goat Pox Vaccine', '2025-12-19', 'Annual - required treatment', False, 27, False),
    (45, None, 'Bluetongue Multivalent Vaccine', '2026-06-30', 'Summer annual - required', False, 28, False),
    
    # Group Vaccination Schedules
    (46, 'Cow', 'FMD Vaccine', '2026-06-15', 'Summer group vaccination campaign', True, None, False),
    (47, 'Goats', 'PPR Vaccine', '2026-03-01', 'Group vaccination - every 3 years', True, None, False),
    (48, 'Sheep', 'Bluetongue Multivalent Vaccine', '2026-07-10', 'Summer group booster', True, None, False),
    
]

print("Creating vaccination schedules...")
schedule_count = 0
for schedule_data in schedules_data:
    schedule_id, group_type, vaccine_name, schedule_date, dose_notes, is_group, animal_id, is_completed = schedule_data
    
    try:
        # Convert date string to date object
        date_obj = datetime.strptime(schedule_date, '%Y-%m-%d').date()
        
        # Get animal if it's not a group schedule
        animal_obj = None
        if not is_group and animal_id:
            try:
                animal_obj = Animal.objects.get(id=animal_id)
            except Animal.DoesNotExist:
                print(f"Warning: Animal with id {animal_id} does not exist. Skipping schedule {schedule_id}")
                continue
        
        VaccinationSchedule.objects.create(
            id=schedule_id,
            group_type=group_type,
            vaccine_name=vaccine_name,
            schedule_date=date_obj,
            dose_notes=dose_notes,
            is_group=is_group,
            animal=animal_obj,
            is_completed=is_completed
        )
        schedule_count += 1
    except Exception as e:
        print(f"Error creating schedule {schedule_id}: {e}")

print(f"Created {schedule_count} vaccination schedules")

# Summary
print("\n=== Data Population Summary ===")
print(f"Total Animals: {Animal.objects.count()}")
print(f"  - User 1: {Animal.objects.filter(user_id=1).count()}")
print(f"  - User 2: {Animal.objects.filter(user_id=2).count()}")
print(f"  - User 3: {Animal.objects.filter(user_id=3).count()}")
print(f"Healthy Animals: {Animal.objects.filter(is_healthy=True).count()}")
print(f"Unhealthy Animals: {Animal.objects.filter(is_healthy=False).count()}")
print(f"\nTotal Schedules: {VaccinationSchedule.objects.count()}")
print(f"  - Individual: {VaccinationSchedule.objects.filter(is_group=False).count()}")
print(f"  - Group: {VaccinationSchedule.objects.filter(is_group=True).count()}")
print(f"Completed Schedules: {VaccinationSchedule.objects.filter(is_completed=True).count()}")
print(f"Pending Schedules: {VaccinationSchedule.objects.filter(is_completed=False).count()}")

print("\n✓ Data population completed successfully!")
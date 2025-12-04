import os
import django
import csv
import io

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'LivestockIQ.settings') # <--- Check if 'LivestockIQ' matches your project folder name
django.setup()

from health.models import VaccineDataset

# The CSV Data
csv_data = """Species,Vaccine_Name,Disease,Min_Age_Months,Dosage_Frequency,Seasonality_Logic,Booster_Rule,Mandatory_Conditions
Cow,FMD Vaccine,Foot and Mouth Disease,4,Every 6 months,None,Every 6 months,
Cow,HS Vaccine,Haemorrhagic Septicaemia,6,Annually,Summer,Annual booster in summer,
Cow,BQ Vaccine,Black Quarter,6,Annually,None,Annual booster,
Cow,Clostridial Vaccine,Clostridial infections,6,Every 6 months,None,Every 6 months,
Cow,Live attenuated LSD Vaccine,Lumpy Skin Disease,4,Annually,Summer,Annual booster in summer,
Cow,Blanthrax Vaccine,Anthrax,4,Annually,Summer,Annual booster in summer,
Cow,Muguga ITM Cocktail Vaccine,East African Coast Fever,0,Once in lifetime,None,No booster needed,
Cow,Rabies Vaccine,Rabies,0,After exposure,None,After exposure only,After exposure/bite
Cow,Combined Vaccine IBR/PI3/BVD/BRSV,Blackleg/Malignant edema/Enterotoxemia,1,Initial series,None,Follow vaccination program,
Cow,IBR/BVD/Parainfluenza Vaccine,Reproductive diseases,6,Annually,None,Annual booster,
Cow,Vaccine,Three Day Stiff Sickness,8,Annually,Summer,Annual booster in summer,
Cow,RVF Vaccine,Rift Valley Fever,7,Annually,Summer,Annual booster in summer,
Cow,Vibriosis Vaccine,Vibriosis,18,Annually,None,Annual booster,Non pregnant cows
Cow,Ultra/Coclavax one shot,Clostridial diseases,6,Annually,None,Annual booster,
Cow,Brucella S19,Brucellosis,4,Once in lifetime,None,No booster needed,Female calves only at 4-8 months
Cow,Brucella S19,Contagious abortion,4,Once in lifetime,Summer,No booster needed,Heifers only at 4 to 8 months of age
Cow,MLV-IBR/PI3/BVD/BRSV,Blackleg/Malignant edema/Enterotoxemia,8,Initial series,None,Follow vaccination program,Replacement heifers at 8 months
Cow,Combined Vaccines with Lepto,Multiple diseases,12,Pre-breeding,None,Follow breeding schedule,1 month before breeding
Cow,IBR/BVD/Parainfluenza Vaccine,Reproductive diseases,6,Annually,None,Annual booster,
Cow,Scourguard Vaccine,Scourguard (To guard against scours),0,Annually,None,Before calving,Healthy pregnant cows and heifers
Cow,Clostridial Vaccine BRSV/Pasteurella,Clostridial/BRSV/Pasteurella,1,Initial + booster,None,As directed,If problem with summer pneumonia
Cow,MLV-IBR/PI3/BVD/BRSV,Multiple respiratory diseases,6,At weaning,None,Follow vaccination program,At weaning time
Cow,MLV-IBR/PI3/BVD/BRSV,Multiple respiratory diseases,6,Post-weaning,None,Follow vaccination program,2-3 weeks after weaning
Goat,PPR Vaccine,PPR (Peste des Petits Ruminants),4,Every 3 years,None,Every 3 years,
Goat,ET Vaccine,Enterotoxaemia,3,Annually,None,Annual booster,Initial at 3 months then annual
Goat,Goat Pox Vaccine,Goat Pox,3,Annually,None,Annual booster,
Goat,FMD Vaccine,Foot & Mouth Disease,4,Every 6 months,None,Every 6 months,
Sheep,PPR Vaccine,PPR (Peste des Petits Ruminants),4,Every 3 years,None,Every 3 years,
Sheep,ET Vaccine,Enterotoxaemia,3,Annually,None,Annual booster,Initial at 3 months then annual
Sheep,Attenuated live virus cell culture,Sheep Pox,0,Annually,Spring & Autumn,Annual in spring or autumn,
Sheep,Inactivated FMD Vaccine,Foot and Mouth Disease,0,Every 6 months,None,Every 6 months,
Cow,Theileria Annulata Vaccine (Live Attenuated),Theileriosis,3,Once in lifetime,None,No booster needed,Exotic/crossbred Cow only
Sheep,Bluetongue Multivalent Vaccine,Bluetongue,3,Annually,Summer,Annual booster,All sheep
Goat,CCPP Inactivated Vaccine,CCPP (Pleuropneumonia),3,Annually,Winter,Annual booster,All goats
Cow,Leptospirosis 5-Way Vaccine,Leptospirosis,6,Annually,None,Annual or every 3-6 months in endemic areas,
Cow,Trichomoniasis Vaccine,Trichomoniasis,12,Annually,None,Before breeding season,Heifers and cows only
Cow,Pinkeye Vaccine (Moraxella bovis),Pinkeye (IBK),2,As needed,None,Annual or as needed before pinkeye season,Complete 3-6 weeks before pinkeye season
Cow,E.coli Vaccine,E.coli scours prevention,12,Twice yearly,None,Before calving,Vaccinate pregnant cows
Cow,Haemophilus somnus Vaccine,Haemophilus somnus,6,Initial series,None,Follow vaccination program,Risk-based
Cow,First Defense/Bar-Guard 99,E.coli prevention,0,Once in lifetime,None,No booster needed,Before colostrum intake
Cow,Calf-Guard,Rota/Corona virus protection,0,Once in lifetime,None,No booster needed,Before colostrum intake
Cow,Inforce 3 (IBR/PI3/BRSV),Respiratory diseases,0,At weaning,None,Follow vaccination program,Nasal product
Cow,Mannheimia haemolytica Vaccine,Pasteurella,6,Initial series,None,Follow vaccination program,Risk-based
Cow,Brucellosis calfhood Vaccine,Brucellosis,8,Once in lifetime,None,No booster needed,Only by accredited veterinarian with tag and tattoo
Cow,Clostridial 7-way Vaccine,Clostridial diseases,12,Annually,None,Annual booster,
Cow,Bovine Respiratory Disease (BRD) Vaccine,Respiratory disease complex,0.5,Initial series,Autumn,Before housing,At least 2 weeks before housing
Cow,Campylobacter fetus Vaccine,Vibriosis/Campylobacteriosis,12,Annually,Spring,Before breeding season,Breeding bulls and females
Cow,Pre-breeding MLV Vaccine,IBR/BVD/PI3/BRSV,14,Pre-breeding,Spring,Before breeding season,At least 30 days before breeding season
Cow,Rotavirus/Coronavirus Vaccine,Calf scours prevention,0,Twice yearly,Winter,Before calving,Pregnant cows in late pregnancy
Cow,Lungworm Vaccine,Dictyocaulus viviparus,2.5,Initial series,Spring,Follow vaccination program,Before turnout to pasture in endemic areas
Cow,Pre-calving booster Vaccines,Multiple diseases,0,Pre-calving,Winter,Before calving,Ensure colostral antibody transfer
Cow,Breeding soundness Vaccines,IBR/BVD/Leptospirosis,12,Annually,Spring,Annual booster,Given 60-75 days before bull turnout
Cow,Replacement heifer complete,IBR/BVD/PI3/BRSV/Lepto/Vibrio,12,Pre-breeding,Spring,Before breeding season,Two doses 3 weeks apart before first breeding
Cow,Fall vaccination program,IBR/BVD/Lepto,0,Annually,Autumn,Annual booster,Given at fall pregnancy check in autumn
Cow,Pre-housing respiratory Vaccines,IBR/PI3/BRSV/Mannheimia,7,Pre-housing,Autumn,Before housing,Protection against winter respiratory disease
Cow,Deworming program,Parasite control,12,Twice yearly,Spring,Spring (May) and optional fall,At least 2 weeks before breeding"""

# Clear old data if needed
# VaccineDataset.objects.all().delete()

print("Processing CSV data...")
reader = csv.DictReader(io.StringIO(csv_data))

count = 0
for row in reader:
    # Handle empty ages
    age_str = row['Min_Age_Months'].strip()
    if not age_str or age_str == '':
        age = 0.0
    else:
        age = float(age_str)
        
    VaccineDataset.objects.create(
        species=row['Species'],
        vaccine_name=row['Vaccine_Name'],
        disease=row['Disease'],
        min_age_months=age,
        dosage_frequency=row['Dosage_Frequency'],
        seasonality=row['Seasonality_Logic'] if row['Seasonality_Logic'] != 'None' else None,
        booster_rule=row['Booster_Rule'] if row['Booster_Rule'] != 'None' else None,
        mandatory_conditions=row['Mandatory_Conditions']
    )
    count += 1

print(f"Success! {count} vaccines added to the health app.")
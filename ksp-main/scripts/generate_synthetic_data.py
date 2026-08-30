import pandas as pd
import numpy as np
import random
import uuid
import datetime
import os
from pathlib import Path

def generate_synthetic_data(num_records=1000):
    output_dir = Path(__file__).resolve().parent.parent / "zoho_data" / "synthetic"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    districts = {
        "Bengaluru City": {"lat": 12.9716, "lon": 77.5946, "stations": ["Cubbon Park PS", "Indiranagar PS", "Koramangala PS", "Malleswaram PS"]},
        "Mysuru City": {"lat": 12.2958, "lon": 76.6394, "stations": ["Devaraja PS", "Kuvempunagar PS", "Saraswathipuram PS"]},
        "Hubballi Dharwad City": {"lat": 15.3647, "lon": 75.1240, "stations": ["Hubballi Town PS", "Vidyanagar PS", "Dharwad Suburban PS"]},
        "Tumakuru": {"lat": 13.3392, "lon": 77.1016, "stations": ["Tumakuru Town PS", "Kyathasandra PS"]},
        "Belagavi Dist": {"lat": 15.8497, "lon": 74.4977, "stations": ["Belagavi Camp PS", "Tilakwadi PS", "Khadebazar PS"]}
    }

    crime_types = ["Murder", "Robbery", "Theft", "Cyber Crime", "POCSO", "NDPS", "Cheating", "Assault"]
    
    # 1. Station Crimes & 2. FIR Text & 3. Profiles
    station_data = []
    fir_data = []
    profile_data = []
    cyber_data = []
    
    start_date = datetime.datetime(2025, 1, 1)
    
    mo_templates = {
        "Murder": ["Attacked with a sharp weapon at night near {}", "Poisoned during a family dispute at {}", "Stabbed after a drunken brawl in {}"],
        "Robbery": ["Snatched gold chain while victim was walking near {}", "Threatened with a knife and stole wallet at {}", "Broke into house and stole valuables in {}"],
        "Theft": ["Stole parked two-wheeler from {}", "Pickpocketed mobile phone at a crowded market in {}", "Stole copper wires from a construction site in {}"],
        "Cyber Crime": ["Tricked victim into sharing OTP over phone call", "Sent phishing link offering fake loan", "Romance scam on dating app leading to crypto transfer"],
        "POCSO": ["Assaulted minor on the way to school near {}", "Groomed minor over social media", "Harassed minor in the neighborhood of {}"],
        "NDPS": ["Caught selling marijuana packets near college in {}", "Smuggling synthetic drugs in a hidden compartment near {}", "Found possessing cocaine at a rave party in {}"],
        "Cheating": ["Sold fake property documents to victim in {}", "Promised a job and took advance money in {}", "Chit fund scam defrauding multiple investors in {}"],
        "Assault": ["Physical altercation over property dispute in {}", "Road rage incident leading to severe injuries near {}", "Group clash using sticks and stones in {}"]
    }
    
    for _ in range(num_records):
        fir_no = f"FIR-{random.randint(100, 999)}/{random.randint(2025, 2026)}-{uuid.uuid4().hex[:4]}"
        dist_name = random.choice(list(districts.keys()))
        station_name = random.choice(districts[dist_name]["stations"])
        
        # Add some random noise to lat/lon for point spread
        lat = districts[dist_name]["lat"] + random.uniform(-0.05, 0.05)
        lon = districts[dist_name]["lon"] + random.uniform(-0.05, 0.05)
        
        crime = random.choice(crime_types)
        date = start_date + datetime.timedelta(days=random.randint(0, 365))
        
        status = random.choice(["Under Investigation", "Charge Sheeted", "Closed", "Pending Trial"])
        
        station_data.append({
            "FIR_Number": fir_no,
            "Date": date.strftime("%Y-%m-%d"),
            "District": dist_name,
            "Police_Station": station_name,
            "Latitude": round(lat, 5),
            "Longitude": round(lon, 5),
            "Crime_Head": crime,
            "Status": status
        })
        
        # FIR Text
        mo = random.choice(mo_templates[crime])
        if "{}" in mo:
            mo = mo.format(station_name)
            
        fir_data.append({
            "FIR_Number": fir_no,
            "Crime_Head": crime,
            "Applicable_Law": "BNS 2023" if date.year >= 2025 else "IPC 1860",
            "Section": random.randint(100, 400), # Mock section
            "MO_Description": mo
        })
        
        # Profiles
        profile_data.append({
            "FIR_Number": fir_no,
            "Accused_Age": random.randint(18, 60),
            "Accused_Gender": random.choices(["Male", "Female", "Unknown"], weights=[0.85, 0.10, 0.05])[0],
            "Accused_Occupation": random.choice(["Unemployed", "Laborer", "Student", "Business", "Private Employee"]),
            "Recidivist_Flag": random.choices(["Yes", "No"], weights=[0.3, 0.7])[0],
            "Victim_Age": random.randint(10, 70),
            "Victim_Gender": random.choice(["Male", "Female"])
        })
        
        # Cyber
        if crime == "Cyber Crime":
            amt_lost = random.randint(5000, 500000)
            amt_frozen = int(amt_lost * random.uniform(0, 0.8))
            cyber_data.append({
                "FIR_Number": fir_no,
                "Fraud_Type": random.choice(["OTP Fraud", "Phishing Link", "Job Scam", "Investment Fraud", "Crypto Scam"]),
                "Amount_Lost_INR": amt_lost,
                "Amount_Frozen_INR": amt_frozen,
                "Platform": random.choice(["WhatsApp", "Telegram", "Fake Website", "Phone Call", "Facebook"])
            })

    pd.DataFrame(station_data).drop_duplicates(subset=['FIR_Number']).to_csv(output_dir / "synthetic_station_crimes.csv", index=False)
    pd.DataFrame(fir_data).drop_duplicates(subset=['FIR_Number']).to_csv(output_dir / "synthetic_fir_text.csv", index=False)
    pd.DataFrame(profile_data).drop_duplicates(subset=['FIR_Number']).to_csv(output_dir / "synthetic_profiles.csv", index=False)
    if cyber_data:
        pd.DataFrame(cyber_data).drop_duplicates(subset=['FIR_Number']).to_csv(output_dir / "synthetic_cyber_financials.csv", index=False)
        
    # 5. Legal Statutes (Static mapping)
    legal_statutes = [
        {"Law_Name": "BNS", "Section_Number": "103", "Offence": "Murder", "Punishment": "Death or Imprisonment for life", "Cognizable": True, "Bailable": False},
        {"Law_Name": "BNS", "Section_Number": "309(4)", "Offence": "Robbery / Snatching", "Punishment": "Rigorous imprisonment up to 7 years", "Cognizable": True, "Bailable": False},
        {"Law_Name": "BNS", "Section_Number": "303(2)", "Offence": "Theft", "Punishment": "Imprisonment up to 3 years or fine", "Cognizable": True, "Bailable": False},
        {"Law_Name": "BNS", "Section_Number": "318(4)", "Offence": "Cheating", "Punishment": "Imprisonment up to 7 years and fine", "Cognizable": True, "Bailable": False},
        {"Law_Name": "IT Act", "Section_Number": "66C", "Offence": "Identity Theft", "Punishment": "Imprisonment up to 3 years and fine up to 1 Lakh", "Cognizable": True, "Bailable": True},
        {"Law_Name": "IT Act", "Section_Number": "66D", "Offence": "Cheating by personation using computer resource", "Punishment": "Imprisonment up to 3 years and fine up to 1 Lakh", "Cognizable": True, "Bailable": True},
        {"Law_Name": "POCSO", "Section_Number": "4", "Offence": "Penetrative sexual assault", "Punishment": "Imprisonment not less than 10 years up to life", "Cognizable": True, "Bailable": False},
        {"Law_Name": "NDPS", "Section_Number": "20", "Offence": "Contravention in relation to cannabis plant and cannabis", "Punishment": "Imprisonment up to 20 years and fine up to 2 Lakhs", "Cognizable": True, "Bailable": False},
    ]
    pd.DataFrame(legal_statutes).to_csv(output_dir / "synthetic_legal_statutes.csv", index=False)

    print(f"Generated 5 synthetic datasets perfectly formatted in: {output_dir}")
    print(f"Total station crimes generated: {len(station_data)}")

if __name__ == "__main__":
    generate_synthetic_data(1500)

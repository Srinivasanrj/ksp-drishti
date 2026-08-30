import csv
import random
from datetime import datetime, timedelta

# Karnataka Approximate Bounding Box (Lat: 11.5 to 18.5, Lon: 74.0 to 78.5)
# Let's create realistic clusters around major cities

CITIES = {
    "Bengaluru": {"lat": 12.9716, "lon": 77.5946, "radius": 0.2, "weight": 40},
    "Mysuru": {"lat": 12.2958, "lon": 76.6394, "radius": 0.1, "weight": 20},
    "Hubballi": {"lat": 15.3647, "lon": 75.1240, "radius": 0.1, "weight": 15},
    "Mangaluru": {"lat": 12.9141, "lon": 74.8560, "radius": 0.1, "weight": 15},
    "Belagavi": {"lat": 15.8497, "lon": 74.4977, "radius": 0.1, "weight": 10},
}

CRIMES = ["Robbery", "Vehicle Theft", "Extortion", "Assault", "Burglary", "Cyber Crime"]
STATUSES = ["Open", "Under Investigation", "Closed", "Charge Sheet Filed"]

def generate_random_date(start_date, end_date):
    time_between = end_date - start_date
    days_between = time_between.days
    random_number_of_days = random.randrange(days_between)
    return start_date + timedelta(days=random_number_of_days)

def generate_records(num_records=500):
    records = []
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2023, 12, 31)

    # Flatten city choices based on weights
    city_choices = []
    for city, data in CITIES.items():
        city_choices.extend([city] * data["weight"])

    for i in range(1, num_records + 1):
        city = random.choice(city_choices)
        base_lat = CITIES[city]["lat"]
        base_lon = CITIES[city]["lon"]
        radius = CITIES[city]["radius"]

        # Randomize lat/lon slightly around the city center
        lat = base_lat + random.uniform(-radius, radius)
        lon = base_lon + random.uniform(-radius, radius)
        
        crime = random.choice(CRIMES)
        status = random.choice(STATUSES)
        date = generate_random_date(start_date, end_date).strftime("%Y-%m-%d")
        
        records.append({
            "case_id": f"KSP-{2023}-{1000 + i}",
            "crime_type": crime,
            "incident_date": date,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "nearest_city": city,
            "case_status": status
        })
    return records

if __name__ == "__main__":
    records = generate_records(500)
    output_file = "d:/latest_datathon/rohith_project/karnataka_synthetic_crimes.csv"
    
    with open(output_file, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["case_id", "crime_type", "incident_date", "latitude", "longitude", "nearest_city", "case_status"])
        writer.writeheader()
        writer.writerows(records)
    
    print(f"Generated {len(records)} synthetic crime records at {output_file}")

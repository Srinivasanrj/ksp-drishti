import os
import zipfile
import re

def inspect_district_kmz(kmz_path):
    print(f"Inspecting KMZ: {kmz_path}")
    if not os.path.exists(kmz_path):
        print("File does not exist")
        return
        
    with zipfile.ZipFile(kmz_path, 'r') as z:
        kml_files = [f for f in z.namelist() if f.endswith('.kml')]
        print("KML files inside KMZ:", kml_files)
        if not kml_files:
            return
            
        content = z.read(kml_files[0]).decode('utf-8', errors='ignore')
        
    placemarks = re.findall(r'<Placemark\b[^>]*>(.*?)</Placemark>', content, re.DOTALL | re.IGNORECASE)
    print(f"Total Placemarks found: {len(placemarks)}")
    
    district_names = []
    for p in placemarks:
        name_match = re.search(r'<name[^>]*>(.*?)</name>', p, re.DOTALL | re.IGNORECASE)
        name = name_match.group(1).strip() if name_match else "Unknown"
        
        # Check district name in SimpleData
        simple_match = re.search(r'<SimpleData name="KGISTDistrictName">([^<]*)</SimpleData>', p, re.IGNORECASE)
        if not simple_match:
            simple_match = re.search(r'<SimpleData name="[^"]*District[^"]*">([^<]*)</SimpleData>', p, re.IGNORECASE)
            
        dist_name = simple_match.group(1).strip() if simple_match else name
        district_names.append(dist_name)
        
    print(f"Sample Districts ({len(district_names)} total):", district_names[:15])

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    kmz = os.path.join(base_dir, 'district_map', 'District.kmz')
    inspect_district_kmz(kmz)

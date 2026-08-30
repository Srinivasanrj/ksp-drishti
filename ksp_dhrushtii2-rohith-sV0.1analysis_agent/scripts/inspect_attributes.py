import os
import zipfile
import re

def inspect_attributes(kmz_path):
    with zipfile.ZipFile(kmz_path, 'r') as z:
        content = z.read('doc.kml').decode('utf-8', errors='ignore')
    
    placemarks = re.findall(r'<Placemark\b[^>]*>(.*?)</Placemark>', content, re.DOTALL | re.IGNORECASE)
    if placemarks:
        print("Placemark 1 XML snippet:")
        print(placemarks[0][:1200])

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    kmz = os.path.join(base_dir, 'district_map', 'District.kmz')
    inspect_attributes(kmz)

import os
import zipfile
import json
import re

def convert_kmz_to_geojson(kmz_path, output_geojson_path):
    print(f"Reading KMZ from {kmz_path}")
    if not os.path.exists(kmz_path):
        print(f"Error: {kmz_path} not found")
        return False

    with zipfile.ZipFile(kmz_path, 'r') as z:
        kml_files = [f for f in z.namelist() if f.endswith('.kml')]
        if not kml_files:
            print("No .kml found in KMZ")
            return False
        
        kml_content = z.read(kml_files[0]).decode('utf-8', errors='ignore')
    
    # Extract placemarks using regex for 100% resilient parsing across all KML variations
    placemark_blocks = re.findall(r'<Placemark\b[^>]*>(.*?)</Placemark>', kml_content, re.DOTALL | re.IGNORECASE)
    print(f"Found {len(placemark_blocks)} placemark blocks in KML")
    
    features = []
    
    for block in placemark_blocks:
        name_match = re.search(r'<name[^>]*>(.*?)</name>', block, re.DOTALL | re.IGNORECASE)
        name = name_match.group(1).strip() if name_match else "Karnataka Boundary Region"
        
        desc_match = re.search(r'<description[^>]*>(.*?)</description>', block, re.DOTALL | re.IGNORECASE)
        desc = desc_match.group(1).strip() if desc_match else ""
        
        props = {"name": name, "description": desc}
        
        # SimpleData tags
        for m in re.finditer(r'<SimpleData name="([^"]+)">([^<]*)</SimpleData>', block, re.IGNORECASE):
            props[m.group(1)] = m.group(2)
        
        # Find coordinates in Polygon or MultiGeometry
        coord_matches = re.findall(r'<coordinates[^>]*>(.*?)</coordinates>', block, re.DOTALL | re.IGNORECASE)
        
        polygons = []
        for ctext in coord_matches:
            raw_pts = ctext.strip().split()
            coords = []
            for p in raw_pts:
                parts = p.split(',')
                if len(parts) >= 2:
                    try:
                        lng = float(parts[0])
                        lat = float(parts[1])
                        coords.append([lng, lat])
                    except ValueError:
                        pass
            if len(coords) >= 3:
                polygons.append(coords)
                
        if len(polygons) == 1:
            features.append({
                "type": "Feature",
                "properties": props,
                "geometry": {
                    "type": "Polygon",
                    "coordinates": polygons
                }
            })
        elif len(polygons) > 1:
            features.append({
                "type": "Feature",
                "properties": props,
                "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": [[poly] for poly in polygons]
                }
            })
            
    # If no polygons found with Placemarks, check root level coordinates
    if not features:
        coord_matches = re.findall(r'<coordinates[^>]*>(.*?)</coordinates>', kml_content, re.DOTALL | re.IGNORECASE)
        polygons = []
        for ctext in coord_matches:
            raw_pts = ctext.strip().split()
            coords = []
            for p in raw_pts:
                parts = p.split(',')
                if len(parts) >= 2:
                    try:
                        lng = float(parts[0])
                        lat = float(parts[1])
                        coords.append([lng, lat])
                    except ValueError:
                        pass
            if len(coords) >= 3:
                polygons.append(coords)
                
        if polygons:
            features.append({
                "type": "Feature",
                "properties": {"name": "Karnataka State Jurisdiction Boundary"},
                "geometry": {
                    "type": "MultiPolygon" if len(polygons) > 1 else "Polygon",
                    "coordinates": [[p] for p in polygons] if len(polygons) > 1 else polygons
                }
            })

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    os.makedirs(os.path.dirname(output_geojson_path), exist_ok=True)
    with open(output_geojson_path, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, indent=2)
        
    print(f"Successfully generated GeoJSON with {len(features)} boundary features at {output_geojson_path}")
    return True

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    kmz = os.path.join(base_dir, 'state_map', 'State.kmz')
    out = os.path.join(base_dir, 'public', 'gis', 'karnataka_state.geojson')
    convert_kmz_to_geojson(kmz, out)

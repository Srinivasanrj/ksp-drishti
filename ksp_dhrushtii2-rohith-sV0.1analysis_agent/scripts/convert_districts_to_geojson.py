import os
import zipfile
import json
import re

def convert_districts_kmz_to_geojson(kmz_path, output_geojson_path, optimize_step=4):
    print(f"Reading District KMZ from: {kmz_path}")
    if not os.path.exists(kmz_path):
        print(f"Error: {kmz_path} does not exist")
        return False

    with zipfile.ZipFile(kmz_path, 'r') as z:
        kml_files = [f for f in z.namelist() if f.endswith('.kml')]
        if not kml_files:
            print("No .kml file found in KMZ archive")
            return False
        
        kml_content = z.read(kml_files[0]).decode('utf-8', errors='ignore')

    placemark_blocks = re.findall(r'<Placemark\b[^>]*>(.*?)</Placemark>', kml_content, re.DOTALL | re.IGNORECASE)
    print(f"Found {len(placemark_blocks)} district placemarks in KML")

    features = []

    for block in placemark_blocks:
        name_match = re.search(r'<name[^>]*>(.*?)</name>', block, re.DOTALL | re.IGNORECASE)
        name = name_match.group(1).strip() if name_match else "Karnataka District"

        # Check district name in SimpleData
        simple_match = re.search(r'<SimpleData name="KGISTDistrictName">([^<]*)</SimpleData>', block, re.IGNORECASE)
        if not simple_match:
            simple_match = re.search(r'<SimpleData name="[^"]*District[^"]*">([^<]*)</SimpleData>', block, re.IGNORECASE)
            
        district_name = simple_match.group(1).strip() if simple_match else name

        props = {
            "name": district_name,
            "district_name": district_name
        }

        # Extract all SimpleData properties
        for m in re.finditer(r'<SimpleData name="([^"]+)">([^<]*)</SimpleData>', block, re.IGNORECASE):
            props[m.group(1)] = m.group(2).strip()

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

        if not polygons:
            continue

        if len(polygons) == 1:
            features.append({
                "type": "Feature",
                "properties": props,
                "geometry": {
                    "type": "Polygon",
                    "coordinates": polygons
                }
            })
        else:
            features.append({
                "type": "Feature",
                "properties": props,
                "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": [[poly] for poly in polygons]
                }
            })

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    os.makedirs(os.path.dirname(output_geojson_path), exist_ok=True)
    with open(output_geojson_path, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, indent=2)
    print(f"Saved full resolution GeoJSON with {len(features)} districts to {output_geojson_path} ({os.path.getsize(output_geojson_path):,} bytes)")

    # Generate optimized lightweight GeoJSON
    opt_path = output_geojson_path.replace('.geojson', '_optimized.geojson')
    for feat in geojson['features']:
        geom = feat['geometry']
        gtype = geom['type']
        if gtype == 'Polygon':
            new_rings = []
            for ring in geom['coordinates']:
                sampled = ring[::optimize_step]
                if sampled and ring[-1] != sampled[-1]:
                    sampled.append(ring[-1])
                if len(sampled) >= 3:
                    new_rings.append(sampled)
            geom['coordinates'] = new_rings
        elif gtype == 'MultiPolygon':
            new_polys = []
            for poly in geom['coordinates']:
                new_rings = []
                for ring in poly:
                    sampled = ring[::optimize_step]
                    if sampled and ring[-1] != sampled[-1]:
                        sampled.append(ring[-1])
                    if len(sampled) >= 3:
                        new_rings.append(sampled)
                if new_rings:
                    new_polys.append(new_rings)
            geom['coordinates'] = new_polys

    with open(opt_path, 'w', encoding='utf-8') as f:
        json.dump(geojson, f)
    print(f"Saved optimized GeoJSON to {opt_path} ({os.path.getsize(opt_path):,} bytes)")

    return True

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    kmz = os.path.join(base_dir, 'district_map', 'District.kmz')
    out = os.path.join(base_dir, 'public', 'gis', 'karnataka_districts.geojson')
    convert_districts_kmz_to_geojson(kmz, out, optimize_step=4)

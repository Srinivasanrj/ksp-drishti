import json
import os

def create_web_optimized(input_path, output_path, step=8, coord_precision=4):
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for feat in data.get('features', []):
        geom = feat.get('geometry', {})
        gtype = geom.get('type')
        if gtype == 'MultiPolygon':
            new_coords = []
            for poly in geom.get('coordinates', []):
                new_poly = []
                for ring in poly:
                    sampled = ring[::step]
                    if sampled and ring[-1] != sampled[-1]:
                        sampled.append(ring[-1])
                    if len(sampled) >= 3:
                        new_poly.append([[round(pt[0], coord_precision), round(pt[1], coord_precision)] for pt in sampled])
                if new_poly:
                    new_coords.append(new_poly)
            geom['coordinates'] = new_coords
        elif gtype == 'Polygon':
            new_coords = []
            for ring in geom.get('coordinates', []):
                sampled = ring[::step]
                if sampled and ring[-1] != sampled[-1]:
                    sampled.append(ring[-1])
                if len(sampled) >= 3:
                    new_coords.append([[round(pt[0], coord_precision), round(pt[1], coord_precision)] for pt in sampled])
            geom['coordinates'] = new_coords

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'))
    print(f"Created fast web GeoJSON at {output_path} ({os.path.getsize(output_path):,} bytes)")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full = os.path.join(base_dir, 'public', 'gis', 'karnataka_districts.geojson')
    fast = os.path.join(base_dir, 'public', 'gis', 'karnataka_districts_optimized.geojson')
    create_web_optimized(full, fast, step=12, coord_precision=4)

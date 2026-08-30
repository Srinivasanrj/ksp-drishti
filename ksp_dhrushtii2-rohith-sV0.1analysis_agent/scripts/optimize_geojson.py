import json
import os

def simplify_geojson(input_path, output_path, step=8):
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
                    # sample points
                    sampled = ring[::step]
                    if sampled and ring[-1] != sampled[-1]:
                        sampled.append(ring[-1])
                    if len(sampled) >= 3:
                        new_poly.append(sampled)
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
                    new_coords.append(sampled)
            geom['coordinates'] = new_coords
            
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f)
    print(f"Simplified geojson saved to {output_path} (size: {os.path.getsize(output_path)} bytes)")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full_geo = os.path.join(base_dir, 'public', 'gis', 'karnataka_state.geojson')
    opt_geo = os.path.join(base_dir, 'public', 'gis', 'karnataka_state_optimized.geojson')
    simplify_geojson(full_geo, opt_geo, step=10)

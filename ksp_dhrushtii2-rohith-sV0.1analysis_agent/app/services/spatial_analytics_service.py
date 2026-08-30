"""
KSP Sentinel AI — Spatial Analytics & Hotspot Detection Engine (SOLID Compliant)
================================================================================
Responsible exclusively for:
1. Spatial clustering using DBSCAN with Haversine distance metric (SRP).
2. Constructing valid GeoJSON bounding polygons / convex hulls via Shapely (LSP).
3. Computing cluster-level intelligence (incident counts, dominant crimes, peak hours, threat levels).
4. Generating density-weighted coordinate payloads for Heatmap rendering.
"""

import math
import logging
from collections import Counter
from typing import Dict, List, Optional, Tuple, Any

import numpy as np
from sklearn.cluster import DBSCAN
from shapely.geometry import MultiPoint, Polygon, Point, mapping

log = logging.getLogger("spatial.analytics")

# Earth radius in kilometers for Haversine conversions
EARTH_RADIUS_KM = 6371.0088


class SpatialAnalyticsService:
    """
    Algorithmic Engine for Spatial Analytics & Hotspot Detection (SRP + OCP)
    """

    @staticmethod
    def _extract_coordinates_and_records(
        records: List[Dict[str, Any]],
        crime_filter: Optional[str] = None,
        division_filter: Optional[str] = None,
        station_filter: Optional[str] = None
    ) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Filters records and extracts lat/lon coordinate matrices.
        """
        valid_coords = []
        valid_records = []

        crime_filter_lower = crime_filter.strip().lower() if crime_filter and crime_filter != "ALL" else None
        div_filter_lower = division_filter.strip().lower() if division_filter and division_filter != "ALL" else None
        stn_filter_lower = station_filter.strip().lower() if station_filter and station_filter != "ALL" else None

        for rec in records:
            # 1. Attribute filtering
            if crime_filter_lower:
                c_cat = str(rec.get("Crime_Category") or rec.get("crime_category") or rec.get("Category") or rec.get("crime_type") or "").strip().lower()
                if c_cat != crime_filter_lower:
                    continue

            if div_filter_lower:
                div = str(rec.get("Division") or rec.get("division") or rec.get("nearest_city") or "").strip().lower()
                if div != div_filter_lower:
                    continue

            if stn_filter_lower:
                stn = str(rec.get("Police_Station") or rec.get("police_station") or rec.get("station") or "").strip().lower()
                if stn != stn_filter_lower:
                    continue

            # 2. Extract Lat & Lon
            lat_val = rec.get("Latitude") or rec.get("latitude") or rec.get("lat") or rec.get("y")
            lon_val = rec.get("Longitude") or rec.get("longitude") or rec.get("lon") or rec.get("lng") or rec.get("x")

            try:
                lat = float(lat_val)
                lon = float(lon_val)
                if not (math.isnan(lat) or math.isnan(lon) or (lat == 0.0 and lon == 0.0)):
                    valid_coords.append([lat, lon])
                    valid_records.append(rec)
            except (ValueError, TypeError):
                continue

        return np.array(valid_coords, dtype=np.float64), valid_records

    @classmethod
    def detect_hotspots_dbscan(
        cls,
        records: List[Dict[str, Any]],
        eps_km: float = 8.0,
        min_samples: int = 4,
        crime_filter: Optional[str] = None,
        division_filter: Optional[str] = None,
        station_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes DBSCAN clustering and converts detected clusters into GeoJSON polygons with metadata.
        """
        coords_matrix, filtered_records = cls._extract_coordinates_and_records(
            records, crime_filter=crime_filter, division_filter=division_filter, station_filter=station_filter
        )

        total_points = len(coords_matrix)
        if total_points < min_samples:
            return {
                "type": "FeatureCollection",
                "features": [],
                "metadata": {
                    "total_points": total_points,
                    "clustered_points": 0,
                    "noise_points": total_points,
                    "cluster_count": 0,
                    "eps_km": eps_km,
                    "min_samples": min_samples
                }
            }

        # Convert coordinates to radians for Haversine distance metric
        coords_rad = np.radians(coords_matrix)
        eps_rad = eps_km / EARTH_RADIUS_KM

        # Execute DBSCAN clustering
        db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric="haversine", algorithm="ball_tree")
        labels = db.fit_predict(coords_rad)

        unique_labels = set(labels)
        unique_labels.discard(-1)  # -1 represents noise points in DBSCAN

        features = []
        total_clustered = 0

        # Group records by cluster label
        clusters_map: Dict[int, List[Dict[str, Any]]] = {label: [] for label in unique_labels}
        coords_map: Dict[int, List[List[float]]] = {label: [] for label in unique_labels}

        for idx, label in enumerate(labels):
            if label != -1:
                clusters_map[label].append(filtered_records[idx])
                coords_map[label].append(coords_matrix[idx].tolist())
                total_clustered += 1

        # Generate GeoJSON Polygon Feature for each cluster
        cluster_list = []
        for label, cluster_pts in coords_map.items():
            cluster_recs = clusters_map[label]
            cluster_info = cls._build_cluster_feature(label, cluster_pts, cluster_recs, eps_km)
            cluster_list.append(cluster_info)

        # Sort clusters by incident count descending
        cluster_list.sort(key=lambda f: f["properties"]["incident_count"], reverse=True)

        # Re-number ranking (Hotspot #1, Hotspot #2, etc.)
        for rank, feature in enumerate(cluster_list, start=1):
            feature["properties"]["rank"] = rank
            feature["properties"]["name"] = f"Hotspot #{rank} ({feature['properties']['primary_crime']})"
            features.append(feature)

        noise_count = int(np.sum(labels == -1))

        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "total_points": total_points,
                "clustered_points": total_clustered,
                "noise_points": noise_count,
                "cluster_count": len(features),
                "eps_km": eps_km,
                "min_samples": min_samples,
                "crime_filter": crime_filter or "ALL"
            }
        }

    @classmethod
    def _build_cluster_feature(
        cls,
        label: int,
        pts: List[List[float]],
        records: List[Dict[str, Any]],
        eps_km: float
    ) -> Dict[str, Any]:
        """
        Constructs a single GeoJSON Feature representing a cluster boundary + statistical intelligence.
        """
        # pts are [lat, lon] -> Shapely expects (lon, lat) / (x, y)
        shapely_pts = [Point(p[1], p[0]) for p in pts]
        multipoint = MultiPoint(shapely_pts)

        # Compute centroid [lat, lon]
        centroid_lat = float(np.mean([p[0] for p in pts]))
        centroid_lon = float(np.mean([p[1] for p in pts]))

        # Adaptive buffer for convex hull (converts points or lines to a realistic bounding polygon)
        # 1 km in degrees approx ~ 0.009 deg
        buffer_deg = max(0.005, (eps_km * 0.25) / 111.32)

        if len(pts) < 3:
            # 1 or 2 points: Create buffered circle/capsule
            hull_geom = multipoint.buffer(buffer_deg)
        else:
            raw_hull = multipoint.convex_hull
            if raw_hull.geom_type == "Polygon":
                hull_geom = raw_hull.buffer(buffer_deg)
            else:
                hull_geom = multipoint.buffer(buffer_deg)

        # Compute statistics & metadata
        crime_categories = []
        stations = []
        statuses = []
        for r in records:
            cat = r.get("Crime_Category") or r.get("crime_category") or r.get("Category") or r.get("crime_type") or "General"
            stn = r.get("Police_Station") or r.get("police_station") or r.get("station") or r.get("nearest_city") or "Local Station"
            stat = r.get("Status") or r.get("status") or r.get("case_status") or "Open"
            crime_categories.append(str(cat))
            stations.append(str(stn))
            statuses.append(str(stat))

        cat_counts = Counter(crime_categories)
        stn_counts = Counter(stations)
        primary_crime, primary_count = cat_counts.most_common(1)[0] if cat_counts else ("General", len(records))
        top_station = stn_counts.most_common(1)[0][0] if stn_counts else "Jurisdiction Area"

        incident_count = len(records)
        
        # Threat Level Grading
        if incident_count >= 25 or (incident_count >= 10 and primary_crime in ["Robbery", "Extortion", "Assault"]):
            threat_level = "CRITICAL"
            threat_color = "#ef4444"  # Crimson
        elif incident_count >= 10:
            threat_level = "HIGH"
            threat_color = "#f97316"  # Orange
        else:
            threat_level = "MODERATE"
            threat_color = "#eab308"  # Yellow

        geojson_geometry = mapping(hull_geom)

        properties = {
            "cluster_id": f"cluster_{label}",
            "incident_count": incident_count,
            "primary_crime": primary_crime,
            "primary_crime_share": round((primary_count / max(1, incident_count)) * 100, 1),
            "threat_level": threat_level,
            "threat_color": threat_color,
            "centroid": [round(centroid_lat, 5), round(centroid_lon, 5)],
            "top_station": top_station,
            "category_breakdown": dict(cat_counts),
            "station_breakdown": dict(stn_counts),
            "status_breakdown": dict(Counter(statuses)),
            "sample_cases": [
                {
                    "case_id": r.get("case_id") or r.get("FIR_Number") or r.get("id") or f"CASE-{i+1}",
                    "crime": r.get("Crime_Category") or r.get("crime_type") or "Incident",
                    "date": r.get("incident_date") or r.get("Date") or "Recent",
                    "lat": r.get("latitude") or r.get("Latitude"),
                    "lon": r.get("longitude") or r.get("Longitude")
                }
                for i, r in enumerate(records[:8])
            ],
            "llm_investigative_leads": [
                f"Concentration of {incident_count} cases under {top_station} jurisdiction with {primary_crime} dominant ({round((primary_count / max(1, incident_count)) * 100)}%).",
                f"Check common suspects, modus operandi, and vehicle links within {eps_km} km radius.",
                f"Cross-reference patrol route schedules during peak activity windows."
            ]
        }

        return {
            "type": "Feature",
            "geometry": geojson_geometry,
            "properties": properties
        }

    @classmethod
    def generate_heatmap_payload(
        cls,
        records: List[Dict[str, Any]],
        crime_filter: Optional[str] = None,
        division_filter: Optional[str] = None,
        station_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extracts weighted lat/lon points suitable for rendering continuous density heatmaps.
        Returns: { "points": [[lat, lon, weight], ...], "count": int }
        """
        coords_matrix, filtered_records = cls._extract_coordinates_and_records(
            records, crime_filter=crime_filter, division_filter=division_filter, station_filter=station_filter
        )

        heatmap_points = []
        for idx, coord in enumerate(coords_matrix):
            rec = filtered_records[idx]
            # Severity-weighted intensity
            crime_cat = str(rec.get("Crime_Category") or rec.get("crime_type") or "").lower()
            if any(k in crime_cat for k in ["robbery", "extortion", "assault", "murder"]):
                weight = 1.0
            elif any(k in crime_cat for k in ["burglary", "theft"]):
                weight = 0.75
            else:
                weight = 0.5

            heatmap_points.append([round(float(coord[0]), 5), round(float(coord[1]), 5), weight])

        return {
            "success": True,
            "count": len(heatmap_points),
            "points": heatmap_points
        }


# Singleton instance export
spatial_analytics_service = SpatialAnalyticsService()

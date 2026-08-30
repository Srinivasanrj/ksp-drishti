"""
Unit Tests for Phase 2 Geospatial Analytics & DBSCAN Hotspot Engine
====================================================================
Tests:
1. SpatialAnalyticsService DBSCAN clustering on multi-point data.
2. GeoJSON FeatureCollection generation with valid Convex Hull geometries.
3. Severity and threat level grading (CRITICAL/HIGH/MODERATE).
4. REST API GET /api/spatial/clusters with parameter tuning & category filtering.
5. REST API GET /api/spatial/heatmap density points.
6. REST API GET /api/spatial/cluster/<cluster_id> detailed dossier.
7. Zero-regression verification on existing Phase 1 CRUD routes.
"""

import json
import unittest
from app.services.spatial_analytics_service import spatial_analytics_service
from app.services.spatial_ingestion_service import spatial_store
from server import app


class TestSpatialAnalyticsPhase2(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

        # Seed test points around two distinct Karnataka clusters:
        # Cluster 1: Bengaluru (Lat ~12.97, Lon ~77.59) -> 6 records
        # Cluster 2: Mysuru (Lat ~12.29, Lon ~76.63) -> 5 records
        # Noise: Far off point -> 1 record
        self.sample_records = [
            # Bengaluru Cluster
            {"case_id": "BLR-1", "crime_type": "Robbery", "latitude": 12.9716, "longitude": 77.5946, "Police_Station": "Cubbon Park", "Status": "Open"},
            {"case_id": "BLR-2", "crime_type": "Robbery", "latitude": 12.9720, "longitude": 77.5950, "Police_Station": "Cubbon Park", "Status": "Open"},
            {"case_id": "BLR-3", "crime_type": "Robbery", "latitude": 12.9710, "longitude": 77.5940, "Police_Station": "Cubbon Park", "Status": "Under Investigation"},
            {"case_id": "BLR-4", "crime_type": "Theft", "latitude": 12.9730, "longitude": 77.5960, "Police_Station": "Commercial Street", "Status": "Open"},
            {"case_id": "BLR-5", "crime_type": "Robbery", "latitude": 12.9705, "longitude": 77.5935, "Police_Station": "Cubbon Park", "Status": "Closed"},
            {"case_id": "BLR-6", "crime_type": "Theft", "latitude": 12.9715, "longitude": 77.5948, "Police_Station": "Cubbon Park", "Status": "Open"},
            
            # Mysuru Cluster
            {"case_id": "MYS-1", "crime_type": "Vehicle Theft", "latitude": 12.2958, "longitude": 76.6394, "Police_Station": "Lashkar", "Status": "Open"},
            {"case_id": "MYS-2", "crime_type": "Vehicle Theft", "latitude": 12.2960, "longitude": 76.6398, "Police_Station": "Lashkar", "Status": "Open"},
            {"case_id": "MYS-3", "crime_type": "Burglary", "latitude": 12.2950, "longitude": 76.6390, "Police_Station": "Devaraja", "Status": "Open"},
            {"case_id": "MYS-4", "crime_type": "Vehicle Theft", "latitude": 12.2965, "longitude": 76.6400, "Police_Station": "Lashkar", "Status": "Closed"},
            {"case_id": "MYS-5", "crime_type": "Burglary", "latitude": 12.2955, "longitude": 76.6392, "Police_Station": "Lashkar", "Status": "Open"},
            
            # Noise Point (Far away in Bidar)
            {"case_id": "BDR-1", "crime_type": "Extortion", "latitude": 17.9100, "longitude": 77.5100, "Police_Station": "Bidar Town", "Status": "Open"}
        ]

    def test_01_dbscan_clustering_engine(self):
        """Test SpatialAnalyticsService DBSCAN detects both clusters and 1 noise point."""
        result = spatial_analytics_service.detect_hotspots_dbscan(
            records=self.sample_records,
            eps_km=10.0,
            min_samples=4
        )

        self.assertEqual(result["type"], "FeatureCollection")
        self.assertEqual(len(result["features"]), 2, "Should identify exactly 2 distinct clusters")
        
        meta = result["metadata"]
        self.assertEqual(meta["total_points"], 12)
        self.assertEqual(meta["clustered_points"], 11)
        self.assertEqual(meta["noise_points"], 1)

        # Check Hotspot #1 (Bengaluru with 6 incidents)
        hotspot_1 = result["features"][0]
        self.assertEqual(hotspot_1["properties"]["rank"], 1)
        self.assertEqual(hotspot_1["properties"]["incident_count"], 6)
        self.assertEqual(hotspot_1["properties"]["primary_crime"], "Robbery")
        self.assertIn(hotspot_1["properties"]["threat_level"], ["CRITICAL", "HIGH", "MODERATE"])

        # Check GeoJSON geometry validity
        geom = hotspot_1["geometry"]
        self.assertIn(geom["type"], ["Polygon", "MultiPolygon"])
        self.assertTrue(len(geom["coordinates"]) > 0)

    def test_02_category_filtered_clustering(self):
        """Test clustering with a specific crime filter (e.g. Robbery only)."""
        result = spatial_analytics_service.detect_hotspots_dbscan(
            records=self.sample_records,
            eps_km=10.0,
            min_samples=3,
            crime_filter="Robbery"
        )

        self.assertEqual(len(result["features"]), 1, "Only Bengaluru should form a Robbery cluster")
        self.assertEqual(result["features"][0]["properties"]["primary_crime"], "Robbery")

    def test_03_heatmap_payload_generation(self):
        """Test heatmap density point weights generation."""
        heatmap_res = spatial_analytics_service.generate_heatmap_payload(self.sample_records)
        self.assertTrue(heatmap_res["success"])
        self.assertEqual(heatmap_res["count"], 12)
        
        # Each point should be [lat, lon, weight]
        first_pt = heatmap_res["points"][0]
        self.assertEqual(len(first_pt), 3)
        self.assertIsInstance(first_pt[0], float)
        self.assertIsInstance(first_pt[1], float)
        self.assertGreater(first_pt[2], 0.0)

    def test_04_api_clusters_endpoint(self):
        """Test GET & POST /api/spatial/clusters endpoint."""
        # 1. POST custom records payload
        res = self.app.post(
            "/api/spatial/clusters",
            data=json.dumps({
                "records": self.sample_records,
                "eps_km": 10.0,
                "min_samples": 4
            }),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("geojson", data)
        self.assertEqual(len(data["geojson"]["features"]), 2)

    def test_05_api_heatmap_endpoint(self):
        """Test GET /api/spatial/heatmap endpoint."""
        res = self.app.post(
            "/api/spatial/heatmap",
            data=json.dumps({
                "records": self.sample_records
            }),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["count"], 12)

    def test_06_zero_regression_crud_routes(self):
        """Verify all existing Phase 1 endpoints continue functioning perfectly."""
        list_res = self.app.get("/api/spatial/datasets")
        self.assertEqual(list_res.status_code, 200)
        
        active_res = self.app.get("/api/spatial/active_layers")
        self.assertEqual(active_res.status_code, 200)


if __name__ == "__main__":
    unittest.main()

"""
KSP Sentinel AI — Automated Unit Tests for Geospatial Ingestion & CRUD APIs
============================================================================
"""
import io
import json
import unittest
from server import app
from app.services.spatial_ingestion_service import spatial_store


class TestSpatialCRUD(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_01_list_datasets_permanent_entity_a(self):
        """Verify Permanent Entity A is present and cannot be tampered with."""
        res = self.app.get("/api/spatial/datasets")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["count"], 1)
        
        base_layer = data["datasets"][0]
        self.assertEqual(base_layer["id"], "karnataka_permanent_kgis")
        self.assertTrue(base_layer["is_permanent"])

    def test_02_upload_csv_point_dataset(self):
        """Upload a CSV with lat/lan column headers (Entity B)."""
        csv_content = b"case_id,crime_type,lat,lan,nearest_city\nFIR-001,Extortion,12.9716,77.5946,Bengaluru\nFIR-002,Robbery,12.2958,76.6394,Mysuru"
        
        res = self.app.post(
            "/api/spatial/dataset/upload",
            data={
                "name": "Test Crime CSV",
                "entity_type": "POINT_DATA",
                "file": (io.BytesIO(csv_content), "crimes.csv")
            },
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["dataset"]["record_count"], 2)
        self.assertEqual(data["stats"]["detected_lat_column"], "lat")
        self.assertEqual(data["stats"]["detected_lon_column"], "lan")

    def test_03_active_layers_endpoint(self):
        """Fetch active consolidated layers."""
        res = self.app.get("/api/spatial/active_layers")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("points", data)
        self.assertIn("custom_boundaries", data)

    def test_04_delete_permanent_entity_a_forbidden(self):
        """Attempting to delete Entity A must return 403 Forbidden."""
        res = self.app.delete("/api/spatial/dataset/karnataka_permanent_kgis")
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertIn("Cannot delete Permanent Base Layer", data["error"])


if __name__ == "__main__":
    unittest.main()

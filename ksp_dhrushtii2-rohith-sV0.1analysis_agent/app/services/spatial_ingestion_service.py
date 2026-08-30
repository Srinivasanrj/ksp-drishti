"""
KSP Sentinel AI — Geospatial Ingestion & Multi-Entity Spatial Store (SOLID Compliant)
===================================================================================
Handles multi-format geospatial ingestion, coordinate extraction, attribute preservation,
and in-memory dataset management with clear separation between:
- ENTITY A: Permanent Base Layer (Karnataka State & 30 KGIS District Boundaries)
- ENTITY B: Analytical Point Data (CSV / Excel / JSON Incident Records for Point Mapping)
- ENTITY C: Custom Boundary Polygons (User-uploaded KML / KMZ / GeoJSON Boundary Overlays)

SOLID Architecture:
- SRP: Distinct parsers for Tabular Point Data vs Vector Boundary Polygons
- OCP: Extensible parser dispatch registry for new formats without modifying core logic
- LSP: Standardized DatasetEntity contract returned for all parsed layers
- ISP: Clean granular CRUD interface for frontend consumption
- DIP: Decoupled from Flask routing; easily testable in standalone CLI / unit tests
"""

import io
import json
import logging
import os
import re
import time
import uuid
import zipfile
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple, Any

import pandas as pd

log = logging.getLogger("spatial.ingestion")

# ── Coordinate Column Matching Signatures (Smart Sniffer) ──────────────────────
LAT_CANDIDATES = ["latitude", "lat", "lat_deg", "y", "y_coord", "latitude_deg", "location_lat"]
LON_CANDIDATES = ["longitude", "lon", "lng", "lan", "long", "x", "x_coord", "lon_deg", "location_lon", "location_lng"]


class SpatialDatasetEntity:
    """
    Standardized Data Entity Contract (LSP)
    """
    def __init__(
        self,
        dataset_id: str,
        name: str,
        entity_type: str,  # 'POINT_DATA' | 'CUSTOM_BOUNDARY' | 'BASE_LAYER'
        record_count: int,
        attributes: List[str],
        data: Any,
        is_permanent: bool = False,
        is_active: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.id = dataset_id
        self.name = name
        self.entity_type = entity_type
        self.record_count = record_count
        self.attributes = attributes
        self.data = data
        self.is_permanent = is_permanent
        self.is_active = is_active
        self.created_at = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        self.metadata = metadata or {}

    def to_dict(self, include_raw_data: bool = False) -> Dict[str, Any]:
        payload = {
            "id": self.id,
            "name": self.name,
            "entity_type": self.entity_type,
            "record_count": self.record_count,
            "attributes": self.attributes,
            "is_permanent": self.is_permanent,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "metadata": self.metadata
        }
        if include_raw_data:
            payload["data"] = self.data
        return payload


class SpatialIngestionService:
    """
    Ingestion Engine for Multi-Format Geospatial Data (SRP + OCP)
    """

    @staticmethod
    def _detect_coordinate_columns(columns: List[str]) -> Tuple[Optional[str], Optional[str]]:
        """
        Sniff column headers to automatically identify latitude and longitude.
        """
        cols_lower = {c.strip().lower(): c for c in columns}
        
        # 1. Exact match pass
        lat_col = None
        lon_col = None
        for candidate in LAT_CANDIDATES:
            if candidate in cols_lower:
                lat_col = cols_lower[candidate]
                break

        for candidate in LON_CANDIDATES:
            if candidate in cols_lower:
                col_name = cols_lower[candidate]
                if col_name != lat_col:
                    lon_col = col_name
                    break

        # 2. Substring fuzzy pass if exact match fails
        if not lat_col:
            for c_lower, orig in cols_lower.items():
                if any(cand in c_lower for cand in ["lat", "y_pos", "y_coord"]):
                    lat_col = orig
                    break

        if not lon_col:
            for c_lower, orig in cols_lower.items():
                if orig != lat_col and any(cand in c_lower for cand in ["lon", "lng", "lan", "x_pos", "x_coord"]):
                    lon_col = orig
                    break

        return lat_col, lon_col

    @classmethod
    def parse_tabular_point_data(
        cls,
        file_bytes: bytes,
        filename: str
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        ENTITY B: Ingest CSV / Excel / TSV files containing point coordinates.
        Preserves all extra tabular columns for drilldown analysis charts.
        """
        filename_lower = filename.lower()
        if filename_lower.endswith(".csv") or filename_lower.endswith(".tsv"):
            delimiter = "\t" if filename_lower.endswith(".tsv") else ","
            df = pd.read_csv(io.BytesIO(file_bytes), sep=delimiter)
        elif filename_lower.endswith(".xlsx") or filename_lower.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(file_bytes))
        elif filename_lower.endswith(".json"):
            data_json = json.loads(file_bytes.decode("utf-8", errors="replace"))
            df = pd.DataFrame(data_json if isinstance(data_json, list) else [data_json])
        else:
            # Fallback to standard CSV
            df = pd.read_csv(io.BytesIO(file_bytes))

        columns = list(df.columns)
        lat_col, lon_col = cls._detect_coordinate_columns(columns)

        if not lat_col or not lon_col:
            raise ValueError(
                f"Could not auto-detect coordinate columns in '{filename}'. "
                f"Available headers: {columns}. Please include 'latitude'/'longitude' or 'lat'/'lon'."
            )

        parsed_records: List[Dict[str, Any]] = []
        skipped_count = 0

        for idx, row in df.iterrows():
            try:
                lat_val = float(row[lat_col])
                lon_val = float(row[lon_col])

                # Validate geographic bounding box (Karnataka approx: Lat 11.5-18.5, Lon 74.0-78.6, or general global)
                if pd.isna(lat_val) or pd.isna(lon_val) or abs(lat_val) > 90 or abs(lon_val) > 180:
                    skipped_count += 1
                    continue

                # Build record preserving all metadata attributes
                rec = {
                    "id": f"REC-{idx+1:05d}",
                    "latitude": lat_val,
                    "longitude": lon_val,
                    "Latitude": lat_val,
                    "Longitude": lon_val
                }

                for col in columns:
                    val = row[col]
                    clean_val = None if pd.isna(val) else (str(val) if not isinstance(val, (int, float, bool)) else val)
                    rec[col] = clean_val

                # Canonical standard aliases for UI seamless compatibility
                if "crime_category" not in rec and "Crime_Category" not in rec:
                    for k in ["category", "Category", "crime_type", "Type", "Offence"]:
                        if k in rec and rec[k]:
                            rec["Crime_Category"] = str(rec[k])
                            break

                if "police_station" not in rec and "Police_Station" not in rec:
                    for k in ["station", "Station", "ps_name", "PoliceStation", "Jurisdiction"]:
                        if k in rec and rec[k]:
                            rec["Police_Station"] = str(rec[k])
                            break

                if "status" not in rec and "Status" not in rec:
                    for k in ["case_status", "State", "Disposition"]:
                        if k in rec and rec[k]:
                            rec["Status"] = str(rec[k])
                            break

                parsed_records.append(rec)
            except Exception as e:
                skipped_count += 1
                continue

        stats = {
            "total_rows": len(df),
            "parsed_records": len(parsed_records),
            "skipped_records": skipped_count,
            "detected_lat_column": lat_col,
            "detected_lon_column": lon_col,
            "columns": columns
        }

        return parsed_records, stats

    @classmethod
    def parse_vector_boundary_data(
        cls,
        file_bytes: bytes,
        filename: str
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        ENTITY C: Ingest KML / KMZ / GeoJSON custom boundary vector layers.
        Converts to web-standard GeoJSON FeatureCollection.
        """
        filename_lower = filename.lower()

        # 1. GeoJSON direct ingest
        if filename_lower.endswith(".geojson") or (filename_lower.endswith(".json") and b"FeatureCollection" in file_bytes[:1000]):
            geojson_data = json.loads(file_bytes.decode("utf-8", errors="replace"))
            features = geojson_data.get("features", [])
            stats = {
                "format": "GeoJSON",
                "feature_count": len(features),
                "type": geojson_data.get("type", "FeatureCollection")
            }
            return geojson_data, stats

        # 2. KMZ Zip unpack
        kml_content = None
        if filename_lower.endswith(".kmz") or file_bytes[:2] == b"PK":
            try:
                with zipfile.ZipFile(io.BytesIO(file_bytes), "r") as z:
                    for zname in z.namelist():
                        if zname.lower().endswith(".kml"):
                            kml_content = z.read(zname)
                            break
            except Exception as e:
                log.warning(f"KMZ unzip failed, attempting raw KML parse: {e}")

        if kml_content is None:
            kml_content = file_bytes

        # 3. KML XML Parsing to GeoJSON
        try:
            root = ET.fromstring(kml_content)
        except Exception as e:
            raise ValueError(f"Failed to parse XML from KML content: {e}")

        # Namespaces handling
        ns = {"kml": "http://www.opengis.net/kml/2.2"}
        # Check if default namespace without prefix
        m = re.match(r"\{(.*)\}", root.tag)
        if m:
            ns = {"kml": m.group(1)}

        features = []
        placemarks = root.findall(".//kml:Placemark", ns) or root.findall(".//Placemark")

        for idx, pm in enumerate(placemarks):
            name_el = pm.find("kml:name", ns) or pm.find("name")
            name = name_el.text.strip() if name_el is not None and name_el.text else f"Boundary_{idx+1}"

            desc_el = pm.find("kml:description", ns) or pm.find("description")
            desc = desc_el.text.strip() if desc_el is not None and desc_el.text else ""

            # Extract Polygon coordinates
            poly_el = pm.find(".//kml:Polygon", ns) or pm.find(".//Polygon")
            if poly_el is not None:
                coords_el = poly_el.find(".//kml:coordinates", ns) or poly_el.find(".//coordinates")
                if coords_el is not None and coords_el.text:
                    coord_text = coords_el.text.strip()
                    ring = []
                    for pair in coord_text.split():
                        parts = pair.strip().split(",")
                        if len(parts) >= 2:
                            try:
                                lon = float(parts[0])
                                lat = float(parts[1])
                                ring.append([lon, lat])
                            except ValueError:
                                continue
                    if ring:
                        features.append({
                            "type": "Feature",
                            "properties": {
                                "name": name,
                                "description": desc,
                                "layer_type": "custom_boundary_polygon"
                            },
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [ring]
                            }
                        })
            else:
                # Extract LineString or Point if Polygon not present
                line_el = pm.find(".//kml:LineString", ns) or pm.find(".//LineString")
                if line_el is not None:
                    coords_el = line_el.find(".//kml:coordinates", ns) or line_el.find(".//coordinates")
                    if coords_el is not None and coords_el.text:
                        line_coords = []
                        for pair in coords_el.text.strip().split():
                            parts = pair.strip().split(",")
                            if len(parts) >= 2:
                                try:
                                    line_coords.append([float(parts[0]), float(parts[1])])
                                except ValueError:
                                    continue
                        if line_coords:
                            features.append({
                                "type": "Feature",
                                "properties": {"name": name, "description": desc},
                                "geometry": {"type": "LineString", "coordinates": line_coords}
                            })

        geojson_out = {
            "type": "FeatureCollection",
            "features": features
        }

        stats = {
            "format": "KML/KMZ",
            "placemarks_found": len(placemarks),
            "features_extracted": len(features)
        }

        return geojson_out, stats


class SpatialDatasetStore:
    """
    In-Memory Multi-Tenant Spatial Store with CRUD Operations (ISP + SRP)
    Ensures Entity A (Karnataka Base Map) remains locked, permanent, and persistent.
    """
    def __init__(self):
        self._datasets: Dict[str, SpatialDatasetEntity] = {}
        self._init_permanent_entities()

    def _init_permanent_entities(self):
        """
        ENTITY A: Hard-mount permanent Karnataka Base Map and District Polygons
        """
        base_entity = SpatialDatasetEntity(
            dataset_id="karnataka_permanent_kgis",
            name="Karnataka 30 KGIS District Boundary Layer (Official)",
            entity_type="BASE_LAYER",
            record_count=30,
            attributes=["District_Name", "KGIS_ID", "Division", "HQ"],
            data={"source": "/gis/karnataka_districts.geojson"},
            is_permanent=True,
            is_active=True,
            metadata={"status": "LOCKED_PERMANENT", "jurisdiction": "Karnataka State Police"}
        )
        self._datasets[base_entity.id] = base_entity

        # Auto-seed live analytical point data from karnataka_synthetic_crimes.csv if present
        csv_path = "karnataka_synthetic_crimes.csv"
        if os.path.exists(csv_path):
            try:
                with open(csv_path, "rb") as f:
                    csv_bytes = f.read()
                records, stats = SpatialIngestionService.parse_tabular_point_data(csv_bytes, "karnataka_synthetic_crimes.csv")
                seed_entity = SpatialDatasetEntity(
                    dataset_id="ds_karnataka_crimes_seed",
                    name="Karnataka Statewide Incident Feed (500 Records)",
                    entity_type="POINT_DATA",
                    record_count=len(records),
                    attributes=stats.get("columns", []),
                    data=records,
                    is_permanent=False,
                    is_active=True,
                    metadata={
                        "filename": "karnataka_synthetic_crimes.csv",
                        "stats": stats,
                        "lat_col": stats.get("detected_lat_column"),
                        "lon_col": stats.get("detected_lon_column")
                    }
                )
                self._datasets[seed_entity.id] = seed_entity
                log.info(f"Auto-seeded initial spatial dataset [{seed_entity.id}] with {len(records)} incidents.")
            except Exception as e:
                log.warning(f"Could not auto-seed synthetic crime dataset: {e}")

    def list_datasets(self) -> List[Dict[str, Any]]:
        """
        List all active and inactive datasets.
        """
        return [ds.to_dict(include_raw_data=False) for ds in self._datasets.values()]

    def get_dataset(self, dataset_id: str, include_raw_data: bool = True) -> Optional[Dict[str, Any]]:
        """
        Retrieve a single dataset by ID with full data payload.
        """
        entity = self._datasets.get(dataset_id)
        if not entity:
            return None
        return entity.to_dict(include_raw_data=include_raw_data)

    def create_dataset(
        self,
        name: str,
        entity_type: str,
        raw_content: bytes,
        filename: str
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Ingest and register a new dataset (Entity B or Entity C).
        """
        dataset_id = f"ds_{uuid.uuid4().hex[:8]}"

        if entity_type == "POINT_DATA":
            records, stats = SpatialIngestionService.parse_tabular_point_data(raw_content, filename)
            attributes = stats.get("columns", [])
            entity = SpatialDatasetEntity(
                dataset_id=dataset_id,
                name=name or filename,
                entity_type="POINT_DATA",
                record_count=len(records),
                attributes=attributes,
                data=records,
                is_permanent=False,
                is_active=True,
                metadata={
                    "filename": filename,
                    "stats": stats,
                    "lat_col": stats.get("detected_lat_column"),
                    "lon_col": stats.get("detected_lon_column")
                }
            )
        elif entity_type == "CUSTOM_BOUNDARY":
            geojson_data, stats = SpatialIngestionService.parse_vector_boundary_data(raw_content, filename)
            features = geojson_data.get("features", [])
            entity = SpatialDatasetEntity(
                dataset_id=dataset_id,
                name=name or filename,
                entity_type="CUSTOM_BOUNDARY",
                record_count=len(features),
                attributes=["name", "layer_type"],
                data=geojson_data,
                is_permanent=False,
                is_active=True,
                metadata={"filename": filename, "stats": stats}
            )
        else:
            raise ValueError(f"Unknown entity_type: '{entity_type}'. Must be 'POINT_DATA' or 'CUSTOM_BOUNDARY'.")

        self._datasets[dataset_id] = entity
        log.info(f"Registered Spatial Dataset [{dataset_id}] '{entity.name}' ({entity.entity_type}) with {entity.record_count} items.")
        return entity.to_dict(include_raw_data=True), stats

    def toggle_dataset_active(self, dataset_id: str, is_active: bool) -> Optional[Dict[str, Any]]:
        """
        Toggle visibility state for layer overlapping.
        """
        entity = self._datasets.get(dataset_id)
        if not entity:
            return None
        entity.is_active = is_active
        return entity.to_dict(include_raw_data=False)

    def delete_dataset(self, dataset_id: str) -> bool:
        """
        CRUD Delete. Prevents deleting Permanent Entity A.
        """
        entity = self._datasets.get(dataset_id)
        if not entity:
            return False
        if entity.is_permanent:
            raise PermissionError("Cannot delete Permanent Base Layer (Entity A: Karnataka KGIS Boundaries).")

        del self._datasets[dataset_id]
        log.info(f"Deleted Spatial Dataset [{dataset_id}] from memory store.")
        return True


# Global Singleton Instance (SOLID: DIP)
spatial_store = SpatialDatasetStore()

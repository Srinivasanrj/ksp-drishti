"""
KSP Sentinel AI — Spatial Ingestion & Layer Management Blueprint (SOLID Compliant)
==================================================================================
Exposes RESTful endpoints for CRUD management of multi-entity geospatial datasets:
- POST /api/spatial/dataset/upload (Upload CSV, Excel, KML, KMZ, GeoJSON)
- GET  /api/spatial/datasets (List all active/inactive datasets)
- GET  /api/spatial/dataset/<id> (Fetch dataset records / geometries)
- PATCH /api/spatial/dataset/<id>/toggle (Toggle dataset active state)
- DELETE /api/spatial/dataset/<id> (Delete custom dataset)
- GET  /api/spatial/active_layers (Fetch combined payload of active point + boundary layers)
"""

import logging
from typing import Optional, List, Dict, Any
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename

from app.services.spatial_ingestion_service import spatial_store
from app.services.spatial_analytics_service import spatial_analytics_service

log = logging.getLogger("spatial.blueprint")

spatial_bp = Blueprint("spatial", __name__, url_prefix="/api/spatial")


def _get_active_point_records(dataset_id: Optional[str] = None) -> list:
    """Helper to collect all active point records for analytics."""
    if dataset_id:
        ds = spatial_store.get_dataset(dataset_id, include_raw_data=True)
        if ds and ds.get("entity_type") == "POINT_DATA":
            return ds.get("data", [])
        return []

    records = []
    for ds_summary in spatial_store.list_datasets():
        if not ds_summary.get("is_active", False):
            continue
        ds = spatial_store.get_dataset(ds_summary["id"], include_raw_data=True)
        if ds and ds.get("entity_type") == "POINT_DATA":
            for r in ds.get("data", []):
                r["_dataset_id"] = ds["id"]
                r["_dataset_name"] = ds["name"]
                records.append(r)
    return records


@spatial_bp.route("/clusters", methods=["GET", "POST"])
def get_spatial_clusters():
    """
    GET / POST /api/spatial/clusters
    Calculates DBSCAN spatial clusters and returns GeoJSON FeatureCollection with cluster metadata.
    Query params:
    - eps_km: Distance threshold in kilometers (default 8.0)
    - min_samples: Minimum points to form cluster (default 4)
    - crime_type / category: Filter by crime category
    - division: Filter by division/city
    - station: Filter by police station
    - dataset_id: Optional specific dataset ID
    """
    try:
        if request.method == "POST" and request.is_json:
            body = request.get_json() or {}
            eps_km = float(body.get("eps_km", 8.0))
            min_samples = int(body.get("min_samples", 4))
            crime_filter = body.get("crime_type") or body.get("category")
            division_filter = body.get("division")
            station_filter = body.get("station")
            dataset_id = body.get("dataset_id")
            custom_records = body.get("records")
            records = custom_records if custom_records is not None else _get_active_point_records(dataset_id)
        else:
            eps_km = float(request.args.get("eps_km", 8.0))
            min_samples = int(request.args.get("min_samples", 4))
            crime_filter = request.args.get("crime_type") or request.args.get("category")
            division_filter = request.args.get("division")
            station_filter = request.args.get("station")
            dataset_id = request.args.get("dataset_id")
            records = _get_active_point_records(dataset_id)

        geojson_clusters = spatial_analytics_service.detect_hotspots_dbscan(
            records=records,
            eps_km=eps_km,
            min_samples=min_samples,
            crime_filter=crime_filter,
            division_filter=division_filter,
            station_filter=station_filter
        )

        return jsonify({
            "success": True,
            "geojson": geojson_clusters
        }), 200
    except Exception as e:
        log.error(f"Error executing DBSCAN clustering: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@spatial_bp.route("/heatmap", methods=["GET", "POST"])
def get_spatial_heatmap():
    """
    GET / POST /api/spatial/heatmap
    Returns weighted [lat, lon, intensity] coordinates for continuous density heatmap rendering.
    """
    try:
        if request.method == "POST" and request.is_json:
            body = request.get_json() or {}
            crime_filter = body.get("crime_type") or body.get("category")
            division_filter = body.get("division")
            station_filter = body.get("station")
            dataset_id = body.get("dataset_id")
            custom_records = body.get("records")
            records = custom_records if custom_records is not None else _get_active_point_records(dataset_id)
        else:
            crime_filter = request.args.get("crime_type") or request.args.get("category")
            division_filter = request.args.get("division")
            station_filter = request.args.get("station")
            dataset_id = request.args.get("dataset_id")
            records = _get_active_point_records(dataset_id)

        payload = spatial_analytics_service.generate_heatmap_payload(
            records=records,
            crime_filter=crime_filter,
            division_filter=division_filter,
            station_filter=station_filter
        )

        return jsonify(payload), 200
    except Exception as e:
        log.error(f"Error generating heatmap payload: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@spatial_bp.route("/cluster/<cluster_id>", methods=["GET"])
def get_cluster_details(cluster_id: str):
    """
    GET /api/spatial/cluster/<cluster_id>
    Fetches detailed analytical dossier for a specific detected cluster.
    """
    try:
        eps_km = float(request.args.get("eps_km", 8.0))
        min_samples = int(request.args.get("min_samples", 4))
        crime_filter = request.args.get("crime_type") or request.args.get("category")
        records = _get_active_point_records()

        geojson_clusters = spatial_analytics_service.detect_hotspots_dbscan(
            records=records,
            eps_km=eps_km,
            min_samples=min_samples,
            crime_filter=crime_filter
        )

        target_feature = None
        for feature in geojson_clusters.get("features", []):
            if feature.get("properties", {}).get("cluster_id") == cluster_id:
                target_feature = feature
                break

        if not target_feature:
            return jsonify({"success": False, "error": f"Cluster '{cluster_id}' not found"}), 404

        return jsonify({
            "success": True,
            "cluster": target_feature
        }), 200
    except Exception as e:
        log.error(f"Error fetching cluster details: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500



@spatial_bp.route("/datasets", methods=["GET"])
def list_datasets():
    """
    GET /api/spatial/datasets
    Returns list of all available datasets (Permanent Entity A, Entity B, Entity C).
    """
    try:
        datasets = spatial_store.list_datasets()
        return jsonify({
            "success": True,
            "count": len(datasets),
            "datasets": datasets
        }), 200
    except Exception as e:
        log.error(f"Error listing spatial datasets: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@spatial_bp.route("/dataset/<dataset_id>", methods=["GET"])
def get_dataset(dataset_id: str):
    """
    GET /api/spatial/dataset/<id>
    Returns full record or geometry payload for a specific dataset.
    """
    try:
        dataset = spatial_store.get_dataset(dataset_id, include_raw_data=True)
        if not dataset:
            return jsonify({"success": False, "error": f"Dataset '{dataset_id}' not found"}), 404
        return jsonify({
            "success": True,
            "dataset": dataset
        }), 200
    except Exception as e:
        log.error(f"Error fetching spatial dataset {dataset_id}: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@spatial_bp.route("/dataset/upload", methods=["POST"])
def upload_dataset():
    """
    POST /api/spatial/dataset/upload
    Accepts file upload (CSV, Excel, KML, KMZ, GeoJSON) and registers as Entity B or Entity C.
    """
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded. Please supply 'file' form field."}), 400

    file_obj = request.files["file"]
    if not file_obj or file_obj.filename == "":
        return jsonify({"success": False, "error": "Empty filename."}), 400

    filename = secure_filename(file_obj.filename)
    raw_content = file_obj.read()
    if not raw_content:
        return jsonify({"success": False, "error": "Uploaded file is empty."}), 400

    # Auto-detect Entity Type if not specified
    filename_lower = filename.lower()
    explicit_entity_type = request.form.get("entity_type")
    
    if explicit_entity_type in ["POINT_DATA", "CUSTOM_BOUNDARY"]:
        entity_type = explicit_entity_type
    elif filename_lower.endswith((".kml", ".kmz", ".geojson")):
        entity_type = "CUSTOM_BOUNDARY"
    else:
        entity_type = "POINT_DATA"

    dataset_name = request.form.get("name") or filename

    try:
        dataset, stats = spatial_store.create_dataset(
            name=dataset_name,
            entity_type=entity_type,
            raw_content=raw_content,
            filename=filename
        )
        return jsonify({
            "success": True,
            "message": f"Successfully ingested '{filename}' as {entity_type}.",
            "dataset": dataset,
            "stats": stats
        }), 201
    except Exception as e:
        log.error(f"Ingestion failure for '{filename}': {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 400


@spatial_bp.route("/dataset/<dataset_id>/toggle", methods=["PATCH"])
def toggle_dataset(dataset_id: str):
    """
    PATCH /api/spatial/dataset/<id>/toggle
    Toggles layer active state for overlapping map visualization.
    """
    try:
        body = request.get_json(silent=True) or {}
        is_active = body.get("is_active")
        if is_active is None:
            # Toggle current state
            current = spatial_store.get_dataset(dataset_id, include_raw_data=False)
            if not current:
                return jsonify({"success": False, "error": "Dataset not found"}), 404
            is_active = not current.get("is_active", True)

        updated = spatial_store.toggle_dataset_active(dataset_id, bool(is_active))
        if not updated:
            return jsonify({"success": False, "error": "Dataset not found"}), 404

        return jsonify({
            "success": True,
            "dataset": updated
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@spatial_bp.route("/dataset/<dataset_id>", methods=["DELETE"])
def delete_dataset(dataset_id: str):
    """
    DELETE /api/spatial/dataset/<id>
    Deletes user-uploaded dataset from in-memory store. Protected against Entity A deletion.
    """
    try:
        success = spatial_store.delete_dataset(dataset_id)
        if not success:
            return jsonify({"success": False, "error": "Dataset not found"}), 404
        return jsonify({
            "success": True,
            "message": f"Dataset '{dataset_id}' deleted successfully from spatial store."
        }), 200
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 403
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@spatial_bp.route("/active_layers", methods=["GET"])
def get_active_layers():
    """
    GET /api/spatial/active_layers
    Convenience endpoint for frontend to fetch all currently active point records
    and custom boundary FeatureCollections in a single consolidated call.
    """
    try:
        all_datasets = spatial_store.list_datasets()
        active_points = []
        active_boundaries = []

        for ds_summary in all_datasets:
            if not ds_summary.get("is_active", False):
                continue

            full_ds = spatial_store.get_dataset(ds_summary["id"], include_raw_data=True)
            if not full_ds:
                continue

            if full_ds["entity_type"] == "POINT_DATA":
                records = full_ds.get("data", [])
                for r in records:
                    # Tag with dataset id & name for client attribution
                    r["_dataset_id"] = full_ds["id"]
                    r["_dataset_name"] = full_ds["name"]
                    active_points.append(r)
            elif full_ds["entity_type"] == "CUSTOM_BOUNDARY":
                active_boundaries.append({
                    "id": full_ds["id"],
                    "name": full_ds["name"],
                    "geojson": full_ds.get("data")
                })

        return jsonify({
            "success": True,
            "total_active_points": len(active_points),
            "total_active_boundaries": len(active_boundaries),
            "points": active_points,
            "custom_boundaries": active_boundaries
        }), 200
    except Exception as e:
        log.error(f"Error assembling active spatial layers: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500

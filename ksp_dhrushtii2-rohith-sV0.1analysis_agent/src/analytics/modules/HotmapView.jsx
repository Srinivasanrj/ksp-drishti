import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShieldCheck } from 'lucide-react';
import DatasetUploader from '../components/DatasetUploader';
import SpatialTopNav from '../components/spatial/SpatialTopNav';
import SpatialRightDeck from '../components/spatial/SpatialRightDeck';
import SpatialViewportControls from '../components/spatial/SpatialViewportControls';
import { useGlobalInvestigation } from '../../context/GlobalInvestigationContext';
import { InvestigationClient } from '../services/InvestigationClient';

// Default Color Mapping with Dynamic Fallback Generator (SOLID: Anti-Hardcoding)
const CATEGORY_COLOR_PALETTE = {
  'Cyber Fraud': '#2563eb',
  'Theft & Burglary': '#d97706',
  'Heinous Crimes': '#dc2626',
  'Special & Local Laws': '#059669',
  'Women & Child Safety': '#7c3aed',
  'Cheating': '#0284c7',
  'Robbery': '#ea580c',
  'NDPS': '#e11d48',
  'Assault': '#b91c1c'
};

const TILE_LAYERS = {
  VOYAGER: {
    name: 'Esri Light Gray',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ | KSP Sentinel AI'
  },
  DARK: {
    name: 'Esri Dark Gray',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ | KSP Sentinel AI'
  }
};

function getCategoryColor(category) {
  if (!category) return '#3b82f6';
  if (CATEGORY_COLOR_PALETTE[category]) return CATEGORY_COLOR_PALETTE[category];
  // Dynamic deterministic color generator for unknown categories (No hardcoding)
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 75%, 50%)`;
}

/**
 * HotmapView — High-Level Geospatial State Coordinator (SOLID: SRP)
 * Coordinates sub-components: SpatialTopNav, SpatialRightDeck, SpatialViewportControls, and Leaflet Map Canvas.
 */
export default function HotmapView({
  records = [],
  onBackToChat,
  divisionName = 'All Divisions'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const districtLayerRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const activeTileLayerRef = useRef(null);
  const hotspotsLayerRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const customBoundariesLayerRef = useRef(null);
  const districtLabelsLayerRef = useRef(null);

  // ── Filter Slicers ──────────────────────────────────────────────────────────
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // ── View Modes & Advanced Analytics State ─────────────────────────────────
  const [viewMode, setViewMode] = useState('POINTS'); // 'POINTS' | 'HEATMAP' | 'HOTSPOTS'
  const [hotspotsData, setHotspotsData] = useState(null);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // ── Right Command & Intelligence Deck State ───────────────────────────────
  const [isDeckCollapsed, setIsDeckCollapsed] = useState(false);
  const [activeDeckTab, setActiveDeckTab] = useState('CONTROLS'); // 'CONTROLS' | 'DOSSIER'
  const [isInvestigating, setIsInvestigating] = useState(false);
  const { openInvestigation } = useGlobalInvestigation();

  // ── Layer & Display Toggles ────────────────────────────────────────────────
  const [activeTileType, setActiveTileType] = useState('VOYAGER');
  const [showStateBoundary, setShowStateBoundary] = useState(true);
  const [showDistricts, setShowDistricts] = useState(true);
  const [showDistrictLabels, setShowDistrictLabels] = useState(true);
  const [boundaryGeoData, setBoundaryGeoData] = useState(null);
  const [districtGeoData, setDistrictGeoData] = useState(null);

  // ── Multi-Entity Ingestion State ───────────────────────────────────────────
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [uploadedPoints, setUploadedPoints] = useState([]);
  const [customBoundaries, setCustomBoundaries] = useState([]);
  const [activeDatasetsCount, setActiveDatasetsCount] = useState(0);

  // Fetch all active user-uploaded spatial layers from Python backend
  const fetchActiveLayers = useCallback(async () => {
    try {
      const res = await fetch('/api/spatial/active_layers');
      const data = await res.json();
      if (data.success) {
        setUploadedPoints(data.points || []);
        setCustomBoundaries(data.custom_boundaries || []);
      }
      const dsRes = await fetch('/api/spatial/datasets');
      const dsData = await dsRes.json();
      if (dsData.success) {
        setActiveDatasetsCount(dsData.datasets?.length || 1);
      }
    } catch (err) {
      console.warn('Failed to load active spatial layers:', err);
    }
  }, []);

  useEffect(() => {
    fetchActiveLayers();
  }, [fetchActiveLayers]);

  // ── Combined Active Records ────────────────────────────────────────────────
  const allActiveRecords = useMemo(() => {
    return [...records, ...uploadedPoints];
  }, [records, uploadedPoints]);

  // ── Dynamic Dropdown Lists Extraction (SOLID: Anti-Hardcoding) ─────────────
  const dynamicFilters = useMemo(() => {
    const divisions = new Set();
    const stations = new Set();
    const categories = new Set();
    const statuses = new Set();

    allActiveRecords.forEach(r => {
      const div = r.Division || r.division;
      if (div) divisions.add(div);

      const stn = r.Police_Station || r.police_station || r.Station || r.station;
      if (stn) stations.add(stn);

      const cat = r.Crime_Category || r.crime_category || r.Category || r.category;
      if (cat) categories.add(cat);

      const status = r.Status || r.status;
      if (status) statuses.add(status);
    });

    return {
      divisions: Array.from(divisions).sort(),
      stations: Array.from(stations).sort(),
      categories: Array.from(categories).sort(),
      statuses: Array.from(statuses).sort()
    };
  }, [allActiveRecords]);

  // ── Filtered Dataset Computation ───────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    return allActiveRecords.filter(r => {
      const lat = parseFloat(r.Latitude || r.latitude || r.lat);
      const lng = parseFloat(r.Longitude || r.longitude || r.lng || r.lon);
      if (isNaN(lat) || isNaN(lng)) return false;

      if (selectedDivision !== 'ALL') {
        const div = r.Division || r.division;
        if (div !== selectedDivision) return false;
      }

      if (selectedStation !== 'ALL') {
        const stn = r.Police_Station || r.police_station || r.Station || r.station;
        if (stn !== selectedStation) return false;
      }

      if (selectedCategory !== 'ALL') {
        const cat = r.Crime_Category || r.crime_category || r.Category || r.category;
        if (cat !== selectedCategory) return false;
      }

      if (selectedStatus !== 'ALL') {
        const stat = r.Status || r.status;
        if (stat !== selectedStatus) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches = Object.values(r).some(val =>
          String(val).toLowerCase().includes(query)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [allActiveRecords, selectedDivision, selectedStation, selectedCategory, selectedStatus, searchQuery]);

  // ── High Level Tactical KPI Computations ───────────────────────────────────
  const kpiSummary = useMemo(() => {
    const total = filteredRecords.length;
    const highRisk = filteredRecords.filter(r => {
      const cat = (r.Crime_Category || r.crime_category || '').toLowerCase();
      const status = (r.Status || r.status || '').toLowerCase();
      return cat.includes('heinous') || cat.includes('robbery') || status.includes('pending') || status.includes('critical');
    }).length;

    const catCounts = {};
    filteredRecords.forEach(r => {
      const cat = r.Crime_Category || r.crime_category || 'General';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    let topCategory = 'None';
    let maxCount = 0;
    Object.entries(catCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    });

    return { total, highRisk, topCategory };
  }, [filteredRecords]);

  // ── Phase 3: AI Investigation Session Initializer (SOLID: SRP) ─────────────
  const handleStartInvestigation = useCallback(async (hotspot) => {
    if (!hotspot) return;
    setIsInvestigating(true);

    const targetDistrict = hotspot.district || selectedDistrictName || 'Bengaluru Urban';
    const coords = hotspot.centroid || [12.9716, 77.5946];

    const primaryCrimesList = hotspot.category_breakdown
      ? Object.entries(hotspot.category_breakdown).map(([cat, count]) => ({
          category: cat,
          percentage: Math.round((count / (hotspot.incident_count || 1)) * 100)
        }))
      : [{ category: hotspot.primary_crime || 'Targeted Offense', percentage: 100 }];

    const sampleRecords = filteredRecords
      .filter(r => {
        const rDist = (r.District || r.district || '').toLowerCase();
        const rStat = (r.Police_Station || r.police_station || '').toLowerCase();
        return rDist.includes(targetDistrict.toLowerCase()) || rStat.includes(targetDistrict.toLowerCase());
      })
      .slice(0, 5)
      .map((r, i) => ({
        id: r.FIR_Number || r.fir_number || `FIR-KA-${i + 101}`,
        title: `${r.Crime_Category || r.crime_category || 'Offense'} reported at ${r.Police_Station || r.police_station || 'Station'}`,
        category: r.Crime_Category || r.crime_category || 'General',
        police_station: r.Police_Station || r.police_station || targetDistrict,
        date: r.Date || r.date || '2026-08-28'
      }));

    const payload = {
      trigger_source: 'geospatial_dossier',
      spatial_context: {
        center_coordinates: coords,
        district_name: targetDistrict
      },
      hotspot_metadata: {
        threat_level: hotspot.threat_level || 'HIGH',
        incident_count: hotspot.incident_count || sampleRecords.length,
        primary_crimes: primaryCrimesList
      },
      sample_records: sampleRecords
    };

    // Dispatch to Global Draggable Chat Overlay
    openInvestigation(payload);
    setIsInvestigating(false);
  }, [selectedDistrictName, filteredRecords, openInvestigation]);

  // ── Load State & District Boundary GeoJSON from Public GIS ─────────────────
  useEffect(() => {
    let isMounted = true;

    fetch('/gis/karnataka_state_optimized.geojson')
      .then(res => {
        if (!res.ok) throw new Error('Optimized geojson not found');
        return res.json();
      })
      .catch(() => fetch('/gis/karnataka_state.geojson').then(r => r.json()))
      .then(data => {
        if (isMounted) setBoundaryGeoData(data);
      })
      .catch(err => {
        console.warn('Could not load official state GeoJSON boundary:', err);
      });

    fetch('/gis/karnataka_districts_optimized.geojson')
      .then(res => {
        if (!res.ok) throw new Error('Optimized district geojson not found');
        return res.json();
      })
      .catch(() => fetch('/gis/karnataka_districts.geojson').then(r => r.json()))
      .then(data => {
        if (isMounted) setDistrictGeoData(data);
      })
      .catch(err => {
        console.warn('Could not load official district GeoJSON boundary:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Dynamic District Incident Aggregation ──────────────────────────────────
  const districtIncidentStats = useMemo(() => {
    if (!districtGeoData || !allActiveRecords.length) return {};
    const stats = {};
    const districtNames = districtGeoData.features?.map(
      f => f.properties?.district_name || f.properties?.name
    ).filter(Boolean) || [];

    districtNames.forEach(d => { stats[d] = 0; });

    allActiveRecords.forEach(r => {
      const div = (r.Division || r.division || '').toLowerCase();
      const stn = (r.Police_Station || r.police_station || r.Station || r.station || '').toLowerCase();
      const dist = (r.District || r.district || '').toLowerCase();
      const addr = (r.Address || r.address || '').toLowerCase();

      for (const d of districtNames) {
        const dLower = d.toLowerCase();
        if (div.includes(dLower) || stn.includes(dLower) || dist.includes(dLower) || addr.includes(dLower)) {
          stats[d] = (stats[d] || 0) + 1;
          break;
        }
      }
    });

    return stats;
  }, [districtGeoData, allActiveRecords]);

  // ── Initialize Leaflet Map Instance ────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [14.5, 75.8],
        zoom: 7,
        minZoom: 5,
        maxZoom: 18,
        zoomControl: false // Viewport controls rendered separately in bottom-left
      });

      const baseTile = L.tileLayer(TILE_LAYERS[activeTileType].url, {
        attribution: TILE_LAYERS[activeTileType].attribution,
        maxZoom: 19
      }).addTo(map);

      activeTileLayerRef.current = baseTile;
      markersLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ── Update Base Tile Layer on Theme Change ─────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
    }

    const newTile = L.tileLayer(TILE_LAYERS[activeTileType].url, {
      attribution: TILE_LAYERS[activeTileType].attribution,
      maxZoom: 19
    }).addTo(map);

    newTile.bringToBack();
    activeTileLayerRef.current = newTile;
  }, [activeTileType]);

  // ── Render State Polygon Boundary Layer ────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    if (showStateBoundary && boundaryGeoData) {
      const layer = L.geoJSON(boundaryGeoData, {
        style: {
          color: activeTileType === 'DARK' ? '#38bdf8' : '#1d4ed8',
          weight: 2.2,
          opacity: 0.85,
          fillColor: activeTileType === 'DARK' ? '#0369a1' : '#60a5fa',
          fillOpacity: activeTileType === 'DARK' ? 0.05 : 0.03,
          dashArray: '4, 4'
        },
        onEachFeature: (feature, l) => {
          const name = feature.properties?.name || 'Karnataka Jurisdiction';
          l.bindTooltip(`<b>🏛️ ${name} State Police Boundary</b>`, {
            permanent: false,
            direction: 'center',
            className: 'ksp-gis-boundary-tooltip'
          });
        }
      }).addTo(map);

      layer.bringToBack();
      geoJsonLayerRef.current = layer;
    }
  }, [showStateBoundary, boundaryGeoData, activeTileType]);

  // ── Render 30 District Polygon Layers & Sleek Vector Typography ────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (districtLayerRef.current) {
      map.removeLayer(districtLayerRef.current);
      districtLayerRef.current = null;
    }
    if (districtLabelsLayerRef.current) {
      map.removeLayer(districtLabelsLayerRef.current);
      districtLabelsLayerRef.current = null;
    }

    if (showDistricts && districtGeoData) {
      const labelsGroup = L.layerGroup();

      const layer = L.geoJSON(districtGeoData, {
        style: (feature) => {
          const dName = feature?.properties?.district_name || feature?.properties?.name || '';
          const isSelected = (selectedDivision && selectedDivision !== 'ALL' && selectedDivision.toLowerCase().includes(dName.toLowerCase())) || 
                             (searchQuery && searchQuery.toLowerCase().includes(dName.toLowerCase())) ||
                             (selectedDistrictName === dName);
          return {
            color: isSelected ? '#f59e0b' : (activeTileType === 'DARK' ? '#38bdf8' : '#0284c7'),
            weight: isSelected ? 2.5 : 1.2,
            opacity: isSelected ? 0.95 : 0.65,
            fillColor: isSelected ? '#f59e0b' : (activeTileType === 'DARK' ? '#0284c7' : '#38bdf8'),
            fillOpacity: isSelected ? 0.16 : 0.04,
            dashArray: isSelected ? '' : '3, 3'
          };
        },
        onEachFeature: (feature, l) => {
          const dName = feature.properties?.district_name || feature.properties?.name || 'District';
          const code = feature.properties?.KGISDistrictCode || feature.properties?.LGD_DistrictCode || '';
          const count = districtIncidentStats[dName] || 0;
          const isSelected = (selectedDivision && selectedDivision !== 'ALL' && selectedDivision.toLowerCase().includes(dName.toLowerCase())) || 
                             (searchQuery && searchQuery.toLowerCase().includes(dName.toLowerCase())) ||
                             (selectedDistrictName === dName);

          // Sleek Vector Typography Label (Zero box clutter)
          if (showDistrictLabels && l.getBounds) {
            const center = l.getBounds().getCenter();
            const labelIcon = L.divIcon({
              className: 'ksp-district-label-container',
              html: `
                <div class="ksp-district-label-card ${isSelected ? 'selected' : ''}">
                  <span class="district-name">${dName}</span>
                  ${count > 0 ? `<span class="district-count">${count}</span>` : ''}
                </div>
              `,
              iconSize: [100, 20],
              iconAnchor: [50, 10]
            });

            const labelMarker = L.marker(center, {
              icon: labelIcon,
              interactive: false
            });
            labelsGroup.addLayer(labelMarker);
          }

          // Interactive Tooltip on Hover
          l.bindTooltip(`
            <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 11px; color: #0f172a; padding: 3px 6px; min-width: 140px;">
              <div style="font-weight: 800; color: #1e40af; font-size: 12px; display: flex; align-items: center; justify-content: space-between;">
                <span>🏛️ ${dName}</span>
                ${code ? `<span style="font-size: 9px; color: #64748b;">#${code}</span>` : ''}
              </div>
              <div style="color: #334155; font-size: 10.5px; margin-top: 3px; font-weight: 600;">
                <span style="color: #0284c7; font-weight: 800;">${count.toLocaleString()}</span> Incidents in Scope
              </div>
            </div>
          `, {
            permanent: false,
            direction: 'center',
            className: 'ksp-gis-boundary-tooltip',
            sticky: true
          });

          l.on('mouseover', (e) => {
            const target = e.target;
            target.setStyle({
              weight: 2.5,
              color: '#f59e0b',
              fillOpacity: 0.15
            });
            target.bringToFront();
          });

          l.on('mouseout', (e) => {
            if (districtLayerRef.current) {
              districtLayerRef.current.resetStyle(e.target);
            }
          });

          l.on('click', (e) => {
            const bounds = e.target.getBounds();
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
            setSelectedDistrictName(dName);
            setActiveDeckTab('DOSSIER');
            setIsDeckCollapsed(false);
          });
        }
      }).addTo(map);

      layer.bringToBack();
      districtLayerRef.current = layer;

      if (showDistrictLabels) {
        labelsGroup.addTo(map);
        districtLabelsLayerRef.current = labelsGroup;
      }
    }
  }, [showDistricts, showDistrictLabels, districtGeoData, activeTileType, selectedDivision, searchQuery, selectedDistrictName, districtIncidentStats]);

  // ── Render Custom Vector Boundary Layers ───────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (customBoundariesLayerRef.current) {
      map.removeLayer(customBoundariesLayerRef.current);
      customBoundariesLayerRef.current = null;
    }

    if (customBoundaries && customBoundaries.length > 0) {
      const layerGroup = L.layerGroup();

      customBoundaries.forEach((boundary) => {
        if (!boundary.geojson) return;
        const bLayer = L.geoJSON(boundary.geojson, {
          style: {
            color: '#f59e0b',
            weight: 2,
            opacity: 0.9,
            fillColor: '#fbbf24',
            fillOpacity: 0.12,
            dashArray: '6, 6'
          },
          onEachFeature: (feature, l) => {
            const name = feature.properties?.name || boundary.name || 'Custom Spatial Boundary';
            l.bindTooltip(`<b>🚩 Custom Overlay: ${name}</b>`, {
              permanent: false,
              direction: 'center',
              className: 'ksp-gis-boundary-tooltip'
            });
          }
        });
        layerGroup.addLayer(bLayer);
      });

      layerGroup.addTo(map);
      customBoundariesLayerRef.current = layerGroup;
    }
  }, [customBoundaries]);

  // ── Fetch DBSCAN Clusters & Hotspots ───────────────────────────────────────
  const fetchHotspots = useCallback(async () => {
    if (filteredRecords.length === 0) {
      setHotspotsData(null);
      return;
    }
    try {
      const res = await fetch('/api/spatial/clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: filteredRecords,
          eps_km: 8.0,
          min_samples: Math.min(3, Math.max(2, Math.floor(filteredRecords.length * 0.05))),
          crime_type: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          division: selectedDivision !== 'ALL' ? selectedDivision : undefined,
          station: selectedStation !== 'ALL' ? selectedStation : undefined
        })
      });
      const data = await res.json();
      if (data.success && data.geojson) {
        setHotspotsData(data.geojson);
      }
    } catch (err) {
      console.warn('Error calculating DBSCAN hotspots:', err);
    }
  }, [filteredRecords, selectedCategory, selectedDivision, selectedStation]);

  // ── Fetch Heatmap Density Points ───────────────────────────────────────────
  const fetchHeatmap = useCallback(async () => {
    if (filteredRecords.length === 0) {
      setHeatmapPoints([]);
      return;
    }
    try {
      const res = await fetch('/api/spatial/heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: filteredRecords,
          crime_type: selectedCategory !== 'ALL' ? selectedCategory : undefined
        })
      });
      const data = await res.json();
      if (data.success && data.points) {
        setHeatmapPoints(data.points);
      }
    } catch (err) {
      console.warn('Error generating heatmap points:', err);
    }
  }, [filteredRecords, selectedCategory]);

  useEffect(() => {
    if (viewMode === 'HOTSPOTS') {
      fetchHotspots();
    } else if (viewMode === 'HEATMAP') {
      fetchHeatmap();
    }
  }, [viewMode, fetchHotspots, fetchHeatmap]);

  // ── Render Dynamic Incident Markers (View Mode: POINTS) ───────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (viewMode !== 'POINTS') return;

    const latLngs = [];

    filteredRecords.slice(0, 1000).forEach(record => {
      const lat = parseFloat(record.Latitude || record.latitude || record.lat);
      const lng = parseFloat(record.Longitude || record.longitude || record.lng || record.lon);
      if (isNaN(lat) || isNaN(lng)) return;

      latLngs.push([lat, lng]);

      const category = record.Crime_Category || record.crime_category || record.Category || 'General';
      const color = getCategoryColor(category);
      const fir = record.FIR_Number || record.fir_number || record.FIR || 'FIR Record';
      const station = record.Police_Station || record.police_station || record.Station || 'Command Station';
      const status = record.Status || record.status || 'Active';
      const date = record.Date || record.date || record.Year || '2026';
      const division = record.Division || record.division || 'State Unit';
      const loss = record.Loss_Amount_INR || record.loss_amount_inr;

      const marker = L.circleMarker([lat, lng], {
        radius: 6.5,
        fillColor: color,
        color: '#ffffff',
        weight: 1.5,
        opacity: 0.95,
        fillOpacity: 0.8
      });

      const popupHtml = `
        <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 11px; min-width: 200px; color: #0f172a; line-height: 1.5;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 6px;">
            <b style="color: #1e40af; font-size: 12px;">🛡️ ${fir}</b>
            <span style="background: ${color}20; color: ${color}; font-weight: 800; font-size: 9px; padding: 2px 6px; border-radius: 10px; border: 1px solid ${color}40;">
              ${category}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 8px; font-size: 10.5px;">
            <span style="color: #64748b; font-weight: 700;">Division:</span> <span>${division}</span>
            <span style="color: #64748b; font-weight: 700;">Station:</span> <span>${station}</span>
            <span style="color: #64748b; font-weight: 700;">Status:</span> <span style="font-weight: 700; color: ${status.toLowerCase().includes('pending') ? '#dc2626' : '#059669'};">${status}</span>
            <span style="color: #64748b; font-weight: 700;">Date:</span> <span>${date}</span>
            ${loss ? `<span style="color: #64748b; font-weight: 700;">Loss:</span> <span style="font-weight: 800; color: #d97706;">₹${Number(loss).toLocaleString()}</span>` : ''}
          </div>
          <div style="margin-top: 8px; padding-top: 5px; border-top: 1px solid #f1f5f9; font-size: 9.5px; color: #94a3b8; text-align: right;">
            GPS: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedIncident(record);
      });

      marker.addTo(markersGroup);
    });

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else if (geoJsonLayerRef.current) {
      map.fitBounds(geoJsonLayerRef.current.getBounds(), { padding: [30, 30] });
    }
  }, [filteredRecords, viewMode]);

  // ── Render Continuous Density Heatmap (View Mode: HEATMAP) ────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    if (viewMode !== 'HEATMAP' || !heatmapPoints || heatmapPoints.length === 0) return;

    const heatGroup = L.layerGroup();

    heatmapPoints.forEach(([lat, lon, weight]) => {
      const outerColor = weight > 0.8 ? '#ef4444' : weight > 0.6 ? '#f97316' : '#eab308';
      const outerCircle = L.circleMarker([lat, lon], {
        radius: Math.max(18, 28 * weight),
        fillColor: outerColor,
        fillOpacity: 0.22 * weight,
        stroke: false,
        interactive: false
      });

      const midCircle = L.circleMarker([lat, lon], {
        radius: Math.max(10, 16 * weight),
        fillColor: '#fbbf24',
        fillOpacity: 0.35 * weight,
        stroke: false,
        interactive: false
      });

      const centerCircle = L.circleMarker([lat, lon], {
        radius: Math.max(4, 7 * weight),
        fillColor: '#ffffff',
        fillOpacity: 0.65,
        stroke: false,
        interactive: false
      });

      heatGroup.addLayer(outerCircle);
      heatGroup.addLayer(midCircle);
      heatGroup.addLayer(centerCircle);
    });

    heatGroup.addTo(map);
    heatmapLayerRef.current = heatGroup;
  }, [heatmapPoints, viewMode]);

  // ── Render DBSCAN Hotspot Polygons & Badges (View Mode: HOTSPOTS) ─────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (hotspotsLayerRef.current) {
      map.removeLayer(hotspotsLayerRef.current);
      hotspotsLayerRef.current = null;
    }

    if (viewMode !== 'HOTSPOTS' || !hotspotsData || !hotspotsData.features || hotspotsData.features.length === 0) {
      return;
    }

    const hotspotsGroup = L.layerGroup();

    const geoLayer = L.geoJSON(hotspotsData, {
      style: (feature) => {
        const threatColor = feature.properties?.threat_color || '#ef4444';
        const isSelected = selectedHotspot?.cluster_id === feature.properties?.cluster_id;
        return {
          color: isSelected ? '#ffffff' : threatColor,
          weight: isSelected ? 3.5 : 2.5,
          opacity: 0.95,
          fillColor: threatColor,
          fillOpacity: isSelected ? 0.45 : 0.28,
          dashArray: '5, 5'
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const centroid = props.centroid || [12.97, 77.59];

        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedHotspot(props);
          setActiveDeckTab('DOSSIER');
          setIsDeckCollapsed(false);
          const bounds = layer.getBounds();
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
        });

        const threatClass = (props.threat_level || 'HIGH').toLowerCase();
        const badgeHtml = `
          <div class="ksp-hotspot-label-card ${threatClass}" title="Click to inspect Hotspot intelligence">
            <span class="hotspot-pulse-dot" style="background: ${props.threat_color};"></span>
            <span class="hotspot-tag">#${props.rank} ${props.primary_crime}</span>
            <span class="hotspot-count-pill">${props.incident_count} Cases</span>
          </div>
        `;

        const badgeIcon = L.divIcon({
          html: badgeHtml,
          className: 'ksp-hotspot-label-container',
          iconSize: [140, 24],
          iconAnchor: [70, 12]
        });

        const badgeMarker = L.marker([centroid[0], centroid[1]], {
          icon: badgeIcon,
          interactive: true
        });

        badgeMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedHotspot(props);
          setActiveDeckTab('DOSSIER');
          setIsDeckCollapsed(false);
          const bounds = layer.getBounds();
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
        });

        hotspotsGroup.addLayer(badgeMarker);
      }
    });

    hotspotsGroup.addLayer(geoLayer);
    hotspotsGroup.addTo(map);
    hotspotsLayerRef.current = hotspotsGroup;
  }, [hotspotsData, viewMode, selectedHotspot]);

  // ── Zoom to Plotted Bounds ──────────────────────────────────────────────────
  const handleZoomToFit = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const latLngs = filteredRecords
      .map(r => {
        const lat = parseFloat(r.Latitude || r.latitude || r.lat);
        const lng = parseFloat(r.Longitude || r.longitude || r.lng || r.lon);
        return (!isNaN(lat) && !isNaN(lng)) ? [lat, lng] : null;
      })
      .filter(Boolean);

    if (latLngs.length > 0) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
    } else if (geoJsonLayerRef.current) {
      map.fitBounds(geoJsonLayerRef.current.getBounds(), { padding: [30, 30] });
    } else {
      map.setView([14.5, 75.8], 7);
    }
  }, [filteredRecords]);

  // ── Reset All Slicers & Viewport ───────────────────────────────────────────
  const handleResetFilters = useCallback(() => {
    setSelectedDivision('ALL');
    setSelectedStation('ALL');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setSelectedHotspot(null);
    setSelectedDistrictName(null);
    setSelectedIncident(null);
    handleZoomToFit();
  }, [handleZoomToFit]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      backgroundColor: '#090d16',
      color: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    }}>
      {/* ── SLIMLINE TOP BAR (48px) ─────────────────────────────────────────── */}
      <SpatialTopNav
        onBackToChat={onBackToChat}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          if (mode !== 'HOTSPOTS') setSelectedHotspot(null);
        }}
        hotspotsCount={hotspotsData?.features?.length || 0}
        totalCoordinates={filteredRecords.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTileType={activeTileType}
        onTileTypeChange={setActiveTileType}
        onOpenUploader={() => setIsUploaderOpen(true)}
        activeDatasetsCount={activeDatasetsCount}
      />

      {/* ── FULL-SCREEN MAP CANVAS WITH OVERLAY DOCKS ────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

        {/* Floating Bottom-Left Viewport Controls */}
        <SpatialViewportControls
          onZoomIn={() => mapInstanceRef.current?.zoomIn()}
          onZoomOut={() => mapInstanceRef.current?.zoomOut()}
          onFitBounds={handleZoomToFit}
          onResetFilters={handleResetFilters}
        />

        {/* Floating Right Command & Dossier Deck */}
        <SpatialRightDeck
          isCollapsed={isDeckCollapsed}
          onToggleCollapse={() => setIsDeckCollapsed(v => !v)}
          activeTab={activeDeckTab}
          onTabChange={setActiveDeckTab}
          // Slicers
          dynamicFilters={dynamicFilters}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedDivision={selectedDivision}
          onDivisionChange={setSelectedDivision}
          selectedStation={selectedStation}
          onStationChange={setSelectedStation}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          // Layer Toggles
          showStateBoundary={showStateBoundary}
          onToggleStateBoundary={() => setShowStateBoundary(v => !v)}
          showDistricts={showDistricts}
          onToggleDistricts={() => setShowDistricts(v => !v)}
          showDistrictLabels={showDistrictLabels}
          onToggleDistrictLabels={() => setShowDistrictLabels(v => !v)}
          // Metrics
          kpiSummary={kpiSummary}
          // Dossier State
          selectedHotspot={selectedHotspot}
          onClearHotspot={() => setSelectedHotspot(null)}
          selectedDistrictName={selectedDistrictName}
          onClearDistrict={() => setSelectedDistrictName(null)}
          onBackToChat={onBackToChat}
          onStartInvestigation={handleStartInvestigation}
        />

        {/* Selected Incident Popup Card (Left floating if an individual incident point is clicked) */}
        {selectedIncident && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '14px',
            padding: '16px',
            zIndex: 999,
            maxWidth: '300px',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)',
            animation: 'bubble-slide-up 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#38bdf8" />
                <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.85rem' }}>
                  {selectedIncident.FIR_Number || selectedIncident.fir_number || selectedIncident.id || 'Case Record'}
                </span>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '5px', color: '#cbd5e1' }}>
              <div><b>Station:</b> {selectedIncident.Police_Station || selectedIncident.police_station || 'HQ'}</div>
              <div><b>Category:</b> {selectedIncident.Crime_Category || selectedIncident.crime_category || 'General'}</div>
              <div><b>Status:</b> <span style={{ color: '#34d399', fontWeight: 700 }}>{selectedIncident.Status || selectedIncident.status || 'Active'}</span></div>
              {selectedIncident.Accused_Name && <div><b>Accused:</b> {selectedIncident.Accused_Name}</div>}
              {selectedIncident.Loss_Amount_INR && <div><b>Loss Amount:</b> ₹{Number(selectedIncident.Loss_Amount_INR).toLocaleString()}</div>}
              {selectedIncident._dataset_name && (
                <div style={{ color: '#38bdf8', fontSize: '0.68rem', marginTop: '2px', fontWeight: 700 }}>
                  Source: {selectedIncident._dataset_name}
                </div>
              )}
              <div style={{ color: '#64748b', fontSize: '0.68rem', marginTop: '4px' }}>
                GPS: {Number(selectedIncident.Latitude || selectedIncident.latitude || 0).toFixed(4)}° N, {Number(selectedIncident.Longitude || selectedIncident.longitude || 0).toFixed(4)}° E
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Ingestion & Layer Manager Modal */}
      <DatasetUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onDatasetsUpdated={fetchActiveLayers}
      />
    </div>
  );
}

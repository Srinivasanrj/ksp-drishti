import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { Search, ShieldBan, UserX, TriangleAlert, Flame, MapPin, Database, CheckCircle, Layers, Globe, Moon } from 'lucide-react';
import karnatakaMaskData from '../data/karnataka_mask.json';
import karnatakaBoundaryData from '../data/karnataka_boundary.json';

// Bounding box for Karnataka State: [[South, West], [North, East]]
const KARNATAKA_BOUNDS = [
  [11.0, 73.5], // South-West corner
  [19.0, 79.2]  // North-East corner
];

const KARNATAKA_CENTER = [14.5204, 75.7224]; // Geographic center of Karnataka State

const DIVISION_COORDS = {
  bengaluru: { coords: [12.9716, 77.5946], zoom: 11 },
  mysuru: { coords: [12.2958, 76.6394], zoom: 11 },
  belagavi: { coords: [15.8497, 74.4977], zoom: 11 },
  kalaburagi: { coords: [17.3297, 76.8343], zoom: 11 }
};

const hotspotCoords = [
  { id: 'h1', coords: [12.9784, 77.6408], radius: 350, color: '#ef4444' },
  { id: 'h2', coords: [12.9352, 77.6244], radius: 400, color: '#f59e0b' },
  { id: 'h3', coords: [12.2958, 76.6394], radius: 500, color: '#8b5cf6' },
  { id: 'h4', coords: [15.3647, 75.1240], radius: 600, color: '#ef4444' }
];

// Google Maps style teardrop pin maker
const createGooglePinIcon = (color) => {
  return L.divIcon({
    className: 'google-map-pin',
    html: `
      <div style="position:relative; width:26px; height:32px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35)); cursor:pointer;">
        <svg viewBox="0 0 24 32" width="26" height="32">
          <path d="M12 0 C5.373 0 0 5.373 0 12 C0 21 12 32 12 32 C12 32 24 21 24 12 C24 5.373 18.627 0 12 0 Z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
          <circle cx="12" cy="11" r="4.5" fill="#ffffff" />
        </svg>
      </div>
    `,
    iconSize: [26, 32],
    iconAnchor: [13, 32],
    popupAnchor: [0, -32]
  });
};

// Map Style Tile URL Providers
const TILE_PROVIDERS = {
  google_street: {
    name: "Street View",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  google_satellite: {
    name: "Satellite View",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
  },
  dark_tactical: {
    name: "Satellite Tactical",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS"
  }
};

function MainMap({ currentDivision }) {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState('google_street');
  const [activeFilters, setActiveFilters] = useState({
    cyber: true,
    theft: true,
    hazard: true,
    hotspots: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(KARNATAKA_CENTER);
  const [mapZoom, setMapZoom] = useState(7);

  const fetchDatasetMarkers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/map_markers');
      const data = await res.json();
      if (data.success && data.markers) {
        setMarkers(data.markers);
      }
    } catch (err) {
      console.error("Error fetching map markers from database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasetMarkers();
  }, []);

  useEffect(() => {
    if (currentDivision && currentDivision.id && DIVISION_COORDS[currentDivision.id]) {
      setMapCenter(DIVISION_COORDS[currentDivision.id].coords);
      setMapZoom(DIVISION_COORDS[currentDivision.id].zoom);
    }
  }, [currentDivision]);

  const toggleFilter = (type) => {
    setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val) return;
    const match = markers.find(m => 
      m.title.toLowerCase().includes(val.toLowerCase()) || 
      m.subcategory.toLowerCase().includes(val.toLowerCase()) ||
      m.category.toLowerCase().includes(val.toLowerCase()) ||
      m.district.toLowerCase().includes(val.toLowerCase())
    );
    if (match) {
      setMapCenter(match.coords);
      setMapZoom(12);
    }
  };

  const focusKarnatakaState = () => {
    if (currentDivision && currentDivision.id && DIVISION_COORDS[currentDivision.id]) {
      setMapCenter(DIVISION_COORDS[currentDivision.id].coords);
      setMapZoom(DIVISION_COORDS[currentDivision.id].zoom);
    } else {
      setMapCenter(KARNATAKA_CENTER);
      setMapZoom(7);
    }
  };

  return (
    <div className="view-map-container">
      {/* Search & Interactive Filters Layer */}
      <div className="map-filters" style={{ padding: '10px', background: 'rgba(252,252,250,0.92)', borderBottom: '1px solid #D4CEBF', backdropFilter: 'blur(8px)' }}>
        <div className="filter-search" style={{ background: '#FCFCFA', border: '1px solid #D4CEBF', borderRadius: '8px', padding: '6px 10px' }}>
          <Search size={14} style={{ color: '#5A6860' }} />
          <input 
            type="text" 
            placeholder="Search Karnataka sectors (e.g., Cyber, Theft, Mysuru)..." 
            value={searchQuery}
            onChange={handleSearch}
            style={{ color: '#132B20', fontSize: '0.78rem' }}
          />
        </div>
        <div className="chips-scroll" style={{ marginTop: '8px' }}>
          <div 
            className="filter-chip active" 
            onClick={() => { setMapCenter(KARNATAKA_CENTER); setMapZoom(7); }}
            style={{ background: '#132B20', color: '#F59E0B', border: '1.5px solid #D49B44', fontWeight: 800, boxShadow: '0 2px 6px rgba(19,43,32,0.2)' }}
            title="Show entire Karnataka State map"
          >
            <MapPin size={12} style={{ color: '#F59E0B' }} /> Karnataka Statewide View
          </div>

          <div className="filter-chip" onClick={() => { setMapCenter([12.9716, 77.5946]); setMapZoom(10); }} style={{ background: '#FCFCFA', color: '#132B20', border: '1px solid #D4CEBF', fontWeight: 700 }}>
            🏛️ Bengaluru
          </div>

          <div className="filter-chip" onClick={() => { setMapCenter([12.2958, 76.6394]); setMapZoom(10); }} style={{ background: '#FCFCFA', color: '#6d28d9', border: '1px solid #ddd6fe', fontWeight: 700 }}>
            🟣 Mysuru
          </div>

          <div className="filter-chip" onClick={() => { setMapCenter([15.8497, 74.4977]); setMapZoom(10); }} style={{ background: '#FCFCFA', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 700 }}>
            🟢 Belagavi
          </div>

          <div className="filter-chip" onClick={() => { setMapCenter([17.3297, 76.8343]); setMapZoom(10); }} style={{ background: '#FCFCFA', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700 }}>
            🟠 Kalaburagi
          </div>

          {/* Map Style Selector Buttons */}
          <div className="filter-chip" onClick={() => setMapStyle('google_street')} style={{ background: mapStyle === 'google_street' ? '#132B20' : '#FCFCFA', color: mapStyle === 'google_street' ? '#F59E0B' : '#132B20', border: mapStyle === 'google_street' ? '1px solid #D49B44' : '1px solid #D4CEBF', fontWeight: 700 }}>
            <Globe size={12} /> Street
          </div>
          <div className="filter-chip" onClick={() => setMapStyle('google_satellite')} style={{ background: mapStyle === 'google_satellite' ? '#132B20' : '#FCFCFA', color: mapStyle === 'google_satellite' ? '#F59E0B' : '#132B20', border: mapStyle === 'google_satellite' ? '1px solid #D49B44' : '1px solid #D4CEBF', fontWeight: 700 }}>
            <Layers size={12} /> Satellite
          </div>
          <div className="filter-chip" onClick={() => setMapStyle('dark_tactical')} style={{ background: mapStyle === 'dark_tactical' ? '#132B20' : '#FCFCFA', color: mapStyle === 'dark_tactical' ? '#F59E0B' : '#132B20', border: mapStyle === 'dark_tactical' ? '1px solid #D49B44' : '1px solid #D4CEBF', fontWeight: 700 }}>
            <Moon size={12} /> Dark
          </div>

          <div 
            className={`filter-chip ${activeFilters.cyber ? 'active' : ''}`} 
            onClick={() => toggleFilter('cyber')}
          >
            <ShieldBan size={12} /> Cyber Scams
          </div>
          <div 
            className={`filter-chip cyan ${activeFilters.theft ? 'active' : ''}`} 
            onClick={() => toggleFilter('theft')}
          >
            <UserX size={12} /> Physical Theft
          </div>
          <div 
            className={`filter-chip warning ${activeFilters.hazard ? 'active' : ''}`} 
            onClick={() => toggleFilter('hazard')}
          >
            <TriangleAlert size={12} /> Hazards
          </div>
          <div 
            className={`filter-chip danger ${activeFilters.hotspots ? 'active' : ''}`} 
            onClick={() => toggleFilter('hotspots')}
          >
            <Flame size={12} /> Hotspots
          </div>
        </div>
      </div>

      {/* React Leaflet Map Wrapper Restricted to Karnataka State Only */}
      <div className="map-wrapper">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          minZoom={6.5}
          maxZoom={18}
          maxBounds={KARNATAKA_BOUNDS}
          maxBoundsViscosity={1.0}
          zoomControl={false}
          attributionControl={false}
          style={{ width: '100%', height: '100%', background: '#e2e8f0' }}
        >
          <TileLayer
            url={TILE_PROVIDERS[mapStyle].url}
            maxZoom={20}
            bounds={KARNATAKA_BOUNDS}
          />

          {/* Mask out all non-Karnataka regions */}
          <GeoJSON 
            data={karnatakaMaskData} 
            style={{ 
              fillColor: mapStyle === 'dark_tactical' ? '#0f172a' : '#f1f5f9', 
              fillOpacity: mapStyle === 'google_satellite' ? 0.92 : 0.98, 
              color: 'transparent', 
              weight: 0 
            }} 
          />

          {/* Draw Crisp Yellow Tint + Black Border Outline around Karnataka State */}
          <GeoJSON 
            data={karnatakaBoundaryData} 
            style={{ 
              fillColor: '#facc15', 
              fillOpacity: 0.12, 
              color: '#0f172a', 
              weight: 2.5, 
              opacity: 0.95 
            }} 
          />
          
          {/* Pins Sourced Directly from SQLite Dataset in Google Maps Pins Style */}
          {markers.map(item => {
            if (!activeFilters[item.type]) return null;
            return (
              <Marker 
                key={item.id} 
                position={item.coords} 
                icon={createGooglePinIcon(item.color)}
              >
                <Popup>
                  <div className="popup-header">
                    <span>{item.subcategory}</span>
                    <span style={{ color: item.severity === 'Critical' || item.severity === 'High' ? '#ef4444' : '#f59e0b' }}>
                      {item.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Database size={10} /> {item.cases.toLocaleString()} Total Cases Sourced
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Category: <b>{item.category}</b> • Sector: <b>{item.district}</b>
                  </div>
                  <div className="popup-desc" style={{ marginTop: '4px', fontSize: '0.65rem' }}>
                    {item.desc}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                    <CheckCircle size={10} /> Verified SQLite Record (Year {item.year})
                  </div>
                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e2e8f0', fontSize: '0.65rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '3px' }}>Direct Location Map Links:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <a
                        href={`https://www.google.com/maps?q=${item.coords[0]},${item.coords[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'underline', wordBreak: 'break-all' }}
                      >
                        Google Maps Location
                      </a>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${item.coords[0]}&mlon=${item.coords[1]}#map=13/${item.coords[0]}/${item.coords[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#059669', fontWeight: 700, textDecoration: 'underline', wordBreak: 'break-all' }}
                      >
                        OpenStreetMap Interactive View
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Hotspots */}
          {activeFilters.hotspots && hotspotCoords.map(spot => (
            <Circle
              key={spot.id}
              center={spot.coords}
              radius={spot.radius}
              pathOptions={{
                color: spot.color,
                fillColor: spot.color,
                fillOpacity: 0.25,
                stroke: true,
                weight: 1.5
              }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default MainMap;

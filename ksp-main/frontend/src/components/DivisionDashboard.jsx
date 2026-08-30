import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogOut, Shield, BarChart2, Share2, Crown, Building2, Search, PlusCircle, FolderKanban, Bot, X, Calendar as CalendarIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import DivisionStatisticsPanel from './DivisionStatisticsPanel';
import SocialFeed from './SocialFeed';
import PanicSOS from './PanicSOS';

import karnatakaDistrictBoundary from '../assets/geo/Karnataka_District_Boundary.json';
import { processDivisionGeoJSON } from '../utils/geoDistrictMapping';

const TILE_PROVIDERS = {
  google_street: {
    name: 'Street View',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  google_satellite: {
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
};

// Red pill pin badge matching user screenshot (e.g., 📍 KOLAR GOLD FIELDS)
const createStationPinIcon = (zoneName, color) => {
  return L.divIcon({
    className: 'ksp-station-pin-marker',
    html: `
      <div style="
        position: relative;
        background: ${color || '#dc2626'};
        color: #ffffff;
        padding: 5px 12px;
        border-radius: 8px;
        font-weight: 900;
        font-size: 11px;
        letter-spacing: 0.5px;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        border: 1.5px solid #ffffff;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transform: translate(-50%, -100%);
      ">
        <span style="font-size: 11px;">📍</span>
        <span>${zoneName.toUpperCase()}</span>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid ${color || '#dc2626'};
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

function DivisionDashboard({
  divisionName,
  overallStats,
  zonesData,
  centerCoords,
  initialZoom = 8,
  hotspots = [],
  currentUser,
  onLogout
}) {
  const divKey = divisionName.toLowerCase();
  
  const divisionGeoJSON = React.useMemo(() => {
    return processDivisionGeoJSON(karnatakaDistrictBoundary, divKey);
  }, [divKey]);

  const isHead = currentUser?.username?.includes('.head') ||
    currentUser?.unitName?.includes('Division Head') ||
    currentUser?.role?.includes('Head') ||
    currentUser?.username === `ksp.${divKey}.head`;

  // Find user's station zone if they are a station account
  const userUnitZone = zonesData.find(z =>
    (currentUser?.username && z.username === currentUser.username) ||
    (currentUser?.unitName && z.name.toLowerCase() === (currentUser.unitName || '').toLowerCase()) ||
    (currentUser?.unitName && (currentUser.unitName || '').toLowerCase().includes(z.name.toLowerCase()))
  ) || zonesData[0];

  const [panicActive, setPanicActive] = useState(false);
  const [leftTab, setLeftTab] = useState('insights');
  const [selectedZone, setSelectedZone] = useState(() => isHead ? null : userUnitZone);
  const [mapStyle, setMapStyle] = useState('google_street');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapInstance, setMapInstance] = useState(null);
  const geoJsonLayerRef = React.useRef(null);

  const activeZone = selectedZone || (!isHead ? userUnitZone : null);

  useEffect(() => {
    if (mapInstance && geoJsonLayerRef.current) {
      // If a specific subdivision is active, focus entirely on it
      if (activeZone) {
        const layers = geoJsonLayerRef.current.getLayers();
        const targetLayer = layers.find(l => l.feature?.properties?.normalized_district?.toLowerCase() === activeZone.name.toLowerCase());
        
        if (targetLayer) {
          const bounds = targetLayer.getBounds();
          if (bounds && bounds.isValid()) {
            mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
            return; // exit early
          }
        }
      }

      // Fallback: zoom to entire division boundary
      const bounds = geoJsonLayerRef.current.getBounds();
      if (bounds && bounds.isValid()) {
        mapInstance.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [mapInstance, divisionGeoJSON, activeZone]);

  useEffect(() => {
    if (!isHead && userUnitZone && mapInstance) {
      mapInstance.flyTo(userUnitZone.coords, 11);
    }
  }, [mapInstance, isHead, userUnitZone]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val) return;
    const match = zonesData.find(z => z.name.toLowerCase().includes(val.toLowerCase()) || z.sector.toLowerCase().includes(val.toLowerCase()));
    if (match && mapInstance) {
      mapInstance.flyTo(match.coords, 11);
      if (isHead || userUnitZone?.name === match.name) {
        setSelectedZone(match);
      }
    }
  };

  const resetMap = () => {
    if (mapInstance) {
      if (isHead) {
        setSelectedZone(null);
        mapInstance.flyTo(centerCoords, initialZoom);
      } else if (userUnitZone) {
        setSelectedZone(userUnitZone);
        mapInstance.flyTo(userUnitZone.coords, 11);
      }
    }
  };

  return (
    <div className="app-window" style={{ background: '#ECE6D9', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* 1. TOP HEADER BAR */}
      <header className="main-header" style={{
        background: 'linear-gradient(180deg, #09170f 0%, #132b20 100%)',
        borderBottom: '1px solid #1B3A2C',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        zIndex: 10,
        height: '72px'
      }}>
        <div className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/ksp_police_logo.png" alt="KSP Crest" style={{ width: 54, height: 54, objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />
          <div className="header-title" style={{ textAlign: 'left' }}>
            <h1 style={{ 
              background: 'linear-gradient(to right, #F3C065, #E5A842)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.45rem', 
              fontWeight: 900, 
              margin: 0, 
              letterSpacing: '0.8px', 
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))'
            }}>
              {activeZone ? `${activeZone.name.toUpperCase()} POLICE STATION COMMAND` : `${divisionName.toUpperCase()} DIVISION COMMAND`}
            </h1>
            <p style={{ color: '#FFFFFF', fontWeight: 800, margin: '2px 0 0 0', fontSize: '0.68rem', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>KARNATAKA STATE POLICE</span> • 
              <span>{activeZone ? activeZone.sector.toUpperCase() : `${divisionName.toUpperCase()} HEADQUARTERS`}</span> • 
              <span>{isHead ? 'IGP / ADGP EXCLUSIVE CONSOLE' : 'STATION UNIT RESTRICTED ACCESS'}</span>
            </p>
          </div>
        </div>

        <div className="header-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Unit Badge (Amber box) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 12px', borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.5)'
          }}>
            <Shield size={16} style={{ color: '#F59E0B' }} />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#F59E0B', lineHeight: 1.1 }}>
                {activeZone ? `${activeZone.name} Station Unit` : `${divisionName} Head Unit`}
              </span>
              <span style={{ fontSize: '0.62rem', color: '#D49B44', fontWeight: 700 }}>
                {currentUser?.username || 'ksp.user'} • {isHead ? 'All Units Access' : 'Restricted Station Access'}
              </span>
            </div>
          </div>

          {/* Panic Mode */}
          <button
            onClick={() => setPanicActive(true)}
            style={{
              background: '#DC2626', color: '#ffffff', border: '1px solid #F59E0B',
              padding: '6px 14px', borderRadius: '100px', fontWeight: 800, fontSize: '0.74rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 0 10px rgba(245,158,11,0.5)'
            }}
          >
            <ShieldAlert size={15} /> Panic Mode
          </button>

          {/* Log Out */}
          <button
            onClick={onLogout}
            style={{
              background: 'transparent', color: '#FCFCFA', border: '1px solid rgba(252, 252, 250, 0.4)',
              padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.74rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
            }}
          >
            <LogOut size={14} style={{ color: '#FCFCFA' }} /> Log Out
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN DASHBOARD GRID */}
      <div className="dashboard-grid" style={{ flex: 1, padding: '12px', gap: '12px', display: 'grid', gridTemplateColumns: '320px 1fr 360px', overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: Analytics & Subdivisions */}
        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', background: '#FCFCFA', borderRadius: '14px', border: '1px solid #D4CEBF', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', background: '#F0EAE0', padding: '4px', margin: '10px 10px 0 10px', borderRadius: '10px' }}>
            <button
              onClick={() => setLeftTab('insights')}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem',
                background: leftTab === 'insights' ? '#FFFFFF' : 'transparent',
                color: leftTab === 'insights' ? '#132B20' : '#6E7A73',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: leftTab === 'insights' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <BarChart2 size={14} /> {activeZone ? `${activeZone.name} Station Analytics` : `${divisionName} Analytics`}
            </button>
            <button
              onClick={() => setLeftTab('social')}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem',
                background: leftTab === 'social' ? '#FFFFFF' : 'transparent',
                color: leftTab === 'social' ? '#132B20' : '#6E7A73',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: leftTab === 'social' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <Share2 size={14} /> Social MCP Feed
            </button>
          </div>

          {leftTab === 'insights' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Subdivisions Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', padding: '0 4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#132B20', letterSpacing: '0.5px' }}>
                  {divisionName.toUpperCase()} DIVISION SUBDIVISIONS:
                </span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px',
                  background: isHead ? '#FEF3C7' : '#F0EAE0',
                  color: isHead ? '#D97706' : '#6E7A73',
                  border: `1px solid ${isHead ? '#F59E0B' : '#D4CEBF'}`
                }}>
                  {isHead ? '👑 All Subdivisions Access' : `🔒 Locked to ${userUnitZone.name}`}
                </span>
              </div>

              {/* Subdivision Cards List */}
              {zonesData.map((zone, idx) => {
                const isSelected = activeZone?.name === zone.name;
                const isLocked = !isHead && userUnitZone?.name !== zone.name;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (!isLocked) {
                        setSelectedZone(zone);
                        if (mapInstance) mapInstance.flyTo(zone.coords, 11);
                      }
                    }}
                    style={{
                      background: isSelected ? '#132B20' : isLocked ? '#F0EAE0' : '#FFFFFF',
                      border: `1px solid ${isSelected ? 'transparent' : isLocked ? '#D4CEBF' : '#E8E2D5'}`,
                      borderLeft: isSelected ? '4px solid #F59E0B' : '1px solid ' + (isLocked ? '#D4CEBF' : '#E8E2D5'),
                      borderRadius: isSelected ? '0 10px 10px 0' : '10px',
                      padding: '10px 12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isLocked ? 0.75 : 1,
                      boxShadow: isSelected ? '0 4px 12px rgba(19, 43, 32, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1rem', color: isSelected ? '#FCFCFA' : '#132B20' }}>
                        {isLocked ? '🔒' : isSelected ? '🛡️' : '📍'}
                      </span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelected ? '#FCFCFA' : isLocked ? '#6E7A73' : '#132B20' }}>
                          {zone.name}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: isSelected ? '#FBBF24' : '#6E7A73', fontWeight: 600 }}>
                          {zone.sector} • {isLocked ? 'Restricted Data' : 'Station Unit Data'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px',
                        background: isSelected ? 'rgba(245, 158, 11, 0.1)' : isLocked ? '#E8E2D5' : '#dcfce7',
                        color: isSelected ? '#F59E0B' : isLocked ? '#6E7A73' : '#166534',
                        border: `1px solid ${isSelected ? 'rgba(245, 158, 11, 0.3)' : isLocked ? '#D4CEBF' : '#86efac'}`
                      }}>
                        {isLocked ? 'LOCKED ●' : 'ACTIVE ●'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              <SocialFeed />
            </div>
          )}
        </div>

        {/* CENTER COLUMN: Interactive Map with GeoJSON Boundaries & Legend Overlay */}
        <div className="view-map-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
          
          {/* Top Search Bar */}
          <div style={{ background: '#FBF9F5', padding: '8px 12px', borderRadius: '12px', border: '1px solid #D4CEBF', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <Search size={16} style={{ color: '#132B20' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder={`Search ${divisionName} Division subdivisions (e.g., Urban, KGF, Tumakuru, Davanagere)...`}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.8rem', background: 'transparent', fontWeight: 600, color: '#132B20' }}
            />
          </div>

          {/* Action Switcher Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <button
              onClick={resetMap}
              style={{
                background: '#132B20', color: '#ffffff', border: 'none',
                padding: '6px 14px', borderRadius: '100px', fontWeight: 800, fontSize: '0.72rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap'
              }}
            >
              <Building2 size={13} style={{ color: '#F59E0B' }} /> {divisionName} {zonesData.length} Subdivisions
            </button>
            <button
              onClick={() => setSelectedZone(null)}
              style={{
                background: '#ffffff', color: '#132B20', border: '1px solid #D4CEBF',
                padding: '6px 14px', borderRadius: '100px', fontWeight: 800, fontSize: '0.72rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap'
              }}
            >
              <Crown size={13} style={{ color: '#D97706' }} /> {divisionName} Division Head View
            </button>
            <button
              onClick={() => setMapStyle('google_street')}
              style={{
                background: mapStyle === 'google_street' ? '#132B20' : '#ffffff',
                color: mapStyle === 'google_street' ? '#ffffff' : '#132B20',
                border: mapStyle === 'google_street' ? '1px solid transparent' : '1px solid #D4CEBF',
                padding: '6px 14px', borderRadius: '100px',
                fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              🗺️ Street
            </button>
            <button
              onClick={() => setMapStyle('google_satellite')}
              style={{
                background: mapStyle === 'google_satellite' ? '#132B20' : '#ffffff',
                color: mapStyle === 'google_satellite' ? '#ffffff' : '#132B20',
                border: mapStyle === 'google_satellite' ? '1px solid transparent' : '1px solid #D4CEBF',
                padding: '6px 14px', borderRadius: '100px',
                fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              🌐 Satellite
            </button>
          </div>

          {/* Leaflet Map with GeoJSON Layer & Pins matching user image */}
          <div style={{ flex: 1, borderRadius: '14px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
            <MapContainer
              center={centerCoords}
              zoom={initialZoom}
              zoomControl={true}
              style={{ width: '100%', height: '100%' }}
              ref={setMapInstance}
              attributionControl={false}
            >
              <TileLayer url={TILE_PROVIDERS[mapStyle]?.url || TILE_PROVIDERS.google_street.url} />

              {/* GeoJSON District Boundaries with Dashed stroke (----) matching screenshot */}
              {divisionGeoJSON && (
                <GeoJSON
                  key={`${divKey}-${activeZone?.name || 'all'}`}
                  ref={geoJsonLayerRef}
                  data={divisionGeoJSON}
                  style={(feature) => {
                    const matchZone = zonesData.find(z => z.name.toLowerCase() === feature.properties.normalized_district?.toLowerCase());
                    const isSelected = activeZone && matchZone && activeZone.name.toLowerCase() === matchZone.name.toLowerCase();
                    const color = isSelected ? '#D49B44' : (matchZone?.color || feature.properties.color || '#2563eb');
                    
                    // Dim others significantly if something is selected.
                    let baseOpacity = activeZone ? 0.15 : 0.25;

                    return {
                      fillColor: color,
                      fillOpacity: isSelected ? 0.75 : baseOpacity,
                      color: color,
                      weight: isSelected ? 3 : 2,
                      dashArray: '5, 5'
                    };
                  }}
                  onEachFeature={(feature, layer) => {
                    const normalizedName = feature.properties.normalized_district;
                    const matchZone = zonesData.find(z => z.name.toLowerCase() === normalizedName?.toLowerCase());
                    
                    if (matchZone) {
                      const isSelected = activeZone && activeZone.name.toLowerCase() === matchZone.name.toLowerCase();
                      
                      // Bind Tooltip
                      layer.bindTooltip(`
                        <div style="font-weight: 800; font-size: 0.85rem;">${normalizedName.toUpperCase()}</div>
                        <div style="font-size: 0.65rem; opacity: 0.9; margin-top: 2px;">
                          ${isSelected ? 'CURRENTLY SELECTED' : 'DISTRICT COMMAND'}
                        </div>
                      `, { 
                        className: 'drishti-tooltip',
                        direction: 'top',
                        sticky: true
                      });

                      layer.on({
                        mouseover: (e) => {
                          const l = e.target;
                          l.setStyle({ fillOpacity: isSelected ? 0.85 : 0.5 });
                          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                            l.bringToFront();
                          }
                        },
                        mouseout: (e) => {
                          const l = e.target;
                          const opacity = isSelected ? 0.75 : (activeZone ? 0.15 : 0.25);
                          l.setStyle({ fillOpacity: opacity });
                        },
                        click: () => {
                          if (isHead || userUnitZone?.name === matchZone.name) {
                            setSelectedZone(matchZone);
                          }
                        }
                      });
                    }
                  }}
                />
              )}

              {/* Station Pin Markers matching red pill in screenshot (📍 KOLAR GOLD FIELDS) */}
              {zonesData.map((zone, idx) => (
                <React.Fragment key={idx}>
                  <Marker
                    position={zone.coords}
                    icon={createStationPinIcon(zone.name, zone.color)}
                    eventHandlers={{
                      click: () => {
                        if (isHead || userUnitZone?.name === zone.name) {
                          setSelectedZone(zone);
                        }
                      }
                    }}
                  >
                    <Popup>
                      <div style={{ padding: '6px', textAlign: 'left', minWidth: 210 }}>
                        <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>{zone.name}</h4>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: '#475569' }}>{zone.sector}</p>
                        <div style={{ marginTop: '4px', fontSize: '0.7rem', fontWeight: 700, color: '#0284c7' }}>
                          Total Cases: {zone.cases?.toLocaleString()}
                        </div>
                        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #e2e8f0', fontSize: '0.65rem' }}>
                          <div style={{ fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Direct Location Map Links:</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <a
                              href={`https://www.google.com/maps?q=${zone.coords[0]},${zone.coords[1]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'underline', wordBreak: 'break-all' }}
                            >
                              Google Maps Location
                            </a>
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${zone.coords[0]}&mlon=${zone.coords[1]}#map=13/${zone.coords[0]}/${zone.coords[1]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#059669', fontWeight: 700, textDecoration: 'underline', wordBreak: 'break-all' }}
                            >
                              OpenStreetMap Interactive View
                            </a>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}

              {/* Hotspots */}
              {hotspots?.map(hs => (
                <Circle
                  key={hs.id}
                  center={hs.coords}
                  radius={hs.radius}
                  pathOptions={{ fillColor: hs.color, color: hs.color, weight: 2, fillOpacity: 0.25 }}
                />
              ))}
            </MapContainer>

            {/* BENGALURU / DIVISION MAP LEGEND OVERLAY (Bottom Right matching user screenshot) */}
            <div style={{
              position: 'absolute',
              bottom: '38px',
              right: '16px',
              zIndex: 1000,
              background: '#ffffff',
              border: '1.5px solid #0284c7',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
              minWidth: '290px',
              maxWidth: '320px'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '0.3px', marginBottom: '10px', textAlign: 'left' }}>
                {divisionName.toUpperCase()} DIVISION LEGEND
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 12px', fontSize: '0.68rem', fontWeight: 800 }}>
                {zonesData.map((z, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                    <span style={{ width: 12, height: 10, borderRadius: 2, background: z.color, display: 'inline-block', flexShrink: 0 }}></span>
                    <span>{z.name.toUpperCase()}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Custom Bottom Right GIS Attribution Bar matching screenshot */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              background: '#132B20',
              padding: '6px 12px',
              fontSize: '0.65rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 1000,
              borderTop: '1px solid #1B3A2C'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 800, color: '#FCFCFA' }}>Karnataka State Police GIS Portal</span>
                <span style={{ color: '#5A6860' }}>|</span>
                <span style={{ color: '#D4CEBF' }}>Powered by Zoho Catalyst Cloud</span>
                <span style={{ color: '#5A6860' }}>|</span>
                <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={10} /> Secure Network
                </span>
                <span style={{ color: '#5A6860' }}>|</span>
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }}></span> All Systems Operational
                </span>
              </div>
              <div style={{ 
                color: '#6E7A73', 
                fontSize: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <a href="https://leafletjs.com" target="_blank" rel="noreferrer" style={{ color: '#D49B44', textDecoration: 'none' }}>Leaflet</a>
                <span>|</span>
                <span>© Karnataka State Police GIS Portal</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Statistics Panel */}
        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', background: '#FCFCFA', borderRadius: '14px', border: '1px solid #D4CEBF', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <DivisionStatisticsPanel
            divisionName={divisionName}
            overallStats={overallStats}
            selectedZoneData={activeZone}
            onResetSelection={() => setSelectedZone(null)}
          />
        </div>

      </div>



      {panicActive && <PanicSOS onClose={() => setPanicActive(false)} />}

      {/* Floating KSP DRISHTI Assistant Trigger (Placeholder) */}
      <button
        className="floating-chatbot-trigger"
        onClick={() => {}}
        title="KSP DRISHTI Intelligence Assistant (Offline for Maintenance)"
        aria-label="KSP DRISHTI Assistant"
      >
        <Bot size={26} />
      </button>
    </div>
  );
}

export default DivisionDashboard;

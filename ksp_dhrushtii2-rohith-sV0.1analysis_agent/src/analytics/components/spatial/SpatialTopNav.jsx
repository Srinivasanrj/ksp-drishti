import React from 'react';
import {
  ArrowLeft,
  Compass,
  MapPin,
  Flame,
  ShieldAlert,
  Search,
  UploadCloud,
  Layers
} from 'lucide-react';

/**
 * SpatialTopNav — Slimline 48px Command Header (SOLID: SRP)
 * Handles global navigation, view mode switching, search query input, and dataset modal trigger.
 */
export default function SpatialTopNav({
  onBackToChat,
  viewMode,
  onViewModeChange,
  hotspotsCount = 0,
  totalCoordinates = 0,
  searchQuery,
  onSearchChange,
  activeTileType,
  onTileTypeChange,
  onOpenUploader,
  activeDatasetsCount = 1
}) {
  return (
    <header style={{
      height: '52px',
      padding: '0 18px',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(59, 130, 246, 0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      zIndex: 1000,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Left: Back Button & Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 'fit-content' }}>
        {onBackToChat && (
          <button
            onClick={onBackToChat}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: '7px',
              padding: '5px 10px',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
            title="Return to Conversational Chatbot Feed"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(2, 132, 199, 0.4)'
          }}>
            <Compass size={16} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>KSP SPATIAL RADAR</span>
              <span style={{
                backgroundColor: 'rgba(56, 189, 248, 0.18)',
                color: '#38bdf8',
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                {totalCoordinates.toLocaleString()} Plotted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Segmented View Mode Switcher */}
      <div className="ksp-mode-switcher-group">
        <button
          className={`ksp-mode-btn ${viewMode === 'POINTS' ? 'active' : ''}`}
          onClick={() => onViewModeChange('POINTS')}
          title="Display individual incident coordinate points"
        >
          <MapPin size={12} />
          <span>Points</span>
        </button>

        <button
          className={`ksp-mode-btn heatmap-mode ${viewMode === 'HEATMAP' ? 'active' : ''}`}
          onClick={() => onViewModeChange('HEATMAP')}
          title="Display continuous density gradient heatmap"
        >
          <Flame size={12} />
          <span>Heatmap</span>
        </button>

        <button
          className={`ksp-mode-btn hotspot-mode ${viewMode === 'HOTSPOTS' ? 'active' : ''}`}
          onClick={() => onViewModeChange('HOTSPOTS')}
          title="Run DBSCAN clustering to detect statistical crime hotspots"
        >
          <ShieldAlert size={12} />
          <span>Hotspots (DBSCAN)</span>
          {hotspotsCount > 0 && viewMode === 'HOTSPOTS' && (
            <span style={{
              backgroundColor: '#ffffff',
              color: '#dc2626',
              borderRadius: '10px',
              padding: '0 5px',
              fontSize: '0.62rem',
              fontWeight: 900
            }}>
              {hotspotsCount}
            </span>
          )}
        </button>
      </div>

      {/* Right: Quick Search, Basemap, & Ingest */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Search Box */}
        <div style={{ position: 'relative', width: '180px' }}>
          <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search incident, station..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '7px',
              padding: '5px 8px 5px 26px',
              fontSize: '0.72rem',
              color: '#f8fafc',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
            onBlur={(e) => e.target.style.borderColor = '#334155'}
          />
        </div>

        {/* Basemap Picker */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '7px',
          padding: '2px 4px'
        }}>
          <button
            onClick={() => onTileTypeChange('VOYAGER')}
            style={{
              background: activeTileType === 'VOYAGER' ? '#2563eb' : 'transparent',
              color: activeTileType === 'VOYAGER' ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: '5px',
              padding: '3px 7px',
              fontSize: '0.66rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Voyager
          </button>
          <button
            onClick={() => onTileTypeChange('DARK')}
            style={{
              background: activeTileType === 'DARK' ? '#2563eb' : 'transparent',
              color: activeTileType === 'DARK' ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: '5px',
              padding: '3px 7px',
              fontSize: '0.66rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Dark
          </button>
        </div>

        {/* Ingest Dataset Trigger */}
        <button
          onClick={onOpenUploader}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            borderRadius: '7px',
            padding: '5px 11px',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.12)'
          }}
          title="Ingest CSV/KML files and manage active spatial dataset layers"
        >
          <UploadCloud size={13} color="#38bdf8" />
          <span>Ingest</span>
          {activeDatasetsCount > 1 && (
            <span style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '1px 5px',
              fontSize: '0.6rem',
              fontWeight: 900
            }}>
              {activeDatasetsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

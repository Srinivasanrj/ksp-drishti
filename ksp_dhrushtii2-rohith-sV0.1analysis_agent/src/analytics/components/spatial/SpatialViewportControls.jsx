import React from 'react';
import { Plus, Minus, Crosshair, RotateCcw } from 'lucide-react';

/**
 * SpatialViewportControls — Floating Bottom-Left Navigation Tools (SOLID: SRP)
 * Handles zoom in, zoom out, auto-fitting to dataset bounds, and resetting slicers.
 */
export default function SpatialViewportControls({
  onZoomIn,
  onZoomOut,
  onFitBounds,
  onResetFilters
}) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '24px',
      left: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      zIndex: 999,
      pointerEvents: 'auto'
    }}>
      {/* Zoom In & Zoom Out Cluster */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)'
      }}>
        <button
          onClick={onZoomIn}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#f8fafc',
            padding: '8px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Zoom In"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={onZoomOut}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f8fafc',
            padding: '8px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Zoom Out"
        >
          <Minus size={14} />
        </button>
      </div>

      {/* Auto-Fit Bounds Button */}
      <button
        onClick={onFitBounds}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          color: '#38bdf8',
          padding: '7px 11px',
          fontSize: '0.72rem',
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.92)'}
        title="Auto-Fit View to Plotted Coordinates"
      >
        <Crosshair size={13} color="#38bdf8" />
        <span>Fit Bounds</span>
      </button>

      {/* Reset Slicers Button */}
      <button
        onClick={onResetFilters}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '8px',
          color: '#fca5a5',
          padding: '7px 11px',
          fontSize: '0.72rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'}
        title="Reset all slicers and viewport"
      >
        <RotateCcw size={13} />
        <span>Reset</span>
      </button>
    </div>
  );
}

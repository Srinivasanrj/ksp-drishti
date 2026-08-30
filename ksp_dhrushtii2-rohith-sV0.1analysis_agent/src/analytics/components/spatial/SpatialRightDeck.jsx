import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  FileText,
  ChevronRight,
  ChevronLeft,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  Filter,
  CheckCircle2
} from 'lucide-react';

/**
 * SpatialRightDeck — Unified Floating Right Command & Intelligence Deck (SOLID: SRP + ISP)
 * Features dual-mode tab switching:
 * - Tab 1: Control Deck (Slicers, Layer Toggles, Live Incident KPIs)
 * - Tab 2: Intelligence Dossier (Deep-Dive Analysis, Threat Level, AI Leads)
 */
export default function SpatialRightDeck({
  isCollapsed,
  onToggleCollapse,
  activeTab,
  onTabChange,
  // Slicers
  dynamicFilters,
  selectedCategory,
  onCategoryChange,
  selectedDivision,
  onDivisionChange,
  selectedStation,
  onStationChange,
  selectedStatus,
  onStatusChange,
  // Layer Toggles
  showStateBoundary,
  onToggleStateBoundary,
  showDistricts,
  onToggleDistricts,
  showDistrictLabels,
  onToggleDistrictLabels,
  // Metrics
  kpiSummary,
  selectedHotspot,
  onClearHotspot,
  selectedDistrictName,
  onClearDistrict,
  onBackToChat,
  onStartInvestigation
}) {
  // Auto-switch to Dossier tab when a hotspot or district is clicked
  useEffect(() => {
    if (selectedHotspot || selectedDistrictName) {
      onTabChange('DOSSIER');
    }
  }, [selectedHotspot, selectedDistrictName, onTabChange]);

  return (
    <aside style={{
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: isCollapsed ? '42px' : '340px',
      maxHeight: 'calc(100% - 32px)',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '14px',
      zIndex: 999,
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'auto'
    }}>
      {/* Deck Header & Collapse Toggle */}
      <div style={{
        padding: isCollapsed ? '12px 0' : '10px 14px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        backgroundColor: '#0f172a'
      }}>
        {!isCollapsed && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => onTabChange('CONTROLS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                backgroundColor: activeTab === 'CONTROLS' ? '#2563eb' : 'transparent',
                color: activeTab === 'CONTROLS' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease'
              }}
            >
              <SlidersHorizontal size={12} />
              <span>Controls</span>
            </button>

            <button
              onClick={() => onTabChange('DOSSIER')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                backgroundColor: activeTab === 'DOSSIER' ? '#0284c7' : 'transparent',
                color: activeTab === 'DOSSIER' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease'
              }}
            >
              <FileText size={12} />
              <span>Dossier</span>
              {(selectedHotspot || selectedDistrictName) && (
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 6px #ef4444'
                }} />
              )}
            </button>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          title={isCollapsed ? 'Expand Command Deck' : 'Collapse Command Deck'}
        >
          {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Main Content Body (Scrollable) */}
      {!isCollapsed && (
        <div style={{ padding: '14px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeTab === 'CONTROLS' ? (
            /* ── TAB 1: CONTROLS & SLICERS DECK ── */
            <>
              {/* Crime Slicers Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38bdf8', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  <Filter size={11} color="#38bdf8" />
                  <span>Crime Slicers</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Category Slicer */}
                  <div>
                    <label style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Crime Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => onCategoryChange(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '5px 8px',
                        outline: 'none',
                        marginTop: '2px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ALL">All Categories ({dynamicFilters.categories.length})</option>
                      {dynamicFilters.categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Division Slicer */}
                  {dynamicFilters.divisions.length > 0 && (
                    <div>
                      <label style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Division / Region</label>
                      <select
                        value={selectedDivision}
                        onChange={(e) => onDivisionChange(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '5px 8px',
                          outline: 'none',
                          marginTop: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="ALL">All Divisions ({dynamicFilters.divisions.length})</option>
                        {dynamicFilters.divisions.map(div => (
                          <option key={div} value={div}>{div}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Station Slicer */}
                  {dynamicFilters.stations.length > 0 && (
                    <div>
                      <label style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Police Station</label>
                      <select
                        value={selectedStation}
                        onChange={(e) => onStationChange(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '5px 8px',
                          outline: 'none',
                          marginTop: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="ALL">All Stations ({dynamicFilters.stations.length})</option>
                        {dynamicFilters.stations.map(stn => (
                          <option key={stn} value={stn}>{stn}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Status Slicer */}
                  {dynamicFilters.statuses.length > 0 && (
                    <div>
                      <label style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Case Status</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => onStatusChange(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '5px 8px',
                          outline: 'none',
                          marginTop: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="ALL">All Statuses ({dynamicFilters.statuses.length})</option>
                        {dynamicFilters.statuses.map(stat => (
                          <option key={stat} value={stat}>{stat}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Layer Toggles Section */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38bdf8', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  <Layers size={11} color="#38bdf8" />
                  <span>Layer Overlays</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* 30 Districts Toggle */}
                  <div
                    onClick={onToggleDistricts}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      backgroundColor: showDistricts ? 'rgba(2, 132, 199, 0.15)' : '#1e293b',
                      border: `1px solid ${showDistricts ? 'rgba(2, 132, 199, 0.4)' : '#334155'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      color: showDistricts ? '#38bdf8' : '#94a3b8'
                    }}
                  >
                    <span>30 Districts KGIS Polygons</span>
                    {showDistricts ? <Eye size={13} color="#38bdf8" /> : <EyeOff size={13} />}
                  </div>

                  {/* District Names Typography Toggle */}
                  {showDistricts && (
                    <div
                      onClick={onToggleDistrictLabels}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        backgroundColor: showDistrictLabels ? 'rgba(168, 85, 247, 0.15)' : '#1e293b',
                        border: `1px solid ${showDistrictLabels ? 'rgba(168, 85, 247, 0.4)' : '#334155'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        color: showDistrictLabels ? '#c084fc' : '#94a3b8'
                      }}
                    >
                      <span>District Name Labels</span>
                      {showDistrictLabels ? <Eye size={13} color="#c084fc" /> : <EyeOff size={13} />}
                    </div>
                  )}

                  {/* State Boundary Toggle */}
                  <div
                    onClick={onToggleStateBoundary}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      backgroundColor: showStateBoundary ? 'rgba(37, 99, 235, 0.15)' : '#1e293b',
                      border: `1px solid ${showStateBoundary ? 'rgba(59, 130, 246, 0.4)' : '#334155'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      color: showStateBoundary ? '#60a5fa' : '#94a3b8'
                    }}
                  >
                    <span>Karnataka State Bound Vector</span>
                    {showStateBoundary ? <Eye size={13} color="#60a5fa" /> : <EyeOff size={13} />}
                  </div>
                </div>
              </div>

              {/* Live Incident KPI Metrics */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Live Incident Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div style={{ backgroundColor: '#1e293b', padding: '6px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Plotted Cases</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>
                      {kpiSummary.total.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '6px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.6rem', color: '#64748b' }}>High Risk Hotspots</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#ef4444', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Flame size={12} /> {kpiSummary.highRisk.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── TAB 2: INTELLIGENCE DOSSIER DECK ── */
            <>
              {selectedHotspot ? (
                /* Hotspot Intelligence Dossier */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Hotspot Header */}
                  <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="hotspot-pulse-dot" style={{ background: selectedHotspot.threat_color || '#ef4444' }} />
                        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>
                          {selectedHotspot.name || 'DBSCAN Hotspot'}
                        </h4>
                      </div>
                      <button
                        onClick={onClearHotspot}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{
                      display: 'inline-block',
                      marginTop: '3px',
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      color: selectedHotspot.threat_color || '#ef4444',
                      letterSpacing: '0.5px'
                    }}>
                      {selectedHotspot.threat_level || 'HIGH'} THREAT LEVEL
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div style={{ backgroundColor: '#1e293b', padding: '6px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Volume</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#f8fafc' }}>
                        {selectedHotspot.incident_count} <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Cases</span>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#1e293b', padding: '6px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Dominant Crime</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedHotspot.primary_crime}
                      </div>
                    </div>
                  </div>

                  {/* Primary Station */}
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>Jurisdiction:</span>{' '}
                    <b>{selectedHotspot.top_station || 'District HQ'}</b>
                  </div>

                  {/* Category Breakdown Tags */}
                  {selectedHotspot.category_breakdown && (
                    <div>
                      <div style={{ fontSize: '0.64rem', color: '#94a3b8', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase' }}>
                        Category Distribution
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {Object.entries(selectedHotspot.category_breakdown).map(([cat, count]) => (
                          <span
                            key={cat}
                            style={{
                              backgroundColor: 'rgba(37, 99, 235, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '5px',
                              padding: '2px 6px',
                              fontSize: '0.65rem',
                              color: '#93c5fd',
                              fontWeight: 700
                            }}
                          >
                            {cat}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Leads */}
                  {selectedHotspot.llm_investigative_leads && (
                    <div style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '8px',
                      padding: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontSize: '0.7rem', fontWeight: 800, marginBottom: '4px' }}>
                        <Sparkles size={12} color="#38bdf8" />
                        <span>AI Tactical Leads</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.66rem', color: '#cbd5e1', lineHeight: 1.35 }}>
                        {selectedHotspot.llm_investigative_leads.map((lead, i) => (
                          <li key={i} style={{ marginBottom: '3px' }}>{lead}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action: Send to Conversational Agent */}
                  {(onStartInvestigation || onBackToChat) && (
                    <button
                      onClick={() => {
                        if (onStartInvestigation) {
                          onStartInvestigation(selectedHotspot);
                        } else if (onBackToChat) {
                          onBackToChat();
                        }
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '7px',
                        padding: '7px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                        transition: 'all 0.15s ease'
                      }}
                      title="Open Tactical AI Investigator with this Hotspot Context"
                    >
                      <Sparkles size={13} />
                      <span>Investigate with AI Agent</span>
                    </button>
                  )}
                </div>
              ) : selectedDistrictName ? (
                /* Selected District Card */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={16} color="#38bdf8" />
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>
                        {selectedDistrictName}
                      </h4>
                    </div>
                    <button
                      onClick={onClearDistrict}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    District boundary polygon active. Use slicers on the left or click a Hotspot cluster to inspect localized incidents.
                  </div>
                </div>
              ) : (
                /* Empty Dossier Prompt */
                <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748b', fontSize: '0.72rem' }}>
                  <ShieldAlert size={28} color="#334155" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <b style={{ color: '#94a3b8' }}>No Hotspot Selected</b>
                  <p style={{ marginTop: '4px', lineHeight: 1.4 }}>
                    Click any DBSCAN Hotspot polygon or district on the map canvas to open its deep-dive analytical dossier.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </aside>
  );
}

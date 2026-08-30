import React from 'react';
import { Filter, RotateCcw, Search, MapPin, ShieldAlert, Calendar, CheckCircle2 } from 'lucide-react';

export default function FilterSlicerPanel({
  rawRecords = [],
  filteredCount = 0,
  filters,
  onFilterChange,
  onResetFilters
}) {
  // Derive unique options dynamically from raw records
  const uniqueDivisions = ['All', ...Array.from(new Set(rawRecords.map(r => r.Division).filter(Boolean)))];
  const uniqueDistricts = ['All', ...Array.from(new Set(rawRecords.map(r => r.District).filter(Boolean)))];
  const uniqueCategories = ['All', ...Array.from(new Set(rawRecords.map(r => r.Crime_Category).filter(Boolean)))];
  const uniqueStatuses = ['All', ...Array.from(new Set(rawRecords.map(r => r.Status).filter(Boolean)))];
  const uniqueYears = ['All', ...Array.from(new Set(rawRecords.map(r => r.Year).filter(Boolean))).sort((a, b) => b - a)];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0
    }}>
      {/* FILTER PANEL HEADER */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: '#0284c7' }} />
          <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
            Filter Slicers
          </h3>
        </div>

        <button
          onClick={onResetFilters}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: '#0284c7',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          title="Reset all slicers"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* RECORD MATCH COUNTER BADGE */}
      <div style={{
        padding: '8px 16px',
        background: '#f0f9ff',
        borderBottom: '1px solid #e0f2fe',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600 }}>Active Slice:</span>
        <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 800 }}>
          {filteredCount.toLocaleString()} / {rawRecords.length.toLocaleString()} rows
        </span>
      </div>

      {/* SLICERS FORM */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        
        {/* KEYWORD SEARCH */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Search Keyword:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px' }}>
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Filter station, FIR..."
              value={filters.searchKeyword || ''}
              onChange={(e) => onFilterChange('searchKeyword', e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.76rem', color: '#0f172a', width: '100%' }}
            />
          </div>
        </div>

        {/* DIVISION SLICER */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Command Division:
          </label>
          <select
            value={filters.division}
            onChange={(e) => onFilterChange('division', e.target.value)}
            style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '7px 10px', fontSize: '0.76rem', fontWeight: 600, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
          >
            {uniqueDivisions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* DISTRICT SLICER */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            District Unit:
          </label>
          <select
            value={filters.district}
            onChange={(e) => onFilterChange('district', e.target.value)}
            style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '7px 10px', fontSize: '0.76rem', fontWeight: 600, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
          >
            {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* CRIME CATEGORY SLICER */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Crime Category:
          </label>
          <select
            value={filters.crimeCategory}
            onChange={(e) => onFilterChange('crimeCategory', e.target.value)}
            style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '7px 10px', fontSize: '0.76rem', fontWeight: 600, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
          >
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* YEAR SLICER */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Year:
          </label>
          <select
            value={filters.year}
            onChange={(e) => onFilterChange('year', e.target.value)}
            style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '7px 10px', fontSize: '0.76rem', fontWeight: 600, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
          >
            {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* STATUS SLICER */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Case Stage / Status:
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '7px 10px', fontSize: '0.76rem', fontWeight: 600, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
          >
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

      </div>
    </aside>
  );
}

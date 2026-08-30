import React from 'react';
import { Search, Moon, Bell, Sparkles, Shield } from 'lucide-react';

export default function PortalHeader({ divisionName, onQuickSearchClick }) {
  return (
    <header style={{
      height: '60px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0
    }}>
      {/* SEARCH BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '7px 14px',
        width: '380px'
      }}>
        <Search size={16} style={{ color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Search cases, FIRs, suspects..."
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '0.82rem',
            color: '#1e293b',
            width: '100%',
            fontWeight: 500
          }}
        />
      </div>

      {/* RIGHT ACTIONS & PROFILE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* QUICK AI SEARCH BUTTON */}
        <button
          onClick={onQuickSearchClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#0f172a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)'
          }}
        >
          <Sparkles size={14} style={{ color: '#38bdf8' }} />
          <span>AI Crime Search</span>
        </button>

        {/* NIGHT MODE TOGGLE */}
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: '6px', borderRadius: '6px' }}>
          <Moon size={18} />
        </button>

        {/* NOTIFICATIONS BELL */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={18} style={{ color: '#64748b' }} />
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '14px',
            height: '14px',
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            color: '#ffffff',
            fontSize: '0.58rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            3
          </span>
        </div>

        {/* OFFICER PROFILE BADGE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#1e3a8a',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            AR
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              Arjun Rao
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
              Inspector • {divisionName || 'Whitefield PS'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

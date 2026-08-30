import React from 'react';
import {
  Network,
  ArrowLeft,
  Settings,
  HardDrive,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const FOCUSED_WORKSPACES = [
  { id: 'network_graph', label: 'Network & Link Intelligence', icon: Network, badge: 'Graph Topology' }
];

export default function PortalSidebar({ activeTab, setActiveTab, onBackToChat, isDatasetLoaded = false, recordCount = 0 }) {
  return (
    <aside style={{
      width: '240px',
      height: '100%',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* BRAND HEADER */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)'
        }}>
          <img src="/ksp_police_logo.png" alt="KSP Logo" style={{ width: '22px', height: '22px' }} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
            KSP Platform
          </h2>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
            Executive BI & Analytics
          </div>
        </div>
      </div>

      {/* RETURN TO ASSISTANT BUTTON */}
      <div style={{ padding: '12px 14px 6px 14px' }}>
        <button
          onClick={onBackToChat}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f1f5f9',
            color: '#1e3a8a',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
        >
          <ArrowLeft size={14} />
          <span>← Back to AI Assistant</span>
        </button>
      </div>

      {/* 3 FOCUSED WORKSPACES NAVIGATION */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', padding: '4px 8px' }}>
          Workspaces
        </div>

        {FOCUSED_WORKSPACES.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#0f172a' : 'transparent',
                color: isActive ? '#ffffff' : '#475569',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={16} color={isActive ? '#38bdf8' : '#64748b'} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: isActive ? '#1e293b' : '#eff6ff',
                  color: isActive ? '#38bdf8' : '#2563eb',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #bfdbfe'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* DATASET STATUS PILL IN SIDEBAR FOOTER */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
        <div style={{
          backgroundColor: isDatasetLoaded ? '#f0fdf4' : '#fffbeb',
          border: isDatasetLoaded ? '1px solid #bbf7d0' : '1px solid #fef3c7',
          borderRadius: '8px',
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {isDatasetLoaded ? (
            <CheckCircle2 size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
          ) : (
            <AlertCircle size={14} style={{ color: '#d97706', flexShrink: 0 }} />
          )}
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isDatasetLoaded ? '#166534' : '#92400e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isDatasetLoaded ? 'Active Data Mart' : 'No Dataset Loaded'}
            </div>
            <div style={{ fontSize: '0.62rem', color: isDatasetLoaded ? '#15803d' : '#b45309' }}>
              {isDatasetLoaded ? `${recordCount.toLocaleString()} records indexed` : 'Upload CSV / DB'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

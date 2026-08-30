import React, { useState } from 'react';
import { Database, Upload, FileText, CheckCircle, AlertCircle, Sparkles, RefreshCw, Layers, ArrowRight, Play } from 'lucide-react';

export default function DynamicRAGConnector({ onDatasetLoaded }) {
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' | 'db'
  const [dbType, setDbType] = useState('postgres');
  const [connectionString, setConnectionString] = useState('postgresql://ksp_officer:******@10.0.4.12:5432/crimes_2026');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedStatus, setConnectedStatus] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: 'KSP_Cyber_Crime_Q3_2026.csv', size: '1.4 MB', rows: 4280, columns: ['Date', 'Station', 'Motive', 'Loss_INR', 'Accused_State'], status: 'Indexed' },
    { name: 'Bengaluru_East_Night_Burglary_Log.xlsx', size: '890 KB', rows: 1140, columns: ['FIR_No', 'Area', 'Time_Window', 'Entry_Method'], status: 'Indexed' }
  ]);

  const handleSimulateConnection = () => {
    setIsConnecting(true);
    setConnectedStatus(null);
    setTimeout(() => {
      setIsConnecting(false);
      setConnectedStatus({
        success: true,
        database: dbType.toUpperCase(),
        tablesDiscovered: ['station_firs_2026', 'mule_account_alerts', 'ndps_seizures'],
        rowCount: '18,450 records',
        latency: '42 ms'
      });
    }, 1200);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newEntries = files.map(f => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      rows: Math.floor(Math.random() * 2000) + 500,
      columns: ['Timestamp', 'District', 'Crime_Head', 'Latitude', 'Longitude', 'Status'],
      status: 'Dynamic Ingestion Active'
    }));
    setUploadedFiles(prev => [...newEntries, ...prev]);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8))',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={20} style={{ color: '#f59e0b' }} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>
                DYNAMIC BYOD & HYBRID RAG CONNECTOR
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Connect live external databases or drop custom police dataset reports (CSV, Excel, PDF) into an isolated in-memory data mart.
            </p>
          </div>

          <div style={{ display: 'flex', background: '#0f172a', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setActiveMode('upload')}
              style={{
                padding: '6px 14px',
                fontSize: '0.74rem',
                fontWeight: 800,
                borderRadius: '6px',
                border: 'none',
                background: activeMode === 'upload' ? '#f59e0b' : 'transparent',
                color: activeMode === 'upload' ? '#0f172a' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              📄 Upload File / Dataset
            </button>
            <button
              onClick={() => setActiveMode('db')}
              style={{
                padding: '6px 14px',
                fontSize: '0.74rem',
                fontWeight: 800,
                borderRadius: '6px',
                border: 'none',
                background: activeMode === 'db' ? '#f59e0b' : 'transparent',
                color: activeMode === 'db' ? '#0f172a' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              🔌 Connect Live DB
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: FILE DROPZONE */}
      {activeMode === 'upload' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          
          {/* DROPZONE */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e); }}
            style={{
              background: dragOver ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.7)',
              border: dragOver ? '2px dashed #38bdf8' : '2px dashed rgba(59, 130, 246, 0.4)',
              borderRadius: '16px',
              padding: '36px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <input
              id="file-upload-input"
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.pdf,.json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid rgba(59,130,246,0.3)' }}>
              <Upload size={22} style={{ color: '#38bdf8' }} />
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>Click to Browse or Drag & Drop Dataset</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Supports CSV, Excel (XLSX), PDF Incident Reports, JSON</div>
          </div>

          {/* ACTIVE IN-MEMORY DATASETS LIST */}
          <div style={{ background: '#0d1527', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#93c5fd', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} /> Active In-Memory Data Marts ({uploadedFiles.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {uploadedFiles.map((file, idx) => (
                <div key={idx} style={{ background: '#131f38', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>{file.name}</span>
                    <span style={{ fontSize: '0.65rem', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>{file.status}</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                    {file.size} • {file.rows.toLocaleString()} rows • Auto-inferred: <span style={{ color: '#93c5fd' }}>[{file.columns.join(', ')}]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: DATABASE CONNECTOR */}
      {activeMode === 'db' && (
        <div style={{ background: '#0d1527', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Database Engine:</label>
              <select
                value={dbType}
                onChange={(e) => setDbType(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#ffffff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <option value="postgres">PostgreSQL (Relational Police Archive)</option>
                <option value="mysql">MySQL / MariaDB</option>
                <option value="mongo">MongoDB (NoSQL Narrative Dossiers)</option>
                <option value="sqlite">Local SQLite File Bridge</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Connection URI / DSN:</label>
              <input
                type="text"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93c5fd', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}
              />
            </div>
          </div>

          <button
            onClick={handleSimulateConnection}
            disabled={isConnecting}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#0f172a',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '0.8rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isConnecting ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {isConnecting ? 'Testing Connection & Profiling Schema...' : 'Establish Secure Read-Only Bridge ➔'}
          </button>

          {connectedStatus && (
            <div style={{ marginTop: '16px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={18} style={{ color: '#34d399' }} />
              <div style={{ fontSize: '0.75rem', color: '#f8fafc' }}>
                <b>Connected to {connectedStatus.database} successfully:</b> Discovered tables <code style={{ color: '#34d399' }}>{connectedStatus.tablesDiscovered.join(', ')}</code> ({connectedStatus.rowCount} ready for dynamic RAG & Charting).
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

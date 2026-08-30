import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  MapPin,
  Layers,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  X,
  Plus,
  Compass,
  FileCode2,
  FileText
} from 'lucide-react';

export default function DatasetUploader({
  isOpen,
  onClose,
  onDatasetsUpdated
}) {
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customName, setCustomName] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('AUTO');

  const fileInputRef = useRef(null);

  // Fetch available datasets on open
  const fetchDatasets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/spatial/datasets');
      const data = await res.json();
      if (data.success) {
        setDatasets(data.datasets || []);
      }
    } catch (err) {
      console.error('Failed to fetch spatial datasets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDatasets();
      setUploadError(null);
      setUploadSuccess(null);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!customName) {
        setCustomName(file.name.replace(/\.[^/.]+$/, ''));
      }
      // Auto infer entity type from extension
      const ext = file.name.toLowerCase();
      if (ext.endsWith('.kml') || ext.endsWith('.kmz') || ext.endsWith('.geojson')) {
        setSelectedEntityType('CUSTOM_BOUNDARY');
      } else {
        setSelectedEntityType('POINT_DATA');
      }
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to ingest.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (customName.trim()) {
      formData.append('name', customName.trim());
    }
    if (selectedEntityType !== 'AUTO') {
      formData.append('entity_type', selectedEntityType);
    }

    try {
      const res = await fetch('/api/spatial/dataset/upload', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setUploadSuccess(
          `Successfully ingested "${result.dataset.name}" with ${result.dataset.record_count} items!`
        );
        setSelectedFile(null);
        setCustomName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchDatasets();
        if (onDatasetsUpdated) onDatasetsUpdated();
      } else {
        setUploadError(result.error || 'Failed to ingest file.');
      }
    } catch (err) {
      setUploadError(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      const res = await fetch(`/api/spatial/dataset/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive })
      });
      const result = await res.json();
      if (result.success) {
        setDatasets(prev =>
          prev.map(d => (d.id === id ? { ...d, is_active: !currentActive } : d))
        );
        if (onDatasetsUpdated) onDatasetsUpdated();
      }
    } catch (err) {
      console.error('Failed to toggle dataset:', err);
    }
  };

  const handleDelete = async (id, isPermanent) => {
    if (isPermanent) return;
    if (!window.confirm('Are you sure you want to delete this custom dataset? It will be removed from the map.')) {
      return;
    }

    try {
      const res = await fetch(`/api/spatial/dataset/${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        setDatasets(prev => prev.filter(d => d.id !== id));
        if (onDatasetsUpdated) onDatasetsUpdated();
      } else {
        alert(result.error || 'Failed to delete dataset.');
      }
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '840px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden',
        color: '#f8fafc'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#0a1020',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={18} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                Geospatial Ingestion & Dataset Manager
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                Upload CSV incident records or custom KML/GeoJSON boundary overlays (Multi-Entity Architecture)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* ── SECTION 1: INGESTION FORM ── */}
          <form
            onSubmit={handleUploadSubmit}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={14} color="#38bdf8" />
              <b style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>Ingest New Spatial Dataset</b>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {/* File Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Select File (.csv, .xlsx, .kml, .kmz, .geojson)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.xlsx,.xls,.kml,.kmz,.geojson,.json"
                  onChange={handleFileChange}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.74rem',
                    color: '#cbd5e1',
                    width: '100%'
                  }}
                />
              </div>

              {/* Dataset Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Dataset Label / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Central Sector Robbery Reports 2026"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    fontSize: '0.74rem',
                    color: '#f8fafc',
                    width: '100%',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Entity Type Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Target Entity Classification
                </label>
                <select
                  value={selectedEntityType}
                  onChange={(e) => setSelectedEntityType(e.target.value)}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    fontSize: '0.74rem',
                    color: '#f8fafc',
                    width: '100%',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="AUTO">Auto-Detect from File Type</option>
                  <option value="POINT_DATA">Entity B: Analytical Point Records (Incidents/Hotspots)</option>
                  <option value="CUSTOM_BOUNDARY">Entity C: Custom Boundary Polygon Overlay</option>
                </select>
              </div>
            </div>

            {uploadError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.74rem',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={14} color="#ef4444" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.74rem',
                color: '#6ee7b7',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: isUploading || !selectedFile ? '#334155' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: isUploading || !selectedFile ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {isUploading ? <RefreshCw size={13} className="spin-animate" /> : <Upload size={13} />}
                <span>{isUploading ? 'Parsing Coordinates...' : 'Ingest & Plot Dataset'}</span>
              </button>
            </div>
          </form>

          {/* ── SECTION 2: ACTIVE DATASET MANAGER TABLE ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={15} color="#38bdf8" />
                <b style={{ fontSize: '0.85rem', color: '#f8fafc' }}>Registered Spatial Layers & Overlays</b>
                <span style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  fontSize: '0.68rem',
                  fontWeight: 800
                }}>
                  {datasets.length} Total
                </span>
              </div>

              <button
                onClick={fetchDatasets}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: '#94a3b8',
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={11} className={isLoading ? 'spin-animate' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            <div style={{
              backgroundColor: '#0a1020',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {datasets.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                  No spatial datasets currently loaded.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Dataset Name</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Classification</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Items</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700 }}>Map Overlay</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.map((ds) => {
                      const isPerm = ds.is_permanent;
                      const isPoint = ds.entity_type === 'POINT_DATA';
                      const isBoundary = ds.entity_type === 'CUSTOM_BOUNDARY';

                      return (
                        <tr
                          key={ds.id}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            backgroundColor: ds.is_active ? 'transparent' : 'rgba(239, 68, 68, 0.04)'
                          }}
                        >
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isPerm ? (
                                <Lock size={13} color="#a78bfa" title="Permanent Base Layer" />
                              ) : isPoint ? (
                                <FileSpreadsheet size={13} color="#38bdf8" />
                              ) : (
                                <FileCode2 size={13} color="#f59e0b" />
                              )}
                              <span style={{ fontWeight: 600, color: ds.is_active ? '#f8fafc' : '#64748b' }}>
                                {ds.name}
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '10px 14px' }}>
                            {isPerm ? (
                              <span style={{ backgroundColor: 'rgba(167, 139, 250, 0.15)', color: '#c4b5fd', padding: '2px 6px', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 700 }}>
                                Entity A: Base Layer
                              </span>
                            ) : isPoint ? (
                              <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', padding: '2px 6px', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 700 }}>
                                Entity B: Point Incidents
                              </span>
                            ) : (
                              <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', padding: '2px 6px', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 700 }}>
                                Entity C: Custom Boundary
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 700 }}>
                            {ds.record_count.toLocaleString()} {isPoint ? 'records' : 'polygons'}
                          </td>

                          <td style={{ padding: '10px 14px' }}>
                            <button
                              onClick={() => handleToggleActive(ds.id, ds.is_active)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: ds.is_active ? 'rgba(56, 189, 248, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                color: ds.is_active ? '#38bdf8' : '#94a3b8',
                                border: `1px solid ${ds.is_active ? 'rgba(56, 189, 248, 0.3)' : '#334155'}`,
                                borderRadius: '6px',
                                padding: '3px 8px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {ds.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                              <span>{ds.is_active ? 'Visible' : 'Hidden'}</span>
                            </button>
                          </td>

                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            {isPerm ? (
                              <span style={{ color: '#64748b', fontSize: '0.68rem', fontStyle: 'italic' }}>
                                Locked (State HQ)
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDelete(ds.id, ds.is_permanent)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '0.68rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title="Delete dataset and remove from map"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: '#0a1020',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#64748b'
        }}>
          <span>KSP Sentinel AI &bull; Geospatial Ingestion Engine v2.0 (SOLID Compliant)</span>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

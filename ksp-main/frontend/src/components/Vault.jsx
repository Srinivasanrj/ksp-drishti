import React, { useState, useEffect } from 'react';
import { FileKey2, FileText, Download, Database, Upload, Trash2, Cpu, CheckCircle } from 'lucide-react';

function Vault({ documents, onAddDocument }) {
  const [ragDatasets, setRagDatasets] = useState([]);
  const [loadingRag, setLoadingRag] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDatasets = async () => {
    setLoadingRag(true);
    try {
      const res = await fetch('/api/datasets');
      const data = await res.json();
      if (data.success) {
        setRagDatasets(data.datasets);
      }
    } catch (err) {
      console.error("Failed to fetch RAG datasets:", err);
    } finally {
      setLoadingRag(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDownload = (doc) => {
    if (doc.type === 'default') {
      alert("Downloading Citizen Safety Handbook...");
    } else if (doc.type === 'compiled' && doc.downloadFn) {
      doc.downloadFn();
    }
  };

  const handleVaultUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload_dataset', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert(`Success! File '${data.filename}' indexed with ${data.chunks_indexed} RAG vector chunks.`);
        fetchDatasets();
        if (onAddDocument) {
          onAddDocument({
            id: 'rag-' + Date.now(),
            name: data.filename,
            type: 'compiled',
            size: data.file_size,
            date: 'RAG Indexed'
          });
        }
      } else {
        alert("Upload error: " + (data.error || "Failed to process file"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error uploading dataset.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDataset = async (filename) => {
    if (!confirm(`Are you sure you want to remove '${filename}' from RAG Knowledge Store?`)) return;
    try {
      const res = await fetch(`/api/datasets/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDatasets();
      }
    } catch (err) {
      console.error("Error deleting dataset:", err);
    }
  };

  return (
    <div className="vault-content" style={{ padding: '14px' }}>
      <div style={{ marginBottom: '12px' }}>
        <h3 className="section-title" style={{ color: '#132B20', fontSize: '1rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#D49B44' }}>◈</span> Encrypted Vault & RAG Knowledge Store
        </h3>
        <p className="section-desc" style={{ color: '#5A6860', fontSize: '0.72rem', margin: 0, fontWeight: 600 }}>
          Active dataset files & vector-indexed RAG documents for real-time intelligence retrieval.
        </p>
      </div>

      {/* RAG Knowledge Store Section */}
      <div className="chart-card" style={{ padding: '14px', background: '#FBF9F5', border: '1px solid #D4CEBF', borderRadius: '12px', boxShadow: '0 2px 8px rgba(19,43,32,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#132B20' }}>
            <Cpu size={16} style={{ color: '#D49B44' }} /> RAG Datasets & Vector Store
          </div>
          <label className="calc-trigger-btn" style={{ background: '#132B20', color: '#FCFCFA', border: '1px solid #D49B44', padding: '5px 12px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(19,43,32,0.2)' }}>
            <Upload size={12} style={{ color: '#D49B44' }} /> Upload PDF / CSV
            <input type="file" accept=".pdf,.csv,.json,.txt" style={{ display: 'none' }} onChange={handleVaultUpload} />
          </label>
        </div>

        {uploading && (
          <div style={{ fontSize: '0.74rem', color: '#D49B44', padding: '6px', textAlign: 'center', fontWeight: 700 }}>
            ⚡ Parsing, chunking & updating SQLite & RAG Knowledge Store...
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          {ragDatasets.map((ds, idx) => (
            <div key={`${ds.id || ds.filename}-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FCFCFA', border: '1px solid #E8E2D5', padding: '8px 10px', borderRadius: '8px', fontSize: '0.74rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={14} style={{ color: ds.file_type === 'pdf' ? '#DC2626' : '#10B981' }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#132B20' }}>{ds.filename}</div>
                  <div style={{ fontSize: '0.64rem', color: '#6E7A73', fontWeight: 600 }}>
                    {ds.file_type.toUpperCase()} • {ds.record_count} Records/Chunks • {ds.upload_date}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.62rem', color: '#047857', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>
                  <CheckCircle size={8} style={{ display: 'inline', marginRight: '3px' }} /> Active
                </span>
                {ds.id.startsWith('ds-') && (
                  <Trash2 size={12} style={{ color: '#94A3B8', cursor: 'pointer' }} onClick={() => handleDeleteDataset(ds.filename)} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compiled Local PDF Vault Section */}
      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '6px' }}>
        Compiled Case Documents & Certificates
      </h4>

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '16px' }}>
          No custom reports compiled yet. Use the Chatbot to report a Cyber Scam.
        </div>
      ) : (
        documents.map((doc) => (
          <div className="vault-item" key={doc.id}>
            <div className="vault-info">
              <div className={`vault-icon ${doc.type === 'compiled' ? 'pdf' : ''}`}>
                {doc.type === 'compiled' ? <FileText size={20} /> : <FileKey2 size={20} />}
              </div>
              <div className="vault-details">
                <h5>{doc.name}</h5>
                <p>{doc.date} • {doc.size}</p>
              </div>
            </div>
            <div className="vault-action" onClick={() => handleDownload(doc)}>
              <Download size={16} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Vault;

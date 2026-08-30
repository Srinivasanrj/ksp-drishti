import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

/**
 * AudioGatewayModal — Human-in-the-Loop Evidentiary Chain-of-Custody Modal
 * (SOLID: SRP — Confirmation Gateway Presentation)
 */
export default function AudioGatewayModal({
  isOpen,
  sessionId,
  isInjecting,
  onCancel,
  onConfirm
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '90%',
        background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)',
        border: '1px solid rgba(99, 102, 241, 0.5)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        color: '#f8fafc'
      }}>
        {/* Header Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(234, 179, 8, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(234, 179, 8, 0.4)'
          }}>
            <Shield size={24} color="#eab308" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fef08a' }}>
              Official Evidentiary Chain-of-Custody
            </h3>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Human-in-the-Loop Verification Gate • Section 65B Audit
            </div>
          </div>
        </div>

        {/* Notice Info Box */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.65)',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '0.82rem',
          lineHeight: '1.5',
          color: '#cbd5e1',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          marginBottom: '22px'
        }}>
          <p style={{ margin: '0 0 10px 0', color: '#f8fafc', fontWeight: 700 }}>
            ⚠️ Law Enforcement Verification Notice:
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              This audio transcript will be saved as structured Markdown (<code>.md</code>) in session <strong>`{sessionId}`</strong>.
            </li>
            <li>
              <strong>Strict Replacement Model:</strong> Confirming this statement will index it as the active audio evidence in DuckDB RAG and automatically replace any previous audio statements.
            </li>
            <li>
              The <strong>Document & Legal Agent</strong> will immediately cite this transcript during chatbot queries.
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            disabled={isInjecting}
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: '1px solid #475569',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: isInjecting ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel / Keep Staged
          </button>

          <button
            disabled={isInjecting}
            onClick={onConfirm}
            style={{
              background: isInjecting
                ? '#334155'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 22px',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: isInjecting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}
          >
            {isInjecting ? (
              <>Indexing Markdown into RAG...</>
            ) : (
              <>
                <CheckCircle2 size={16} /> Confirm & Inject Evidence
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

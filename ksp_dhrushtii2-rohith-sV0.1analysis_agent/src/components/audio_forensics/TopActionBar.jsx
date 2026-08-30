import React from 'react';
import { ArrowLeft, Mic, Shield, PlusCircle, RotateCcw } from 'lucide-react';
import { VIEW_STATES } from './constants';

/**
 * TopActionBar — Top Navigation & Session Status for Audio Forensics Panel
 * (SOLID: SRP — Header presentation & route controls)
 */
export default function TopActionBar({
  sessionId,
  divisionName,
  viewState,
  onBackToChat,
  onUploadAnother,
  isUploading,
  isStreaming
}) {
  return (
    <div style={{
      height: '58px',
      borderBottom: '1px solid rgba(59, 130, 246, 0.25)',
      background: 'linear-gradient(90deg, #0b1120 0%, #1e1b4b 50%, #0b1120 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
      zIndex: 20
    }}>
      {/* Left: Back button & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onBackToChat}
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            color: '#93c5fd',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
            e.currentTarget.style.color = '#93c5fd';
          }}
        >
          <ArrowLeft size={14} /> Back to Chatbot
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)'
          }}>
            <Mic size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
              AUDIO FORENSIC INTELLIGENCE STUDIO
            </div>
            <div style={{ fontSize: '0.65rem', color: '#a5b4fc', fontWeight: 600 }}>
              Zoho Zia STT Speech Engine • Spotify-Style Bilingual Lyrics • Sandboxed RAG Staging
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions, Session Info, Division */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {viewState === VIEW_STATES.TRANSCRIPT_ACTIVE && (
          <button
            disabled={isUploading || isStreaming}
            onClick={onUploadAnother}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isUploading || isStreaming ? 'not-allowed' : 'pointer',
              opacity: isUploading || isStreaming ? 0.6 : 1,
              boxShadow: '0 2px 10px rgba(124, 58, 237, 0.3)',
              transition: 'all 0.2s ease'
            }}
            title="Discard current unconfirmed transcript and upload a new audio file"
          >
            <PlusCircle size={14} /> Upload Another Audio
          </button>
        )}

        <div style={{
          fontSize: '0.72rem',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          color: '#c7d2fe',
          padding: '4px 10px',
          borderRadius: '6px',
          fontWeight: 700
        }}>
          Session: <span style={{ color: '#ffffff' }}>{sessionId}</span>
        </div>

        <div style={{
          fontSize: '0.72rem',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          padding: '4px 10px',
          borderRadius: '6px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Shield size={13} /> {divisionName}
        </div>
      </div>
    </div>
  );
}

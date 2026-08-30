import React, { useRef } from 'react';
import { Upload, Mic, Volume2, Sparkles, FileAudio, AlertTriangle, ShieldCheck, Headphones } from 'lucide-react';
import { FILE_LIMITS } from './constants';

/**
 * UploadCenterView — Centered Drag & Drop Audio Upload Screen
 * (SOLID: SRP — Centered Empty/Upload state presentation)
 */
export default function UploadCenterView({
  selectedFile,
  audioUrl,
  isUploading,
  uploadProgress,
  errorMessage,
  onFileSelected,
  onStartTranscribe,
  onLoadSampleAudio
}) {
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      position: 'relative',
      overflowY: 'auto'
    }}>
      {/* Background Decorative Radial Glows */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.05) 50%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Glassmorphic Card Container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '680px',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 27, 75, 0.6) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Top Header Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(99, 102, 241, 0.2)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '20px',
          padding: '6px 14px',
          color: '#c7d2fe',
          fontSize: '0.75rem',
          fontWeight: 800,
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          <ShieldCheck size={14} color="#818cf8" />
          Karnataka State Police • Voice Forensics Lab
        </div>

        <h2 style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          color: '#ffffff',
          margin: '0 0 8px 0',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Upload Voice & Audio Evidence
        </h2>

        <p style={{
          fontSize: '0.86rem',
          color: '#94a3b8',
          margin: '0 0 24px 0',
          maxWidth: '480px',
          lineHeight: '1.5'
        }}>
          Upload witness statements, field recordings, or suspect interrogations. Zoho Zia STT transcribes speech into bilingual Kannada and English evidence narratives with dynamic BNS/IPC legal mapping.
        </p>

        {/* Error Banner if any */}
        {errorMessage && (
          <div style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '10px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#f87171',
            fontSize: '0.8rem',
            fontWeight: 700,
            textAlign: 'left'
          }}>
            <AlertTriangle size={16} flexShrink={0} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Centered Dropzone Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            width: '100%',
            border: selectedFile ? '2px solid rgba(99, 102, 241, 0.8)' : '2px dashed rgba(99, 102, 241, 0.4)',
            borderRadius: '18px',
            padding: '32px 20px',
            background: selectedFile
              ? 'rgba(99, 102, 241, 0.12)'
              : 'rgba(15, 23, 42, 0.5)',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            boxShadow: selectedFile ? '0 0 25px rgba(99, 102, 241, 0.2)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!selectedFile) e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.8)';
          }}
          onMouseLeave={(e) => {
            if (!selectedFile) e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_LIMITS.MIME_ACCEPT}
            style={{ display: 'none' }}
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelected(file);
            }}
          />

          {/* Central Pulsing Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: selectedFile
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: selectedFile
              ? '0 0 25px rgba(16, 185, 129, 0.4)'
              : '0 0 20px rgba(99, 102, 241, 0.3)'
          }}>
            {selectedFile ? (
              <FileAudio size={28} color="#ffffff" />
            ) : (
              <Upload size={28} color="#c7d2fe" />
            )}
          </div>

          {/* Label Text */}
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
              {selectedFile ? selectedFile.name : 'Click to Browse or Drag & Drop Recording'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {selectedFile ? (
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                  Ready to Transcribe • {roundSize(selectedFile.size)}
                </span>
              ) : (
                <>Supported formats: <strong style={{ color: '#c7d2fe' }}>.mp3, .wav, .ogg, .m4a, .aac, .flac</strong> (Max {FILE_LIMITS.MAX_SIZE_LABEL})</>
              )}
            </div>
          </div>

          {/* Format Badges */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            {FILE_LIMITS.ALLOWED_EXTENSIONS.map((ext) => (
              <span
                key={ext}
                style={{
                  fontSize: '0.65rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: '#94a3b8',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  fontWeight: 600
                }}
              >
                {ext.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Audio Preview Player if Selected */}
        {audioUrl && (
          <div style={{
            width: '100%',
            marginTop: '16px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Volume2 size={18} color="#38bdf8" />
            <audio
              src={audioUrl}
              controls
              style={{ width: '100%', height: '32px' }}
            />
          </div>
        )}

        {/* Main CTA Button */}
        <button
          disabled={!selectedFile || isUploading}
          onClick={onStartTranscribe}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '14px',
            background: !selectedFile || isUploading
              ? '#334155'
              : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: !selectedFile || isUploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: selectedFile && !isUploading ? '0 6px 20px rgba(168, 85, 247, 0.4)' : 'none',
            transition: 'all 0.25s ease'
          }}
        >
          {isUploading ? (
            <>
              <div className="audio-spinner" /> Transcribing with Zoho Zia STT... ({uploadProgress}%)
            </>
          ) : (
            <>
              <Sparkles size={18} /> Run Speech-to-Text Transcription & Legal Mapping
            </>
          )}
        </button>

        {/* Instant Demo Audio Sample Option */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          <span>Or test instant audio intelligence:</span>
          <button
            type="button"
            disabled={isUploading}
            onClick={onLoadSampleAudio}
            style={{
              background: 'transparent',
              border: '1px dashed rgba(99, 102, 241, 0.5)',
              color: '#818cf8',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Headphones size={12} /> Load Witness Statement Recording
          </button>
        </div>
      </div>
    </div>
  );
}

function roundSize(bytes) {
  if (!bytes) return '0 KB';
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

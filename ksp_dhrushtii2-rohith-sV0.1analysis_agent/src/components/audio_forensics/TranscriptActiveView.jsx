import React, { useRef, useState, useEffect } from 'react';
import {
  Globe,
  FileText,
  Edit3,
  RotateCcw,
  Sparkles,
  Send,
  Trash2,
  Scale,
  MapPin,
  UserCheck,
  Tag,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import ElevenLabsTextStreamer from './ElevenLabsTextStreamer';

/**
 * TranscriptActiveView — ElevenLabs & Spotify Style Bilingual Voice Intelligence Panel
 * (SOLID: SRP — High-fidelity word-by-word streaming & audio sync presentation)
 */
export default function TranscriptActiveView({
  transcriptKn,
  transcriptEn,
  entities,
  activeWordIndexKn = 9999,
  activeWordIndexEn = 9999,
  isStreaming = false,
  isEditing = false,
  editedKn = '',
  editedEn = '',
  processingTimeMs = 0,
  stageId = null,
  audioUrl = null,
  onToggleEdit,
  onReplayStreaming,
  onEditedKnChange,
  onEditedEnChange,
  onDiscard,
  onOpenDisclaimerModal,
  onAudioTimeUpdate
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 1;
    const progress = Math.min(Math.max(current / duration, 0), 1);
    if (onAudioTimeUpdate) {
      onAudioTimeUpdate(progress);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 24px',
      gap: '14px',
      overflow: 'hidden',
      backgroundColor: '#090d16'
    }}>
      {/* ── TOP BILINGUAL ELEVENLABS-STYLE CARD ── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(145deg, #0f172a 0%, #151b2e 50%, #0d1222 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: '20px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Card Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
              🎙️ BILINGUAL EVIDENCE TRANSCRIPT
            </span>
            {isStreaming ? (
              <span style={{
                fontSize: '0.7rem',
                background: 'rgba(168, 85, 247, 0.2)',
                color: '#d8b4fe',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                padding: '2px 10px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700
              }}>
                <div className="audio-live-dot" /> ElevenLabs Speech-to-Text Streaming...
              </span>
            ) : (
              <span style={{
                fontSize: '0.68rem',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 700
              }}>
                ✓ Verified Speech Synthesis
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Audio Playback Sync Bar */}
            {audioUrl && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '8px',
                padding: '4px 10px'
              }}>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleEnded}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={togglePlay}
                  style={{
                    background: isPlaying ? '#38bdf8' : '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={isPlaying ? 'Pause Audio' : 'Play Audio & Sync Highlights'}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: '1px' }} />}
                </button>
                <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700 }}>
                  {isPlaying ? 'Playing & Syncing...' : 'Sync Playback'}
                </span>
              </div>
            )}

            <button
              onClick={onToggleEdit}
              style={{
                background: isEditing ? '#4338ca' : 'rgba(51, 65, 85, 0.8)',
                color: '#e0e7ff',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                borderRadius: '8px',
                padding: '5px 12px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s ease'
              }}
            >
              <Edit3 size={13} /> {isEditing ? 'Done Editing' : 'Edit Text'}
            </button>

            <button
              disabled={isStreaming}
              onClick={onReplayStreaming}
              style={{
                background: 'rgba(51, 65, 85, 0.8)',
                color: '#94a3b8',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '0.74rem',
                cursor: isStreaming ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Replay ElevenLabs word-by-word streaming animation"
            >
              <RotateCcw size={13} /> Replay
            </button>
          </div>
        </div>

        {/* Dual Column ElevenLabs Lyrics Display */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          padding: '2px'
        }}>
          {/* Column 1: Kannada Original */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            borderRadius: '16px',
            padding: '18px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#fbbf24',
              textTransform: 'uppercase',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.04em'
            }}>
              <Globe size={14} /> Kannada Spoken Original (ಕನ್ನಡ ಪ್ರತಿಲೇಖನ)
            </div>

            <ElevenLabsTextStreamer
              text={isEditing ? editedKn : transcriptKn}
              currentWordIndex={activeWordIndexKn}
              isStreaming={isStreaming}
              isEditing={isEditing}
              editedValue={editedKn}
              onEditedChange={onEditedKnChange}
              placeholder="Waiting for Kannada speech transcription..."
              accentColor="#fbbf24"
            />
          </div>

          {/* Column 2: English Translation */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            borderRadius: '16px',
            padding: '18px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#38bdf8',
              textTransform: 'uppercase',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.04em'
            }}>
              <FileText size={14} /> English Translated Narrative
            </div>

            <ElevenLabsTextStreamer
              text={isEditing ? editedEn : transcriptEn}
              currentWordIndex={activeWordIndexEn}
              isStreaming={isStreaming}
              isEditing={isEditing}
              editedValue={editedEn}
              onEditedChange={onEditedEnChange}
              placeholder="Translated English narrative will stream here..."
              accentColor="#38bdf8"
            />
          </div>
        </div>

        {/* Forensic Entity Extraction Strip */}
        {entities && (
          <div style={{
            marginTop: '14px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '12px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.78rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Tag size={13} color="#f87171" />
                <span style={{ color: '#94a3b8' }}>Category:</span>
                <span style={{ color: '#f87171', fontWeight: 800 }}>{entities.crime_category || 'General Crime'}</span>
              </div>

              {entities.locations?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={13} color="#38bdf8" />
                  <span style={{ color: '#94a3b8' }}>Locations:</span>
                  {entities.locations.map((loc, i) => (
                    <span key={i} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 7px', borderRadius: '5px', fontWeight: 700 }}>
                      {loc}
                    </span>
                  ))}
                </div>
              )}

              {entities.suspects?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <UserCheck size={13} color="#fbbf24" />
                  <span style={{ color: '#94a3b8' }}>Suspects:</span>
                  {entities.suspects.map((susp, i) => (
                    <span key={i} style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '2px 7px', borderRadius: '5px', fontWeight: 700 }}>
                      {susp}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {entities.bns_sections?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scale size={13} color="#c084fc" />
                {entities.bns_sections.map((sec, i) => (
                  <span key={i} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '2px 8px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 700 }} title={sec.title}>
                    {sec.section} ({sec.ipc_equivalent})
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM HUMAN-IN-THE-LOOP ACTION BAR ── */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: '16px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            Status: <strong style={{ color: '#f8fafc' }}>{stageId ? 'Staged (Sandboxed in Session)' : 'Idle'}</strong>
          </span>
          {processingTimeMs > 0 && (
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              • Zia STT Latency: {processingTimeMs}ms
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onDiscard}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={13} /> Discard Evidence
          </button>

          <button
            disabled={!transcriptKn || isStreaming}
            onClick={onOpenDisclaimerModal}
            style={{
              background: !transcriptKn || isStreaming
                ? '#334155'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 22px',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: !transcriptKn || isStreaming ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: transcriptKn && !isStreaming ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            <Send size={15} /> Send to Investigation Context (RAG) ➔
          </button>
        </div>
      </div>
    </div>
  );
}

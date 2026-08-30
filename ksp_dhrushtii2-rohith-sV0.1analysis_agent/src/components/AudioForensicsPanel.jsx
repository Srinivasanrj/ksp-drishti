import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';

import {
  API_ENDPOINTS,
  FILE_LIMITS,
  ANIMATION,
  VIEW_STATES
} from './audio_forensics/constants';
import TopActionBar from './audio_forensics/TopActionBar';
import UploadCenterView from './audio_forensics/UploadCenterView';
import TranscriptActiveView from './audio_forensics/TranscriptActiveView';
import AudioGatewayModal from './audio_forensics/AudioGatewayModal';

/**
 * AudioForensicsPanel — Standalone Voice-to-Text Forensic Intelligence Studio
 * (SOLID Architecture: SRP Orchestrator / State Machine)
 * 
 * - Empty State: Prominent Centered Drag & Drop Upload Zone
 * - Transcribed State: ElevenLabs-Style Bilingual Word-by-Word Active Lighting
 * - Audio Playback Sync: Synchronized active word highlighting during audio playback
 * - Upload Another: Discards volatile unconfirmed stage and resets to centered upload
 * - RAG Integrity: Strict Replacement Model (confirming C purges previous audio from RAG)
 */
export default function AudioForensicsPanel({
  sessionId = 'default_session',
  divisionName = 'Bengaluru Division',
  onBackToChat,
  onEvidenceInjected
}) {
  // ── View State Machine ──────────────────────────────────────────────────────
  const [viewState, setViewState] = useState(VIEW_STATES.UPLOAD_CENTER);

  // ── File & Uploading State ──────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // ── Staged Audio Evidence State ─────────────────────────────────────────────
  const [stageId, setStageId] = useState(null);
  const [transcriptKn, setTranscriptKn] = useState('');
  const [transcriptEn, setTranscriptEn] = useState('');
  const [entities, setEntities] = useState(null);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  // ── ElevenLabs Word Lighting Indices ───────────────────────────────────────
  const [activeWordIndexKn, setActiveWordIndexKn] = useState(9999);
  const [activeWordIndexEn, setActiveWordIndexEn] = useState(9999);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamIntervalRef = useRef(null);

  // ── Transcript Editing State ───────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editedKn, setEditedKn] = useState('');
  const [editedEn, setEditedEn] = useState('');

  // ── Human-in-the-Loop Confirmation Gateway State ───────────────────────────
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectionSuccess, setInjectionSuccess] = useState(null);

  // ── 1. Rehydrate unconfirmed staged transcripts on mount / session change ──
  useEffect(() => {
    fetchStagedTranscript();
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [sessionId]);

  const fetchStagedTranscript = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_STAGED(sessionId));
      const data = await res.json();
      if (data.success && Array.isArray(data.staged) && data.staged.length > 0) {
        const latest = data.staged[0];
        setStageId(latest.stage_id);
        setTranscriptKn(latest.transcript_kn || '');
        setTranscriptEn(latest.transcript_en || '');
        setEntities(latest.entities || {});
        setEditedKn(latest.transcript_kn || '');
        setEditedEn(latest.transcript_en || '');
        setActiveWordIndexKn(9999);
        setActiveWordIndexEn(9999);
        setViewState(VIEW_STATES.TRANSCRIPT_ACTIVE);
      } else {
        setViewState(VIEW_STATES.UPLOAD_CENTER);
      }
    } catch (err) {
      console.warn('[AudioForensics] Rehydration check failed:', err);
    }
  };

  // ── 2. Progressive ElevenLabs Word-by-Word Reveal Animation ───────────────
  const startWordStreaming = (knText, enText) => {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

    setIsStreaming(true);
    setActiveWordIndexKn(0);
    setActiveWordIndexEn(0);

    const knWords = (knText || '').split(/\s+/).filter(Boolean);
    const enWords = (enText || '').split(/\s+/).filter(Boolean);
    const maxLen = Math.max(knWords.length, enWords.length);

    let step = 0;
    streamIntervalRef.current = setInterval(() => {
      step++;
      setActiveWordIndexKn(step);
      setActiveWordIndexEn(step);

      if (step >= maxLen) {
        clearInterval(streamIntervalRef.current);
        setActiveWordIndexKn(9999);
        setActiveWordIndexEn(9999);
        setIsStreaming(false);
      }
    }, ANIMATION.STREAM_DELAY_MS);
  };

  // ── 3. Audio Playback Time Synchronization ─────────────────────────────────
  const handleAudioTimeUpdate = (progress) => {
    if (isStreaming) return; // Don't interrupt initial stream
    const knWords = (transcriptKn || '').split(/\s+/).filter(Boolean);
    const enWords = (transcriptEn || '').split(/\s+/).filter(Boolean);
    if (progress >= 0.99) {
      setActiveWordIndexKn(9999);
      setActiveWordIndexEn(9999);
    } else {
      setActiveWordIndexKn(Math.floor(progress * knWords.length));
      setActiveWordIndexEn(Math.floor(progress * enWords.length));
    }
  };

  // ── 4. File Selection & Validation (SOLID: SRP) ────────────────────────────
  const handleFileSelected = (file) => {
    if (!file) return;

    if (file.size > FILE_LIMITS.MAX_SIZE_BYTES) {
      setErrorMessage(`File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds ${FILE_LIMITS.MAX_SIZE_LABEL} limit.`);
      return;
    }

    const nameLower = file.name.toLowerCase();
    const isAllowed = FILE_LIMITS.ALLOWED_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
    if (!isAllowed) {
      setErrorMessage(`Unsupported format. Please upload ${FILE_LIMITS.ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
    setAudioUrl(URL.createObjectURL(file));
  };

  // ── 5. Upload & Transcribe via Zoho Zia STT ────────────────────────────────
  const handleStartTranscribe = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(20);
    setErrorMessage('');
    setInjectionSuccess(null);

    const formData = new FormData();
    formData.append('audio', selectedFile);
    formData.append('session_id', sessionId);

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress((p) => (p < 85 ? p + 12 : p));
      }, 300);

      const res = await fetch(API_ENDPOINTS.TRANSCRIBE_STAGE, {
        method: 'POST',
        body: formData
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await res.json();
      if (data.success) {
        setStageId(data.stage_id);
        setTranscriptKn(data.transcript_kannada || '');
        setTranscriptEn(data.transcript_english || '');
        setEntities(data.entities || {});
        setProcessingTimeMs(data.processing_time_ms || 0);

        setEditedKn(data.transcript_kannada || '');
        setEditedEn(data.transcript_english || '');

        setViewState(VIEW_STATES.TRANSCRIPT_ACTIVE);
        startWordStreaming(data.transcript_kannada, data.transcript_english);
      } else {
        setErrorMessage(data.error || 'Speech transcription failed.');
      }
    } catch (err) {
      setErrorMessage(`Network error during transcription: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // ── 6. Instant Demo Audio Sample Loader ───────────────────────────────────
  const handleLoadSampleAudio = async () => {
    setIsUploading(true);
    setUploadProgress(40);
    setErrorMessage('');
    setInjectionSuccess(null);

    const sampleStatement = "Inspector, this is Sub-Inspector Raghav reporting from the Koramangala Cyber Crime Cell. We have intercepted communications regarding the unauthorized withdrawal case. Suspect Ramesh Kumar operated from Indiranagar and routed eight lakh rupees through mule accounts.";
    const sampleKn = "ಇನ್‌ಸ್ಪೆಕ್ಟರ್, ಇದು ಕೋರಮಂಗಲ ಸೈಬರ್ ಕ್ರೈಂ ಸೆಲ್‌ನಿಂದ ಸಬ್-ಇನ್‌ಸ್ಪೆಕ್ಟರ್ ರಾಘವ್ ವರದಿ. ಅನಧಿಕೃತ ಹಣ ವರ್ಗಾವಣೆ ಪ್ರಕರಣದ ಸಂವಹನಗಳನ್ನು ನಾವು ಪತ್ತೆಹಚ್ಚಿದ್ದೇವೆ. ಸಂದೇಹಸ್ಪದ ರಮೇಶ್ ಕುಮಾರ್ ಇಂದಿರಾನಗರದಿಂದ ಎಂಟು ಲಕ್ಷ ರೂಪಾಯಿಗಳನ್ನು ವರ್ಗಾಯಿಸಿದ್ದಾನೆ.";

    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('text', sampleStatement);

    try {
      const res = await fetch(API_ENDPOINTS.TRANSCRIBE_STAGE, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setStageId(data.stage_id);
        setTranscriptKn(data.transcript_kannada || sampleKn);
        setTranscriptEn(data.transcript_english || sampleStatement);
        setEntities(data.entities || {});
        setProcessingTimeMs(data.processing_time_ms || 120);

        setEditedKn(data.transcript_kannada || sampleKn);
        setEditedEn(data.transcript_english || sampleStatement);

        setViewState(VIEW_STATES.TRANSCRIPT_ACTIVE);
        startWordStreaming(data.transcript_kannada || sampleKn, data.transcript_english || sampleStatement);
      } else {
        setErrorMessage(data.error || 'Failed to load sample statement.');
      }
    } catch (err) {
      setErrorMessage(`Error loading sample audio: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // ── 7. "Upload Another Audio" — Discard Unconfirmed Stage & Return to Center
  const handleUploadAnother = async () => {
    if (stageId) {
      try {
        await fetch(API_ENDPOINTS.DELETE_STAGED(sessionId, stageId), { method: 'DELETE' });
      } catch (e) {
        console.warn('Failed to delete previous unconfirmed stage:', e);
      }
    }

    setStageId(null);
    setTranscriptKn('');
    setTranscriptEn('');
    setEntities(null);
    setSelectedFile(null);
    setAudioUrl(null);
    setActiveWordIndexKn(9999);
    setActiveWordIndexEn(9999);
    setIsEditing(false);
    setErrorMessage('');
    setViewState(VIEW_STATES.UPLOAD_CENTER);
  };

  // ── 8. Discard Evidence Explicitly ─────────────────────────────────────────
  const handleDiscard = async () => {
    if (stageId) {
      try {
        await fetch(API_ENDPOINTS.DELETE_STAGED(sessionId, stageId), { method: 'DELETE' });
      } catch (err) {
        console.warn('Failed to discard staged audio:', err);
      }
    }
    handleUploadAnother();
  };

  // ── 9. Human-in-the-Loop Gateway Confirm & Inject (Strict Replacement Model) ──
  const handleConfirmAndInject = async () => {
    setIsInjecting(true);
    setErrorMessage('');

    const finalKn = isEditing ? editedKn : transcriptKn;
    const finalEn = isEditing ? editedEn : transcriptEn;

    const docFilename = selectedFile?.name
      ? `audio_${selectedFile.name.replace(/\.[^/.]+$/, '')}.md`
      : `audio_statement_${stageId || Date.now()}.md`;

    try {
      const res = await fetch(API_ENDPOINTS.CONFIRM_INJECT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          stage_id: stageId,
          filename: docFilename,
          transcript_kannada: finalKn,
          transcript_english: finalEn,
          entities: entities || {}
        })
      });

      const data = await res.json();
      if (data.success) {
        setInjectionSuccess({
          doc_name: data.doc_name,
          chunk_count: data.chunk_count,
          file_size_kb: data.file_size_kb,
          message: data.message
        });
        setShowDisclaimerModal(false);

        if (onEvidenceInjected) {
          onEvidenceInjected({
            doc_name: data.doc_name,
            chunk_count: data.chunk_count,
            transcript_en: finalEn
          });
        }
      } else {
        setErrorMessage(data.error || 'Failed to inject audio evidence.');
      }
    } catch (err) {
      setErrorMessage(`Error injecting evidence: ${err.message}`);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#090d16',
      color: '#f8fafc',
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* ── TOP ACTION BAR ── */}
      <TopActionBar
        sessionId={sessionId}
        divisionName={divisionName}
        viewState={viewState}
        onBackToChat={onBackToChat}
        onUploadAnother={handleUploadAnother}
        isUploading={isUploading}
        isStreaming={isStreaming}
      />

      {/* ── SUCCESS BANNER (EVIDENCE INJECTED) ── */}
      {injectionSuccess && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.5)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.3s ease-in',
          flexShrink: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color="#34d399" />
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#34d399' }}>
                Evidence Ingested into Session RAG (Strict Replacement Active):
              </span>
              <span style={{ fontSize: '0.8rem', color: '#f1f5f9', marginLeft: '6px' }}>
                `{injectionSuccess.doc_name}` ({injectionSuccess.chunk_count} Markdown chunks indexed)
              </span>
            </div>
          </div>
          <button
            onClick={onBackToChat}
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
            }}
          >
            <MessageSquare size={13} /> Query Evidence in Chatbot ➔
          </button>
        </div>
      )}

      {/* ── ERROR BANNER ── */}
      {errorMessage && viewState === VIEW_STATES.TRANSCRIPT_ACTIVE && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#f87171',
          fontSize: '0.8rem',
          fontWeight: 700,
          flexShrink: 0
        }}>
          <AlertTriangle size={16} /> {errorMessage}
        </div>
      )}

      {/* ── DYNAMIC VIEW STATE RENDERING ── */}
      {viewState === VIEW_STATES.UPLOAD_CENTER ? (
        <UploadCenterView
          selectedFile={selectedFile}
          audioUrl={audioUrl}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          errorMessage={errorMessage}
          onFileSelected={handleFileSelected}
          onStartTranscribe={handleStartTranscribe}
          onLoadSampleAudio={handleLoadSampleAudio}
        />
      ) : (
        <TranscriptActiveView
          transcriptKn={transcriptKn}
          transcriptEn={transcriptEn}
          entities={entities}
          activeWordIndexKn={activeWordIndexKn}
          activeWordIndexEn={activeWordIndexEn}
          isStreaming={isStreaming}
          isEditing={isEditing}
          editedKn={editedKn}
          editedEn={editedEn}
          processingTimeMs={processingTimeMs}
          stageId={stageId}
          audioUrl={audioUrl}
          onToggleEdit={() => setIsEditing(!isEditing)}
          onReplayStreaming={() => startWordStreaming(isEditing ? editedKn : transcriptKn, isEditing ? editedEn : transcriptEn)}
          onEditedKnChange={setEditedKn}
          onEditedEnChange={setEditedEn}
          onDiscard={handleDiscard}
          onOpenDisclaimerModal={() => setShowDisclaimerModal(true)}
          onAudioTimeUpdate={handleAudioTimeUpdate}
        />
      )}

      {/* ── HUMAN-IN-THE-LOOP DISCLAIMER POPUP MODAL ── */}
      <AudioGatewayModal
        isOpen={showDisclaimerModal}
        sessionId={sessionId}
        isInjecting={isInjecting}
        onCancel={() => setShowDisclaimerModal(false)}
        onConfirm={handleConfirmAndInject}
      />
    </div>
  );
}

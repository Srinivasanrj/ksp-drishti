/**
 * Audio Forensics Constants & Config (SOLID: Single Source of Truth / No Hardcoding)
 */
export const API_ENDPOINTS = {
  TRANSCRIBE_STAGE: '/api/audio_transcribe_and_stage',
  GET_STAGED: (sessionId) => `/api/audio_staged/${encodeURIComponent(sessionId)}`,
  CONFIRM_INJECT: '/api/audio_confirm_inject',
  DELETE_STAGED: (sessionId, stageId) => `/api/audio_staged/${encodeURIComponent(sessionId)}/${encodeURIComponent(stageId)}`
};

export const FILE_LIMITS = {
  MAX_SIZE_BYTES: 15 * 1024 * 1024, // 15 MB
  MAX_SIZE_LABEL: '15 MB',
  ALLOWED_EXTENSIONS: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
  MIME_ACCEPT: '.mp3,.wav,.ogg,.m4a,.aac,.flac'
};

export const ANIMATION = {
  STREAM_DELAY_MS: 40 // 40ms per word reveal cadence
};

export const VIEW_STATES = {
  UPLOAD_CENTER: 'UPLOAD_CENTER',
  TRANSCRIPT_ACTIVE: 'TRANSCRIPT_ACTIVE'
};

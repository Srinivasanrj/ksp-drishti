/**
 * Text-to-Speech (TTS) Service (SOLID - SRP)
 * Provides Sarvam AI Indic voice synthesis with graceful browser SpeechSynthesis fallback.
 */
import { postJson } from './apiClient';

let activeAudio = null;

export function stopSpeaking() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch (_) {}
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export async function speakMessageText(textToSpeak, { voiceLang = 'en-IN', onStart, onEnd, onError } = {}) {
  if (!textToSpeak) return;
  const cleanText = textToSpeak.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
  if (!cleanText) return;

  stopSpeaking();
  if (onStart) onStart();

  try {
    const res = await postJson('/api/sarvam_tts', {
      text: cleanText,
      language_code: voiceLang
    });
    const data = await res.json();

    if (data && data.success && data.audio_b64) {
      const audio = new Audio(`data:audio/wav;base64,${data.audio_b64}`);
      activeAudio = audio;

      audio.onended = () => {
        activeAudio = null;
        if (onEnd) onEnd();
      };
      audio.onerror = (e) => {
        activeAudio = null;
        fallbackBrowserTTS(cleanText, { voiceLang, onEnd, onError });
      };

      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('Sarvam AI TTS endpoint failed or offline; using browser synthesis:', err);
  }

  fallbackBrowserTTS(cleanText, { voiceLang, onEnd, onError });
}

function fallbackBrowserTTS(cleanText, { voiceLang, onEnd, onError }) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = voiceLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = (err) => {
      if (onError) onError(err);
      if (onEnd) onEnd();
    };

    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find((v) => v.lang.includes(voiceLang.split('-')[0]));
    if (targetVoice) utterance.voice = targetVoice;

    window.speechSynthesis.speak(utterance);
  } else {
    if (onEnd) onEnd();
  }
}

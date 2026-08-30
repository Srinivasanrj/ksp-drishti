import React, { useMemo } from 'react';

/**
 * ElevenLabsTextStreamer — High-fidelity ElevenLabs-style Word-by-Word Streaming & Karaoke Component
 * (SOLID: SRP — Text tokenization & active word lighting rendering)
 * 
 * - Active/Revealed words: Crisp bold white (#ffffff, font-weight: 800)
 * - Current word: Glowing highlight / active cursor
 * - Upcoming/Unspoken words: Dimmed translucent grey (rgba(255, 255, 255, 0.22))
 */
export default function ElevenLabsTextStreamer({
  text = '',
  currentWordIndex = 0,
  isStreaming = false,
  isEditing = false,
  editedValue = '',
  onEditedChange,
  placeholder = 'Awaiting speech audio stream...',
  accentColor = '#ffffff'
}) {
  // Tokenize text into words preserving natural spacing
  const words = useMemo(() => {
    if (!text) return [];
    return text.split(/\s+/).filter(Boolean);
  }, [text]);

  if (isEditing) {
    return (
      <textarea
        value={editedValue}
        onChange={(e) => onEditedChange && onEditedChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          width: '100%',
          background: '#090d16',
          border: '1px solid #475569',
          borderRadius: '12px',
          color: '#f8fafc',
          padding: '16px',
          fontSize: '1.25rem',
          lineHeight: '1.6',
          fontWeight: 700,
          fontFamily: "'Inter', system-ui, sans-serif",
          resize: 'none',
          outline: 'none',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
        }}
      />
    );
  }

  if (words.length === 0) {
    return (
      <div style={{
        color: 'rgba(255, 255, 255, 0.2)',
        fontSize: '1.2rem',
        fontWeight: 600,
        fontStyle: 'italic',
        marginTop: '20px',
        lineHeight: '1.6'
      }}>
        {placeholder}
      </div>
    );
  }

  return (
    <div
      className="elevenlabs-stream-container"
      style={{
        flex: 1,
        overflowY: 'auto',
        fontSize: '1.35rem',
        lineHeight: '1.65',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        letterSpacing: '-0.015em',
        padding: '8px 4px',
        userSelect: 'text'
      }}
    >
      {words.map((word, idx) => {
        const isPast = idx < currentWordIndex;
        const isCurrent = idx === currentWordIndex;
        const isFuture = idx > currentWordIndex;

        return (
          <span
            key={idx}
            className={`elevenlabs-word ${isPast ? 'revealed' : isCurrent ? 'current' : 'upcoming'}`}
            style={{
              display: 'inline',
              color: isPast
                ? '#ffffff'
                : isCurrent
                ? '#ffffff'
                : 'rgba(255, 255, 255, 0.24)',
              fontWeight: isPast || isCurrent ? 800 : 700,
              textShadow: isCurrent
                ? '0 0 15px rgba(255, 255, 255, 0.5), 0 0 25px rgba(99, 102, 241, 0.4)'
                : isPast
                ? '0 1px 2px rgba(0,0,0,0.4)'
                : 'none',
              transition: 'color 0.18s cubic-bezier(0.4, 0, 0.2, 1), text-shadow 0.18s ease',
              marginRight: '0.3em'
            }}
          >
            {word}
            {isCurrent && isStreaming && (
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '1.1em',
                  background: '#a855f7',
                  marginLeft: '3px',
                  verticalAlign: '-0.15em',
                  borderRadius: '2px',
                  animation: 'elevenlabs-caret 0.7s infinite'
                }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

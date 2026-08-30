import React from 'react';
import { Sparkles, Shield, ArrowRight, Layers, CheckCircle2, FileText, Database } from 'lucide-react';

export default function GenericFeaturePlaceholder({ title, description, badge, category, onSelectPrompt }) {
  
  const samplePrompts = [
    'How many total crimes are registered in Karnataka?',
    'Show crimes by district and division',
    'Which crime type is most common in 2024?',
    'Show crime trend from 2019 to 2025',
    'Top crime hotspot police stations',
    'ಬೆಂಗಳೂರಿನಲ್ಲಿ ಎಷ್ಟು ಅಪರಾಧಗಳಾಗಿವೆ?',
    'How many accused are currently wanted?',
    'Show case status breakdown and recovery rate'
  ];

  return (
    <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* FEATURE HEADER BANNER */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8', textTransform: 'uppercase' }}>
              {category || 'Intelligence Module'}
            </span>
            {badge && (
              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#fef3c7', color: '#b45309' }}>
                {badge}
              </span>
            )}
          </div>
          <h1 style={{ margin: '8px 0 4px 0', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            {title}
          </h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', maxWidth: '700px' }}>
            {description || 'Karnataka State Police high-precision command module ready for integration.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
            <CheckCircle2 size={14} /> UI Component Active
          </div>
        </div>
      </div>

      {/* KRIME AI STYLE PROMPT SUGGESTION CHIPS (IMAGE 2) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#0284c7" /> Pre-Configured Investigation Prompts (English & ಕನ್ನಡ)
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>
            Click any analytical prompt to inspect the underlying verification flow:
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt && onSelectPrompt(prompt)}
              style={{
                background: '#f8fafc',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                borderRadius: '20px',
                padding: '7px 16px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0f172a';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#1e293b';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
            >
              <span>{prompt}</span>
              <ArrowRight size={12} opacity={0.6} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

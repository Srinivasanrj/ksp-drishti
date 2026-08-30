import React, { useState, useEffect, useRef } from 'react';
import { InvestigationClient } from '../../services/InvestigationClient';

export default function InvestigationChatView({ sessionData, onClose }) {
  const [sessionId, setSessionId] = useState(sessionData?.session_id || '');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toolLogs, setToolLogs] = useState([]);
  const messagesEndRef = useRef(null);

  const spatialContext = sessionData?.context_payload?.spatial_context || {};
  const hotspotMeta = sessionData?.context_payload?.hotspot_metadata || {};
  const districtName = spatialContext.district_name || 'Karnataka Sector';
  const threatLevel = hotspotMeta.threat_level || 'HIGH';
  const incidentCount = hotspotMeta.incident_count || 0;
  const primaryCrimes = hotspotMeta.primary_crimes || [];

  const threatColor =
    threatLevel === 'CRITICAL' ? '#ef4444' : threatLevel === 'HIGH' ? '#f97316' : '#3b82f6';

  // Initialize with initial greeting if provided
  useEffect(() => {
    if (sessionData?.greeting) {
      setMessages([
        {
          id: 'initial_greeting',
          role: 'assistant',
          content: sessionData.greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [sessionData]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const res = await InvestigationClient.sendMessage(sessionId, query);
    setIsLoading(false);

    if (res?.success) {
      const assistantMsg = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecutions: res.tool_executions || []
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (res.tool_executions && res.tool_executions.length > 0) {
        setToolLogs((prev) => [...prev, ...res.tool_executions]);
      }
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Failed to receive intelligence response. Please check network connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleQuickPrompt = (promptText) => {
    handleSendMessage(promptText);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(11, 15, 25, 0.96)',
        backdropFilter: 'blur(16px)',
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#f8fafc',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      {/* ── 1. Top Header Bar ────────────────────────────────────────── */}
      <div
        style={{
          height: '56px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
          >
            ← Back to Map Canvas
          </button>

          <div style={{ height: '20px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🤖</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>
                  KSP Sentinel Tactical AI Investigator
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: `${threatColor}22`,
                    color: threatColor,
                    border: `1px solid ${threatColor}66`
                  }}
                >
                  {threatLevel} SECTOR
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Active Target: <strong style={{ color: '#94a3b8' }}>{districtName}</strong> | Session:{' '}
                <code style={{ color: '#38bdf8' }}>{sessionId}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Volume badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              fontSize: '11px',
              color: '#cbd5e1',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 12px'
            }}
          >
            📊 Plotted Cluster: <strong style={{ color: '#38bdf8' }}>{incidentCount} Incidents</strong>
          </div>
        </div>
      </div>

      {/* ── 2. Context Strip Bar ────────────────────────────────────────── */}
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: '#64748b', fontWeight: '600' }}>Patterned Crimes:</span>
          {primaryCrimes.map((c, i) => (
            <span
              key={i}
              style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: '600'
              }}
            >
              {c.category} ({c.percentage}%)
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8' }}>
          <span>⚡ State: <strong>Memory Stack Synced</strong></span>
          <span>💼 Enterprise Tools: <strong style={{ color: '#10b981' }}>Zoho Desk & CRM Connected</strong></span>
        </div>
      </div>

      {/* ── 3. Main Message Area ────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '850px',
              width: '100%',
              margin: '0 auto'
            }}
          >
            {/* Sender Label */}
            <div
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: msg.role === 'user' ? '#38bdf8' : '#a855f7',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{msg.role === 'user' ? '👮 Officer Command' : '🛡️ KSP Sentinel AI'}</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '400' }}>
                {msg.timestamp}
              </span>
            </div>

            {/* Bubble */}
            <div
              style={{
                background:
                  msg.role === 'user'
                    ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.7), rgba(30, 64, 175, 0.8))'
                    : 'rgba(15, 23, 42, 0.75)',
                border:
                  msg.role === 'user'
                    ? '1px solid rgba(96, 165, 250, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                padding: '14px 18px',
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#f1f5f9',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {msg.content}

              {/* Tool Execution Banners if any */}
              {msg.toolExecutions &&
                msg.toolExecutions.map((tool, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  >
                    {tool.tool_name === 'zoho_desk_create_ticket' && (
                      <div>
                        <div style={{ fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🎫</span> Zoho Desk Ticket Generated: #{tool.result?.ticket_number}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                          Status: <strong style={{ color: '#f8fafc' }}>{tool.result?.status}</strong> | Assigned: {tool.result?.department}
                        </div>
                      </div>
                    )}
                    {tool.tool_name === 'zoho_crm_query_suspects' && (
                      <div>
                        <div style={{ fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🕵️</span> Zoho CRM Profiles Retrieved: {tool.count} Repeat Suspects Found
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              maxWidth: '850px',
              margin: '0 auto',
              padding: '12px 18px',
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#94a3b8'
            }}
          >
            <div
              style={{
                width: '14px',
                height: '14px',
                border: '2px solid rgba(56, 189, 248, 0.2)',
                borderTopColor: '#38bdf8',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            <span>Sentinel AI reasoning over spatial bounds and invoking Zoho tools...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 4. Quick Action Directives ─────────────────────────────────── */}
      <div
        style={{
          padding: '8px 20px',
          background: 'rgba(15, 23, 42, 0.9)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto'
        }}
      >
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>
          Tactical Directives:
        </span>

        <button
          onClick={() => handleQuickPrompt(`Who are the known repeat suspects operating in ${districtName}?`)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            padding: '4px 12px',
            fontSize: '11px',
            color: '#cbd5e1',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
        >
          🔍 Check Repeat Suspects (Zoho CRM)
        </button>

        <button
          onClick={() => handleQuickPrompt(`Log a P1 priority dispatch ticket for this ${threatLevel} cluster in Zoho Desk.`)}
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '999px',
            padding: '4px 12px',
            fontSize: '11px',
            color: '#34d399',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)')}
        >
          🎫 Dispatch Alert (Zoho Desk)
        </button>

        <button
          onClick={() => handleQuickPrompt(`Formulate a high-density patrol route and checkpost perimeter for ${districtName}.`)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            padding: '4px 12px',
            fontSize: '11px',
            color: '#cbd5e1',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
        >
          🚨 Suggest Patrol Grid
        </button>
      </div>

      {/* ── 5. Bottom Input Bar ─────────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 20px',
          background: 'rgba(11, 15, 25, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            maxWidth: '850px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask Sentinel AI about modus operandi, suspects, or tactical deployment in ${districtName}...`}
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
          />

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            style={{
              background: inputText.trim() ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              color: inputText.trim() ? '#ffffff' : '#64748b',
              fontSize: '13px',
              fontWeight: '700',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Send</span>
            <span>➤</span>
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

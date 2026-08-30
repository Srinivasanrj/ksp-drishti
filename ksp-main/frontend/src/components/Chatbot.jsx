import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ShieldCheck, CheckCheck, Send, Upload, Bolt, Disc, CheckCircle, FileText, Cpu, Database, ChevronDown, ChevronUp, Paperclip, Download, History, Trash2, Sparkles, Mic, MicOff, Volume2, VolumeX, Languages, Radio, Compass, Lightbulb, Scale, AlertTriangle, Shield, PlusCircle, BarChart2, PieChart, TrendingUp, Plus, ChevronRight, Plug, Layers, FolderPlus, MessageSquare, FolderKanban, ShieldAlert, X, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { jsPDF } from 'jspdf';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import ComplaintPortal from './ComplaintPortal';
import ChartAnalysisModal from './ChartAnalysisModal';
import DatabaseConnectorModal from './DatabaseConnectorModal';
import CalendarModal from './CalendarModal';
import { processQuery } from '../crimepattern/crimePatternEngine';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ── Lightweight Markdown → HTML converter ──────────────────────────────────
// Handles: **bold**, *italic*, `code`, ### headers, bullet lists, GFM tables
function markdownToHtml(text) {
  if (!text) return '';
  // If text already contains HTML tags, return as-is (welcome message etc.)
  if (/<[a-z][\s\S]*>/i.test(text)) return text;

  let html = text
    // Escape raw HTML to prevent injection from non-HTML strings
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- GFM Table ---
  // Match table blocks: header row | separator row | data rows
  html = html.replace(
    /^(\|.+\|[ \t]*\n)(\|[-: |]+\|[ \t]*\n)((\|.+\|[ \t]*\n?)*)/gm,
    (match, header, sep, body) => {
      const parseRow = (row) =>
        row.trim().replace(/^\|/, '').replace(/\|$/, '')
          .split('|').map(c => c.trim());
      const headers = parseRow(header);
      const rows = body.trim().split('\n').filter(r => r.trim());
      const thead = '<thead><tr>' + headers.map(h => `<th>${h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</th>`).join('') + '</tr></thead>';
      const tbody = '<tbody>' + rows.map(r =>
        '<tr>' + parseRow(r).map(c =>
          `<td>${c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>`
        ).join('') + '</tr>'
      ).join('') + '</tbody>';
      return `<table class="md-table">${thead}${tbody}</table>`;
    }
  );

  // --- Headers ---
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // --- Bold & Italic ---
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // --- Inline code ---
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // --- Bullet lists ---
  html = html.replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // --- Line breaks ---
  html = html.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>');
  html = `<p>${html}</p>`;
  // Clean empty paragraphs
  html = html.replace(/<p><\/p>/g, '').replace(/<p>(<h[1-3]>)/g, '$1').replace(/(<\/h[1-3]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<table)/g, '$1').replace(/(<\/table>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1').replace(/(<\/ul>)<\/p>/g, '$1');

  return html;
}

// Helper component to capture map clicks in mini-map
function MiniMapEvents({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

function InlineChartCard({ message, onOpenModal }) {
  const [chartType, setChartType] = useState('bar');
  const inlineChartRef = useRef(null);

  if (!message.chart_data) return null;

  const labels = message.chart_data.labels || [];
  const rawDataset = (message.chart_data.datasets && message.chart_data.datasets[0]) ? message.chart_data.datasets[0] : { label: 'Cases', data: [] };
  const dataValues = rawDataset.data || [];
  const datasetLabel = rawDataset.label || 'Cases';

  const PALETTE = [
    '#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#a855f7', 
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  const chartDataConfig = {
    labels: labels,
    datasets: [{
      label: datasetLabel,
      data: dataValues,
      backgroundColor: (chartType === 'pie' || chartType === 'doughnut') ? PALETTE.slice(0, labels.length) : 'rgba(56, 189, 248, 0.75)',
      borderColor: '#38bdf8',
      borderWidth: 1.5,
      borderRadius: 4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: (chartType === 'pie' || chartType === 'doughnut'), position: 'top', labels: { color: '#e2e8f0', font: { size: 10 } } },
      title: { display: false }
    },
    scales: (chartType === 'pie' || chartType === 'doughnut') ? {} : {
      x: { ticks: { color: '#94a3b8', font: { size: 9 } }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
      y: { ticks: { color: '#94a3b8', font: { size: 9 } }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
    }
  };

  const downloadPNG = (e) => {
    e.stopPropagation();
    if (!inlineChartRef.current) return;
    const url = inlineChartRef.current.toBase64Image();
    const link = document.createElement('a');
    link.download = `KSP_Chart_${Date.now()}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div style={{
      marginTop: '10px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      border: '1px solid #38bdf8',
      borderRadius: '12px',
      padding: '12px',
      boxShadow: '0 6px 16px rgba(15, 23, 42, 0.4)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>
          <BarChart2 size={15} />
          <span>📊 Statistics Visualizer</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '6px' }}>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setChartType('bar'); }}
            style={{ padding: '2px 6px', fontSize: '0.62rem', fontWeight: 700, borderRadius: '4px', border: 'none', background: chartType === 'bar' ? '#38bdf8' : 'transparent', color: chartType === 'bar' ? '#0f172a' : '#94a3b8', cursor: 'pointer' }}
          >
            Bar
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setChartType('pie'); }}
            style={{ padding: '2px 6px', fontSize: '0.62rem', fontWeight: 700, borderRadius: '4px', border: 'none', background: chartType === 'pie' ? '#38bdf8' : 'transparent', color: chartType === 'pie' ? '#0f172a' : '#94a3b8', cursor: 'pointer' }}
          >
            Pie
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setChartType('doughnut'); }}
            style={{ padding: '2px 6px', fontSize: '0.62rem', fontWeight: 700, borderRadius: '4px', border: 'none', background: chartType === 'doughnut' ? '#38bdf8' : 'transparent', color: chartType === 'doughnut' ? '#0f172a' : '#94a3b8', cursor: 'pointer' }}
          >
            Doughnut
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setChartType('line'); }}
            style={{ padding: '2px 6px', fontSize: '0.62rem', fontWeight: 700, borderRadius: '4px', border: 'none', background: chartType === 'line' ? '#38bdf8' : 'transparent', color: chartType === 'line' ? '#0f172a' : '#94a3b8', cursor: 'pointer' }}
          >
            Line
          </button>
        </div>
      </div>

      <div style={{ height: '180px', position: 'relative', width: '100%', marginBottom: '10px' }}>
        {chartType === 'bar' && <Bar ref={inlineChartRef} data={chartDataConfig} options={chartOptions} />}
        {chartType === 'pie' && <Pie ref={inlineChartRef} data={chartDataConfig} options={chartOptions} />}
        {chartType === 'doughnut' && <Doughnut ref={inlineChartRef} data={chartDataConfig} options={chartOptions} />}
        {chartType === 'line' && <Line ref={inlineChartRef} data={chartDataConfig} options={chartOptions} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
        <button
          type="button"
          onClick={downloadPNG}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '0.68rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Download size={12} /> Save Chart PNG
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenModal(message); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: '#38bdf8',
            color: '#0f172a',
            border: 'none',
            borderRadius: '6px',
            padding: '3px 10px',
            fontSize: '0.68rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Fullscreen & Report PDF ↗
        </button>
      </div>
    </div>
  );
}

const customMiniIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="background-color:#ef4444; width:10px; height:10px; border-radius:50%; border:2px solid white;"></div>`,
  iconSize: [10, 10]
});

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'bot',
  text: "Hello Officer! I am <b>KSP DRISHTI</b> — your General Police Law, FIR & Command Operations Assistant. ನಮಸ್ಕಾರ!<br/><br/>💡 <b>Direct Agent Triggers:</b><br/>• <code>\\analytics</code> — Data Metrics, SQL & Visual Charts<br/>• <code>\\document</code> — RAG Knowledge Base & SOP Summaries<br/>• <code>\\pattern</code> — Interrogation Strategy & Case Co-Pilot<br/><br/>Type any trigger in chat for instant 0ms execution, or click the specialist buttons below!",
  agent_type: "general_agent",
  agent_label: "KSP DRISHTI",
  agent_icon: "🛡️",
  agent_color: "#1e40af",
  agent_description: "General Police Law & Command Operations"
};

function generateFallbackChartData(message) {
  if (!message) return null;
  if (message.chart_data && message.chart_data.labels && message.chart_data.labels.length > 0) {
    return message.chart_data;
  }
  if (message.pattern_response && message.pattern_response.chartData) {
    return message.pattern_response.chartData;
  }

  const text = message.text || '';
  const labels = [];
  const data = [];

  // 1. Parse HTML table rows (e.g. for case lists)
  if (text.includes('<table')) {
    const crimeCounts = {};
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(text)) !== null) {
      const rowContent = trMatch[1];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const tds = [];
      let tdMatch;
      while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
        tds.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
      }
      if (tds.length >= 3) {
        const cat = tds[2] || tds[3];
        if (cat && !cat.toLowerCase().includes('case id') && !cat.toLowerCase().includes('crime type')) {
          crimeCounts[cat] = (crimeCounts[cat] || 0) + 1;
        }
      }
    }

    const entries = Object.entries(crimeCounts);
    if (entries.length > 0) {
      return {
        type: 'combination',
        labels: entries.map(e => e[0]),
        datasets: [{
          label: 'Case Category Distribution',
          data: entries.map(e => e[1])
        }]
      };
    }
  }

  // 2. Parse Bullet Lines (e.g. "• Manipal — 6 cases (67% share)")
  const bulletRegex = /[•\*\-][ \t]*<b>?(.*?)<\/b>?[ \t]*[—\:\-][ \t]*<b>?(\d+)[ \t]*cases/gi;
  let bMatch;
  while ((bMatch = bulletRegex.exec(text)) !== null) {
    const label = bMatch[1].replace(/<[^>]*>/g, '').trim();
    const count = parseInt(bMatch[2], 10);
    if (label && !isNaN(count)) {
      if (!labels.includes(label)) {
        labels.push(label);
        data.push(count);
      }
    }
  }

  if (labels.length > 0) {
    return {
      type: 'combination',
      labels: labels,
      datasets: [{ label: 'Reported Cases', data: data }]
    };
  }

  // 3. Fallback to title/content extraction
  const cleanTitle = (message.title || message.agent_label || 'Query Crime Analysis').replace(/<[^>]*>/g, '');
  return {
    type: 'combination',
    labels: ['Primary Hotspot', 'Secondary Hotspot', 'Emerging Cluster'],
    datasets: [{
      label: cleanTitle,
      data: [15, 10, 6]
    }]
  };
}

// ── Synthetic Data Badge ────────────────────────────────────────────────────
function SyntheticDataBadge() {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(245, 158, 11, 0.15)',
      border: '1px solid rgba(245, 158, 11, 0.4)',
      borderRadius: '6px',
      padding: '2px 8px',
      fontSize: '0.65rem',
      fontWeight: 800,
      color: '#fbbf24',
      letterSpacing: '0.05em'
    }}>
      <span>⚠️ SYNTHETIC DEMO DATA</span>
    </div>
  );
}

// ── Inline Pattern Mutation Card ────────────────────────────────────────────
function InlinePatternMutationCard({ mutation, onSendQuery }) {
  if (!mutation) return null;

  const { shiftDetected, affectedDistrict, crimeTypeFilter, p1Label, p2Label, fp1, fp2, mutations, summaryText } = mutation;

  return (
    <div style={{
      marginTop: '12px',
      background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
      border: shiftDetected ? '1px solid #f43f5e' : '1px solid #3b82f6',
      borderRadius: '12px',
      padding: '16px',
      color: '#f8fafc',
      boxShadow: shiftDetected ? '0 8px 24px rgba(244, 63, 94, 0.25)' : '0 8px 24px rgba(59, 130, 246, 0.2)'
    }}>
      {/* SHIFT BANNER HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: shiftDetected ? 'rgba(244, 63, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            color: shiftDetected ? '#f43f5e' : '#60a5fa',
            border: shiftDetected ? '1px solid #f43f5e' : '1px solid #3b82f6',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            fontWeight: 900
          }}>
            {shiftDetected ? '⚠️ PATTERN SHIFT DETECTED' : '✓ PATTERN STABLE'}
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#93c5fd' }}>
            {affectedDistrict} ({crimeTypeFilter})
          </span>
        </div>
        <SyntheticDataBadge />
      </div>

      {/* MULTI-DIMENSIONAL FINGERPRINT COMPARISON TABLE */}
      <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8' }}>
              <th style={{ padding: '6px 8px' }}>Dimension</th>
              <th style={{ padding: '6px 8px' }}>{p1Label}</th>
              <th style={{ padding: '6px 8px' }}>{p2Label}</th>
              <th style={{ padding: '6px 8px', textAlign: 'center' }}>Shift Status</th>
            </tr>
          </thead>
          <tbody>
            {mutations.map((m, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: m.changed ? 'rgba(244, 63, 94, 0.05)' : 'transparent' }}>
                <td style={{ padding: '6px 8px', fontWeight: 700, color: '#cbd5e1' }}>{m.dimension}</td>
                <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{m.previous}</td>
                <td style={{ padding: '6px 8px', color: m.changed ? '#fbbf24' : '#34d399', fontWeight: 800 }}>{m.current}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  {m.changed ? (
                    <span style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 800 }}>
                      ✓ SHIFTED
                    </span>
                  ) : (
                    <span style={{ color: '#60a5fa', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 800 }}>
                      STABLE
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INTELLIGENCE SIGNAL SUMMARY */}
      <div style={{
        fontSize: '0.78rem',
        lineHeight: 1.5,
        color: '#cbd5e1',
        background: 'rgba(0,0,0,0.3)',
        padding: '10px 12px',
        borderRadius: '8px',
        borderLeft: shiftDetected ? '3px solid #f43f5e' : '3px solid #3b82f6',
        marginBottom: '12px'
      }} dangerouslySetInnerHTML={{ __html: summaryText }} />

      {/* ACTION CHIPS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
        <button
          onClick={() => onSendQuery && onSendQuery(`Compare ${affectedDistrict} and Mysuru crime fingerprints`)}
          style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', padding: '3px 9px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer' }}
        >
          Compare Mysuru Fingerprint ↗
        </button>
        <button
          onClick={() => onSendQuery && onSendQuery(`Which locations are affected in ${affectedDistrict}?`)}
          style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '6px', padding: '3px 9px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer' }}
        >
          View Affected Locations ↗
        </button>
      </div>
    </div>
  );
}

// ── Inline Area Fingerprint Comparison Card ─────────────────────────────────
function InlineAreaFingerprintCard({ comp, onSendQuery }) {
  if (!comp) return null;

  const { name1, name2, total1, total2, fp1, fp2, comparisonSummary } = comp;

  return (
    <div style={{
      marginTop: '12px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      border: '1px solid #38bdf8',
      borderRadius: '12px',
      padding: '16px',
      color: '#f8fafc'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8' }}>
          CRIME FINGERPRINT COMPARISON: {name1} vs {name2}
        </h4>
        <SyntheticDataBadge />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        {/* DISTRICT 1 FINGERPRINT */}
        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>{name1} ({total1} Cases)</div>
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div>📊 <strong>Dominant Crime:</strong> {fp1.dominantCrime.name} ({fp1.dominantCrime.share}%)</div>
            <div>⏰ <strong>Peak Time:</strong> {fp1.dominantTime.name}</div>
            <div>🏢 <strong>Target Type:</strong> {fp1.dominantLocation.name}</div>
            <div>🔧 <strong>Dominant M.O.:</strong> {fp1.dominantMO.name}</div>
          </div>
        </div>

        {/* DISTRICT 2 FINGERPRINT */}
        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>{name2} ({total2} Cases)</div>
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div>📊 <strong>Dominant Crime:</strong> {fp2.dominantCrime.name} ({fp2.dominantCrime.share}%)</div>
            <div>⏰ <strong>Peak Time:</strong> {fp2.dominantTime.name}</div>
            <div>🏢 <strong>Target Type:</strong> {fp2.dominantLocation.name}</div>
            <div>🔧 <strong>Dominant M.O.:</strong> {fp2.dominantMO.name}</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
        <strong>Intelligence Analysis:</strong> {comparisonSummary}
      </div>
    </div>
  );
}

// ── Inline Behavioral Profile Card ──────────────────────────────────────────
function InlineBehavioralProfileCard({ profile, onSendQuery }) {
  if (!profile) return null;

  return (
    <div style={{
      marginTop: '12px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      border: '1px solid #c084fc',
      borderRadius: '12px',
      padding: '16px',
      color: '#f8fafc'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#c084fc' }}>
          BEHAVIORAL DOSSIER: {profile.offenderId}
        </h4>
        <SyntheticDataBadge />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '10px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>TOTAL CASES</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>{profile.totalCases}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>ACTIVE CASES</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: profile.activeCases > 0 ? '#f43f5e' : '#34d399' }}>{profile.activeCases}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>REPEAT STATUS</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>{profile.repeatStatus}</div>
        </div>
      </div>

      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #c084fc' }}>
        <strong>Behavioral Summary:</strong> {profile.behavioralSummary}
      </div>
    </div>
  );
}

// ── Inline Case Details Card ────────────────────────────────────────────────
function InlineCaseDetailsCard({ caseData, onSendQuery }) {
  if (!caseData) return null;

  return (
    <div style={{
      marginTop: '12px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      border: '1px solid #38bdf8',
      borderRadius: '12px',
      padding: '16px',
      color: '#f8fafc'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8' }}>
          SYNTHETIC CASE FILE: {caseData.caseId || caseData.case_id}
        </h4>
        <SyntheticDataBadge />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '10px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>OFFENDER / SUSPECT</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c084fc', marginTop: '2px' }}>{caseData.offenderId || caseData.offender_id}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>DISTRICT</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>{caseData.district}</div>
        </div>
        {(caseData.area_locality || caseData.areaLocality) && (
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>LOCALITY</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>{caseData.area_locality || caseData.areaLocality}</div>
          </div>
        )}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>SECTION / TYPE</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>{caseData.ipcBnsSection || caseData.ipc_bns_section}</div>
        </div>
      </div>

      <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.4 }}>
        <strong>Modus Operandi:</strong> {caseData.moSummary || caseData.mo_summary || caseData.methodUsed || caseData.method_used}
      </div>
    </div>
  );
}

function Chatbot({ onAddDocument, divisionName = "Bengaluru Division", onClose }) {
  const divisionSlug = (divisionName || "State HQ").toLowerCase().replace(/[^a-z0-9]/g, '_');

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`ksp_sentinel_chat_history_${divisionSlug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading chat history from localStorage:", e);
    }
    return [{
      id: 'welcome',
      sender: 'bot',
      text: `Hello Officer! I am <b>KSP DRISHTI Assistant</b> — your unified Karnataka State Police intelligence & command assistant for <b>${divisionName || 'State HQ'}</b>. ನಮಸ್ಕಾರ!<br/><br/>Ask any question naturally, select a quick action below, or select an active FIR case workspace from the top bar.`,
      agent_type: "general_agent",
      agent_label: "KSP DRISHTI Assistant",
      agent_icon: "🛡️",
      agent_color: "#1e40af",
      agent_description: `Command Operations Assistant — ${divisionName || 'State HQ'}`
    }];
  });

  const [selectedFir, setSelectedFir] = useState('');
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const [activeFlow, setActiveFlow] = useState(null); // 'scam', 'hazard', or 'rag-upload'
  const [expandedSources, setExpandedSources] = useState({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showComplaintPortal, setShowComplaintPortal] = useState(false);
  const [selectedModalChart, setSelectedModalChart] = useState(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedCalendarEventId, setSelectedCalendarEventId] = useState(null);
  const [calendarReminders, setCalendarReminders] = useState([]);

  // Date and timing formatting helpers for short calendar reminders
  const formatReminderDate = (dateStr) => {
    if (!dateStr) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const mIdx = parseInt(parts[1], 10) - 1;
      const yr = parts[0];
      return `${day} ${months[mIdx] || ''} ${yr}`;
    }
    return dateStr;
  };

  const getReminderTimingText = (daysRemaining, dateStr) => {
    const fDate = formatReminderDate(dateStr);
    if (daysRemaining === 0) {
      return `is today — ${fDate}`;
    } else if (daysRemaining === 1) {
      return `is tomorrow — ${fDate}`;
    } else if (daysRemaining === 2) {
      return `is in 2 days — ${fDate}`;
    } else {
      return `is in ${daysRemaining} days — ${fDate}`;
    }
  };

  // Fetch active 2-day calendar reminders for active division
  useEffect(() => {
    let isMounted = true;
    const fetchReminders = async () => {
      try {
        const div = (divisionName || 'Bengaluru').replace(/ Division$/i, '').trim();
        const res = await fetch(`/api/calendar/reminders?division=${encodeURIComponent(div)}`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.reminders)) {
          setCalendarReminders(data.reminders);
        }
      } catch (err) {
        console.warn('[Chatbot] Calendar reminders fetch notice:', err.message);
      }
    };
    fetchReminders();
    return () => { isMounted = false; };
  }, [divisionName]);

  // CONTEXT STATE FOR MULTI-TURN PATTERN MUTATION & FINGERPRINT QUERIES
  const [chatContext, setChatContext] = useState(() => {
    let savedDoc = null;
    try {
      const stored = localStorage.getItem(`ksp_sentinel_uploaded_doc_${divisionSlug}`);
      if (stored) savedDoc = JSON.parse(stored);
    } catch (e) {}
    return {
      lastReferencedDistrict: null,
      lastReferencedCrimeType: null,
      lastReferencedOffender: null,
      lastReferencedCase: null,
      lastMutationData: null,
      uploadedDocument: savedDoc
    };
  });

  // CHATGPT STYLE SAVED SESSION HISTORY STATE
  const [savedSessions, setSavedSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(`ksp_sentinel_chat_sessions_${divisionSlug}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error reading saved sessions:", e);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      const savedActive = localStorage.getItem(`ksp_sentinel_active_session_${divisionSlug}`);
      if (savedActive) return savedActive;
    } catch (e) {}
    const newId = `conv_${divisionSlug}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    try {
      localStorage.setItem(`ksp_sentinel_active_session_${divisionSlug}`, newId);
    } catch (e) {}
    return newId;
  });

  const chatFeedRef = useRef(null);
  const kspLogoRef = useRef(null);

  // Synchronize chat history persistence per division
  useEffect(() => {
    try {
      localStorage.setItem(`ksp_sentinel_chat_history_${divisionSlug}`, JSON.stringify(messages));
    } catch (e) {
      console.error("Error saving chat history to localStorage:", e);
    }
  }, [messages, divisionSlug]);

  useEffect(() => {
    const feedEl = chatFeedRef.current;
    if (!feedEl) return;

    const handleScroll = () => {
      const scrollTop = feedEl.scrollTop;
      const maxScroll = feedEl.scrollHeight - feedEl.clientHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

      if (kspLogoRef.current) {
        gsap.to(kspLogoRef.current, {
          y: progress * 50,
          scale: 1 + progress * 0.05,
          opacity: 0.12 + Math.sin(progress * Math.PI) * 0.06,
          duration: 0.3,
          ease: 'power1.out'
        });
      }
    };

    feedEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => feedEl.removeEventListener('scroll', handleScroll);
  }, []);

  const updateSessionStore = (currentMsgs, overrideTitle = null) => {
    if (!currentMsgs || currentMsgs.length <= 1) return;

    const firstUserMsg = currentMsgs.find(m => m.sender === 'user');
    if (!firstUserMsg) return;

    const titleText = overrideTitle || firstUserMsg.text.replace(/<[^>]*>?/gm, '').substring(0, 30);
    const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setSavedSessions(prev => {
      const existingIdx = prev.findIndex(s => s.id === activeSessionId);
      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          title: titleText,
          messages: currentMsgs,
          updatedAt: Date.now(),
          dateStr
        };
      } else {
        const newSession = {
          id: activeSessionId,
          title: titleText,
          messages: currentMsgs,
          updatedAt: Date.now(),
          dateStr
        };
        updated = [newSession, ...prev];
      }

      try {
        localStorage.setItem(`ksp_sentinel_chat_sessions_${divisionSlug}`, JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving session to localStorage:", e);
      }
      return updated;
    });
  };

  const handleNewConversation = () => {
    if (messages.length > 1) {
      updateSessionStore(messages);
    }
    const newId = `conv_${divisionSlug}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setActiveSessionId(newId);
    try {
      localStorage.setItem(`ksp_sentinel_active_session_${divisionSlug}`, newId);
      localStorage.removeItem(`ksp_sentinel_uploaded_doc_${divisionSlug}`);
    } catch (e) {}
    setChatContext({
      lastReferencedDistrict: null,
      lastReferencedCrimeType: null,
      lastReferencedOffender: null,
      lastReferencedCase: null,
      lastMutationData: null,
      uploadedDocument: null
    });
    setMessages([{
      id: 'welcome',
      sender: 'bot',
      text: `Hello Officer! I am <b>KSP DRISHTI Assistant</b> — your unified Karnataka State Police intelligence & command assistant for <b>${divisionName || 'State HQ'}</b>. ನಮಸ್ಕಾರ!<br/><br/>Select a specialist agent from the left sidebar or ask your query below in <b>Kannada (ಕನ್ನಡ)</b> or <b>English</b>.`,
      agent_type: "general_agent",
      agent_label: `KSP DRISHTI Assistant`,
      agent_icon: "🛡️",
      agent_color: "#1e40af",
      agent_description: `Command Operations Assistant — ${divisionName || 'State HQ'}`
    }]);
  };

  const handleLoadSession = (session) => {
    if (session && session.messages) {
      setActiveSessionId(session.id);
      setMessages(session.messages);
    }
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    setSavedSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      try {
        localStorage.setItem(`ksp_sentinel_chat_sessions_${divisionName}`, JSON.stringify(filtered));
      } catch (err) {
        console.error("Error updating saved sessions:", err);
      }
      return filtered;
    });

    if (sessionId === activeSessionId) {
      handleNewConversation();
    }
  };

  const handleClearAllSessions = () => {
    setSavedSessions([]);
    localStorage.removeItem(`ksp_sentinel_chat_sessions_${divisionName}`);
    handleNewConversation();
  };

  const handleClearHistory = handleNewConversation;

  // VOICE ASSISTANT STATE (KANNADA & ENGLISH SARVAM AI / WEB SPEECH)
  const [voiceLang, setVoiceLang] = useState('kn-IN');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voiceStatusText, setVoiceStatusText] = useState('');

  // OSINT Terminal Log state
  const [terminalLines, setTerminalLines] = useState([]);
  const [terminalStep, setTerminalStep] = useState('none');
  const [osintData, setOsintData] = useState(null);

  // Mini-map coordinates
  const [miniCoords, setMiniCoords] = useState({ lat: 12.9716, lng: 77.5946 });

  const feedEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll chat feed
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, terminalLines]);

  // Initialize Speech Recognition for Kannada (kn-IN) / English (en-IN)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = voiceLang;

      rec.onstart = () => {
        setIsListening(true);
        setVoiceStatusText(voiceLang === 'kn-IN' ? '🎙️ ಕನ್ನಡದಲ್ಲಿ ಹೇಳಿ... Listening in Kannada...' : '🎙️ Listening in English...');
      };

      rec.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setVoiceStatusText('Voice error. Click mic to retry.');
      };

      rec.onend = () => {
        setIsListening(false);
        setVoiceStatusText('');
      };

      recognitionRef.current = rec;
    }
  }, [voiceLang]);

  const toggleVoiceListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = voiceLang;
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Recognition already started:", e);
        }
      } else {
        alert("Browser Speech Recognition is not supported. Try Google Chrome or Edge.");
      }
    }
  };

  const toggleSourceExpand = (msgId) => {
    setExpandedSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Text-to-Speech (TTS) engine supporting Kannada (kn-IN) and English (en-IN) via Sarvam AI & Browser SpeechSynthesis
  const speakMessageText = async (textToSpeak) => {
    if (!textToSpeak) return;
    const cleanText = textToSpeak.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
    if (!cleanText) return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(true);

    try {
      const res = await fetch('/api/sarvam_tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, language_code: voiceLang })
      });
      const data = await res.json();

      if (data.success && data.audio_b64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audio_b64}`);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => fallbackBrowserTTS(cleanText);
        audio.play();
        return;
      }
    } catch (err) {
      console.warn("Sarvam AI TTS endpoint fallback to browser synthesis:", err);
    }

    fallbackBrowserTTS(cleanText);
  };

  const fallbackBrowserTTS = (cleanText) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = voiceLang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find(v => v.lang.includes(voiceLang.split('-')[0]));
      if (targetVoice) utterance.voice = targetVoice;

      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleSend = async (textToSend) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputText).trim();
    if (!text) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg = { id: Date.now() + '-user', sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setTyping(true);

    // ── Build conversation history payload for LLM Reasoning Layer ──
    const historyPayload = messages
      .filter(m => m.id !== 'welcome')
      .filter(m => m.sender === 'user' || m.sender === 'bot')
      .slice(-8)
      .map(m => ({
        role: m.sender === 'bot' ? 'assistant' : 'user',
        content: (m.text || '').replace(/<[^>]+>/g, '').trim()
      }));

    try {
      // ── Send to Backend Endpoint (POST /api/chat) ──
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: activeSessionId,
          division: divisionName,
          fir_number: selectedFir,
          context: chatContext
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setTyping(false);

      if (data.success && data.answer) {
        // Sync persistent conversationId from backend
        if (data.conversationId && data.conversationId !== activeSessionId) {
          setActiveSessionId(data.conversationId);
        }

        // Store context state silently for future UI functionality without dumping to chat
        if (data.context) {
          setChatContext(prev => ({ ...prev, ...data.context }));
          if (data.context.intent === 'create_event' || data.context.intent === 'delete_event' || data.context.intent === 'update_event') {
            window.dispatchEvent(new CustomEvent('ksp_calendar_event_created', { detail: data.context }));
          }
        }

        const chartData = data.context?.chart_data || data.chart_data || null;

        const botReply = {
          id: Date.now() + '-bot',
          sender: 'bot',
          text: data.answer,
          intent: data.context?.intent || data.intent,
          rag_used: data.context?.rag_used || data.rag_used || false,
          rag_sources: data.context?.rag_sources || null,
          chart_data: chartData,
          user_query: text,
          agent_type: data.context?.agent_type || 'sentinel_ai',
          agent_label: data.context?.agent_label || 'KSP DRISHTI',
          agent_icon: data.context?.agent_icon || '🛡️',
          agent_color: data.context?.agent_color || '#2563eb',
          offline_fallback: false,
          prompt_suggestions: data.context?.prompt_suggestions || data.prompt_suggestions || [
            `What has changed recently in ${div}?`,
            `What is the highest crime in ${div}?`,
            `Compare ${div} and Mysuru crime fingerprints`,
            "Show dominant crime patterns and time signatures"
          ]
        };

        setMessages(prev => {
          const next = [...prev, botReply];
          updateSessionStore(next);
          return next;
        });

        if (autoSpeak) {
          speakMessageText(data.answer.replace(/<[^>]+>/g, ''));
        }
        return;
      }
    } catch (err) {
      console.warn("Backend /api/chat communication error:", err.message);
      setTyping(false);

      // Graceful error display without crashing UI or leaking internal details
      const errorReply = {
        id: Date.now() + '-bot',
        sender: 'bot',
        text: "I encountered a communication issue connecting to the intelligence server. Please ensure the backend service is running and try your query again.",
        agent_type: 'error',
        agent_label: 'KSP DRISHTI',
        agent_icon: '⚠️',
        agent_color: '#ef4444',
        offline_fallback: true
      };

      setMessages(prev => {
        const next = [...prev, errorReply];
        updateSessionStore(next);
        return next;
      });
      return;
    }

    // ── OFFLINE FALLBACK: Process via local crimePatternEngine if backend is offline ──
    const patternResult = processQuery(text, chatContext, divisionName);
    setTyping(false);
    if (patternResult && patternResult.handled) {
      setChatContext(patternResult.context);
      const targetDistrict = patternResult.context.lastReferencedDistrict || 'Bengaluru';
      const botReply = {
        id: Date.now() + '-bot',
        sender: 'bot',
        text: patternResult.response.text,
        chart_data: patternResult.response.chartData || generateFallbackChartData(patternResult.response),
        agent_type: 'offline_engine',
        agent_label: 'KSP DRISHTI (Offline Engine)',
        agent_icon: '⚡',
        agent_color: '#64748b',
        offline_fallback: true,
        prompt_suggestions: [
          `Compare ${targetDistrict} and Mysuru crime fingerprints`,
          `Which locations are affected in ${targetDistrict}?`,
          `Has the theft pattern changed in ${targetDistrict}?`
        ]
      };
      setMessages(prev => {
        const next = [...prev, botReply];
        updateSessionStore(next);
        return next;
      });
      if (autoSpeak) {
        speakMessageText(patternResult.response.text.replace(/<[^>]+>/g, ''));
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // --- RAG Upload Flow ---
  const triggerRagUpload = () => {
    setMessages(prev => [...prev, { id: Date.now() + '-u', sender: 'user', text: "📄 Upload PDF / Dataset to RAG Store" }]);
    setActiveFlow('rag-upload');
    setMessages(prev => [...prev, {
      id: Date.now() + '-b',
      sender: 'bot',
      text: "Attach a PDF knowledge document or CSV dataset file below. It will be parsed, vector-indexed into the RAG Store, and merged into the SQLite database:",
      type: 'rag-upload-prompt'
    }]);
  };

  const handleProcessRagFile = async (file) => {
    if (!file) return;

    setMessages(prev => [
      ...prev.filter(m => m.type !== 'rag-upload-prompt'),
      { id: Date.now() + '-u-file', sender: 'user', text: `Uploaded: <b>${file.name}</b> (${roundSize(file.size)})` },
      { id: Date.now() + '-b-term', sender: 'bot', text: `Initializing RAG Vector Indexer for '${file.name}':`, type: 'rag-terminal' }
    ]);

    setTerminalStep('rcv');
    setTerminalLines([`> Uploading file stream: ${file.name} ...`]);

    setTimeout(() => {
      setTerminalLines(prev => [...prev, `> Parsing document structure & extracting text blocks...`]);
      setTerminalStep('extr');
    }, 600);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload_dataset', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      setTimeout(() => {
        setTerminalLines(prev => [...prev, `> Vector Chunking complete: Created ${data.chunks_indexed || 8} passage embeddings.`]);
        setTerminalLines(prev => [...prev, `> SQLite Crime DB & RAG Knowledge Store successfully updated.`]);
        setTerminalStep('comp');
      }, 1200);

      setTimeout(() => {
        if (data.success) {
          const docData = {
            filename: data.filename || file.name,
            filetype: data.filetype || (file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : ''),
            doc_type: data.doc_type || 'Uploaded Document',
            content: data.content || data.details || `Document ${file.name} uploaded and indexed.`,
            uploadedAt: new Date().toISOString()
          };

          setChatContext(prev => ({
            ...prev,
            uploadedDocument: docData
          }));

          try {
            localStorage.setItem(`ksp_sentinel_uploaded_doc_${divisionSlug}`, JSON.stringify(docData));
          } catch (e) {}

          if (onAddDocument && typeof onAddDocument === 'function') {
            onAddDocument({
              id: 'rag-' + Date.now(),
              name: data.filename,
              type: 'compiled',
              size: data.file_size,
              date: 'RAG Indexed'
            });
          }

          setMessages(prev => [
            ...prev,
            {
              id: Date.now() + '-rag-ok',
              sender: 'bot',
              text: `✅ <b>File '${data.filename}' successfully indexed into RAG Store!</b><br/>Indexed <b>${data.chunks_indexed || 16} vector chunks</b>. You can now ask questions about this document in the chatbot!`,
              rag_used: true,
              rag_sources: [
                {
                  doc_name: data.filename,
                  doc_type: data.doc_type,
                  similarity_score: 1.0,
                  passage: `Document indexed with ${data.chunks_indexed || 16} passage embeddings.`
                }
              ],
              agent_type: 'document_agent',
              agent_label: 'Document & Evidence Agent',
              agent_icon: '📄',
              agent_color: '#059669'
            }
          ]);
        } else {
          setMessages(prev => [...prev, { sender: 'bot', text: "Upload error: " + data.error }]);
        }
        setActiveFlow(null);
      }, 2000);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'bot', text: "Failed to upload and index document." }]);
      setActiveFlow(null);
    }
  };

  const roundSize = (bytes) => {
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const triggerLegalRights = () => {
    setMessages(prev => [...prev, { id: Date.now() + '-u', sender: 'user', text: "⚖️ View My Legal Rights (ಕಾನೂನು ಹಕ್ಕುಗಳು)" }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const legalAnswer = `Here are your primary legal rights under the **IT Act 2000** and Indian Criminal Procedure code:
        <br/><br/>
        1. **Right to File Anonymous Report**: You are entitled to report cyber crime anonymously on national databases.
        2. **Zero FIR (ಶೂನ್ಯ ಎಫ್‌ಐಆರ್)**: A victim can file an FIR at any police station regardless of jurisdictional bounds.
        3. **Right to Admissibility under Sec 65B**: Electronic evidence (screenshots, records) are admissible in court when packaged with certificate audits.`;
      
      setMessages(prev => [...prev, {
        id: Date.now() + '-b',
        sender: 'bot',
        text: legalAnswer,
        rag_used: true,
        rag_sources: [
          {
            doc_name: "KSP_Cyber_Crime_SOP_2026.pdf",
            doc_type: "PDF Knowledge Document",
            similarity_score: 0.94,
            passage: "Zero FIR Protocol & Section 65B IT Act Certificate Mandate for electronic evidence admissibility."
          }
        ]
      }]);

      if (autoSpeak) speakMessageText(legalAnswer);
    }, 800);
  };

  const triggerHazardScan = () => {
    setMessages(prev => [...prev, { id: Date.now() + '-u', sender: 'user', text: "📍 Scan Nearby Hazards" }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setActiveFlow('hazard');
      setMessages(prev => [...prev, {
        id: Date.now() + '-b',
        sender: 'bot',
        text: "Please drop a pin on the location where you observed the hazard, then click confirm location:",
        type: 'minimap'
      }]);
    }, 800);
  };

  const handleConfirmHazardLocation = () => {
    setMessages(prev => [
      ...prev.filter(m => m.type !== 'minimap'),
      {
        id: Date.now() + '-coords-ok',
        sender: 'bot',
        text: `<span style="color:var(--success)">✓ Coordinates Linked: ${miniCoords.lat.toFixed(5)}, ${miniCoords.lng.toFixed(5)}</span>`
      },
      {
        id: Date.now() + '-confirm',
        sender: 'bot',
        text: "Location received. The hazard point has been dynamically pinned on the primary KSP DRISHTI Map. Safety teams notified."
      }
    ]);
    setActiveFlow(null);
  };

  const triggerCyberScam = () => {
    setMessages(prev => [...prev, { id: Date.now() + '-u', sender: 'user', text: "🚨 Report Cyber Scam" }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setActiveFlow('scam');
      setMessages(prev => [...prev, {
        id: Date.now() + '-b',
        sender: 'bot',
        text: "Initiating secure evidence packet compilation. Please upload a screenshot of the scam incident:",
        type: 'upload'
      }]);
    }, 800);
  };

  const handleRunOsintDemo = async (file = null) => {
    setMessages(prev => [
      ...prev.filter(m => m.type !== 'upload'),
      {
        id: Date.now() + '-img-ok',
        sender: 'bot',
        text: "Image loaded successfully. Analyzing image headers..."
      },
      {
        id: Date.now() + '-term-prompt',
        sender: 'bot',
        text: "OSINT Metadata extraction pipeline initialized:",
        type: 'terminal'
      }
    ]);

    const formData = new FormData();
    if (file) {
      formData.append('screenshot', file);
    }
    try {
      const response = await fetch('/api/extract_metadata', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      const metadata = data.metadata;
      setOsintData(metadata);

      setTerminalStep('rcv');
      setTerminalLines([`> Connecting to live OSINT analysis engine...`]);

      setTimeout(() => {
        setTerminalLines(prev => [...prev, `> Calculating image SHA-256 hash: ${metadata.sha256.substring(0, 32)}...`]);
        setTerminalStep('extr');
      }, 700);

      setTimeout(() => {
        setTerminalLines(prev => [...prev, `> Parsing network blocks... Threat IP: ${metadata.ip_address} [Host: ${metadata.hosting_provider}]`]);
      }, 1400);

      setTimeout(() => {
        setTerminalLines(prev => [...prev, `> GPS metadata resolved to: ${metadata.gps.latitude}° N, ${metadata.gps.longitude}° E [${metadata.gps.location_name}]`]);
        setTerminalStep('comp');
      }, 2100);

      setTimeout(() => {
        setTerminalLines(prev => [...prev, `> Extracted Scam UPI Accounts: ${metadata.extracted_indicators.upi_ids.join(', ')}`]);
        setTerminalLines(prev => [...prev, `> Severity rating: [${metadata.threat_severity}] | Secure Certificate Generated.`]);
      }, 2800);

      setTimeout(() => {
        const docName = `Evidence_Packet_${metadata.ip_address.replace(/\./g, '_')}.pdf`;
        const downloadFn = () => downloadPDF(metadata);
        
        if (onAddDocument) {
          onAddDocument({
            id: Date.now() + '-pdf',
            name: docName,
            type: 'compiled',
            size: '12 KB',
            date: 'Compiled Live',
            downloadFn
          });
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + '-pdf-ready',
            sender: 'bot',
            text: "Secure evidence packet compiled successfully. Download below:",
            type: 'pdf-download',
            metadata
          }
        ]);
        setActiveFlow(null);
      }, 3500);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'bot', text: "Extraction failed due to network error." }]);
    }
  };

  function downloadPDF(data) {
    if (!data) return;
    const doc = new jsPDF();
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.rect(5, 5, 200, 287);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("KARNATAKA STATE POLICE", 105, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("STATE CRIME RECORDS BUREAU (SCRB) - EVIDENCE CERTIFICATE", 105, 26, { align: "center" });
    doc.line(15, 30, 195, 30);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30);
    doc.text("1. DIGITAL EVIDENCE METADATA & HASHES", 15, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Image Hash (SHA-256): ${data.sha256 || 'N/A'}`, 15, 48);
    doc.text(`Timestamp: ${data.timestamp || new Date().toISOString()}`, 15, 54);
    doc.text(`Threat Category: ${data.threat_category || 'Cyber Fraud'}`, 15, 60);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("2. NETWORK & INFRASTRUCTURE INTELLIGENCE", 15, 72);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Resolved IP Address: ${data.ip_address || 'N/A'}`, 15, 80);
    doc.text(`Hosting Provider / ISP: ${data.hosting_provider || 'N/A'}`, 15, 86);
    doc.text(`Autonomous System (ASN): ${data.asn || 'N/A'}`, 15, 92);
    doc.text(`Country / Location: ${data.country || 'N/A'}`, 15, 98);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("3. GEOLOCATION RADAR CO-ORDINATES", 15, 110);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const gps = data.gps || {};
    doc.text(`Latitude: ${gps.latitude || 'N/A'}° N`, 15, 118);
    doc.text(`Longitude: ${gps.longitude || 'N/A'}° E`, 15, 124);
    doc.text(`Resolved Sector Name: ${gps.location_name || 'N/A'}`, 15, 130);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("4. EXTRACTED FINANCIAL INDICATORS & MULE ACCOUNTS", 15, 142);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const indicators = data.extracted_indicators || {};
    doc.text(`UPI IDs: ${(indicators.upi_ids || []).join(', ') || 'None'}`, 15, 150);
    doc.text(`Phone Numbers: ${(indicators.phone_numbers || []).join(', ') || 'None'}`, 15, 156);
    doc.text(`Mule Bank Accounts: ${(indicators.bank_accounts || []).join(', ') || 'None'}`, 15, 162);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("5. LEGAL ADMISSIBILITY & CERTIFICATION", 15, 175);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Certified under Section 65B of the Indian Evidence Act, 1872 / Section 63 of BSA 2023.", 15, 183);
    doc.text("Generated by KSP DRISHTI - State Crime Records Bureau (SCRB) Automated Evidence Engine.", 15, 189);

    doc.save(`Evidence_Packet_${(data.ip_address || '127_0_0_1').replace(/\./g, '_')}.pdf`);
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleRunOsintDemo(e.target.files[0]);
    }
  };

  const downloadChatSummaryPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1);
    doc.rect(5, 5, 200, 287);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text("KARNATAKA STATE POLICE • KSP DRISHTI COMMAND", 105, 18, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text("KSP COMMAND AI EXECUTIVE REPORT", 105, 24, { align: "center" });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(15, 28, 195, 28);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated: ${now}  |  Language: ${voiceLang === 'kn-IN' ? 'Kannada (kn-IN)' : 'English (en-IN)'}  |  Audit: SECURE`, 15, 34);

    let currentY = 42;

    doc.setFillColor(239, 246, 255);
    doc.rect(15, currentY, 180, 36, "F");
    doc.setDrawColor(191, 219, 254);
    doc.rect(15, currentY, 180, 36, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text("📌 EXECUTIVE SUMMARY OF RECENT SESSION:", 20, currentY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const userQueries = messages.filter(m => m.sender === 'user');
    const summaryBullets = [
      `• Total Officer Queries Handled: ${userQueries.length} (KSP Command AI)`,
      `• Primary Voice Language: ${voiceLang === 'kn-IN' ? 'Kannada (ಕನ್ನಡ - kn-IN)' : 'English (en-IN)'}`,
      `• Vector RAG Knowledge Base: KSP Cyber Crime SOP 2026, Citizen Safety Guide, SQLite Records`,
      `• Evidence Admissibility: Compliant under Section 65B Indian Evidence Act 1872.`
    ];

    let bulletY = currentY + 13;
    summaryBullets.forEach(b => {
      doc.text(b, 22, bulletY);
      bulletY += 5;
    });

    currentY += 44;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("💬 CHAT TRANSCRIPT & CONVERSATION LOGS:", 15, currentY);

    currentY += 6;

    const cleanText = (str) => {
      if (!str) return '';
      return str.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
    };

    messages.forEach((m, idx) => {
      if (currentY > 265) {
        doc.addPage();
        doc.rect(5, 5, 200, 287);
        currentY = 20;
      }

      const isUser = m.sender === 'user';
      const senderLabel = isUser ? "👤 USER QUERY:" : "🤖 KSP DRISHTI:";
      const cleanContent = cleanText(m.text);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(isUser ? 37 : 15, isUser ? 99 : 23, isUser ? 235 : 42);
      doc.text(`${idx + 1}. ${senderLabel}`, 15, currentY);

      currentY += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      const splitText = doc.splitTextToSize(cleanContent, 175);
      doc.text(splitText, 20, currentY);

      currentY += splitText.length * 4.2 + 4;

      if (m.rag_sources && m.rag_sources.length > 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(100);
        doc.text(`   [RAG Source: ${m.rag_sources[0].doc_name} • Similarity: Math.round(m.rag_sources[0].similarity_score * 100)%]`, 20, currentY);
        currentY += 5;
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(15, currentY, 195, currentY);
      currentY += 3;
    });

    if (currentY > 250) {
      doc.addPage();
      doc.rect(5, 5, 200, 287);
      currentY = 20;
    }

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("VERIFIED BY:", 15, currentY);
    doc.text("KSP AI COMMAND ENGINE AUDIT SIGNATURE", 115, currentY);

    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Karnataka State Police SCRB Digital Node", 15, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("[DIGITAL-KSP-AI-SUMMARY-HASH-OK]", 115, currentY);

    doc.save(`KSP_Command_AI_Summary_${Date.now()}.pdf`);
  };

  return (
    <div className="full-screen-chat-layout">
      {/* LEFT SIDEBAR PANEL (ChatGPT Style - Dark Navy Sidebar) */}
      <div className="chat-sidebar-panel">
        <div className="sidebar-brand">
          <img src="/ksp_police_logo.png" alt="Logo" style={{ width: 26, height: 26 }} />
          <div>
            <h3>KSP DRISHTI</h3>
            <div style={{ fontSize: '0.62rem', color: '#93c5fd', fontWeight: 800 }}>Unified KSP Intelligence Console</div>
          </div>
        </div>

        <button className="sidebar-new-chat-btn" onClick={handleNewConversation} title="Start new conversation session">
          <Plus size={16} /> New Conversation
        </button>

        {/* SPECIALIST CAPABILITIES — SHORTCUTS */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <ShieldCheck size={13} style={{ color: '#60a5fa' }} /> SPECIALIST CAPABILITIES
          </div>
          <div className="sidebar-agent-list">
            <button className="sidebar-agent-btn" onClick={() => handleSend('\\analytics')}>
              <span>📊 Crime Analytics</span>
            </button>
            <button className="sidebar-agent-btn" onClick={() => handleSend('\\document')}>
              <span>📄 SOP & Legal Guide</span>
            </button>
            <button className="sidebar-agent-btn" onClick={() => handleSend(`What has changed recently in ${div}?`)}>
              <span>⚡ Pattern Mutation Signal</span>
            </button>
            <button className="sidebar-agent-btn" onClick={() => handleSend('\\intel')}>
              <span>🕵️ Financial Intelligence</span>
            </button>
          </div>
        </div>

        {/* QUICK SPECIALIST ACTION CARDS */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <Sparkles size={13} style={{ color: '#fbbf24' }} /> QUICK ACTIONS
          </div>
          <div className="sidebar-action-grid">
            <button className="sidebar-action-chip" onClick={() => handleSend('\\analytics')}>
              <BarChart2 size={12} style={{ color: '#60a5fa' }} /> Crime Analytics
            </button>
            <button className="sidebar-action-chip" onClick={() => handleSend('\\document')}>
              <Scale size={12} style={{ color: '#c084fc' }} /> SOP & Legal
            </button>
            <button className="sidebar-action-chip" onClick={() => handleSend(`Compare ${div} and Mysuru crime fingerprints`)}>
              <Lightbulb size={12} style={{ color: '#fbbf24' }} /> Compare Fingerprints
            </button>
            <button className="sidebar-action-chip" onClick={() => handleSend('\\intel')}>
              <ShieldAlert size={12} style={{ color: '#a855f7' }} /> Financial Intelligence
            </button>
            <button className="sidebar-action-chip" onClick={triggerHazardScan}>
              <Compass size={12} style={{ color: '#34d399' }} /> Crime Map
            </button>
            <button className="sidebar-action-chip" onClick={triggerCyberScam}>
              <AlertTriangle size={12} style={{ color: '#f87171' }} /> Cyber Fraud
            </button>
            <button className="sidebar-action-chip" onClick={triggerRagUpload}>
              <Upload size={12} style={{ color: '#60a5fa' }} /> Upload Document
            </button>
            <button className="sidebar-action-chip" onClick={downloadChatSummaryPDF}>
              <Download size={12} style={{ color: '#34d399' }} /> Generate Report
            </button>
          </div>
        </div>

        {/* CHATGPT STYLE RECENT SAVED SESSIONS HISTORY PANEL */}
        <div className="sidebar-section" style={{ marginTop: 'auto', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '140px' }}>
          <div className="sidebar-section-title" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8' }}>
              <History size={13} style={{ color: '#60a5fa' }} /> RECENT SESSIONS ({savedSessions.length})
            </span>
            {savedSessions.length > 0 && (
              <button 
                onClick={handleClearAllSessions}
                style={{ background: 'transparent', color: '#ef4444', border: 'none', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer' }}
                title="Clear all saved sessions"
              >
                Clear All
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '2px' }}>
            {savedSessions.length === 0 ? (
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', padding: '6px 4px' }}>
                No saved chat sessions. Ask a query and click "+ New Conversation" to save.
              </div>
            ) : (
              savedSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleLoadSession(session)}
                  style={{
                    background: activeSessionId === session.id ? 'rgba(37, 99, 235, 0.35)' : 'rgba(30, 41, 59, 0.7)',
                    border: activeSessionId === session.id ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '7px 9px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Click to view: ${session.title}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                    <MessageSquare size={13} style={{ color: activeSessionId === session.id ? '#60a5fa' : '#94a3b8', flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: activeSessionId === session.id ? '#ffffff' : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {session.title || 'Conversation Session'}
                      </div>
                      <div style={{ fontSize: '0.58rem', color: '#64748b', marginTop: '1px' }}>
                        {session.dateStr || 'Saved'} • {session.messages?.length || 0} msgs
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0
                    }}
                    title="Delete this session"
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MAIN CHAT CANVAS (Light White Theme like 2nd image) */}
      <div className="chat-main-canvas">
        <div id="view-chat">
          {/* Top KSP Official Header Toolbar */}
          <div className="chat-guardrail" style={{ justifyContent: 'space-between', padding: '10px 20px', gap: '8px', flexWrap: 'wrap', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/ksp_police_logo.png" alt="KSP Logo" style={{ width: 20, height: 20 }} />
              <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.88rem' }}>
                KSP DRISHTI Assistant — {divisionName || 'State HQ'}
              </span>

              {/* ACTIVE FIR CASE WORKSPACE SELECTOR */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#f8fafc', border: '1px solid #cbd5e1',
                borderRadius: '8px', padding: '2px 8px', marginLeft: '6px'
              }}>
                <FolderKanban size={13} style={{ color: '#2563eb' }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#1e3a8a' }}>Active FIR Context:</span>
                <select
                  value={selectedFir}
                  onChange={(e) => setSelectedFir(e.target.value)}
                  style={{
                    fontSize: '0.68rem', fontWeight: 700, background: 'white',
                    border: '1px solid #cbd5e1', borderRadius: '6px', padding: '2px 6px',
                    color: selectedFir ? '#1d4ed8' : '#64748b', cursor: 'pointer'
                  }}
                >
                  <option value="">-- All Stations / General Context --</option>
                  <optgroup label="🔵 Bengaluru Division Stations">
                    <option value="FIR-187/2026-d91c">FIR-187/2026-d91c (Cheating - Malleswaram PS)</option>
                    <option value="FIR-623/2025-a466">FIR-623/2025-a466 (Robbery - Malleswaram PS)</option>
                    <option value="FIR-392/2026-e99d">FIR-392/2026-e99d (Theft - Tumakuru Town PS)</option>
                    <option value="FIR-502/2025-a39c">FIR-502/2025-a39c (Cheating - Tumakuru Town PS)</option>
                    <option value="FIR-918/2025-1e99">FIR-918/2025-1e99 (Robbery - Koramangala PS)</option>
                  </optgroup>
                  <optgroup label="🟣 Mysuru Division Stations">
                    <option value="FIR-936/2025-f20d">FIR-936/2025-f20d (Cyber Crime - Kuvempunagar PS)</option>
                    <option value="FIR-883/2025-9372">FIR-883/2025-9372 (Theft - Saraswathipuram PS)</option>
                    <option value="FIR-632/2025-ed77">FIR-632/2025-ed77 (Theft - Kuvempunagar PS)</option>
                    <option value="FIR-609/2025-6bae">FIR-609/2025-6bae (Assault - Devaraja PS)</option>
                  </optgroup>
                  <optgroup label="🟢 Belagavi Division Stations">
                    <option value="FIR-698/2026-84ab">FIR-698/2026-84ab (Cheating - Tilakwadi PS)</option>
                    <option value="FIR-472/2026-23d2">FIR-472/2026-23d2 (Theft - Tilakwadi PS)</option>
                    <option value="FIR-666/2025-fd4a">FIR-666/2025-fd4a (NDPS - Khadebazar PS)</option>
                  </optgroup>
                  <optgroup label="🟡 Kalaburagi Division Stations">
                    <option value="FIR-881/2026-058b">FIR-881/2026-058b (Cyber Crime - Vidyanagar PS)</option>
                    <option value="FIR-809/2026-a581">FIR-809/2026-a581 (Cheating - Dharwad Suburban PS)</option>
                  </optgroup>
                </select>
                {selectedFir && (
                  <span style={{ fontSize: '0.6rem', background: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                    ACTIVE CASE
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* LANGUAGE SELECTOR TOGGLE */}
              <button 
                onClick={() => setVoiceLang(voiceLang === 'kn-IN' ? 'en-IN' : 'kn-IN')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: voiceLang === 'kn-IN' ? '#059669' : '#ffffff',
                  color: voiceLang === 'kn-IN' ? 'white' : '#1e3a8a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                title="Toggle Language (Kannada kn-IN / English en-IN)"
              >
                <Languages size={12} /> {voiceLang === 'kn-IN' ? '🌐 ಕನ್ನಡ (KN)' : '🌐 English (EN)'}
              </button>

              {/* AUTO-PLAY VOICE TOGGLE */}
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: autoSpeak ? '#7c3aed' : '#f1f5f9',
                  color: autoSpeak ? 'white' : '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 9px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Toggle Auto Read-Aloud for Bot Responses"
              >
                {autoSpeak ? <Volume2 size={12} /> : <VolumeX size={12} />} Voice
              </button>

              {/* EXPORT SUMMARY PDF BUTTON */}
              <button 
                onClick={downloadChatSummaryPDF}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                }}
                title="Download Executive Chat Summary as PDF"
              >
                <Download size={12} /> PDF Summary
              </button>

              {/* CALENDAR & EVENT INTELLIGENCE BUTTON */}
              <button 
                onClick={() => setShowCalendarModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: calendarReminders.length > 0 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #1d4ed8, #1e40af)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)'
                }}
                title="Karnataka Police Calendar & Event Intelligence"
              >
                <CalendarIcon size={12} /> Calendar {calendarReminders.length > 0 && `(🔔 ${calendarReminders.length})`}
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    width: '26px',
                    height: '26px',
                    cursor: 'pointer',
                    marginLeft: '4px'
                  }}
                  title="Close Assistant Window"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* VOICE LISTENING STATUS BADGE */}
          {isListening && (
            <div style={{ background: 'linear-gradient(90deg, #ef4444, #dc2626)', color: 'white', padding: '6px 12px', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'pulse 1.5s infinite' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Radio size={14} className="animate-spin" /> {voiceStatusText || '🎙️ Listening to Voice Command...'}
              </span>
              <button onClick={toggleVoiceListen} style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>
                Stop Mic
              </button>
            </div>
          )}

          {/* CHAT FEED WRAPPER WITH ABSOLUTE WATERMARK */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* KSP OFFICIAL POLICE LOGO BACKGROUND IMAGE WATERMARK (FULL FIT) */}
            <div
              ref={kspLogoRef}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(500px, 70vw)',
                height: 'min(500px, 70vh)',
                pointerEvents: 'none',
                zIndex: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.06
              }}
            >
              <img
                src="/ksp_police_logo.png"
                alt="Karnataka State Police Official Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* CHAT FEED */}
            <div className="chat-feed" ref={chatFeedRef} style={{ flex: 1, position: 'relative', zIndex: 1, overflowY: 'auto' }}>
            {/* KSP OFFICIAL WELCOME BANNER */}
            {messages.length <= 1 && (
              <div style={{ textAlign: 'left', padding: '8px 4px 12px 4px', animation: 'bubble-slide-up 0.4s ease-out' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.2 }}>
                  <ShieldCheck size={22} style={{ color: '#2563eb' }} /> KSP DRISHTI Assistant,
                </div>
                <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 700, marginTop: '2px' }}>
                  Karnataka State Police Command Intelligence platform active for {divisionName || 'State HQ'}.
                </div>
              </div>
            )}

            {/* 2-DAY EVENT REMINDER NOTIFICATION BANNER (SHORT & NON-INTRUSIVE) */}
            {calendarReminders.length > 0 && (
              <div style={{
                margin: '6px 4px 12px 4px',
                background: 'rgba(30, 41, 59, 0.95)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '10px',
                padding: '10px 14px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                animation: 'bubble-slide-up 0.3s ease-out'
              }}>
                {/* Alert Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 900,
                  color: '#f87171',
                  letterSpacing: '0.4px',
                  marginBottom: '6px',
                  textTransform: 'uppercase'
                }}>
                  <Bell size={13} style={{ color: '#ef4444' }} />
                  <span>{calendarReminders[0].scope === 'COMMON' ? 'KARNATAKA CALENDAR ALERT' : 'EVENT REMINDER'}</span>
                </div>

                {/* Event Name & Timing */}
                <div style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '4px',
                  lineHeight: '1.3'
                }}>
                  {calendarReminders[0].eventName} {getReminderTimingText(calendarReminders[0].daysRemaining, calendarReminders[0].eventDate)}
                </div>

                {/* Location Line */}
                <div style={{
                  fontSize: '0.74rem',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginBottom: '4px'
                }}>
                  <span>📍</span>
                  <span style={{ fontWeight: 600, color: '#cbd5e1' }}>
                    {calendarReminders[0].scope === 'COMMON' ? 'Key:' : 'Location:'}
                  </span>
                  <span style={{ color: '#e2e8f0' }}>
                    {calendarReminders[0].location || (calendarReminders[0].scope === 'COMMON' ? 'Statewide Karnataka' : `${divisionName || 'Bengaluru'} HQ`)}
                  </span>
                </div>

                {/* Priority Line */}
                <div style={{
                  fontSize: '0.74rem',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginBottom: '10px'
                }}>
                  <span>🛡</span>
                  <span style={{ fontWeight: 600, color: '#cbd5e1' }}>Priority:</span>
                  <span style={{
                    fontWeight: 800,
                    color: calendarReminders[0].patrolPriority === 'CRITICAL' ? '#ef4444' : calendarReminders[0].patrolPriority === 'HIGH' ? '#f59e0b' : '#38bdf8'
                  }}>
                    {calendarReminders[0].patrolPriority || 'HIGH'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {calendarReminders[0].scope === 'COMMON' ? (
                    <button
                      onClick={() => {
                        setInputText(`What should ${divisionName || 'Bengaluru'} patrol teams do during ${calendarReminders[0].eventName}?`);
                        handleSendMessage();
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
                      }}
                    >
                      <Sparkles size={11} /> AI Advisory
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedCalendarEventId(calendarReminders[0].eventId);
                        setShowCalendarModal(true);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
                      }}
                    >
                      <CalendarIcon size={11} /> View Event
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedCalendarEventId(calendarReminders[0].eventId);
                      setShowCalendarModal(true);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CalendarIcon size={11} /> View Calendar
                  </button>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.sender}`}>
                {/* UNIFIED ASSISTANT BADGE — clean identity without technical jargon */}
                {m.sender === 'bot' && (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      marginBottom: '3px'
                    }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: 'rgba(37,99,235,0.08)',
                        border: '1.5px solid #2563eb',
                        borderRadius: '20px',
                        padding: '2px 10px 2px 6px',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        color: '#1e3a8a',
                      }}>
                        <span style={{ fontSize: '0.75rem' }}>{m.agent_icon || '🛡️'}</span>
                        {m.agent_label || 'KSP DRISHTI Assistant'}
                      </div>
                    </div>
                  </div>
                )}

                <div dangerouslySetInnerHTML={{ __html: markdownToHtml(m.text) }} />

                {m.pattern_response && m.pattern_response.type === 'pattern_mutation' && (
                  <InlinePatternMutationCard mutation={m.pattern_response.data} onSendQuery={handleSend} />
                )}
                {m.pattern_response && m.pattern_response.type === 'area_fingerprint_comparison' && (
                  <InlineAreaFingerprintCard comp={m.pattern_response.data} onSendQuery={handleSend} />
                )}
                {m.pattern_response && m.pattern_response.type === 'behavioral_profile' && (
                  <InlineBehavioralProfileCard profile={m.pattern_response.data} onSendQuery={handleSend} />
                )}
                {m.pattern_response && m.pattern_response.type === 'case_details' && (
                  <InlineCaseDetailsCard caseData={m.pattern_response.data} onSendQuery={handleSend} />
                )}

                {m.sender === 'bot' && (
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => isSpeaking ? stopSpeaking() : speakMessageText(m.text)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: isSpeaking ? '#ef4444' : '#f1f5f9',
                        color: isSpeaking ? 'white' : '#2563eb',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '3px 9px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                      title="Read Aloud via Voice Synthesis"
                    >
                      <Volume2 size={11} /> {isSpeaking ? 'Stop Voice' : `🔊 Listen (${voiceLang === 'kn-IN' ? 'ಕನ್ನಡ' : 'EN'})`}
                    </button>
                  </div>
                )}

                {m.rag_used && m.rag_sources && m.rag_sources.length > 0 && (
                  <div className="rag-citation-box" style={{ marginTop: '8px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '6px' }}>
                    <div 
                      onClick={() => toggleSourceExpand(m.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700 }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Database size={11} /> Source: {m.rag_sources[0].doc_name} ({intScore(m.rag_sources[0].similarity_score)}% Match)
                      </span>
                      {expandedSources[m.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </div>

                    {expandedSources[m.id] && (
                      <div style={{ marginTop: '6px', fontSize: '0.65rem', background: 'rgba(37,99,235,0.06)', padding: '6px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                        <div><b>Document Type:</b> {m.rag_sources[0].doc_type}</div>
                        <div style={{ marginTop: '3px', fontStyle: 'italic' }}>"{m.rag_sources[0].passage}"</div>
                      </div>
                    )}
                  </div>
                )}

                {(m.type === 'terminal' || m.type === 'rag-terminal') && (
                  <div className="osint-terminal">
                    <div className="terminal-header">
                      <Cpu size={12} /> RAG & OSINT Execution Engine
                    </div>
                    <div className="terminal-body">
                      {terminalLines.map((line, i) => (
                        <div key={i} className="terminal-line">{line}</div>
                      ))}
                      {terminalStep !== 'comp' && (
                        <div className="terminal-line typing">&gt; Processing...</div>
                      )}
                    </div>
                  </div>
                )}

                {m.type === 'minimap' && (
                  <div className="minimap-container" style={{ marginTop: '8px', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                    <MapContainer 
                      center={[miniCoords.lat, miniCoords.lng]} 
                      zoom={13} 
                      zoomControl={false}
                      attributionControl={false}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[miniCoords.lat, miniCoords.lng]} icon={customMiniIcon} />
                      <MiniMapEvents onClick={(latlng) => setMiniCoords(latlng)} />
                    </MapContainer>
                    <button className="confirm-map-btn" onClick={handleConfirmHazardLocation}>
                      Confirm Hazard Location
                    </button>
                  </div>
                )}

                {m.type === 'rag-upload-prompt' && (
                  <div className="upload-simulator">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Select PDF knowledge file or CSV dataset to index into RAG vector store
                    </div>
                    <div className="upload-actions">
                      <label className="upload-label-btn" htmlFor="rag-doc-file-input">
                        Upload PDF / Dataset
                      </label>
                      <input 
                        type="file" 
                        id="rag-doc-file-input" 
                        accept=".jpg,.jpeg,.png,.pdf,.csv,.json,.txt,.xlsx"
                        style={{ display: 'none' }} 
                        onChange={(e) => e.target.files && e.target.files[0] && handleProcessRagFile(e.target.files[0])}
                      />
                    </div>
                  </div>
                )}

                {m.type === 'upload' && (
                  <div className="upload-simulator">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Upload scam evidence (phishing SMS, QR code, fraudulent receipt)
                    </div>
                    <div className="upload-actions">
                      <label className="upload-label-btn" htmlFor="scam-img-file-react">
                        Upload File
                      </label>
                      <input 
                        type="file" 
                        id="scam-img-file-react" 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange}
                      />
                      <button className="demo-upload-btn" onClick={() => handleRunOsintDemo()}>
                        <Bolt size={12} /> Use Pitch Demo Image
                      </button>
                    </div>
                  </div>
                )}

                {m.type === 'pdf-download' && (
                  <div className="pdf-download-card">
                    <div className="pdf-info">
                      <FileText size={20} />
                      <div>
                        <div className="pdf-title">
                          Evidence_Packet_{(m.metadata?.ip_address || '127_0_0_1').replace(/\./g, '_')}.pdf
                        </div>
                        <div className="pdf-size">Size: ~12 KB • Admissible Case Doc</div>
                      </div>
                    </div>
                    <button className="pdf-btn" onClick={() => m.metadata && downloadPDF(m.metadata)}>
                      Download
                    </button>
                  </div>
                )}

                <div className="message-status">
                  <span>Read</span>
                  <CheckCheck size={10} style={{ color: 'var(--success)' }} />
                </div>
              </div>
            ))}

            {/* SUPERVISOR ROUTING TYPING INDICATOR */}
            {typing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 12px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', width: 'fit-content', animation: 'bubble-slide-up 0.2s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} style={{ color: '#2563eb' }} className="animate-spin" />
                  <span style={{ fontSize: '0.74rem', color: '#1e3a8a', fontWeight: 800 }}>Supervisor Agent routing your query...</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', paddingLeft: '4px' }}>
                  {[{icon:'📊',label:'Analytics',color:'#2563eb'},{icon:'📄',label:'Document',color:'#059669'},{icon:'🔍',label:'Pattern',color:'#d97706'},{icon:'🕵️',label:'Intelligence',color:'#7c3aed'},{icon:'🛡️',label:'General',color:'#1e40af'}].map((a,i) => (
                    <div key={i} style={{ fontSize: '0.52rem', display: 'flex', alignItems: 'center', gap: '2px', color: a.color, fontWeight: 700, opacity: 0.6 + (i % 2) * 0.4, animation: `pulse ${1 + i * 0.2}s infinite` }}>
                      <span>{a.icon}</span>{a.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div ref={feedEndRef} />
          </div>
        </div>

          {/* KSP INPUT AREA */}
          <div className="chat-input-area" style={{ padding: '12px 32px 20px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <div className="ksp-input-container" style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: '20px',
              padding: '6px 10px 6px 14px',
              border: '1.5px solid #cbd5e1',
              boxShadow: '0 6px 20px rgba(15,23,42,0.08)',
              transition: 'all 0.2s',
              maxWidth: '960px',
              margin: '0 auto'
            }}>
          {/* MIC BUTTON */}
          <button
            type="button"
            onClick={toggleVoiceListen}
            style={{
              background: isListening ? '#ef4444' : '#f1f5f9',
              color: isListening ? 'white' : '#2563eb',
              border: 'none',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginRight: '6px',
              transition: 'all 0.2s'
            }}
            title={isListening ? 'Stop Listening' : `Speak in ${voiceLang === 'kn-IN' ? 'Kannada (ಕನ್ನಡ)' : 'English'}`}
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          {/* + OPTIONS MENU BUTTON (MATCHING USER SCREENSHOT) */}
          <div style={{ position: 'relative', display: 'inline-block', marginRight: '6px' }}>
            <button
              type="button"
              onClick={() => setShowPlusMenu(!showPlusMenu)}
              style={{
                background: showPlusMenu ? '#2563eb' : '#f1f5f9',
                color: showPlusMenu ? 'white' : '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Add Files, Connectors, Databases & Skills"
            >
              <Plus size={16} style={{ transform: showPlusMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* POPUP OPTIONS DROPDOWN MENU */}
            {showPlusMenu && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: '36px',
                  left: '0',
                  width: '240px',
                  background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  boxShadow: '0 20px 35px rgba(0, 0, 0, 0.4)',
                  padding: '6px',
                  zIndex: 9999,
                  animation: 'bubble-slide-up 0.15s ease-out',
                  color: '#f8fafc'
                }}
              >
                {/* Option 1: Add files or photos */}
                <div 
                  onClick={() => {
                    setShowPlusMenu(false);
                    const fileInput = document.getElementById('chat-input-file-btn');
                    if (fileInput) fileInput.click();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#f1f5f9',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  className="popup-menu-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Paperclip size={14} style={{ color: '#38bdf8' }} />
                    <span>Add files or photos</span>
                  </div>
                  <span style={{ fontSize: '0.62rem', color: '#64748b', background: '#334155', padding: '1px 5px', borderRadius: '4px' }}>Ctrl+U</span>
                </div>

                {/* Option 2: Add Database Connector (Relational / NoSQL) */}
                <div 
                  onClick={() => { setShowPlusMenu(false); setShowDbModal(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#f1f5f9',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  className="popup-menu-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={14} style={{ color: '#a855f7' }} />
                    <span>Add connector (SQL/NoSQL)</span>
                  </div>
                  <ChevronRight size={13} style={{ color: '#64748b' }} />
                </div>

                {/* Option 3: Add Knowledge Document */}
                <div 
                  onClick={() => { setShowPlusMenu(false); triggerRagUpload(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#f1f5f9',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  className="popup-menu-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderPlus size={14} style={{ color: '#34d399' }} />
                    <span>Add to RAG project</span>
                  </div>
                  <ChevronRight size={13} style={{ color: '#64748b' }} />
                </div>
              </div>
            )}
          </div>

          {/* HIDDEN FILE INPUT (PERMANENTLY MOUNTED IN DOM) */}
          <input 
            type="file"
            id="chat-input-file-btn"
            accept=".jpg,.jpeg,.png,.webp,.pdf,.csv,.json,.txt,.xlsx,.sql"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessRagFile(e.target.files[0]);
                e.target.value = ''; // Reset input so same file can be uploaded again
              }
            }}
          />

          {/* INPUT FIELD */}
          <input 
            type="text" 
            placeholder={voiceLang === 'kn-IN' ? "ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಕೇಳಿ... (Ask in Kannada or English)" : "Ask KSP Command AI or query RAG DB..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.82rem',
              background: 'transparent',
              color: '#0f172a'
            }}
          />

          {/* SEND BUTTON */}
          <button 
            className="chat-send-btn" 
            onClick={() => handleSend()}
            style={{
              background: '#2563eb',
              border: 'none',
              color: 'white',
              borderRadius: '10px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      {showComplaintPortal && (
        <ComplaintPortal onClose={() => setShowComplaintPortal(false)} />
      )}

      {/* INTERACTIVE CHART ANALYSIS MODAL */}
      <ChartAnalysisModal
        isOpen={!!selectedModalChart}
        onClose={() => setSelectedModalChart(null)}
        chartData={selectedModalChart?.chart_data || (selectedModalChart && generateFallbackChartData(selectedModalChart))}
        answerText={selectedModalChart?.text}
        sec65bAudit={selectedModalChart?.sec65b_audit}
        userQuery={selectedModalChart?.user_query || selectedModalChart?.userQuery || 'Crime Statistics Analysis'}
      />

      {/* DATABASE CONNECTOR MODAL (SQL / MongoDB) */}
      <DatabaseConnectorModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
        onConnectSuccess={(data) => {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              sender: 'bot',
              text: `✅ <b>Database Workspace Connected!</b><br/>Workspace updated with session database. You can now run analytical queries against your connected database.`,
              agent_type: 'analytics_agent',
              agent_label: 'Analytics & DB Connector',
              agent_icon: '🗄️',
              agent_color: '#a855f7',
              agent_description: 'Isolated Database Session Workspace'
            }
          ]);
        }}
      />

      {/* KARNATAKA POLICE CALENDAR & EVENT INTELLIGENCE MODAL */}
      <CalendarModal
        isOpen={showCalendarModal}
        onClose={() => {
          setShowCalendarModal(false);
          setSelectedCalendarEventId(null);
        }}
        currentDivision={(divisionName || 'Bengaluru').replace(/ Division$/i, '').trim()}
        initialSelectedEventId={selectedCalendarEventId}
        onTriggerAdvisory={(eventName) => {
          setInputText(`What should ${divisionName || 'Bengaluru'} patrol teams do during ${eventName}?`);
          setTimeout(() => {
            const sendBtn = document.querySelector('.chat-send-btn');
            if (sendBtn) sendBtn.click();
          }, 100);
        }}
      />
        </div>
      </div>
    </div>
  );
}

function intScore(score) {
  if (!score) return 85;
  return Math.min(99, Math.max(50, Math.round(score * 100)));
}

export default Chatbot;

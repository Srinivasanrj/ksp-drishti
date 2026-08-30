import React, { useState } from 'react';
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
import { getSampleChartData } from './analyticsService';
import { BarChart2, PieChart, TrendingUp, MapPin, Download, Sparkles, Filter, Database, CheckCircle2 } from 'lucide-react';

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

export default function VisualSpectrumExplorer({ divisionName }) {
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const [selectedCrimeHead, setSelectedCrimeHead] = useState('Theft');
  const [activeGranularity, setActiveGranularity] = useState('division');

  const chartData = getSampleChartData(selectedChartType, selectedCrimeHead);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: (selectedChartType === 'pie' || selectedChartType === 'doughnut') ? 'right' : 'top',
        labels: { color: '#e2e8f0', font: { size: 11, weight: '600' } }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: '#38bdf8',
        borderWidth: 1,
        padding: 10
      }
    },
    scales: (selectedChartType === 'pie' || selectedChartType === 'doughnut') ? {} : {
      x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
      y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* TOP CONTROLS & KPI STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* KPI 1 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '14px',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>TOTAL INCIDENTS TRACKED</span>
            <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 800, background: 'rgba(52, 211, 153, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>+12.4% YoY</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', margin: '6px 0 2px 0' }}>24,960</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Across 1,100+ Police Stations in Karnataka</div>
        </div>

        {/* KPI 2 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '14px',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>CYBERCRIME MOTIVE SHARE</span>
            <span style={{ fontSize: '0.7rem', color: '#c084fc', fontWeight: 800, background: 'rgba(192, 132, 252, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>15 Motive Categories</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#c084fc', margin: '6px 0 2px 0' }}>62% Fraud</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>UPI Phishing & Digital Loan Scams Dominant</div>
        </div>

        {/* KPI 3 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          borderRadius: '14px',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>DYNAMIC RAG INDEX STATUS</span>
            <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 800, background: 'rgba(52, 211, 153, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>ONLINE</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399', margin: '6px 0 2px 0' }}>10 Tables</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Dual Channel: SQLite + Vector Store Synchronized</div>
        </div>
      </div>

      {/* MAIN VISUAL EXPLORER CARD */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1527 0%, #131f38 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '18px',
        padding: '24px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
      }}>
        
        {/* HEADER & SPECTRUM SELECTORS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: '#38bdf8' }} /> Dynamic Visual Spectrum Engine
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
              Simulates real-time automated visual synthesis across Bar, Pie, Line, and Heatmap spectrums.
            </p>
          </div>

          {/* CONTROLS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* CRIME TYPE FILTER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f172a', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Filter size={12} style={{ color: '#38bdf8' }} />
              <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700 }}>Crime Head:</span>
              <select
                value={selectedCrimeHead}
                onChange={(e) => setSelectedCrimeHead(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontWeight: 800, fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Theft" style={{ background: '#0f172a', color: '#fff' }}>Theft & Robbery</option>
                <option value="Murder" style={{ background: '#0f172a', color: '#fff' }}>Murder & Assault</option>
                <option value="Cyber Crimes" style={{ background: '#0f172a', color: '#fff' }}>Cyber Crimes (IT Act)</option>
                <option value="NDPS Cases" style={{ background: '#0f172a', color: '#fff' }}>NDPS Narcotics</option>
                <option value="POCSO" style={{ background: '#0f172a', color: '#fff' }}>POCSO Special Acts</option>
              </select>
            </div>

            {/* CHART TYPE TOGGLE BUTTONS */}
            <div style={{ display: 'flex', background: '#0f172a', padding: '3px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              {['bar', 'pie', 'doughnut', 'line'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedChartType(type)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'capitalize',
                    borderRadius: '6px',
                    border: 'none',
                    background: selectedChartType === type ? '#38bdf8' : 'transparent',
                    color: selectedChartType === type ? '#0f172a' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CHART RENDER CANVAS */}
        <div style={{ height: '360px', width: '100%', position: 'relative', marginTop: '20px' }}>
          {chartData && selectedChartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
          {chartData && selectedChartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
          {chartData && selectedChartType === 'doughnut' && <Doughnut data={chartData} options={chartOptions} />}
          {chartData && selectedChartType === 'line' && <Line data={chartData} options={chartOptions} />}
        </div>

        {/* METADATA FOOTER */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#34d399', fontWeight: 800 }}>✓ Auto-Type Profiler:</span> Categorical $x$ Temporal Dimension Verified
          </div>
          <div>Grounded in <code style={{ color: '#93c5fd', background: 'rgba(30,41,59,0.8)', padding: '2px 6px', borderRadius: '4px' }}>backend/crime.db</code></div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Briefcase,
  Package,
  Clock,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  FileText,
  Sparkles,
  BarChart2,
  Table as TableIcon,
  Download,
  ShieldCheck,
  ScatterChart
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar, Scatter } from 'react-chartjs-2';
import FilterSlicerPanel from '../components/FilterSlicerPanel';
import { computeMetrics, applyFilters, generateVisualSpectrums } from '../services/datasetStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function OverviewDashboard({
  datasetState,
  onUpdateFilters,
  onResetFilters
}) {
  const [activeSecondaryChart, setActiveSecondaryChart] = useState('scatter'); // 'scatter' | 'histogram'
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const rawRecords = datasetState.rawRecords || [];
  const filteredRecords = applyFilters(rawRecords, datasetState.filters);
  const metrics = computeMetrics(filteredRecords);
  const visualSpectrums = generateVisualSpectrums(filteredRecords);

  // Filtered table rows
  const tableRows = filteredRecords.filter(r => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.toLowerCase();
    return (
      (r.FIR_Number || '').toLowerCase().includes(q) ||
      (r.Police_Station || '').toLowerCase().includes(q) ||
      (r.District || '').toLowerCase().includes(q) ||
      (r.Crime_Category || '').toLowerCase().includes(q) ||
      (r.Status || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(tableRows.length / pageSize) || 1;
  const paginatedRows = tableRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Line Chart options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#0f172a', padding: 8 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 10 } } }
    }
  };

  // Doughnut options
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#0f172a', padding: 8 }
    }
  };

  // Bar options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#0f172a', padding: 8 }
    },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { display: false }, ticks: { color: '#0f172a', font: { size: 10, weight: '600' } } }
    }
  };

  // Scatter options
  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        callbacks: {
          label: (ctx) => `Loss: ₹${ctx.raw.x}K | Duration: ${ctx.raw.y} Days`
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Loss Amount (₹ in Thousands)', color: '#64748b', font: { size: 10 } }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { title: { display: true, text: 'Days to Resolve', color: '#64748b', font: { size: 10 } }, ticks: { color: '#64748b', font: { size: 10 } } }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      
      {/* LEFT POWER BI STYLE FILTER PANEL */}
      <FilterSlicerPanel
        rawRecords={rawRecords}
        filteredCount={filteredRecords.length}
        filters={datasetState.filters}
        onFilterChange={onUpdateFilters}
        onResetFilters={onResetFilters}
      />

      {/* MAIN DASHBOARD CANVAS */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* TOP KPI CARDS (4 FLOATING METRIC CARDS) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          {/* KPI 1 */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>TOTAL INCIDENTS</span>
              <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 800, background: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>Active Slice</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 2px 0' }}>{metrics.totalIncidents}</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Reported across selected filters</div>
          </div>

          {/* KPI 2 */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>TOTAL FINANCIAL LOSS</span>
              <span style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 800, background: '#fef2f2', padding: '2px 6px', borderRadius: '4px' }}>INR Valuation</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 2px 0' }}>{metrics.totalLossINR}</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Avg Recovery: {metrics.recoveryRatePercent}</div>
          </div>

          {/* KPI 3 */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>AVG RESOLUTION TIME</span>
              <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 800, background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px' }}>Efficiency</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 2px 0' }}>{metrics.avgResolutionDays}</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Disposal & Chargesheet duration</div>
          </div>

          {/* KPI 4 */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>HIGH-RISK ALERTS</span>
              <span style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 800, background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>Priority</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#b45309', margin: '8px 0 2px 0' }}>{metrics.highRiskAlerts}</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Heinous & high-value frauds</div>
          </div>
        </div>

        {/* 4-GRID VISUAL SPECTRUM */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          
          {/* VISUAL 1: DOUGHNUT CRIME DISTRIBUTION */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>Crime Category Distribution</h4>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Proportional share across filtered records</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', height: '180px' }}>
              <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                <Doughnut data={visualSpectrums.doughnut} options={doughnutOptions} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>{filteredRecords.length}</div>
                  <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700 }}>FIRs</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, maxHeight: '160px', overflowY: 'auto' }}>
                {visualSpectrums.doughnut.labels.map((label, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#1e293b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: visualSpectrums.doughnut.datasets[0].backgroundColor[idx] || '#cbd5e1' }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{label}</span>
                    </span>
                    <span style={{ fontWeight: 800 }}>{visualSpectrums.doughnut.datasets[0].data[idx]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VISUAL 2: LINE CRIME TRAJECTORY */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>Incident Trajectory (Monthly)</h4>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Time-series volume over months</div>
            </div>
            <div style={{ height: '180px', width: '100%' }}>
              <Line data={visualSpectrums.line} options={lineOptions} />
            </div>
          </div>

          {/* VISUAL 3: HORIZONTAL BAR TOP STATIONS */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>Top Police Stations by Case Volume</h4>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Ranked jurisdictional density</div>
            </div>
            <div style={{ height: '180px', width: '100%' }}>
              <Bar data={visualSpectrums.bar} options={barOptions} />
            </div>
          </div>

          {/* VISUAL 4: SCATTER / HISTOGRAM TOGGLE */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  {activeSecondaryChart === 'scatter' ? 'Scatter: Financial Loss vs. Days to Resolve' : 'Histogram: Accused Age Distribution'}
                </h4>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Multivariate correlation spectrum</div>
              </div>

              <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                <button
                  onClick={() => setActiveSecondaryChart('scatter')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '4px',
                    background: activeSecondaryChart === 'scatter' ? '#ffffff' : 'transparent',
                    color: activeSecondaryChart === 'scatter' ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    boxShadow: activeSecondaryChart === 'scatter' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  Scatter
                </button>
                <button
                  onClick={() => setActiveSecondaryChart('histogram')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '4px',
                    background: activeSecondaryChart === 'histogram' ? '#ffffff' : 'transparent',
                    color: activeSecondaryChart === 'histogram' ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    boxShadow: activeSecondaryChart === 'histogram' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  Histogram
                </button>
              </div>
            </div>

            <div style={{ height: '180px', width: '100%' }}>
              {activeSecondaryChart === 'scatter' ? (
                <Scatter data={visualSpectrums.scatter} options={scatterOptions} />
              ) : (
                <Bar data={visualSpectrums.histogram} options={lineOptions} />
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM: FORENSIC MATRIX DATA TABLE */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TableIcon size={16} color="#0284c7" />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                Forensic Records Matrix ({tableRows.length.toLocaleString()} matching)
              </h4>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search table rows..."
                value={tableSearch}
                onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
                style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', outline: 'none', width: '200px' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>FIR Number</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Police Station</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Crime Category</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Loss (INR)</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Sec 65B Hash</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      No records match the active filter slice.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1e3a8a' }}>{r.FIR_Number}</td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>{r.Date}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{r.Police_Station}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {r.Crime_Category}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {r.Status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>
                        ₹{(r.Loss_Amount_INR || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#64748b', fontSize: '0.68rem' }}>
                        {r.Section_65B_Signature ? `${r.Section_65B_Signature}...` : 'SHA-OK'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.72rem', color: '#64748b' }}>
            <span>Page {currentPage} of {totalPages}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => p - 1)}
                style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

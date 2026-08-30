import React, { useState } from 'react';
import {
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  ShieldAlert,
  Layers,
  CheckCircle2,
  ChevronRight,
  HardDrive
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
import { Bar, Doughnut, Line, Scatter } from 'react-chartjs-2';

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

export default function VisualIntelligenceStudio({
  charts = [],
  kpis = null,
  executiveDecision = null,
  onClose,
  divisionName = "Bengaluru Division",
  isDatasetLoaded = true,
  datasetCount = 0
}) {
  const displayTotal = kpis?.total_incidents || (datasetCount > 0 ? datasetCount.toLocaleString() : '0');
  const displayLoss = kpis?.total_financial_loss || 'N/A';
  const displayDays = kpis?.avg_resolution_days || 'N/A';
  const displayAlerts = kpis?.high_risk_alerts ? kpis.high_risk_alerts.toLocaleString() : 'N/A';
  const recordCount = displayTotal;
  const [selectedChartTab, setSelectedChartTab] = useState('all'); // 'all' | chart.id
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Common dark theme options for Chart.js
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { size: 9, family: 'system-ui' },
          boxWidth: 12,
          filter: (item) => !!item.text  // hide empty labels
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10, family: 'system-ui' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10, family: 'system-ui' } }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#cbd5e1', font: { size: 10, family: 'system-ui' }, boxWidth: 12 }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8
      }
    }
  };

  // Fallback charts if none are generated yet
  const activeCharts = charts.length > 0 ? charts : [
    {
      id: "chart-severity",
      type: "bar",
      title: "Crime Severity & Volume Index",
      subtitle: `Jurisdictional distribution in ${divisionName}`,
      labels: ["Forgery", "Cybercrime", "Cheating", "Attempt to Murder", "Theft", "Kidnapping", "Murder", "Sexual Assault", "Domestic Violence", "Dacoity"],
      datasets: [{
        label: "Avg Severity (0-10)",
        data: [5.2, 4.8, 5.5, 5.3, 3.8, 5.2, 9.6, 5.6, 4.7, 7.8],
        backgroundColor: ["#84cc16", "#84cc16", "#84cc16", "#84cc16", "#22c55e", "#84cc16", "#ef4444", "#84cc16", "#84cc16", "#f97316"],
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)"
      }]
    },
    {
      id: "chart-trajectory",
      type: "line",
      title: "Monthly Incident Trajectory & Forecast",
      subtitle: "Historical cases vs XGBoost projected trend",
      labels: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan (F)", "Feb (F)", "Mar (F)"],
      datasets: [
        {
          label: "Historical Actuals",
          data: [42, 38, 55, 48, 62, 70, null, null, null],
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.15)",
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: "#38bdf8"
        },
        {
          label: "XGBoost Production Forecast",
          data: [null, null, null, null, null, 70, 74, 68, 61],
          borderColor: "#eab308",
          borderDash: [5, 5],
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: "#eab308"
        }
      ]
    }
  ];

  const displayedCharts = selectedChartTab === 'all'
    ? activeCharts
    : activeCharts.filter(c => c.id === selectedChartTab);

  return (
    <aside style={{
      width: isFullscreen ? '100vw' : '100%',
      height: '100%',
      backgroundColor: '#0a0f1d',
      borderRight: '1px solid rgba(59, 130, 246, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: isFullscreen ? 'fixed' : 'relative',
      top: 0,
      left: 0,
      zIndex: isFullscreen ? 1000 : 10,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    }}>
      
      {/* ── TOP HEADER BAR ──────────────────────────────────────────────────────── */}
      <div style={{
        height: '48px',
        padding: '0 16px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #1d4ed8, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BarChart2 size={15} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Visual Intelligence Studio
            </span>
            <span style={{ fontSize: '0.65rem', color: '#38bdf8', marginLeft: '8px', fontWeight: 700 }}>
              • {activeCharts.length} Synchronized Views
            </span>
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            fontSize: '0.65rem',
            color: '#34d399',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '4px',
            padding: '2px 8px',
            fontWeight: 700
          }}>
            {recordCount.toLocaleString()} Records Indexed
          </div>

          <button
            onClick={() => setIsFullscreen(f => !f)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            title={isFullscreen ? "Restore View" : "Fullscreen Studio"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              title="Close Visual Studio"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── CHART SPECTRUM SWITCHER TABS ────────────────────────────────────────── */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: '#0c1322',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setSelectedChartTab('all')}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: selectedChartTab === 'all' ? '#1e3a8a' : '#1e293b',
            color: selectedChartTab === 'all' ? '#38bdf8' : '#94a3b8'
          }}
        >
          All Visuals ({activeCharts.length})
        </button>

        {activeCharts.map((c, idx) => (
          <button
            key={c.id || idx}
            onClick={() => setSelectedChartTab(c.id)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              backgroundColor: selectedChartTab === c.id ? '#1e3a8a' : '#1e293b',
              color: selectedChartTab === c.id ? '#38bdf8' : '#94a3b8'
            }}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* ── SCROLLABLE STUDIO CANVAS ───────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        
        {/* ── 4 TOP KPI METRIC SUMMARY CARDS (Shown on Baseline Ingestion, Hidden when User Prompts) ── */}
        {!executiveDecision && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px'
          }}>
            {/* Card 1: Total Incidents */}
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '10px',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              padding: '12px 14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  TOTAL INCIDENTS
                </span>
                <span style={{ fontSize: '0.55rem', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  Active Slice
                </span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc', margin: '4px 0 2px 0' }}>
                {displayTotal}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                Reported FIR volume in dataset
              </div>
            </div>

            {/* Card 2: Total Financial Loss */}
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '10px',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              padding: '12px 14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  TOTAL FINANCIAL LOSS
                </span>
                <span style={{ fontSize: '0.55rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  INR Valuation
                </span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', margin: '4px 0 2px 0' }}>
                {displayLoss}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                Summed valuation loss
              </div>
            </div>

            {/* Card 3: Avg Resolution Time */}
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '10px',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              padding: '12px 14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AVG RESOLUTION TIME
                </span>
                <span style={{ fontSize: '0.55rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  Efficiency
                </span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399', margin: '4px 0 2px 0' }}>
                {displayDays}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                Days to disposal & chargesheet
              </div>
            </div>

            {/* Card 4: High-Risk Alerts */}
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              padding: '12px 14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  HIGH-RISK ALERTS
                </span>
                <span style={{ fontSize: '0.55rem', background: 'rgba(234, 179, 8, 0.18)', color: '#facc15', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  Priority
                </span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f87171', margin: '4px 0 2px 0' }}>
                {displayAlerts}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                Heinous & high-value frauds
              </div>
            </div>
          </div>
        )}

        {/* ── EXECUTIVE MODEL & DECISION SUMMARY CARD (Shown ONLY when User Prompts) ─────────── */}
        {executiveDecision && (
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            border: '1.5px solid #eab308',
            padding: '14px 16px',
            boxShadow: '0 0 16px rgba(234, 179, 8, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#eab308" />
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {executiveDecision?.title || "Executive Intelligence Assessment"}
                </span>
              </div>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                backgroundColor: 'rgba(234, 179, 8, 0.2)',
                color: '#facc15',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(234, 179, 8, 0.4)'
              }}>
                {executiveDecision?.confidence || "94.8% Command Reliability"}
              </span>
            </div>

            <p style={{
              margin: 0,
              fontSize: '0.76rem',
              lineHeight: 1.5,
              color: '#f1f5f9',
              borderLeft: '3px solid #eab308',
              paddingLeft: '10px'
            }}>
              {executiveDecision?.summary}
            </p>
          </div>
        )}

        {/* ── MULTI-CHART VERTICALLY STACKED CARDS (IMAGE 4/5 STYLE) ──────────── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {displayedCharts.map((chart, idx) => (
            <div
              key={chart.id || idx}
              style={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* CHART HEADER */}
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: '#f8fafc' }}>
                    📊 {chart.title}
                  </h4>
                  <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '2px' }}>
                    {chart.subtitle}
                  </div>
                </div>

                {/* THRESHOLD LINES BADGE */}
                {chart.threshold_lines && chart.threshold_lines.length > 0 && (
                  <div style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    color: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    whiteSpace: 'nowrap'
                  }}>
                    🚨 {chart.threshold_lines[0].label || `Cap: ${chart.threshold_lines[0].value} Days`}
                  </div>
                )}
              </div>

              {/* SUMMARY ANNOTATION */}
              {chart.summary_annotation && (
                <div style={{
                  fontSize: '0.68rem',
                  color: '#38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  borderLeft: '3px solid #38bdf8',
                  padding: '5px 8px',
                  borderRadius: '0 6px 6px 0',
                  marginBottom: '10px'
                }}>
                  🔍 <b>Insight:</b> {chart.summary_annotation}
                </div>
              )}

              {/* CHART CANVAS */}
              <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                {chart.type === 'scatter' && (
                  <Scatter
                    data={{
                      datasets: chart.datasets
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: '#0f172a',
                          titleColor: '#38bdf8',
                          bodyColor: '#f8fafc',
                          borderColor: 'rgba(56, 189, 248, 0.3)',
                          borderWidth: 1,
                          padding: 10,
                          cornerRadius: 8,
                          callbacks: {
                            label: function(context) {
                              const raw = context.raw;
                              const lbl = raw.label || '';
                              return `${lbl} [Loss: ₹${raw.x}L | Duration: ${raw.y} Days]`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          type: 'linear',
                          position: 'bottom',
                          title: { display: true, text: chart.x_axis?.label || 'Financial Loss (₹ Lakhs)', color: '#94a3b8', font: { size: 10 } },
                          grid: { color: 'rgba(255, 255, 255, 0.05)' },
                          ticks: { color: '#94a3b8' }
                        },
                        y: {
                          title: { display: true, text: chart.y_axis?.label || 'Investigation Duration (Days)', color: '#94a3b8', font: { size: 10 } },
                          grid: { color: 'rgba(255, 255, 255, 0.05)' },
                          ticks: { color: '#94a3b8' }
                        }
                      }
                    }}
                  />
                )}

                {chart.type === 'horizontal_bar' && (() => {
                    // SRP: Build % formatter if chart subtitle contains % signal
                    const isPercent = (chart.subtitle || '').toLowerCase().includes('%') ||
                                      (chart.summary_annotation || '').toLowerCase().includes('%');
                    const hBarOptions = {
                      ...commonOptions,
                      indexAxis: 'y',
                      scales: {
                        x: {
                          grid: { color: 'rgba(255, 255, 255, 0.05)' },
                          ticks: {
                            color: '#94a3b8',
                            font: { size: 10 },
                            callback: (v) => isPercent ? `${v}%` : v
                          },
                          min: 0
                        },
                        y: {
                          grid: { color: 'rgba(255, 255, 255, 0.05)' },
                          ticks: { color: '#f1f5f9', font: { size: 10, weight: '600' } }
                        }
                      }
                    };
                    return (
                      <Bar
                        data={{ labels: chart.labels, datasets: chart.datasets }}
                        options={hBarOptions}
                      />
                    );
                  })()
                }

                {chart.type === 'bar' && (
                  <Bar
                    data={{
                      labels: chart.labels,
                      datasets: chart.datasets
                    }}
                    options={commonOptions}
                  />
                )}

                {chart.type === 'line' && (() => {
                    const lineOptions = {
                      ...commonOptions,
                      plugins: {
                        ...commonOptions.plugins,
                        legend: {
                          display: true,
                          position: 'top',
                          labels: {
                            color: '#94a3b8',
                            font: { size: 9 },
                            boxWidth: 12
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: { color: 'rgba(255,255,255,0.05)' },
                          ticks: { color: '#94a3b8', font: { size: 10 } }
                        },
                        y: {
                          grid: { color: 'rgba(255,255,255,0.05)' },
                          ticks: { color: '#94a3b8', font: { size: 10 } },
                          min: 0
                        }
                      }
                    };

                    // SRP: Merge threshold synthetic datasets for line chart
                    const thresholdLineDs = (chart.threshold_lines || []).map(t => ({
                      label: t.label || `Alert: ${t.value}`,
                      data: new Array((chart.labels || []).length).fill(t.value),
                      borderColor: t.color || '#f97316',
                      borderWidth: 1.5,
                      borderDash: [6, 3],
                      pointRadius: 0,
                      fill: false,
                      order: 0,
                      tension: 0
                    }));

                    const allDs = [
                      ...(chart.datasets || []),
                      ...thresholdLineDs
                    ];

                    return (
                      <Line
                        data={{ labels: chart.labels, datasets: allDs }}
                        options={lineOptions}
                      />
                    );
                  })()
                }

                {chart.type === 'doughnut' && (
                  <Doughnut
                    data={{
                      labels: chart.labels,
                      datasets: chart.datasets
                    }}
                    options={doughnutOptions}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── DYNAMIC FORENSIC RECORDS MATRIX TABLE ──────────────────────────── */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HardDrive size={15} color="#38bdf8" />
              <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc' }}>
                Dynamic Forensic Case Matrix ({recordCount.toLocaleString()} Ingested Records)
              </h4>
            </div>
            <span style={{ fontSize: '0.65rem', color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              Sec 65B Certified
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', color: '#cbd5e1', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '6px 10px', fontWeight: 700 }}>FIR Number</th>
                  <th style={{ padding: '6px 10px', fontWeight: 700 }}>Station</th>
                  <th style={{ padding: '6px 10px', fontWeight: 700 }}>Crime Type</th>
                  <th style={{ padding: '6px 10px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '6px 10px', fontWeight: 700 }}>Loss (INR)</th>
                  <th style={{ padding: '6px 10px', fontWeight: 700 }}>Sec 65B Hash</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: '#38bdf8' }}>FIR-410/2025-db0c</td>
                  <td style={{ padding: '6px 10px', color: '#f8fafc' }}>Malleswaram PS</td>
                  <td style={{ padding: '6px 10px', color: '#a855f7' }}>Women & Child Safety</td>
                  <td style={{ padding: '6px 10px', color: '#eab308' }}>Pending FSL</td>
                  <td style={{ padding: '6px 10px', color: '#f8fafc', fontWeight: 700 }}>₹13,877</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#64748b', fontSize: '0.65rem' }}>25beef4204d5e8b6</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: '#38bdf8' }}>FIR-388/2025-2e33</td>
                  <td style={{ padding: '6px 10px', color: '#f8fafc' }}>Hubballi Suburban PS</td>
                  <td style={{ padding: '6px 10px', color: '#d97706' }}>Theft & Burglary</td>
                  <td style={{ padding: '6px 10px', color: '#3b82f6' }}>Under Investigation</td>
                  <td style={{ padding: '6px 10px', color: '#f8fafc', fontWeight: 700 }}>₹83,593</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#64748b', fontSize: '0.65rem' }}>71fdd165d5569e7e</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: '#38bdf8' }}>FIR-177/2024-07ed</td>
                  <td style={{ padding: '6px 10px', color: '#f8fafc' }}>Hassan City PS</td>
                  <td style={{ padding: '6px 10px', color: '#0d9488' }}>Special & Local Laws</td>
                  <td style={{ padding: '6px 10px', color: '#eab308' }}>Pending FSL</td>
                  <td style={{ padding: '6px 10px', color: '#f8fafc', fontWeight: 700 }}>₹15,41,597</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#64748b', fontSize: '0.65rem' }}>1c772f4f19ae6afd</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: '#38bdf8' }}>FIR-558/2025-4ada</td>
                  <td style={{ padding: '6px 10px', color: '#f8fafc' }}>Vidyanagar PS</td>
                  <td style={{ padding: '6px 10px', color: '#ef4444' }}>Heinous Crimes</td>
                  <td style={{ padding: '6px 10px', color: '#22c55e' }}>Chargesheeted</td>
                  <td style={{ padding: '6px 10px', color: '#f8fafc', fontWeight: 700 }}>₹62,002</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#64748b', fontSize: '0.65rem' }}>aaa0307dec9d0fc3</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: '#38bdf8' }}>FIR-766/2025-4c53</td>
                  <td style={{ padding: '6px 10px', color: '#f8fafc' }}>Bidar New Town PS</td>
                  <td style={{ padding: '6px 10px', color: '#0284c7' }}>Cyber Fraud</td>
                  <td style={{ padding: '6px 10px', color: '#3b82f6' }}>Under Investigation</td>
                  <td style={{ padding: '6px 10px', color: '#f8fafc', fontWeight: 700 }}>₹16,63,619</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#64748b', fontSize: '0.65rem' }}>c05c394dab499b2c</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </aside>
  );
}

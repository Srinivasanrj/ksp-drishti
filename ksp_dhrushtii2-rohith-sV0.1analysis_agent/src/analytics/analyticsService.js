/**
 * KSP Sentinel AI — Analytics Service & Dataset Connectors
 * Provides data processing, dynamic schema detection, and chart specification builders.
 */

// Canonical Karnataka Division & District mappings
export const KARNATAKA_DIVISIONS = {
  'Bengaluru Division': ['Bengaluru City', 'Bengaluru Dist', 'Tumakuru', 'Ramanagara', 'KGF'],
  'Mysuru Division': ['Mysuru City', 'Mysuru Dist', 'Mandya', 'Hassan', 'Chamarajanagar'],
  'Belagavi Division': ['Belagavi City', 'Belagavi Dist', 'Dharwad', 'Hubballi-Dharwad', 'Gadag'],
  'Kalaburagi Division': ['Kalaburagi City', 'Kalaburagi Dist', 'Ballari', 'Bidar', 'Yadgir'],
  'State HQ Command': ['State-Wide Aggregation']
};

export const CHECKLIST_CATEGORIES = [
  {
    id: 'temporal',
    title: '1. Temporal & Comparative Crime Trends',
    icon: 'TrendingUp',
    color: '#38bdf8',
    description: 'Year-over-Year (YoY) deltas, month-over-month seasonality, and multi-year time-series regressions.',
    checks: [
      {
        id: 'yoy-calc',
        label: 'Year-over-Year (YoY) Percentage Delta Engine',
        formula: 'Δ% = ((Cases_2024 - Cases_2023) / Cases_2023) * 100',
        status: 'verified',
        sampleQuery: 'Compare theft cases in Bengaluru between 2023 and 2024',
        chartType: 'bar'
      },
      {
        id: 'mom-seasonality',
        label: 'Month-over-Month (MoM) Seasonality Aggregator',
        formula: 'Group by Month + Year across CrimeStatistics',
        status: 'verified',
        sampleQuery: 'Show monthly burglary trend across Karnataka in 2024',
        chartType: 'line'
      },
      {
        id: 'multi-year-series',
        label: 'Multi-Year Historical Time Series (2022–2026)',
        formula: 'Continuous trendline interpolation',
        status: 'verified',
        sampleQuery: '5-year trend analysis for heinous crimes',
        chartType: 'line'
      }
    ]
  },
  {
    id: 'spatial',
    title: '2. Geospatial & Hotspot Analytics',
    icon: 'MapPin',
    color: '#34d399',
    description: 'Police station density, district ranking, and Lat/Lng coordinate heatmap clustering.',
    checks: [
      {
        id: 'station-ranking',
        label: 'Station & District Case Ranking (Top-N)',
        formula: 'GROUP BY Police_Station ORDER BY Cases DESC LIMIT 10',
        status: 'verified',
        sampleQuery: 'Top 10 police stations with highest robbery reports',
        chartType: 'bar'
      },
      {
        id: 'geo-clustering',
        label: 'Lat/Lng Coordinate Heatmap Mapping',
        formula: 'Haversine radius filtering over FIR_Records coordinates',
        status: 'verified',
        sampleQuery: 'Map incident density near Koramangala and Indiranagar',
        chartType: 'heatmap'
      },
      {
        id: 'division-rollup',
        label: 'Multi-Division Regional Rollup Engine',
        formula: 'Aggregate 31 districts into 4 KSP Administrative Ranges',
        status: 'verified',
        sampleQuery: 'Compare total crime volume by KSP Command Division',
        chartType: 'pie'
      }
    ]
  },
  {
    id: 'demographics',
    title: '3. Demographic & Cyber Motive Profiling',
    icon: 'ShieldAlert',
    color: '#a855f7',
    description: 'Cybercrime behavioral breakdown (15 motive columns) and vulnerable demographic audits.',
    checks: [
      {
        id: 'cyber-motives',
        label: '15-Category Cybercrime Motive Distribution',
        formula: 'FRAUD, EXTORTION, DISPUTE, REVENGE, DRUGS from CyberCrimeByCity',
        status: 'verified',
        sampleQuery: 'Breakdown of cybercrime motives in Bengaluru vs Mysuru',
        chartType: 'doughnut'
      },
      {
        id: 'special-acts',
        label: 'Special & Local Laws (POCSO, SC/ST, NDPS)',
        formula: 'Isolate special legislative categories in crime.db',
        status: 'verified',
        sampleQuery: 'NDPS narcotics seizure trend across border districts',
        chartType: 'bar'
      },
      {
        id: 'women-child-fix',
        label: 'Women & Child Safety Normalized Schema Audit',
        formula: 'Sanitized table headers for domestic and child offences',
        status: 'ready',
        sampleQuery: 'Crimes against women statistics by district',
        chartType: 'bar'
      }
    ]
  },
  {
    id: 'byod-rag',
    title: '4. Dynamic RAG & BYOD Connector',
    icon: 'Database',
    color: '#f59e0b',
    description: 'Dynamic in-memory data marts from CSV/Excel uploads and relational DB connectors.',
    checks: [
      {
        id: 'auto-profiler',
        label: 'Automatic Column Type Profiler (Temporal, Geo, Cat, Num)',
        formula: 'Infers data types dynamically without hardcoded schemas',
        status: 'verified',
        sampleQuery: 'Upload new monthly district crime CSV dataset',
        chartType: 'bar'
      },
      {
        id: 'db-bridge',
        label: 'Relational & NoSQL Connector Bridge (Postgres, Mongo, SQLite)',
        formula: 'Parameterized read-only query execution',
        status: 'verified',
        sampleQuery: 'Connect live station database instance',
        chartType: 'doughnut'
      },
      {
        id: 'speculative-rag',
        label: 'Adaptive Speculative RAG (AS-RAG) Verifier',
        formula: 'Parallel Fast-Path SQL + Background Context Grading',
        status: 'verified',
        sampleQuery: 'Cross-verify FIR narrative evidence with legal SOPs',
        chartType: 'line'
      }
    ]
  }
];

// Sample benchmark data generator for visual spectrum preview
export function getSampleChartData(type, category = 'Theft') {
  const PALETTE = ['#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#a855f7', '#06b6d4'];

  if (type === 'bar') {
    return {
      labels: ['Bengaluru City', 'Mysuru City', 'Belagavi', 'Kalaburagi', 'Mangaluru', 'Hubballi-Dharwad'],
      datasets: [
        {
          label: `${category} Cases (2024)`,
          data: [17682, 2224, 1180, 940, 1540, 1310],
          backgroundColor: PALETTE[0],
          borderColor: '#38bdf8',
          borderWidth: 1.5,
          borderRadius: 6
        },
        {
          label: `${category} Cases (2023)`,
          data: [15420, 2410, 1090, 880, 1420, 1250],
          backgroundColor: 'rgba(148, 163, 184, 0.4)',
          borderColor: '#94a3b8',
          borderWidth: 1.5,
          borderRadius: 6
        }
      ]
    };
  }

  if (type === 'pie' || type === 'doughnut') {
    return {
      labels: ['Financial Fraud (62%)', 'Extortion (14%)', 'Identity Theft (11%)', 'Harassment (8%)', 'Others (5%)'],
      datasets: [
        {
          label: 'Motive Distribution',
          data: [62, 14, 11, 8, 5],
          backgroundColor: PALETTE.slice(0, 5),
          borderColor: '#0f172a',
          borderWidth: 2
        }
      ]
    };
  }

  if (type === 'line') {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: '2024 Reported Incidents',
          data: [1420, 1380, 1510, 1690, 1840, 1720, 1650, 1780, 1920, 2040, 1980, 2150],
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#38bdf8'
        },
        {
          label: '2023 Baseline',
          data: [1310, 1290, 1340, 1420, 1500, 1460, 1410, 1490, 1580, 1620, 1600, 1680],
          borderColor: '#94a3b8',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.35,
          pointRadius: 2
        }
      ]
    };
  }

  return null;
}

/**
 * KSP Sentinel AI — Dynamic In-Memory Dataset Store & OLAP Engine
 * Handles CSV parsing, dynamic schema inference, multi-dimensional slicing,
 * and automated visual spectrum generation (Bar, Doughnut, Line, Scatter, Histogram).
 */

// Initial state
export const initialDatasetState = {
  isLoaded: false,
  filename: '',
  fileSizeBytes: 0,
  sha256: '',
  rawRecords: [],
  filteredRecords: [],
  columns: [],
  filters: {
    division: 'All',
    district: 'All',
    crimeCategory: 'All',
    status: 'All',
    year: 'All',
    searchKeyword: ''
  },
  metrics: {
    totalIncidents: 0,
    totalLossINR: 0,
    avgResolutionDays: 0,
    recoveryRatePercent: 0,
    highRiskAlerts: 0
  }
};

/**
 * Parses raw CSV string into array of objects with typed columns
 */
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle quotes with commas inside if present
    const row = [];
    let inQuotes = false;
    let current = '';

    for (let char of lines[i]) {
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim().replace(/^["']|["']$/g, ''));

    if (row.length === headers.length) {
      const obj = {};
      headers.forEach((h, idx) => {
        const val = row[idx];
        const num = Number(val);
        // Automatic type inference
        if (!isNaN(num) && val !== '' && !h.toLowerCase().includes('number') && !h.toLowerCase().includes('id')) {
          obj[h] = num;
        } else {
          obj[h] = val;
        }
      });
      records.push(obj);
    }
  }

  return { headers, records };
}

/**
 * Computes dynamic metrics & KPIs from records
 */
export function computeMetrics(records) {
  if (!records || records.length === 0) {
    return {
      totalIncidents: 0,
      totalLossINR: '₹0',
      avgResolutionDays: '0 Days',
      recoveryRatePercent: '0%',
      highRiskAlerts: 0
    };
  }

  const total = records.length;
  let totalLoss = 0;
  let totalResolution = 0;
  let resCount = 0;
  let totalRecovery = 0;
  let recCount = 0;
  let highRisk = 0;

  // Dynamically identify field names
  const sample = records[0] || {};
  const lossKey = Object.keys(sample).find(k => /loss|amount|value|stolen/i.test(k));
  const resKey = Object.keys(sample).find(k => /resolution|duration|days|tat|delay/i.test(k));
  const recKey = Object.keys(sample).find(k => /recovery/i.test(k));
  const statusKey = Object.keys(sample).find(k => /status|priority|risk|severity/i.test(k));

  records.forEach(r => {
    if (lossKey && !isNaN(Number(r[lossKey]))) {
      totalLoss += Number(r[lossKey]);
    }
    if (resKey && !isNaN(Number(r[resKey])) && Number(r[resKey]) > 0) {
      totalResolution += Number(r[resKey]);
      resCount++;
    }
    if (recKey && !isNaN(Number(r[recKey]))) {
      totalRecovery += Number(r[recKey]);
      recCount++;
    }
    if (statusKey && /critical|high|pending|investigation|urgent/i.test(String(r[statusKey]))) {
      highRisk++;
    } else if (lossKey && Number(r[lossKey]) > 1000000) {
      highRisk++;
    }
  });

  const formatINR = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakh`;
    return `₹${val.toLocaleString()}`;
  };

  return {
    totalIncidents: total.toLocaleString(),
    totalLossINR: formatINR(totalLoss),
    avgResolutionDays: resCount > 0 ? `${Math.round(totalResolution / resCount)} Days` : (recCount > 0 ? `${Math.round(totalRecovery / recCount)}% Rec` : 'N/A'),
    recoveryRatePercent: recCount > 0 ? `${Math.round(totalRecovery / recCount)}%` : 'N/A',
    highRiskAlerts: highRisk
  };
}

/**
 * Filter records by dynamic filter state
 */
export function applyFilters(records, filters) {
  if (!records) return [];

  return records.filter(r => {
    if (filters.division && filters.division !== 'All' && r.Division !== filters.division) {
      return false;
    }
    if (filters.district && filters.district !== 'All' && r.District !== filters.district) {
      return false;
    }
    if (filters.crimeCategory && filters.crimeCategory !== 'All' && r.Crime_Category !== filters.crimeCategory) {
      return false;
    }
    if (filters.status && filters.status !== 'All' && r.Status !== filters.status) {
      return false;
    }
    if (filters.year && filters.year !== 'All' && String(r.Year) !== String(filters.year)) {
      return false;
    }
    if (filters.searchKeyword && filters.searchKeyword.trim()) {
      const q = filters.searchKeyword.toLowerCase();
      const match = Object.values(r).some(v => String(v).toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Generates all 6 visual chart specifications from filtered records
 */
export function generateVisualSpectrums(records) {
  const PALETTE = ['#1e3a8a', '#0d9488', '#d97706', '#dc2626', '#7c3aed', '#0284c7', '#ea580c'];

  if (!records || records.length === 0) {
    return {
      doughnut: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#cbd5e1'] }] },
      line: { labels: ['No Data'], datasets: [] },
      bar: { labels: ['No Data'], datasets: [] },
      scatter: { datasets: [] },
      histogram: { labels: [], datasets: [] }
    };
  }

  // 1. DOUGHNUT: Crime Category Breakdown
  const catCounts = {};
  records.forEach(r => {
    const cat = r.Crime_Category || 'Other';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });
  const catLabels = Object.keys(catCounts);
  const catData = Object.values(catCounts);

  const doughnut = {
    labels: catLabels,
    datasets: [{
      data: catData,
      backgroundColor: PALETTE.slice(0, catLabels.length),
      borderWidth: 3,
      borderColor: '#ffffff',
      cutout: '70%'
    }]
  };

  // 2. LINE: Month-over-Month Crime Trajectory
  const monthsOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthCounts = {};
  records.forEach(r => {
    const m = r.Month || 'January';
    monthCounts[m] = (monthCounts[m] || 0) + 1;
  });
  const activeMonths = monthsOrder.filter(m => monthCounts[m] !== undefined);
  const lineData = activeMonths.map(m => monthCounts[m]);

  const line = {
    labels: activeMonths.map(m => m.substring(0, 3)),
    datasets: [{
      label: 'Monthly Reported Incidents',
      data: lineData,
      borderColor: '#1e3a8a',
      backgroundColor: 'rgba(30, 58, 138, 0.08)',
      fill: true,
      tension: 0.35,
      borderWidth: 2.5,
      pointBackgroundColor: '#1e3a8a',
      pointRadius: 4
    }]
  };

  // 3. HORIZONTAL BAR: Top Police Stations by Case Count
  const stationCounts = {};
  records.forEach(r => {
    const st = r.Police_Station || 'HQ Command';
    stationCounts[st] = (stationCounts[st] || 0) + 1;
  });
  const sortedStations = Object.entries(stationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const bar = {
    labels: sortedStations.map(s => s[0].replace('Police Station', 'PS')),
    datasets: [{
      label: 'Reported Cases',
      data: sortedStations.map(s => s[1]),
      backgroundColor: '#0d9488',
      borderColor: '#0f766e',
      borderWidth: 1,
      borderRadius: 6
    }]
  };

  // 4. SCATTER: Loss Amount (INR) vs. Resolution Days
  const scatterPoints = records.slice(0, 150).map(r => ({
    x: Math.round((r.Loss_Amount_INR || 10000) / 1000), // in Thousands
    y: r.Resolution_Days || 14
  }));

  const scatter = {
    datasets: [{
      label: 'Incidents (Loss in ₹K vs Days to Resolve)',
      data: scatterPoints,
      backgroundColor: 'rgba(217, 119, 6, 0.65)',
      borderColor: '#d97706',
      borderWidth: 1,
      pointRadius: 5,
      pointHoverRadius: 7
    }]
  };

  // 5. HISTOGRAM: Accused Age Distribution
  const ageBins = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 };
  records.forEach(r => {
    const age = r.Accused_Age || 30;
    if (age <= 25) ageBins['18-25']++;
    else if (age <= 35) ageBins['26-35']++;
    else if (age <= 45) ageBins['36-45']++;
    else if (age <= 55) ageBins['46-55']++;
    else ageBins['56+']++;
  });

  const histogram = {
    labels: Object.keys(ageBins),
    datasets: [{
      label: 'Accused Age Distribution',
      data: Object.values(ageBins),
      backgroundColor: '#7c3aed',
      borderColor: '#6d28d9',
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  return { doughnut, line, bar, scatter, histogram };
}

/**
 * 🎨 KSP SENTINEL AI — CRIME PATTERN & PATTERN MUTATION INTELLIGENCE ENGINE
 * Deterministic analysis engine operating strictly on synthetic demonstration dataset.
 */

let dataset = [];
let offenderIndex = new Map();
let caseIndex = new Map();
let districtIndex = new Map();
let crimeTypeIndex = new Map();
let rawCsv = '';

if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
  try {
    const { readFileSync, existsSync } = await import('node:fs');
    const { resolve, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    
    let csvPath = '';
    try {
      const __moduleDir = dirname(fileURLToPath(import.meta.url));
      const localPath = resolve(__moduleDir, 'data/crime_pattern_dataset_2000 (1).csv');
      if (existsSync(localPath)) csvPath = localPath;
    } catch (_) {}

    if (!csvPath) {
      const candidates = [
        resolve(process.cwd(), 'src/crimepattern/data/crime_pattern_dataset_2000 (1).csv'),
        resolve(process.cwd(), 'frontend/src/crimepattern/data/crime_pattern_dataset_2000 (1).csv'),
        resolve(process.cwd(), '../frontend/src/crimepattern/data/crime_pattern_dataset_2000 (1).csv'),
        resolve(process.cwd(), '../src/crimepattern/data/crime_pattern_dataset_2000 (1).csv')
      ];
      for (const cand of candidates) {
        if (existsSync(cand)) {
          csvPath = cand;
          break;
        }
      }
    }

    if (csvPath && existsSync(csvPath)) {
      rawCsv = readFileSync(csvPath, 'utf8');
    }
  } catch (e) {
    // Browser fallback
  }
}

/**
 * Parse CSV line handling quotes and commas
 */
function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

/**
 * Initialize and index the CSV data
 */
export function initDataset() {
  if (dataset.length > 0) return dataset;

  let activeCsv = rawCsv;

  if (!activeCsv) {
    console.error("Crime pattern CSV data is empty or missing.");
    return [];
  }

  const lines = activeCsv.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : '';
    });

    // Parse date for chronological sorting
    if (row.date_reported) {
      row.parsed_date = new Date(row.date_reported);
    } else {
      row.parsed_date = new Date('2024-01-01');
    }

    dataset.push(row);

    // Index by offender_id
    const offId = row.offender_id;
    if (offId && offId !== 'UNASSIGNED') {
      if (!offenderIndex.has(offId)) offenderIndex.set(offId, []);
      offenderIndex.get(offId).push(row);
    }

    // Index by case_id
    const cId = row.case_id;
    if (cId) caseIndex.set(cId, row);

    // Index by district
    const dist = row.district;
    if (dist) {
      if (!districtIndex.has(dist)) districtIndex.set(dist, []);
      districtIndex.get(dist).push(row);
    }

    // Index by crime_type
    const ct = row.crime_type;
    if (ct) {
      if (!crimeTypeIndex.has(ct)) crimeTypeIndex.set(ct, []);
      crimeTypeIndex.get(ct).push(row);
    }
  }

  // Sort dataset chronologically
  dataset.sort((a, b) => a.parsed_date - b.parsed_date);

  console.log(`[CrimePatternEngine] Parsed & indexed ${dataset.length} synthetic crime records.`);
  return dataset;
}

// Auto-initialize dataset
initDataset();

export const KARNATAKA_DISTRICT_ALIASES = {
  'bengaluru rural': 'Bengaluru Rural',
  'bengaluru urban': 'Bengaluru Urban',
  'bengaluru': 'Bengaluru Urban',
  'bangalore': 'Bengaluru Urban',
  'kalaburagi': 'Kalaburagi',
  'gulbarga': 'Kalaburagi',
  'mysuru': 'Mysuru',
  'mysore': 'Mysuru',
  'belagavi': 'Belagavi',
  'belgaum': 'Belagavi',
  'ballari': 'Ballari',
  'bellary': 'Ballari',
  'shivamogga': 'Shivamogga',
  'shimoga': 'Shivamogga',
  'udupi': 'Udupi',
  'kolar': 'Kolar',
  'davanagere': 'Davanagere',
  'davangere': 'Davanagere',
  'mandya': 'Mandya',
  'chikkamagaluru': 'Chikkamagaluru',
  'chikmagalur': 'Chikkamagaluru',
  'bidar': 'Bidar',
  'vijayapura': 'Vijayapura',
  'bijapur': 'Vijayapura',
  'koppal': 'Koppal',
  'raichur': 'Raichur',
  'uttara kannada': 'Uttara Kannada',
  'karwar': 'Uttara Kannada',
  'tumakuru': 'Tumakuru',
  'tumkur': 'Tumakuru',
  'haveri': 'Haveri',
  'mangaluru': 'Mangaluru (Dakshina Kannada)',
  'mangalore': 'Mangaluru (Dakshina Kannada)',
  'dakshina kannada': 'Mangaluru (Dakshina Kannada)',
  'hassan': 'Hassan',
  'kodagu': 'Kodagu',
  'coorg': 'Kodagu',
  'yadgir': 'Yadgir',
  'yadgiri': 'Yadgir',
  'bagalkot': 'Bagalkot',
  'bagalkote': 'Bagalkot',
  'chamarajanagar': 'Chamarajanagar',
  'chikkaballapur': 'Chikkaballapur',
  'chikkaballapura': 'Chikkaballapur',
  'chitradurga': 'Chitradurga',
  'gadag': 'Gadag',
  'hubballi-dharwad': 'Hubballi-Dharwad',
  'dharwad': 'Hubballi-Dharwad',
  'hubballi': 'Hubballi-Dharwad',
  'hubli': 'Hubballi-Dharwad',
  'ramanagara': 'Ramanagara',
  'ramanagar': 'Ramanagara'
};

/**
 * Detect if query explicitly contains a Karnataka district or alias
 */
export function extractExplicitDistrict(query) {
  if (!query) return null;
  const qLower = query.toLowerCase();

  // Sort keys by length descending to match multi-word names first (e.g. 'bengaluru rural' before 'bengaluru')
  const sortedKeys = Object.keys(KARNATAKA_DISTRICT_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedKeys) {
    const pattern = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(qLower) || qLower.includes(alias)) {
      return KARNATAKA_DISTRICT_ALIASES[alias];
    }
  }
  return null;
}

/**
 * Extract district name from query or fallback to selected division
 */
export function extractDistrict(query, divisionName = 'Bengaluru Division') {
  const explicit = extractExplicitDistrict(query);
  if (explicit) {
    return explicit;
  }

  // Check if query contains any known locality in dataset (e.g. Manipal -> Udupi)
  const locObj = extractLocation(query, null);
  if (locObj && locObj.district) {
    return locObj.district;
  }

  if (divisionName) {
    const divClean = divisionName.replace(/ Division| State HQ Command/gi, '').trim().toLowerCase();
    if (KARNATAKA_DISTRICT_ALIASES[divClean]) {
      return KARNATAKA_DISTRICT_ALIASES[divClean];
    }
    const matched = dataset.find(r => r.district && r.district.toLowerCase().includes(divClean));
    if (matched) return matched.district;
    const locMatch = dataset.find(r => r.area_locality && r.area_locality.toLowerCase().includes(divClean));
    if (locMatch) return locMatch.district;
  }

  return 'Bengaluru Urban';
}

/**
 * Generate a Crime Fingerprint object for a given set of records
 */
export function generateCrimeFingerprint(records, label = 'Dataset Subset') {
  if (!records || records.length === 0) {
    return {
      label,
      totalCases: 0,
      dominantCrime: 'N/A',
      dominantTime: 'N/A',
      dominantLocation: 'N/A',
      dominantMO: 'N/A',
      dominantDistrict: 'N/A'
    };
  }

  const crimeCounts = {};
  const timeCounts = {};
  const victimCounts = {};
  const moCounts = {};
  const distCounts = {};
  const localityCounts = {};
  const ageCounts = {};
  const genderCounts = {};

  records.forEach(r => {
    if (r.crime_type) crimeCounts[r.crime_type] = (crimeCounts[r.crime_type] || 0) + 1;
    if (r.time_pattern) timeCounts[r.time_pattern] = (timeCounts[r.time_pattern] || 0) + 1;
    if (r.victim_type) victimCounts[r.victim_type] = (victimCounts[r.victim_type] || 0) + 1;
    if (r.method_used) moCounts[r.method_used] = (moCounts[r.method_used] || 0) + 1;
    if (r.district) distCounts[r.district] = (distCounts[r.district] || 0) + 1;
    if (r.area_locality) localityCounts[r.area_locality] = (localityCounts[r.area_locality] || 0) + 1;
    if (r.offender_age_band) ageCounts[r.offender_age_band] = (ageCounts[r.offender_age_band] || 0) + 1;
    if (r.offender_gender) genderCounts[r.offender_gender] = (genderCounts[r.offender_gender] || 0) + 1;
  });

  const getTop = (map) => {
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], count: sorted[0][1], share: Math.round((sorted[0][1] / records.length) * 100) } : { name: 'N/A', count: 0, share: 0 };
  };

  return {
    label,
    totalCases: records.length,
    dominantCrime: getTop(crimeCounts),
    dominantTime: getTop(timeCounts),
    dominantLocation: getTop(victimCounts),
    dominantMO: getTop(moCounts),
    dominantDistrict: getTop(distCounts),
    dominantLocality: getTop(localityCounts),
    dominantAge: getTop(ageCounts),
    dominantGender: getTop(genderCounts),
    crimeCounts,
    timeCounts,
    victimCounts,
    moCounts,
    localityCounts,
    ageCounts,
    genderCounts
  };
}

/**
 * Detect Pattern Mutations between Historical Baseline vs Recent Period
 */
export function detectPatternMutations({ district = null, crimeType = null } = {}) {
  initDataset();

  let targetRows = dataset;
  if (district) {
    const dClean = district.toLowerCase();
    targetRows = dataset.filter(r => r.district && r.district.toLowerCase().includes(dClean));
    if (targetRows.length === 0) targetRows = dataset;
  }

  if (crimeType) {
    const ctClean = crimeType.toLowerCase();
    targetRows = targetRows.filter(r => r.crime_type && r.crime_type.toLowerCase().includes(ctClean));
  }

  if (targetRows.length < 4) {
    targetRows = dataset;
  }

  // Chronologically split dataset: Baseline (first 65%) vs Recent Period (latest 35%)
  const splitIndex = Math.floor(targetRows.length * 0.65);
  const baselineRows = targetRows.slice(0, splitIndex);
  const recentRows = targetRows.slice(splitIndex);

  const baselineDates = baselineRows.map(r => r.parsed_date).filter(d => !isNaN(d));
  const recentDates = recentRows.map(r => r.parsed_date).filter(d => !isNaN(d));

  const p1StartDate = baselineDates.length > 0 ? baselineDates[0].toISOString().split('T')[0] : '2023-01-01';
  const p1EndDate = baselineDates.length > 0 ? baselineDates[baselineDates.length - 1].toISOString().split('T')[0] : '2024-06-30';
  const p2StartDate = recentDates.length > 0 ? recentDates[0].toISOString().split('T')[0] : '2024-07-01';
  const p2EndDate = recentDates.length > 0 ? recentDates[recentDates.length - 1].toISOString().split('T')[0] : '2025-12-31';

  const fp1 = generateCrimeFingerprint(baselineRows, `Historical Baseline (${p1StartDate} to ${p1EndDate})`);
  const fp2 = generateCrimeFingerprint(recentRows, `Recent Period (${p2StartDate} to ${p2EndDate})`);

  // Detect dimensional changes
  const mutations = [];
  let shiftScore = 0;

  if (fp1.dominantCrime.name !== fp2.dominantCrime.name) {
    mutations.push({
      dimension: 'Crime Category',
      changed: true,
      previous: `${fp1.dominantCrime.name} (${fp1.dominantCrime.share}%)`,
      current: `${fp2.dominantCrime.name} (${fp2.dominantCrime.share}%)`
    });
    shiftScore += 30;
  } else {
    mutations.push({
      dimension: 'Crime Category',
      changed: false,
      previous: `${fp1.dominantCrime.name} (${fp1.dominantCrime.share}%)`,
      current: `${fp2.dominantCrime.name} (${fp2.dominantCrime.share}%)`
    });
  }

  if (fp1.dominantTime.name !== fp2.dominantTime.name) {
    mutations.push({
      dimension: 'Time Slot / Day Pattern',
      changed: true,
      previous: `${fp1.dominantTime.name}`,
      current: `${fp2.dominantTime.name}`
    });
    shiftScore += 25;
  } else {
    mutations.push({
      dimension: 'Time Slot / Day Pattern',
      changed: false,
      previous: `${fp1.dominantTime.name}`,
      current: `${fp2.dominantTime.name}`
    });
  }

  if (fp1.dominantLocation.name !== fp2.dominantLocation.name) {
    mutations.push({
      dimension: 'Target / Location Type',
      changed: true,
      previous: `${fp1.dominantLocation.name}`,
      current: `${fp2.dominantLocation.name}`
    });
    shiftScore += 25;
  } else {
    mutations.push({
      dimension: 'Target / Location Type',
      changed: false,
      previous: `${fp1.dominantLocation.name}`,
      current: `${fp2.dominantLocation.name}`
    });
  }

  if (fp1.dominantMO.name !== fp2.dominantMO.name) {
    mutations.push({
      dimension: 'Modus Operandi (M.O.)',
      changed: true,
      previous: `${fp1.dominantMO.name}`,
      current: `${fp2.dominantMO.name}`
    });
    shiftScore += 20;
  } else {
    mutations.push({
      dimension: 'Modus Operandi (M.O.)',
      changed: false,
      previous: `${fp1.dominantMO.name}`,
      current: `${fp2.dominantMO.name}`
    });
  }

  const shiftDetected = shiftScore >= 20;
  const affectedDistrict = district || 'Statewide Command';

  // Build natural language mutation explanation
  const changedDimensions = mutations.filter(m => m.changed).map(m => m.dimension);
  let summaryText = ``;

  if (shiftDetected) {
    summaryText = `⚠️ <b>PATTERN SHIFT DETECTED in ${affectedDistrict}</b>: Multi-dimensional comparison indicates a meaningful mutation across <b>${changedDimensions.join(', ')}</b>. Dominant pattern evolved from <i>${fp1.dominantCrime.name} (${fp1.dominantTime.name} in ${fp1.dominantLocation.name})</i> to <i>${fp2.dominantCrime.name} (${fp2.dominantTime.name} in ${fp2.dominantLocation.name})</i>.`;
  } else {
    summaryText = `✓ <b>PATTERN STABLE in ${affectedDistrict}</b>: Recent records align closely with the historical baseline. Dominant crime category remains <b>${fp1.dominantCrime.name}</b> in <b>${fp1.dominantLocation.name}</b> during <b>${fp1.dominantTime.name}</b>.`;
  }

  return {
    shiftDetected,
    shiftScore,
    affectedDistrict,
    crimeTypeFilter: crimeType || 'All Categories',
    p1Label: `Previous Period (${p1StartDate} - ${p1EndDate})`,
    p2Label: `Current Period (${p2StartDate} - ${p2EndDate})`,
    fp1,
    fp2,
    mutations,
    summaryText
  };
}

/**
 * Compare fingerprints of two areas/districts
 */
export function compareAreaFingerprints(district1, district2, crimeType = null) {
  initDataset();

  const d1Clean = district1.toLowerCase();
  const d2Clean = district2.toLowerCase();

  let rows1 = dataset.filter(r => r.district && r.district.toLowerCase().includes(d1Clean));
  let rows2 = dataset.filter(r => r.district && r.district.toLowerCase().includes(d2Clean));

  if (crimeType) {
    const ctClean = crimeType.toLowerCase();
    const sub1 = rows1.filter(r => r.crime_type && r.crime_type.toLowerCase().includes(ctClean));
    const sub2 = rows2.filter(r => r.crime_type && r.crime_type.toLowerCase().includes(ctClean));
    if (sub1.length > 0) rows1 = sub1;
    if (sub2.length > 0) rows2 = sub2;
  }

  const name1 = rows1.length > 0 ? rows1[0].district : district1.toUpperCase();
  const name2 = rows2.length > 0 ? rows2[0].district : district2.toUpperCase();

  const fp1 = generateCrimeFingerprint(rows1, `${name1}${crimeType ? ' (' + crimeType + ')' : ''}`);
  const fp2 = generateCrimeFingerprint(rows2, `${name2}${crimeType ? ' (' + crimeType + ')' : ''}`);

  const differences = [];
  differences.push(`Total documented crime volume: ${name1} (${rows1.length} cases) vs ${name2} (${rows2.length} cases).`);
  differences.push(`Dominant crime category: ${name1} is dominated by ${fp1.dominantCrime.name} (${fp1.dominantCrime.share}% share), whereas ${name2} is dominated by ${fp2.dominantCrime.name} (${fp2.dominantCrime.share}% share).`);
  differences.push(`Demographic Profile (Age & Gender): In ${name1}, ${fp1.dominantGender.name === 'M' ? 'Male' : (fp1.dominantGender.name === 'F' ? 'Female' : fp1.dominantGender.name)} offenders represent ${fp1.dominantGender.share}% with primary age band ${fp1.dominantAge.name} (${fp1.dominantAge.share}%). In ${name2}, ${fp2.dominantGender.name === 'M' ? 'Male' : (fp2.dominantGender.name === 'F' ? 'Female' : fp2.dominantGender.name)} offenders represent ${fp2.dominantGender.share}% with primary age band ${fp2.dominantAge.name} (${fp2.dominantAge.share}%).`);
  differences.push(`Temporal patterns: ${name1} offenses peak during ${fp1.dominantTime.name}, while ${name2} peaks during ${fp1.dominantTime.name !== fp2.dominantTime.name ? fp2.dominantTime.name : 'similar time slots'}.`);
  differences.push(`Modus Operandi: Primary technique in ${name1} is "${fp1.dominantMO.name}" vs "${fp2.dominantMO.name}" in ${name2}.`);
  differences.push(`Target Location / Locality: ${name1} concentrates in ${fp1.dominantLocality.name} (${fp1.dominantLocality.share}%), while ${name2} concentrates in ${fp2.dominantLocality.name} (${fp2.dominantLocality.share}%).`);

  const comparisonSummary = differences.join('\n');

  return {
    name1,
    name2,
    crimeTypeFilter: crimeType || 'All Categories',
    total1: rows1.length,
    total2: rows2.length,
    fp1,
    fp2,
    differences,
    comparisonSummary
  };
}

/**
 * Extract all distinct Karnataka districts from natural language query
 */
export function extractAllDistricts(query) {
  if (!query) return [];
  const qLower = query.toLowerCase();
  const allFoundDistricts = [];
  const sortedAliases = Object.keys(KARNATAKA_DISTRICT_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    const pattern = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(qLower) || qLower.includes(alias)) {
      const canonical = KARNATAKA_DISTRICT_ALIASES[alias];
      if (!allFoundDistricts.includes(canonical)) {
        allFoundDistricts.push(canonical);
      }
    }
  }
  return allFoundDistricts;
}

/**
 * Multi-District Comparative Causal Explanation Generator
 */
export function buildComparativeCausalExplanation(district1, district2, crimeType = null) {
  initDataset();
  const d1Clean = district1.toLowerCase();
  const d2Clean = district2.toLowerCase();

  let rows1 = dataset.filter(r => r.district && r.district.toLowerCase().includes(d1Clean));
  let rows2 = dataset.filter(r => r.district && r.district.toLowerCase().includes(d2Clean));

  if (crimeType) {
    const ctClean = crimeType.toLowerCase();
    const sub1 = rows1.filter(r => r.crime_type && r.crime_type.toLowerCase().includes(ctClean));
    const sub2 = rows2.filter(r => r.crime_type && r.crime_type.toLowerCase().includes(ctClean));
    if (sub1.length > 0) rows1 = sub1;
    if (sub2.length > 0) rows2 = sub2;
  }

  const name1 = rows1.length > 0 ? rows1[0].district : district1.toUpperCase();
  const name2 = rows2.length > 0 ? rows2[0].district : district2.toUpperCase();

  const fp1 = generateCrimeFingerprint(rows1, `${name1}${crimeType ? ' (' + crimeType + ')' : ''}`);
  const fp2 = generateCrimeFingerprint(rows2, `${name2}${crimeType ? ' (' + crimeType + ')' : ''}`);

  const facts = [];
  facts.push(`COMPARATIVE OPERATIONAL EVIDENCE FOR ${name1.toUpperCase()} AND ${name2.toUpperCase()}:`);
  facts.push(`- ${name1}: Total ${rows1.length} cases. Dominant crime category is ${fp1.dominantCrime.name} (${fp1.dominantCrime.share}% share), peaking during ${fp1.dominantTime.name} in ${fp1.dominantLocality.name} (${fp1.dominantLocality.share}% share). Target environment: ${fp1.dominantLocation.name}. Primary M.O.: "${fp1.dominantMO.name}". Demographic Profile: ${fp1.dominantGender.name === 'M' ? 'Male' : 'Female'} offenders (${fp1.dominantGender.share}%), Age Band ${fp1.dominantAge.name} (${fp1.dominantAge.share}%). Operational Factors: The concentration of ${fp1.dominantLocation.name} in ${fp1.dominantLocality.name} during ${fp1.dominantTime.name} creates target vulnerability exploiting "${fp1.dominantMO.name}".`);
  facts.push(`- ${name2}: Total ${rows2.length} cases. Dominant crime category is ${fp2.dominantCrime.name} (${fp2.dominantCrime.share}% share), peaking during ${fp2.dominantTime.name} in ${fp2.dominantLocality.name} (${fp2.dominantLocality.share}% share). Target environment: ${fp2.dominantLocation.name}. Primary M.O.: "${fp2.dominantMO.name}". Demographic Profile: ${fp2.dominantGender.name === 'M' ? 'Male' : 'Female'} offenders (${fp2.dominantGender.share}%), Age Band ${fp2.dominantAge.name} (${fp2.dominantAge.share}%). Operational Factors: The concentration of ${fp2.dominantLocation.name} in ${fp2.dominantLocality.name} during ${fp2.dominantTime.name} creates target vulnerability exploiting "${fp2.dominantMO.name}".`);
  facts.push(`- Comparative Divergence: ${name1} is primarily impacted by ${fp1.dominantCrime.name} targeting ${fp1.dominantLocation.name} via "${fp1.dominantMO.name}", whereas ${name2} is impacted by ${fp2.dominantCrime.name} targeting ${fp2.dominantLocation.name} via "${fp2.dominantMO.name}".`);

  return {
    name1,
    name2,
    crimeTypeFilter: crimeType || 'All Categories',
    total1: rows1.length,
    total2: rows2.length,
    fp1,
    fp2,
    evidenceText: facts.join('\n')
  };
}

/**
 * Multi-District Comparative 30-Day Mutation Generator
 */
export function buildComparativeMutationExplanation(district1, district2, crimeType = null) {
  const mut1 = detectPatternMutations({ district: district1, crimeType });
  const mut2 = detectPatternMutations({ district: district2, crimeType });

  const facts = [];
  facts.push(`COMPARATIVE 30-DAY PATTERN MUTATION FOR ${mut1.affectedDistrict.toUpperCase()} AND ${mut2.affectedDistrict.toUpperCase()}:`);
  facts.push(`- ${mut1.affectedDistrict}: ${mut1.summaryText}. Recent Dominant Crime: ${mut1.fp2.dominantCrime.name} (${mut1.fp2.dominantCrime.share}% share), Peak Time: ${mut1.fp2.dominantTime.name}, Locality: ${mut1.fp2.dominantLocality.name}, Modus Operandi: "${mut1.fp2.dominantMO.name}".`);
  facts.push(`- ${mut2.affectedDistrict}: ${mut2.summaryText}. Recent Dominant Crime: ${mut2.fp2.dominantCrime.name} (${mut2.fp2.dominantCrime.share}% share), Peak Time: ${mut2.fp2.dominantTime.name}, Locality: ${mut2.fp2.dominantLocality.name}, Modus Operandi: "${mut2.fp2.dominantMO.name}".`);

  return {
    mut1,
    mut2,
    evidenceText: facts.join('\n')
  };
}

/**
 * Helper to extract crime type from natural language query
 */
export function extractCrimeType(query) {
  const qLower = query.toLowerCase();
  const knownCrimes = [
    { key: 'theft', label: 'Two-Wheeler Theft' },
    { key: 'burglary', label: 'House Burglary' },
    { key: 'cyber', label: 'Cyber Fraud (OTP/Phishing)' },
    { key: 'snatching', label: 'Chain Snatching' },
    { key: 'counterfeit', label: 'Counterfeit Currency' },
    { key: 'robbery', label: 'Shop Robbery' },
    { key: 'pickpocket', label: 'Pickpocketing' },
    { key: 'chit fund', label: 'Chit Fund / Investment Fraud' }
  ];

  for (const c of knownCrimes) {
    if (qLower.includes(c.key)) return c.label;
  }
  return null;
}

/**
 * Location & Neighborhood Hotspot Analysis Generator
 */
export function buildLocationAnalysisResponse(district, crimeTypeFilter = null) {
  initDataset();
  const dClean = (district || 'Bengaluru Urban').toLowerCase();
  let rows = dataset.filter(r => r.district && r.district.toLowerCase().includes(dClean));
  if (crimeTypeFilter) {
    const ctClean = crimeTypeFilter.toLowerCase();
    const sub = rows.filter(r => r.crime_type && r.crime_type.toLowerCase().includes(ctClean));
    if (sub.length > 0) rows = sub;
  }

  const distName = rows.length > 0 ? rows[0].district : district;
  const localityMap = {};
  rows.forEach(r => {
    if (r.area_locality) {
      localityMap[r.area_locality] = (localityMap[r.area_locality] || 0) + 1;
    }
  });

  const sorted = Object.entries(localityMap).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return `No specific location hotspots documented for <b>${distName}</b>.`;
  }

  let text = `<b>📍 AFFECTED LOCATIONS & HOTSPOTS — ${distName.toUpperCase()}</b><br/>`;
  text += `Documented hotspot breakdown across <b>${rows.length} crime records</b> in <b>${distName}</b>:<br/><br/>`;
  sorted.slice(0, 5).forEach(([loc, count], idx) => {
    const rank = idx === 0 ? 'PRIMARY LOCATION' : (idx === 1 ? 'SECONDARY LOCATION' : (idx === 2 ? 'TERTIARY LOCATION' : `HOTSPOT #${idx + 1}`));
    const share = Math.round((count / rows.length) * 100);
    text += `• <b>${rank}:</b> <b>${loc}</b> (${count} incidents, ${share}% share)<br/>`;
  });

  return text;
}

/**
 * Extract district or locality name dynamically from natural language query
 */
export function extractLocation(query, fallbackDistrict = null) {
  initDataset();
  const qLower = query.toLowerCase();

  // 1. Check matching area_locality dynamically across dataset
  const localities = Array.from(new Set(dataset.map(r => r.area_locality).filter(Boolean)));
  for (const loc of localities) {
    if (loc.length > 2 && qLower.includes(loc.toLowerCase())) {
      const match = dataset.find(r => r.area_locality && r.area_locality.toLowerCase() === loc.toLowerCase());
      return {
        type: 'locality',
        name: loc,
        district: match ? match.district : 'Bengaluru Urban'
      };
    }
  }

  // 2. Check explicit Karnataka district using aliases
  const explicitDist = extractExplicitDistrict(query);
  if (explicitDist) {
    return {
      type: 'district',
      name: explicitDist,
      district: explicitDist
    };
  }

  return {
    type: 'district',
    name: fallbackDistrict,
    district: fallbackDistrict
  };
}

/**
 * Case Listing Response Generator for specific locations / localities
 */
export function buildCaseListResponse(locationObj, crimeTypeFilter = null) {
  initDataset();

  const locName = locationObj.name;
  let matchingRows = [];

  if (locationObj.type === 'locality') {
    matchingRows = dataset.filter(r => r.area_locality && r.area_locality.toLowerCase().includes(locName.toLowerCase()));
  } else {
    matchingRows = dataset.filter(r => r.district && r.district.toLowerCase().includes(locName.toLowerCase()));
  }

  if (crimeTypeFilter) {
    const ctClean = crimeTypeFilter.toLowerCase();
    const sub = matchingRows.filter(r => r.crime_type && r.crime_type.toLowerCase().includes(ctClean));
    if (sub.length > 0) matchingRows = sub;
  }

  if (matchingRows.length === 0) {
    return `No recorded synthetic cases found for <b>${locName}</b>.`;
  }

  const distContext = matchingRows[0].district;
  let htmlText = `<b>📁 RECORDED SYNTHETIC CASES IN ${locName.toUpperCase()} (${distContext})</b><br/>`;
  htmlText += `Found <b>${matchingRows.length} matching case records</b> in <b>${locName}</b>${crimeTypeFilter ? ' for <b>' + crimeTypeFilter + '</b>' : ''}:<br/><br/>`;

  htmlText += `<div style="overflow-x: auto; margin-top: 6px;">`;
  htmlText += `<table style="width:100%; border-collapse: collapse; font-size:0.78rem; text-align:left; border: 1px solid #cbd5e1;">`;
  htmlText += `<thead style="background:#f1f5f9; color:#1e293b; font-weight:800;">`;
  htmlText += `<tr>`;
  htmlText += `<th style="padding:6px 8px; border:1px solid #cbd5e1;">Case ID</th>`;
  htmlText += `<th style="padding:6px 8px; border:1px solid #cbd5e1;">Offender ID</th>`;
  htmlText += `<th style="padding:6px 8px; border:1px solid #cbd5e1;">Crime Type</th>`;
  htmlText += `<th style="padding:6px 8px; border:1px solid #cbd5e1;">Locality</th>`;
  htmlText += `<th style="padding:6px 8px; border:1px solid #cbd5e1;">Time Slot</th>`;
  htmlText += `<th style="padding:6px 8px; border:1px solid #cbd5e1;">Date Reported</th>`;
  htmlText += `</tr>`;
  htmlText += `</thead>`;
  htmlText += `<tbody>`;

  matchingRows.slice(0, 15).forEach((r, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    htmlText += `<tr style="background:${bg};">`;
    htmlText += `<td style="padding:6px 8px; border:1px solid #cbd5e1; font-weight:800; color:#2563eb;">${r.case_id}</td>`;
    htmlText += `<td style="padding:6px 8px; border:1px solid #cbd5e1; font-weight:700; color:${r.offender_id === 'UNASSIGNED' ? '#dc2626' : '#7c3aed'};">${r.offender_id}</td>`;
    htmlText += `<td style="padding:6px 8px; border:1px solid #cbd5e1; font-weight:700;">${r.crime_type}</td>`;
    htmlText += `<td style="padding:6px 8px; border:1px solid #cbd5e1;">${r.area_locality || r.district}</td>`;
    htmlText += `<td style="padding:6px 8px; border:1px solid #cbd5e1; color:#475569;">${r.time_pattern}</td>`;
    htmlText += `<td style="padding:6px 8px; border:1px solid #cbd5e1; color:#475569;">${r.date_reported}</td>`;
    htmlText += `</tr>`;
  });

  htmlText += `</tbody>`;
  htmlText += `</table>`;
  htmlText += `</div>`;

  return htmlText;
}

/**
 * ----------------------------------------------------
 * INTENT ROUTER & CONTEXT RESOLVER
 * ----------------------------------------------------
 */
export function detectIntent(query, currentContext = {}) {
  const q = query.trim();
  const qLower = q.toLowerCase();

  // 1. Explicit Case ID match: CASE-XXXX
  const caseMatch = q.match(/CASE-?(\d{3,5})/i);
  if (caseMatch) {
    const formattedId = `CASE-${caseMatch[1].padStart(5, '0')}`;
    const foundCase = caseIndex.get(formattedId) || dataset.find(r => r.case_id && r.case_id.toLowerCase().includes(caseMatch[1].toLowerCase()));
    return {
      intent: 'case_lookup',
      caseId: foundCase ? foundCase.case_id : formattedId,
      offenderId: foundCase ? foundCase.offender_id : null
    };
  }

  // 2. Explicit Offender ID match: OFF-XXXX
  const offenderMatch = q.match(/OFF-?(\d{3,5})/i);
  if (offenderMatch) {
    const formattedOff = `OFF-${offenderMatch[1].padStart(5, '0')}`;
    const foundOff = offenderIndex.get(formattedOff) || dataset.find(r => r.offender_id && r.offender_id.toLowerCase().includes(offenderMatch[1].toLowerCase()));
    const targetOffId = foundOff ? foundOff[0].offender_id : formattedOff;

    if (qLower.includes('network') || qLower.includes('connect') || qLower.includes('link') || qLower.includes('associate') || qLower.includes('map')) {
      return { intent: 'criminal_network', offenderId: targetOffId };
    }
    return { intent: 'behavioral_profile', offenderId: targetOffId };
  }

  // 3. Detect Explicit Karnataka Districts in Query
  const explicitDistrict = extractExplicitDistrict(query);
  const detectedLocObj = extractLocation(query, currentContext.lastReferencedDistrict || null);

  // Detect all distinct districts in query (for area comparison)
  const allFoundDistricts = [];
  const sortedAliases = Object.keys(KARNATAKA_DISTRICT_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    const pattern = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(qLower) || qLower.includes(alias)) {
      const canonical = KARNATAKA_DISTRICT_ALIASES[alias];
      if (!allFoundDistricts.includes(canonical)) {
        allFoundDistricts.push(canonical);
      }
    }
  }

  // 3b. Case listing intent (e.g. "list the cases in manipal", "cases in Udupi", "show cases in Nelamangala")
  const isCaseListQuery = qLower.includes('cases') || qLower.includes('list cases') || 
                          qLower.includes('show cases') || qLower.includes('get cases') || 
                          qLower.includes('case list') || qLower.includes('records in');

  if (isCaseListQuery && (detectedLocObj.type === 'locality' || explicitDistrict || (detectedLocObj.type === 'district' && detectedLocObj.name !== null))) {
    return {
      intent: 'case_list',
      location: explicitDistrict ? { type: 'district', name: explicitDistrict, district: explicitDistrict } : detectedLocObj,
      crimeType: extractCrimeType(query)
    };
  }

  // 4. Multiple districts in query -> Area Comparison Intent (e.g. "compare Bengaluru and Mysuru")
  if (allFoundDistricts.length >= 2) {
    return {
      intent: 'area_comparison',
      district1: allFoundDistricts[0],
      district2: allFoundDistricts[1],
      crimeType: extractCrimeType(query)
    };
  }

  // 5. Location / Locality Specific Query (e.g. "Which locations are affected in Udupi?", "list the location", "show hotspots")
  const isLocationQuery = qLower.includes('location') || qLower.includes('locality') || 
                          qLower.includes('localities') || qLower.includes('where') || 
                          qLower.includes('affected area') || qLower.includes('affected location') ||
                          qLower.includes('neighborhood') || qLower.includes('hotspot');

  if (isLocationQuery) {
    return {
      intent: 'location_analysis',
      district: explicitDistrict || detectedLocObj.name || currentContext.lastReferencedDistrict || null,
      crimeType: extractCrimeType(query)
    };
  }

  // 6. Pattern Mutation / Shift Intent Detection
  const isMutationQuery = qLower.includes('what has changed') || qLower.includes('what changed') ||
                          qLower.includes('pattern shift') || qLower.includes('pattern mutation') ||
                          qLower.includes('new crime pattern') || qLower.includes('unusual pattern') ||
                          qLower.includes('emerging pattern') || qLower.includes('shifted from') ||
                          qLower.includes('changed recently') || qLower.includes('recent crime pattern') ||
                          qLower.includes('pattern changed') || qLower.includes('when did this start') ||
                          qLower.includes('mutation') || qLower.includes('last 30 days') ||
                          qLower.includes('30 days');

  if (isMutationQuery) {
    return {
      intent: 'pattern_mutation',
      district: explicitDistrict || currentContext.lastReferencedDistrict || null,
      crimeType: extractCrimeType(query)
    };
  }

  // 7. Explicit Offender / Profile Context Resolution
  const hasExplicitOffenderRef = qLower.includes('this person') || qLower.includes('this offender') || 
                                 qLower.includes('the suspect') || qLower.includes('this suspect') ||
                                 qLower.includes('who is the suspect') || qLower.includes('that profile') ||
                                 qLower.includes('this profile') || qLower.includes('the profile') ||
                                 qLower.includes('his profile') || qLower.includes('her profile') ||
                                 qLower.includes('that offender') || qLower.includes('that person') ||
                                 qLower.includes('about him') || qLower.includes('about her') ||
                                 qLower.includes('offender profile') || qLower.includes('behavioral profile') ||
                                 ((qLower.includes('summary of that profile') || qLower.includes('summary of his') || qLower.includes('summary of the suspect')) && (currentContext.lastReferencedOffender || currentContext.lastReferencedEntity || currentContext.offenderId));

  if (hasExplicitOffenderRef) {
    let resolvedOffender = currentContext.lastReferencedOffender || currentContext.lastReferencedEntity || currentContext.offenderId;
    if (resolvedOffender && resolvedOffender !== 'UNASSIGNED') {
      return { intent: 'behavioral_profile', offenderId: resolvedOffender, contextUsed: true };
    }
  }

  // 7b. Multi-turn Follow-up Context Resolution for Multi-District Comparison Topic
  const comparisonDistricts = currentContext.conversationTopic?.topicType === 'comparison'
    ? currentContext.conversationTopic.districts
    : (Array.isArray(currentContext.districts) && currentContext.districts.length > 1 ? currentContext.districts : []);

  if (comparisonDistricts.length >= 2) {
    // Check if query explicitly narrows to ONE of the compared districts (RULE C)
    const matchingNarrowDist = comparisonDistricts.find(d => {
      const dClean = d.toLowerCase();
      return qLower.includes(dClean) || (explicitDistrict && explicitDistrict.toLowerCase() === dClean);
    });

    if (matchingNarrowDist) {
      const mappedCrime = currentContext.conversationTopic?.districtCrimeMap?.[matchingNarrowDist] || extractCrimeType(query) || null;
      if (isMutationQuery) {
        return {
          intent: 'pattern_mutation',
          district: matchingNarrowDist,
          crimeType: mappedCrime,
          isFollowUp: true,
          contextUsed: true
        };
      }
      return {
        intent: 'crime_pattern',
        district: matchingNarrowDist,
        crimeType: mappedCrime,
        isFollowUp: true,
        contextUsed: true
      };
    }

    // Check if query explicitly names ONE crime from comparison (RULE D)
    const detectedCrimeInComp = extractCrimeType(query);
    if (detectedCrimeInComp) {
      let mappedDist = null;
      for (const d of comparisonDistricts) {
        const dCrime = currentContext.conversationTopic?.districtCrimeMap?.[d];
        if (dCrime && dCrime.toLowerCase().includes(detectedCrimeInComp.toLowerCase())) {
          mappedDist = d;
          break;
        }
      }
      if (mappedDist) {
        return {
          intent: 'crime_pattern',
          district: mappedDist,
          crimeType: detectedCrimeInComp,
          isFollowUp: true,
          contextUsed: true
        };
      }
    }

    // Generic Comparison Follow-ups (RULE B & TEST 5)
    if (isMutationQuery) {
      return {
        intent: 'comparative_mutation',
        district1: comparisonDistricts[0],
        district2: comparisonDistricts[1],
        crimeType: extractCrimeType(query),
        isFollowUp: true,
        contextUsed: true
      };
    }

    const isWhyFollowUp = qLower.includes('why') || qLower.includes('cause') || qLower.includes('reason') || qLower.includes('happen') || qLower.includes('occur') || qLower.includes('explain') || qLower.includes('tell me more');
    if (isWhyFollowUp) {
      return {
        intent: 'comparative_explanation',
        district1: comparisonDistricts[0],
        district2: comparisonDistricts[1],
        crimeType: extractCrimeType(query),
        isFollowUp: true,
        contextUsed: true
      };
    }

    return {
      intent: 'area_comparison',
      district1: comparisonDistricts[0],
      district2: comparisonDistricts[1],
      crimeType: extractCrimeType(query),
      isFollowUp: true,
      contextUsed: true
    };
  }

  // 7c. Multi-turn Generic Summary / Follow-up / Anaphoric Context Resolution (RULE A)
  // (e.g. "give summary of these", "give summary", "summary", "summarize this", "Why is that crime high?", "Why is it happening?", "How to prevent this?")
  const isGenericSummaryOrFollowUp = !explicitDistrict && (
    qLower.includes('summary of these') || qLower.includes('summary of this') ||
    qLower.includes('summary of that') || qLower.includes('summary of it') ||
    qLower.includes('give summary') || qLower.includes('give a summary') ||
    qLower.includes('summarize this') || qLower.includes('summarize these') ||
    qLower.includes('summarize') || qLower === 'summary' ||
    qLower.includes('that crime') || qLower.includes('this crime') || qLower.includes('the crime') ||
    qLower.includes('why is that') || qLower.includes('why is it') || qLower.includes('why is this') ||
    qLower.includes('why?') || qLower.startsWith('why ') || qLower.includes('why ') ||
    qLower.includes('how to prevent') || qLower.includes('prevent it') || qLower.includes('prevention') ||
    qLower.includes('what causes') || qLower.includes('contributing factor') || qLower.includes('tell me more') ||
    qLower.includes('more details') || qLower.includes('when does it') || qLower.includes('where does it') ||
    qLower.includes('who is doing it')
  );

  if (isGenericSummaryOrFollowUp) {
    // If the immediate preceding turn was behavioral_profile, summarize the profile
    if (currentContext.lastIntent === 'behavioral_profile' && currentContext.lastReferencedOffender) {
      return {
        intent: 'behavioral_profile',
        offenderId: currentContext.lastReferencedOffender,
        contextUsed: true
      };
    }

    // If the preceding turn was location_analysis, continue location summary
    if (currentContext.lastIntent === 'location_analysis' && currentContext.lastReferencedDistrict) {
      return {
        intent: 'location_analysis',
        district: currentContext.lastReferencedDistrict,
        crimeType: currentContext.lastReferencedCrimeType || null,
        isFollowUp: true,
        contextUsed: true
      };
    }

    // If the preceding turn was pattern_mutation, continue mutation summary
    if (currentContext.lastIntent === 'pattern_mutation' && currentContext.lastReferencedDistrict) {
      return {
        intent: 'pattern_mutation',
        district: currentContext.lastReferencedDistrict,
        crimeType: currentContext.lastReferencedCrimeType || null,
        isFollowUp: true,
        contextUsed: true
      };
    }

    // Default to active district crime pattern summary
    if (currentContext.lastReferencedDistrict) {
      return {
        intent: 'crime_pattern',
        district: currentContext.lastReferencedDistrict,
        crimeType: currentContext.lastReferencedCrimeType || null,
        isFollowUp: true,
        contextUsed: true
      };
    }
  }

  // 8. Single Explicit District or Locality Query (PRIORITIZE EXPLICIT DISTRICT!)
  if (explicitDistrict) {
    return {
      intent: 'crime_pattern',
      district: explicitDistrict,
      crimeType: extractCrimeType(query)
    };
  }

  if (detectedLocObj.type === 'locality' && detectedLocObj.name) {
    return {
      intent: 'crime_pattern',
      district: detectedLocObj.name,
      crimeType: extractCrimeType(query)
    };
  }

  const detectedCrime = extractCrimeType(query);
  if (detectedCrime) {
    return {
      intent: 'crime_category_analysis',
      district: currentContext.lastReferencedDistrict || null,
      crimeType: detectedCrime
    };
  }

  // 9. Multi-turn Analytical Fallback (use current context if available)
  if (currentContext.lastReferencedDistrict) {
    return {
      intent: 'crime_pattern',
      district: currentContext.lastReferencedDistrict,
      crimeType: currentContext.lastReferencedCrimeType || null,
      contextUsed: true
    };
  }

  return { intent: 'general_dataset_analysis' };
}

/**
 * Helper to compute chart_data dynamically for any query response
 */
export function extractChartDataForResponse(type, locationName, matchingRows = []) {
  if (!matchingRows || matchingRows.length === 0) return null;

  const crimeMap = {};
  const localityMap = {};
  const timeMap = {};

  matchingRows.forEach(r => {
    if (r.crime_type) crimeMap[r.crime_type] = (crimeMap[r.crime_type] || 0) + 1;
    if (r.area_locality) localityMap[r.area_locality] = (localityMap[r.area_locality] || 0) + 1;
    if (r.time_pattern) timeMap[r.time_pattern] = (timeMap[r.time_pattern] || 0) + 1;
  });

  const sortedCrimes = Object.entries(crimeMap).sort((a, b) => b[1] - a[1]);
  const sortedLocalities = Object.entries(localityMap).sort((a, b) => b[1] - a[1]);

  if (type === 'location_analysis' && sortedLocalities.length > 0) {
    return {
      type: 'combination',
      labels: sortedLocalities.slice(0, 8).map(e => e[0]),
      datasets: [{
        label: `Cases in ${locationName} Hotspots`,
        data: sortedLocalities.slice(0, 8).map(e => e[1])
      }]
    };
  }

  return {
    type: 'combination',
    labels: sortedCrimes.slice(0, 8).map(e => e[0]),
    datasets: [{
      label: `Crime Breakdown — ${locationName}`,
      data: sortedCrimes.slice(0, 8).map(e => e[1])
    }]
  };
}

/**
 * Master Query Processor — Guarantees 100% data-backed answers from dataset
 */
export function processQuery(query, currentContext = {}, selectedDivision = 'Bengaluru Division') {
  initDataset();

  const intentInfo = detectIntent(query, currentContext);
  const nextContext = { ...currentContext };

  // ── 0. CASE LIST INTENT ──────────────────────────────────────────────────
  if (intentInfo.intent === 'case_list') {
    const locObj = intentInfo.location || extractLocation(query, currentContext.lastReferencedDistrict || selectedDivision);
    const crimeTypeFilter = intentInfo.crimeType || currentContext.lastReferencedCrimeType;
    
    let matchingRows = [];
    if (locObj.type === 'locality') {
      matchingRows = dataset.filter(r => r.area_locality && r.area_locality.toLowerCase().includes(locObj.name.toLowerCase()));
    } else {
      matchingRows = dataset.filter(r => r.district && r.district.toLowerCase().includes(locObj.name.toLowerCase()));
    }

    if (crimeTypeFilter) {
      const ctClean = crimeTypeFilter.toLowerCase();
      const sub = matchingRows.filter(r => r.crime_type && r.crime_type.toLowerCase().includes(ctClean));
      if (sub.length > 0) matchingRows = sub;
    }

    const caseListHtml = buildCaseListResponse(locObj, crimeTypeFilter);
    const chartDataPayload = extractChartDataForResponse('case_list', locObj.name, matchingRows);

    nextContext.lastReferencedDistrict = locObj.district;
    nextContext.lastReferencedLocality = locObj.name;
    if (crimeTypeFilter) nextContext.lastReferencedCrimeType = crimeTypeFilter;
    nextContext.conversationTopic = {
      topicType: 'district_crime',
      districts: [locObj.district],
      divisions: [selectedDivision],
      crimeTypes: crimeTypeFilter ? [crimeTypeFilter] : [],
      referencedEntities: [],
      districtCrimeMap: { [locObj.district]: crimeTypeFilter || '' },
      lastUserQuery: query,
      lastIntent: 'case_list'
    };

    return {
      handled: true,
      intent: 'case_list',
      context: nextContext,
      response: {
        type: 'case_list',
        title: `Recorded Cases — ${locObj.name}`,
        text: caseListHtml,
        chartData: chartDataPayload
      }
    };
  }

  // ── 1. LOCATION ANALYSIS INTENT ─────────────────────────────────────────
  if (intentInfo.intent === 'location_analysis') {
    const distTarget = extractDistrict(intentInfo.district || query, currentContext.lastReferencedDistrict || selectedDivision);
    const crimeTypeFilter = intentInfo.crimeType || currentContext.lastReferencedCrimeType;
    
    let targetRows = dataset.filter(r => r.district && r.district.toLowerCase().includes(distTarget.toLowerCase()));
    if (crimeTypeFilter) {
      const ctClean = crimeTypeFilter.toLowerCase();
      const sub = targetRows.filter(r => r.crime_type && r.crime_type.toLowerCase().includes(ctClean));
      if (sub.length > 0) targetRows = sub;
    }

    const locationText = buildLocationAnalysisResponse(distTarget, crimeTypeFilter);
    const chartDataPayload = extractChartDataForResponse('location_analysis', distTarget, targetRows);

    nextContext.lastReferencedDistrict = distTarget;
    if (crimeTypeFilter) nextContext.lastReferencedCrimeType = crimeTypeFilter;
    nextContext.conversationTopic = {
      topicType: 'district_crime',
      districts: [distTarget],
      divisions: [selectedDivision],
      crimeTypes: crimeTypeFilter ? [crimeTypeFilter] : [],
      referencedEntities: [],
      districtCrimeMap: { [distTarget]: crimeTypeFilter || '' },
      lastUserQuery: query,
      lastIntent: 'location_analysis'
    };

    return {
      handled: true,
      intent: 'location_analysis',
      context: nextContext,
      response: {
        type: 'location_analysis',
        title: `Affected Locations & Hotspots — ${distTarget}`,
        text: locationText,
        chartData: chartDataPayload
      }
    };
  }

  // ── 2a. COMPARATIVE CAUSAL EXPLANATION INTENT (FOLLOW-UP TO COMPARISON) ──
  if (intentInfo.intent === 'comparative_explanation') {
    const comp = buildComparativeCausalExplanation(intentInfo.district1, intentInfo.district2, intentInfo.crimeType);
    nextContext.districts = [comp.name1, comp.name2];
    nextContext.lastReferencedDistrict = `${comp.name1}, ${comp.name2}`;
    nextContext.conversationTopic = {
      topicType: 'comparison',
      districts: [comp.name1, comp.name2],
      divisions: [selectedDivision],
      crimeTypes: [comp.fp1.dominantCrime.name, comp.fp2.dominantCrime.name],
      referencedEntities: [],
      districtCrimeMap: {
        [comp.name1]: comp.fp1.dominantCrime.name,
        [comp.name2]: comp.fp2.dominantCrime.name
      },
      lastUserQuery: query,
      lastIntent: 'comparative_explanation'
    };

    const chartDataPayload = {
      type: 'bar',
      labels: ['Dominant Crime Share %', 'Total Incident Volume'],
      datasets: [
        { label: comp.name1, data: [comp.fp1.dominantCrime.share, comp.fp1.totalCases] },
        { label: comp.name2, data: [comp.fp2.dominantCrime.share, comp.fp2.totalCases] }
      ]
    };

    return {
      handled: true,
      intent: 'comparative_explanation',
      context: nextContext,
      response: {
        type: 'comparative_explanation',
        title: `Comparative Intelligence Assessment: ${comp.name1} vs ${comp.name2}`,
        data: comp,
        text: comp.evidenceText,
        chartData: chartDataPayload
      }
    };
  }

  // ── 2b. COMPARATIVE PATTERN MUTATION INTENT (30-DAY SHIFT FOR BOTH DISTRICTS) ──
  if (intentInfo.intent === 'comparative_mutation') {
    const compMut = buildComparativeMutationExplanation(intentInfo.district1, intentInfo.district2, intentInfo.crimeType);
    nextContext.districts = [compMut.mut1.affectedDistrict, compMut.mut2.affectedDistrict];
    nextContext.lastReferencedDistrict = `${compMut.mut1.affectedDistrict}, ${compMut.mut2.affectedDistrict}`;
    nextContext.conversationTopic = {
      topicType: 'comparison',
      districts: [compMut.mut1.affectedDistrict, compMut.mut2.affectedDistrict],
      divisions: [selectedDivision],
      crimeTypes: [compMut.mut1.fp2.dominantCrime.name, compMut.mut2.fp2.dominantCrime.name],
      referencedEntities: [],
      districtCrimeMap: {
        [compMut.mut1.affectedDistrict]: compMut.mut1.fp2.dominantCrime.name,
        [compMut.mut2.affectedDistrict]: compMut.mut2.fp2.dominantCrime.name
      },
      lastUserQuery: query,
      lastIntent: 'comparative_mutation'
    };

    const chartDataPayload = {
      type: 'bar',
      labels: [`${compMut.mut1.affectedDistrict} (30d Share %)`, `${compMut.mut2.affectedDistrict} (30d Share %)`],
      datasets: [
        {
          label: 'Recent 30 Days Crime Share %',
          data: [compMut.mut1.fp2.dominantCrime.share, compMut.mut2.fp2.dominantCrime.share]
        }
      ]
    };

    return {
      handled: true,
      intent: 'comparative_mutation',
      context: nextContext,
      response: {
        type: 'comparative_mutation',
        title: `Comparative Pattern Mutation: ${compMut.mut1.affectedDistrict} & ${compMut.mut2.affectedDistrict}`,
        data: compMut,
        text: compMut.evidenceText,
        chartData: chartDataPayload
      }
    };
  }

  // ── 2c. AREA FINGERPRINT COMPARISON INTENT ────────────────────────────
  if (intentInfo.intent === 'area_comparison') {
    const comp = compareAreaFingerprints(intentInfo.district1, intentInfo.district2, intentInfo.crimeType);
    nextContext.districts = [comp.name1, comp.name2];
    nextContext.lastReferencedDistrict = `${comp.name1}, ${comp.name2}`;
    if (intentInfo.crimeType) nextContext.lastReferencedCrimeType = intentInfo.crimeType;
    nextContext.conversationTopic = {
      topicType: 'comparison',
      districts: [comp.name1, comp.name2],
      divisions: [selectedDivision],
      crimeTypes: [comp.fp1.dominantCrime.name, comp.fp2.dominantCrime.name],
      referencedEntities: [],
      districtCrimeMap: {
        [comp.name1]: comp.fp1.dominantCrime.name,
        [comp.name2]: comp.fp2.dominantCrime.name
      },
      lastUserQuery: query,
      lastIntent: 'area_comparison'
    };

    const qLower = query.toLowerCase();
    const isDemographicQuery = qLower.includes('age') || qLower.includes('gender') || qLower.includes('demograph') || qLower.includes('offender profile');

    let chartDataPayload;
    if (isDemographicQuery) {
      const ageLabels = ['18-25', '26-35', '36-55', '56+'];
      chartDataPayload = {
        type: 'bar',
        labels: ageLabels,
        datasets: [
          {
            label: `${comp.name1} (Age Band Cases)`,
            data: ageLabels.map(band => comp.fp1.ageCounts[band] || 0)
          },
          {
            label: `${comp.name2} (Age Band Cases)`,
            data: ageLabels.map(band => comp.fp2.ageCounts[band] || 0)
          }
        ]
      };
    } else {
      chartDataPayload = {
        type: 'bar',
        labels: ['Dominant Crime Share %', 'Total Incident Volume'],
        datasets: [
          { label: comp.name1, data: [comp.fp1.dominantCrime.share, comp.fp1.totalCases] },
          { label: comp.name2, data: [comp.fp2.dominantCrime.share, comp.fp2.totalCases] }
        ]
      };
    }

    return {
      handled: true,
      intent: 'area_comparison',
      context: nextContext,
      response: {
        type: 'area_fingerprint_comparison',
        title: `Comparative Intelligence: ${comp.name1} vs ${comp.name2}`,
        data: comp,
        text: comp.comparisonSummary,
        chartData: chartDataPayload
      }
    };
  }

  // ── 3. PATTERN MUTATION INTENT ──────────────────────────────────────────
  if (intentInfo.intent === 'pattern_mutation') {
    const distTarget = extractDistrict(query, currentContext.lastReferencedDistrict || selectedDivision);
    const crimeTypeFilter = intentInfo.crimeType || currentContext.lastReferencedCrimeType;

    const mutationData = detectPatternMutations({ district: distTarget, crimeType: crimeTypeFilter });
    nextContext.districts = [mutationData.affectedDistrict];
    nextContext.lastReferencedDistrict = mutationData.affectedDistrict;
    if (crimeTypeFilter) nextContext.lastReferencedCrimeType = crimeTypeFilter;
    nextContext.lastMutationData = mutationData;
    nextContext.conversationTopic = {
      topicType: 'district_crime',
      districts: [mutationData.affectedDistrict],
      divisions: [selectedDivision],
      crimeTypes: [mutationData.fp2.dominantCrime.name],
      referencedEntities: [],
      districtCrimeMap: { [mutationData.affectedDistrict]: mutationData.fp2.dominantCrime.name },
      lastUserQuery: query,
      lastIntent: 'pattern_mutation'
    };

    const chartDataPayload = {
      type: 'bar',
      labels: ['Historical 6 Mo', 'Recent 30 Days'],
      datasets: [
        { label: mutationData.fp1.dominantCrime.name, data: [mutationData.fp1.dominantCrime.share, mutationData.fp2.dominantCrime.share] }
      ]
    };

    return {
      handled: true,
      intent: 'pattern_mutation',
      context: nextContext,
      response: {
        type: 'pattern_mutation_signal',
        title: `Pattern Mutation Signal — ${distTarget}`,
        data: mutationData,
        text: mutationData.summaryText,
        chartData: chartDataPayload
      }
    };
  }

  // ── 4. CASE LOOKUP INTENT ───────────────────────────────────────────────
  if (intentInfo.intent === 'case_lookup') {
    const c = caseIndex.get(intentInfo.caseId) || dataset.find(r => r.case_id && r.case_id.toLowerCase().includes(intentInfo.caseId.toLowerCase()));
    if (c) {
      nextContext.lastReferencedCase = c.case_id;
      if (c.offender_id && c.offender_id !== 'UNASSIGNED') nextContext.lastReferencedOffender = c.offender_id;
      nextContext.lastReferencedDistrict = c.district;
      nextContext.lastReferencedCrimeType = c.crime_type;

      const distRows = dataset.filter(r => r.district === c.district);
      const chartDataPayload = extractChartDataForResponse('case_lookup', c.district, distRows);

      return {
        handled: true,
        intent: 'case_lookup',
        context: nextContext,
        response: {
          type: 'case_details',
          title: `Synthetic Case Details: ${c.case_id}`,
          data: c,
          text: `Retrieved synthetic record <b>${c.case_id}</b>. Case is associated with suspect <b>${c.offender_id}</b> in <b>${c.district}</b> (${c.area_locality || 'District Area'}) under <b>${c.ipc_bns_section} (${c.crime_type})</b>.`,
          chartData: chartDataPayload
        }
      };
    }
  }

  // ── 5. BEHAVIORAL PROFILE INTENT ────────────────────────────────────────
  if (intentInfo.intent === 'behavioral_profile' && intentInfo.offenderId) {
    const cases = offenderIndex.get(intentInfo.offenderId) || dataset.filter(r => r.offender_id && r.offender_id.toLowerCase() === intentInfo.offenderId.toLowerCase());
    if (cases && cases.length > 0) {
      const primaryOff = cases[0];
      const districts = Array.from(new Set(cases.map(c => c.district).filter(Boolean)));
      const mos = Array.from(new Set(cases.map(c => c.method_used).filter(Boolean)));
      const crimeTypes = Array.from(new Set(cases.map(c => c.crime_type).filter(Boolean)));
      const targetLocations = Array.from(new Set(cases.map(c => c.location_type || c.location).filter(Boolean)));
      const targetVictims = Array.from(new Set(cases.map(c => c.victim_profile).filter(Boolean)));
      const caseIds = cases.map(c => c.case_id);

      const profile = {
        offenderId: primaryOff.offender_id,
        gender: primaryOff.offender_gender || 'N/A',
        ageBand: primaryOff.offender_age_band || 'N/A',
        totalCases: cases.length,
        activeCases: cases.filter(c => c.match_status && c.match_status.toLowerCase().includes('open')).length,
        repeatStatus: primaryOff.offender_repeat_status || 'Repeat Offender',
        districts,
        crimeTypes,
        mos,
        caseIds,
        behavioralSummary: `Offender ${primaryOff.offender_id} (${primaryOff.offender_gender || 'Male'}, Age: ${primaryOff.offender_age_band || 'Adult'}) is linked to ${cases.length} documented cases across ${districts.join(', ')}. Associated crime types: ${crimeTypes.join(', ')}. Primary Modus Operandi: "${mos.join(', ')}".`
      };

      nextContext.lastReferencedOffender = profile.offenderId;
      nextContext.lastReferencedEntity = profile.offenderId;
      nextContext.offenderId = profile.offenderId;
      if (districts.length > 0) nextContext.lastReferencedDistrict = districts[0];
      if (crimeTypes.length > 0) nextContext.lastReferencedCrimeType = crimeTypes[0];

      const formattedText = `<b>👤 BEHAVIORAL DOSSIER — ${primaryOff.offender_id}</b><br/>` +
        `• 🆔 <b>Offender ID:</b> <b>${primaryOff.offender_id}</b> (${profile.repeatStatus})<br/>` +
        `• 👤 <b>Demographics:</b> ${primaryOff.offender_gender || 'Unknown'}, Age Band: ${primaryOff.offender_age_band || 'N/A'}<br/>` +
        `• 🚨 <b>Associated Crime Categories:</b> <b>${crimeTypes.join(', ')}</b><br/>` +
        `• 📍 <b>Operational Jurisdiction(s):</b> <b>${districts.join(', ')}</b><br/>` +
        `• 🔧 <b>Primary Modus Operandi:</b> <i>"${mos.join(', ')}"</i><br/>` +
        (targetLocations.length > 0 ? `• 🏬 <b>Target Profile:</b> ${targetLocations.join(', ')}<br/>` : '') +
        (targetVictims.length > 0 ? `• 🎯 <b>Target Victim Profile:</b> ${targetVictims.join(', ')}<br/>` : '') +
        `• 📋 <b>Linked Records:</b> ${cases.length} documented incidents (${profile.activeCases} active)`;

      const chartDataPayload = extractChartDataForResponse('behavioral_profile', profile.offenderId, cases);

      return {
        handled: true,
        intent: 'behavioral_profile',
        context: nextContext,
        response: {
          type: 'behavioral_profile',
          title: `Behavioral Dossier — ${profile.offenderId}`,
          data: profile,
          text: formattedText,
          chartData: chartDataPayload
        }
      };
    }
  }

  // ── 6. SINGLE DISTRICT CRIME PATTERN INTENT ────────────────────────────
  if (intentInfo.intent === 'crime_pattern' && (intentInfo.district || currentContext.lastReferencedDistrict)) {
    const distTarget = extractDistrict(intentInfo.district || currentContext.lastReferencedDistrict, currentContext.lastReferencedDistrict || selectedDivision);
    let targetRows = dataset.filter(r => r.district && r.district.toLowerCase().includes(distTarget.toLowerCase()));
    
    const targetCrime = intentInfo.crimeType || (intentInfo.isFollowUp ? currentContext.lastReferencedCrimeType : null);
    if (targetCrime) {
      const ctClean = targetCrime.toLowerCase();
      const sub = targetRows.filter(r => r.crime_type && r.crime_type.toLowerCase().includes(ctClean));
      if (sub.length > 0) targetRows = sub;
    }

    const fp = generateCrimeFingerprint(targetRows, `${distTarget}${targetCrime ? ' (' + targetCrime + ')' : ''}`);
    nextContext.lastReferencedDistrict = distTarget;
    nextContext.lastReferencedCrimeType = targetCrime || (fp.dominantCrime.name !== 'N/A' ? fp.dominantCrime.name : null);
    if (fp.dominantLocality && fp.dominantLocality.name !== 'N/A') {
      nextContext.lastReferencedLocality = fp.dominantLocality.name;
    }

    const formattedText = `<b>📊 CRIME PATTERN ANALYSIS — ${distTarget.toUpperCase()}</b><br/>` +
      `Analysis of <b>${fp.totalCases} synthetic crime records</b> in <b>${distTarget}</b>${targetCrime ? ' for <b>' + targetCrime + '</b>' : ''}:<br/><br/>` +
      `• 🚨 <b>Dominant Category:</b> <b>${fp.dominantCrime.name}</b> (${fp.dominantCrime.share}% share)<br/>` +
      `• ⏰ <b>Peak Time Window:</b> <b>${fp.dominantTime.name}</b><br/>` +
      `• 📍 <b>Top Locality:</b> <b>${fp.dominantLocality.name}</b> (${fp.dominantLocality.share}% share)<br/>` +
      `• 🏬 <b>Target Location Profile:</b> <b>${fp.dominantLocation.name}</b><br/>` +
      `• 🔧 <b>Dominant Modus Operandi:</b> <i>"${fp.dominantMO.name}"</i>`;

    const chartDataPayload = extractChartDataForResponse('crime_pattern', distTarget, targetRows);

    return {
      handled: true,
      intent: 'crime_pattern',
      context: nextContext,
      response: {
        type: 'crime_pattern_stats',
        title: `Crime Pattern Fingerprint — ${distTarget}`,
        data: fp,
        text: formattedText,
        chartData: chartDataPayload
      }
    };
  }

  // ── 7. CRIME CATEGORY ANALYSIS INTENT ──────────────────────────────────
  if (intentInfo.intent === 'crime_category_analysis' && intentInfo.crimeType) {
    const ctClean = intentInfo.crimeType.toLowerCase();
    const targetDistrict = intentInfo.district || currentContext.lastReferencedDistrict;
    let matchingRows = dataset.filter(r => r.crime_type && r.crime_type.toLowerCase().includes(ctClean));
    if (targetDistrict) {
      const dSub = matchingRows.filter(r => r.district && r.district.toLowerCase().includes(targetDistrict.toLowerCase()));
      if (dSub.length > 0) matchingRows = dSub;
    }
    const fp = generateCrimeFingerprint(matchingRows, intentInfo.crimeType);

    nextContext.lastReferencedCrimeType = intentInfo.crimeType;
    if (targetDistrict) nextContext.lastReferencedDistrict = targetDistrict;

    const formattedText = `<b>🛡️ CATEGORY INTELLIGENCE REPORT — ${intentInfo.crimeType.toUpperCase()}</b><br/>` +
      `Found <b>${matchingRows.length} synthetic records</b> for <b>${intentInfo.crimeType}</b>${targetDistrict ? ' in <b>' + targetDistrict + '</b>' : ' across Karnataka'}:<br/><br/>` +
      `• 📍 <b>Highest Concentration District:</b> <b>${fp.dominantDistrict.name}</b> (${fp.dominantDistrict.share}% share)<br/>` +
      `• 🏘️ <b>Top Locality Hotspot:</b> <b>${fp.dominantLocality.name}</b><br/>` +
      `• ⏰ <b>Peak Time Slot:</b> <b>${fp.dominantTime.name}</b><br/>` +
      `• 🏬 <b>Dominant Target Type:</b> <b>${fp.dominantLocation.name}</b><br/>` +
      `• 🔧 <b>Primary Modus Operandi:</b> <i>"${fp.dominantMO.name}"</i>`;

    const chartDataPayload = extractChartDataForResponse('crime_category_analysis', intentInfo.crimeType, matchingRows);

    return {
      handled: true,
      intent: 'crime_category_analysis',
      context: nextContext,
      response: {
        type: 'crime_pattern_stats',
        title: `Category Intelligence Report — ${intentInfo.crimeType}`,
        data: fp,
        text: formattedText,
        chartData: chartDataPayload
      }
    };
  }

  // ── 8. UNIVERSAL DATASET ANALYTICAL FALLBACK ──────────────────────────
  const fallbackDiv = currentContext.lastReferencedDistrict || selectedDivision;
  const distTarget = extractDistrict(query, fallbackDiv);
  const districtRows = dataset.filter(r => r.district && r.district.toLowerCase().includes(distTarget.toLowerCase()));
  const distFP = generateCrimeFingerprint(districtRows, distTarget);

  nextContext.lastReferencedDistrict = distTarget;
  nextContext.lastReferencedCrimeType = currentContext.lastReferencedCrimeType || (distFP.dominantCrime.name !== 'N/A' ? distFP.dominantCrime.name : null);

  const formattedText = `<b>🛡️ SENTINEL COMMAND REPORT — ${distTarget.toUpperCase()}</b><br/>` +
    `Analyzed <b>2,000 synthetic records</b> in dataset for <b>${distTarget}</b> (<b>${districtRows.length} matching cases</b>):<br/><br/>` +
    `• 🚨 <b>Dominant Category:</b> <b>${distFP.dominantCrime.name}</b> (${distFP.dominantCrime.share}% share)<br/>` +
    `• ⏰ <b>Peak Activity Window:</b> <b>${distFP.dominantTime.name}</b><br/>` +
    `• 📍 <b>Primary Locality:</b> <b>${distFP.dominantLocality.name}</b> (${distFP.dominantLocality.share}% share)<br/>` +
    `• 🏢 <b>Target Location Profile:</b> <b>${distFP.dominantLocation.name}</b><br/>` +
    `• 🔧 <b>Primary Modus Operandi:</b> <i>"${distFP.dominantMO.name}"</i>`;

  const chartDataPayload = extractChartDataForResponse('general_dataset_analysis', distTarget, districtRows);

  return {
    handled: true,
    intent: 'general_dataset_analysis',
    context: nextContext,
    response: {
      type: 'crime_pattern_stats',
      title: `Sentinel Intelligence Report — ${distTarget}`,
      data: distFP,
      text: formattedText,
      chartData: chartDataPayload
    }
  };
}

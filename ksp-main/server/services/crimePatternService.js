/**
 * Crime Pattern & Intelligence Analysis Service
 * Bridges to the KSP crime dataset engine to calculate pattern metrics,
 * behavioral profiles, mutation shifts, and geographic correlations.
 */

let processQueryEngine = null;
let extractExplicitDistrictFn = null;
let extractAllDistrictsFn = null;
let extractLocationFn = null;

// Dynamically load the crime pattern engine
try {
  const engineModule = await import('../../src/crimepattern/crimePatternEngine.js');
  processQueryEngine = engineModule.processQuery;
  extractExplicitDistrictFn = engineModule.extractExplicitDistrict;
  extractAllDistrictsFn = engineModule.extractAllDistricts;
  extractLocationFn = engineModule.extractLocation;
  console.log('[CrimePatternService] Crime pattern engine loaded successfully.');
} catch (e) {
  console.error('[CrimePatternService] Failed to load crimePatternEngine:', e.message);
}

export function extractExplicitDistrict(query) {
  if (extractExplicitDistrictFn) {
    return extractExplicitDistrictFn(query);
  }
  return null;
}

export function extractAllDistricts(query) {
  if (extractAllDistrictsFn) {
    return extractAllDistrictsFn(query);
  }
  return [];
}

export function extractLocation(query, fallbackDistrict = null) {
  if (extractLocationFn) {
    return extractLocationFn(query, fallbackDistrict);
  }
  return null;
}

/**
 * Sanitize raw engine output to strip internal implementation details
 * (e.g., synthetic record counts, database terms, CSV mentions).
 */
export function sanitizeEvidence(text) {
  if (!text) return '';
  return text
    // Strip entire 'Analysis of X records in Y for Z:' header line
    .replace(/Analysis\s+of\s+(<b>[^<]*<\/b>\s*)+in\s+(<b>[^<]*<\/b>\s*)?(for\s+<b>[^<]*<\/b>\s*)?:?<br\/>/gi, '')
    // Replace synthetic mentions with intelligence/documented
    .replace(/\bsynthetic\s+case\(s\)/gi, 'documented cases')
    .replace(/\bsynthetic\s+cases?/gi, 'documented cases')
    .replace(/\bsynthetic\s+records?/gi, 'documented records')
    .replace(/\bsynthetic\s+crime\s+records?/gi, 'crime records')
    .replace(/\bsynthetic\b/gi, '')
    // Remove 'in this dataset/database/CSV'
    .replace(/\bin\s+this\s+(dataset|database|CSV|data\s+set)\b/gi, 'in intelligence records')
    .replace(/\bthe\s+(dataset|database|CSV|data\s+set)\b/gi, 'intelligence records')
    // Clean leftover markers and empty tags
    .replace(/Analysis\s+of\s+in\s+<b>[^<]*<\/b>(\s+for\s+<b>[^<]*<\/b>)?:?/gi, '')
    .replace(/<b>\s*<\/b>/g, '')
    .replace(/(<br\/>\s*){2,}/g, '<br/>')
    .trim();
}

/**
 * Strip HTML tags from evidence for clean LLM prompt inclusion
 */
export function stripHTML(s) {
  if (!s) return '';
  return s.replace(/<[^>]*>/g, '').replace(/•\s*/g, '- ').trim();
}

class CrimePatternService {
  /**
   * Analyze query against crime records
   */
  analyzeQuery(query, context = {}, division = 'Bengaluru Division') {
    if (!processQueryEngine) {
      return {
        rawEvidence: '',
        sanitizedEvidence: '',
        evidenceFacts: '',
        intent: 'general_question',
        chartData: null,
        engineResult: null
      };
    }

    try {
      const engineResult = processQueryEngine(query, context, division);
      const rawEvidence = engineResult?.response?.text || '';
      const sanitizedEvidence = sanitizeEvidence(rawEvidence);
      const evidenceFacts = stripHTML(sanitizedEvidence);
      const intent = engineResult?.intent || 'general_question';
      const chartData = engineResult?.response?.chartData || null;

      return {
        rawEvidence,
        sanitizedEvidence,
        evidenceFacts,
        intent,
        chartData,
        engineResult
      };
    } catch (err) {
      console.error('[CrimePatternService] Analysis error:', err.message);
      return {
        rawEvidence: '',
        sanitizedEvidence: '',
        evidenceFacts: '',
        intent: 'general_question',
        chartData: null,
        engineResult: null,
        error: err.message
      };
    }
  }

  /**
   * Check if an intent warrants visualization data
   */
  isChartableIntent(intent) {
    const CHARTABLE_INTENTS = [
      'crime_pattern',
      'pattern_mutation',
      'area_comparison',
      'socio_demographic',
      'crime_trend'
    ];
    return CHARTABLE_INTENTS.includes(intent);
  }
}

export const crimePatternService = new CrimePatternService();
export default crimePatternService;

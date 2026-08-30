/**
 * Conversational Memory Service for KSP Sentinel AI
 * Persistent conversational memory powered by Zoho Catalyst Data Store table:
 * Table Name: ChatMemory
 * Table ID:   54626000000092001
 * 
 * Column Mapping:
 * - SessionId        -> sessionId
 * - UserQuery        -> userQuery
 * - AssistantResponse-> assistantResponse
 * - Division         -> division
 * - District         -> district
 * - CrimeType        -> crimeType
 * - ReferencedEntity -> referencedEntity
 * - Intent           -> intent
 * - CreatedAt        -> current datetime (YYYY-MM-DD HH:mm:ss)
 */

import dotenv from 'dotenv';

dotenv.config();

const CATALYST_PROJECT_ID = process.env.CATALYST_PROJECT_ID;
const CATALYST_ORG_ID     = process.env.CATALYST_ORG_ID;
const CHAT_MEMORY_TABLE_ID = process.env.CATALYST_MEMORY_TABLE_ID || '54626000000092001';
const CHAT_MEMORY_TABLE_NAME = process.env.CATALYST_MEMORY_TABLE_NAME || 'ChatMemory';
const CATALYST_ENVIRONMENT = process.env.CATALYST_ENVIRONMENT || 'Development';

const CATALYST_CLIENT_ID = process.env.CATALYST_CLIENT_ID;
const CATALYST_CLIENT_SECRET = process.env.CATALYST_CLIENT_SECRET;
const CATALYST_DATASTORE_REFRESH_TOKEN = process.env.CATALYST_DATASTORE_REFRESH_TOKEN || process.env.CATALYST_REFRESH_TOKEN;

const ZOHO_TOKEN_URL = process.env.ZOHO_ACCOUNTS_URL ? `${process.env.ZOHO_ACCOUNTS_URL}/oauth/v2/token` : 'https://accounts.zoho.in/oauth/v2/token';
const CATALYST_BASE_URL = process.env.CATALYST_BASE_URL || 'https://api.catalyst.zoho.in/baas/v1';

const TOKEN_TTL_MS = 8 * 60 * 1000; // 8-minute cycle
const SAFETY_BUFFER_MS = 30 * 1000; // 30 seconds

let cachedDsToken = null;
let dsTokenExpiresAt = 0;

/**
 * 🔒 Dedicated OAuth Token Management for Catalyst Data Store
 * Enforces an 8-minute token refresh cycle.
 */
async function getDataStoreToken(forceRefresh = false) {
  if (!forceRefresh && cachedDsToken && Date.now() < dsTokenExpiresAt - SAFETY_BUFFER_MS) {
    return cachedDsToken;
  }

  try {
    const res = await fetch(ZOHO_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        client_id:     CATALYST_CLIENT_ID,
        client_secret: CATALYST_CLIENT_SECRET,
        refresh_token: CATALYST_DATASTORE_REFRESH_TOKEN
      }).toString()
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(`OAuth Error: ${data.error}`);
    }

    cachedDsToken = data.access_token;
    const upstreamTtlMs = (data.expires_in || 480) * 1000;
    dsTokenExpiresAt = Date.now() + Math.min(upstreamTtlMs, TOKEN_TTL_MS);
    return cachedDsToken;
  } catch (err) {
    console.error('[MemoryService] Data Store token refresh warning:', err.message);
    return null;
  }
}

// Synchronized in-memory session store (keyed by sessionId)
const memoryStore = new Map();

/**
 * 1. Save a conversation turn into Catalyst Data Store ChatMemory table
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {string} params.userQuery
 * @param {string} params.assistantResponse
 * @param {string} [params.division]
 * @param {string} [params.district]
 * @param {string} [params.crimeType]
 * @param {string} [params.referencedEntity]
 * @param {string} [params.intent]
 * @param {Object} [params.conversationTopic]
 */
export async function saveConversationTurn({
  sessionId,
  userQuery,
  assistantResponse,
  division = null,
  district = null,
  crimeType = null,
  referencedEntity = null,
  intent = null,
  conversationTopic = null
}) {
  if (!sessionId) {
    throw new Error('sessionId is required to save conversation turn.');
  }

  const nowIso = new Date().toISOString();
  // Standard Catalyst datetime format: YYYY-MM-DD HH:mm:ss
  const nowFormatted = nowIso.replace('T', ' ').substring(0, 19);

  // Exact column mapping for ChatMemory table (guaranteed non-null string values)
  const catalystRow = {
    SessionId: String(sessionId || ''),
    UserQuery: String(userQuery || ''),
    AssistantResponse: String(assistantResponse || ''),
    Division: String(division || ''),
    District: String(district || ''),
    CrimeType: String(crimeType || ''),
    ReferencedEntity: String(referencedEntity || ''),
    Intent: String(intent || ''),
    CreatedAt: nowFormatted
  };

  const normalizedTurn = {
    sessionId: String(sessionId),
    userQuery: userQuery || '',
    assistantResponse: assistantResponse || '',
    division: division || null,
    district: district || null,
    crimeType: crimeType || null,
    referencedEntity: referencedEntity || null,
    intent: intent || null,
    conversationTopic: conversationTopic || null,
    createdAt: nowIso
  };

  // 1. Maintain local synchronized store for fast access
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(sessionId, []);
  }
  const sessionTurns = memoryStore.get(sessionId);
  sessionTurns.push(normalizedTurn);

  // 2. Persist to Catalyst Data Store Table (ChatMemory: 54626000000092001)
  const insertUrl = `${CATALYST_BASE_URL}/project/${CATALYST_PROJECT_ID}/table/${CHAT_MEMORY_TABLE_ID}/row`;

  try {
    const token = await getDataStoreToken();
    if (!token) {
      console.warn('[MemoryService] Catalyst INSERT skipped: No OAuth token available.');
      return normalizedTurn;
    }

    console.log(`[MemoryService] Catalyst INSERT Request:`);
    console.log(`- Method:     POST`);
    console.log(`- URL:        ${insertUrl}`);
    console.log(`- Project ID: ${CATALYST_PROJECT_ID}`);
    console.log(`- Table ID:   ${CHAT_MEMORY_TABLE_ID}`);

    const res = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'CATALYST-ORG': CATALYST_ORG_ID,
        'Environment': CATALYST_ENVIRONMENT,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([catalystRow])
    });

    const data = await res.json().catch(err => ({ parse_error: err.message }));

    if (res.ok && data.status === 'success') {
      const rowData = Array.isArray(data.data) ? data.data[0] : data.data;
      const rowId = rowData?.ROWID || data.ROWID;
      normalizedTurn.rowId = rowId;
      console.log(`[MemoryService] Saved turn to Catalyst ChatMemory table for session [${sessionId}]`);
      console.log(`- HTTP Status: ${res.status}`);
      console.log(`- ROWID:       ${rowId || 'Confirmed'}`);
    } else {
      console.warn(`[MemoryService] Catalyst INSERT failed`);
      console.warn(`- Status:   ${res.status}`);
      console.warn(`- Response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.warn(`[MemoryService] Catalyst Data Store network error: ${err.message}`);
  }

  return normalizedTurn;
}

/**
 * 2. Get conversation history for a given sessionId from Catalyst Data Store
 * @param {string} sessionId
 * @param {number} [limit=20]
 * @returns {Promise<Array<Object>>} Chronologically ordered history: oldest -> newest
 */
export async function getConversationHistory(sessionId, limit = 20) {
  if (!sessionId) return [];

  let history = [];

  // Retrieve from Catalyst Data Store via ZCQL query
  try {
    const token = await getDataStoreToken();
    if (token) {
      const queryUrl = `${CATALYST_BASE_URL}/project/${CATALYST_PROJECT_ID}/query`;
      const zcql = `SELECT * FROM ${CHAT_MEMORY_TABLE_NAME} WHERE SessionId = '${sessionId}' ORDER BY CreatedAt ASC LIMIT ${limit}`;

      const res = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'CATALYST-ORG': CATALYST_ORG_ID,
          'Environment': CATALYST_ENVIRONMENT,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: zcql })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
          history = data.data.map(item => {
            const row = item[CHAT_MEMORY_TABLE_NAME] || item;
            return {
              rowId: row.ROWID || null,
              sessionId: row.SessionId || sessionId,
              userQuery: row.UserQuery || '',
              assistantResponse: row.AssistantResponse || '',
              division: row.Division || null,
              district: row.District || null,
              crimeType: row.CrimeType || null,
              referencedEntity: row.ReferencedEntity || null,
              intent: row.Intent || null,
              createdAt: row.CreatedAt || new Date().toISOString()
            };
          });
        }
      }
    }
  } catch (err) {
    console.warn('[MemoryService] Catalyst query warning:', err.message);
  }

  // Fallback to local session store if Catalyst query returned empty or supplement cached topic
  if (memoryStore.has(sessionId)) {
    const localTurns = memoryStore.get(sessionId);
    if (history.length === 0) {
      history = [...localTurns];
    } else {
      // Merge in cached conversationTopic from memoryStore if available
      history = history.map((hTurn, idx) => {
        const localMatch = localTurns.find(lt => lt.userQuery === hTurn.userQuery || lt.rowId === hTurn.rowId);
        return {
          ...hTurn,
          conversationTopic: localMatch?.conversationTopic || null
        };
      });
    }
  }

  // Ensure strict chronological ordering: oldest -> newest
  history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return history.slice(-limit);
}

/**
 * 3. Build a compact conversational context from previous valid messages
 * @param {string} sessionId
 * @param {number} [limit=10]
 * @returns {Promise<Object>}
 */
export async function getRecentContext(sessionId, limit = 10) {
  const defaultTopic = {
    conversationIntent: 'general',
    comparedDistricts: [],
    activeDistrict: null,
    activeCrimeType: null,
    referencedEntity: null,
    topicType: 'general',
    districts: [],
    divisions: [],
    crimeTypes: [],
    referencedEntities: [],
    districtCrimeMap: {},
    lastUserQuery: '',
    lastIntent: '',
    lastValidTurn: null
  };

  if (!sessionId) {
    return {
      lastReferencedDistrict: null,
      lastReferencedDivision: null,
      lastReferencedCrimeType: null,
      lastReferencedEntity: null,
      lastIntent: null,
      conversationTopic: defaultTopic,
      recentTurns: [],
      formattedHistory: []
    };
  }

  const history = await getConversationHistory(sessionId, limit);

  // Invalid intents that must NEVER update or corrupt active conversational context
  const INVALID_CONTEXT_INTENTS = new Set([
    'security_block',
    'out_of_scope',
    'invalid_input'
  ]);

  let lastReferencedDistrict = null;
  let lastReferencedDivision = null;
  let lastReferencedCrimeType = null;
  let lastReferencedEntity = null;
  let lastIntent = null;
  let resolvedTopic = null;

  // Traverse history in reverse (newest first) to find most recent VALID context values and topic
  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i];

    // Skip security_block and out_of_scope turns from context reconstruction
    if (INVALID_CONTEXT_INTENTS.has(turn.intent)) {
      console.log(`[Context] Ignored blocked/out-of-scope turn: "${turn.userQuery?.substring(0, 50)}" (intent: ${turn.intent})`);
      continue;
    }

    if (!resolvedTopic) {
      if (turn.conversationTopic && typeof turn.conversationTopic === 'object') {
        const top = turn.conversationTopic;
        resolvedTopic = {
          conversationIntent: top.conversationIntent || top.lastIntent || turn.intent || 'general',
          comparedDistricts: Array.isArray(top.comparedDistricts)
            ? [...top.comparedDistricts]
            : (top.topicType === 'comparison' ? [...(top.districts || [])] : []),
          activeDistrict: top.activeDistrict || (top.topicType !== 'comparison' && top.districts?.length === 1 ? top.districts[0] : null),
          activeCrimeType: top.activeCrimeType || top.crimeTypes?.[0] || turn.crimeType || null,
          referencedEntity: top.referencedEntity || turn.referencedEntity || null,
          topicType: top.topicType || 'general',
          districts: Array.isArray(top.districts) ? [...top.districts] : [],
          divisions: Array.isArray(top.divisions) ? [...top.divisions] : [],
          crimeTypes: Array.isArray(top.crimeTypes) ? [...top.crimeTypes] : [],
          referencedEntities: Array.isArray(top.referencedEntities) ? [...top.referencedEntities] : [],
          districtCrimeMap: top.districtCrimeMap || {},
          lastUserQuery: top.lastUserQuery || turn.userQuery || '',
          lastIntent: top.lastIntent || turn.intent || '',
          lastValidTurn: {
            userQuery: turn.userQuery,
            intent: turn.intent,
            district: turn.district,
            crimeType: turn.crimeType,
            createdAt: turn.createdAt
          }
        };
      } else {
        // Derive structured topic from valid turn data
        const rawDistricts = turn.district
          ? turn.district.split(/,\s*|\s+vs\s+|\s+and\s+/i).map(d => d.trim()).filter(Boolean)
          : [];
        const rawCrimes = turn.crimeType
          ? turn.crimeType.split(/,\s*/).map(c => c.trim()).filter(Boolean)
          : [];
        const rawDivisions = turn.division
          ? turn.division.split(/,\s*|\s+vs\s+|\s+and\s+/i).map(d => d.trim()).filter(Boolean)
          : [];
        const rawEntities = turn.referencedEntity ? [turn.referencedEntity] : [];

        const isComp = turn.intent === 'area_comparison' || turn.intent === 'comparative_explanation' || turn.intent === 'comparative_mutation' || rawDistricts.length > 1;

        resolvedTopic = {
          conversationIntent: turn.intent || (isComp ? 'area_comparison' : 'district_crime'),
          comparedDistricts: isComp ? rawDistricts : [],
          activeDistrict: !isComp && rawDistricts.length === 1 ? rawDistricts[0] : null,
          activeCrimeType: rawCrimes.length > 0 ? rawCrimes[0] : null,
          referencedEntity: rawEntities.length > 0 ? rawEntities[0] : null,
          topicType: isComp ? 'comparison' : (rawDistricts.length > 0 ? 'district_crime' : (rawCrimes.length > 0 ? 'crime' : 'general')),
          districts: rawDistricts,
          divisions: rawDivisions,
          crimeTypes: rawCrimes,
          referencedEntities: rawEntities,
          districtCrimeMap: {},
          lastUserQuery: turn.userQuery || '',
          lastIntent: turn.intent || (isComp ? 'area_comparison' : ''),
          lastValidTurn: {
            userQuery: turn.userQuery,
            intent: turn.intent,
            district: turn.district,
            crimeType: turn.crimeType,
            createdAt: turn.createdAt
          }
        };
      }
    }

    if (!lastReferencedDistrict && turn.district) {
      lastReferencedDistrict = turn.district;
    }
    if (!lastReferencedDivision && turn.division) {
      lastReferencedDivision = turn.division;
    }
    if (!lastReferencedCrimeType && turn.crimeType) {
      lastReferencedCrimeType = turn.crimeType;
    }
    if (!lastReferencedEntity && turn.referencedEntity) {
      lastReferencedEntity = turn.referencedEntity;
    }
    if (!lastIntent && turn.intent) {
      lastIntent = turn.intent;
    }
  }

  const finalTopic = resolvedTopic || defaultTopic;

  // Format turns into LLM message array
  const formattedHistory = [];
  history.forEach(turn => {
    if (turn.userQuery) {
      formattedHistory.push({ role: 'user', content: turn.userQuery });
    }
    if (turn.assistantResponse) {
      formattedHistory.push({
        role: 'assistant',
        content: turn.assistantResponse.replace(/<[^>]+>/g, '').trim()
      });
    }
  });

  return {
    lastReferencedDistrict,
    lastReferencedDivision,
    lastReferencedCrimeType,
    lastReferencedEntity,
    lastIntent,
    conversationTopic: finalTopic,
    recentTurns: history,
    formattedHistory: formattedHistory.slice(-(limit * 2))
  };
}

/**
 * 4. Delete only the memory rows belonging to that SessionId from Catalyst Data Store
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
export async function clearConversationMemory(sessionId) {
  if (!sessionId) return false;

  let clearedFromCatalyst = false;

  // 1. Clear from local session store
  memoryStore.delete(sessionId);

  // 2. Delete rows belonging to sessionId from Catalyst Data Store
  try {
    const token = await getDataStoreToken();
    if (token) {
      const queryUrl = `${CATALYST_BASE_URL}/project/${CATALYST_PROJECT_ID}/query`;
      const zcql = `SELECT ROWID FROM ${CHAT_MEMORY_TABLE_NAME} WHERE SessionId = '${sessionId}'`;

      const res = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'CATALYST-ORG': CATALYST_ORG_ID,
          'Environment': CATALYST_ENVIRONMENT,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: zcql })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
          const rowIds = data.data
            .map(item => item[CHAT_MEMORY_TABLE_NAME]?.ROWID || item.ROWID)
            .filter(Boolean);

          if (rowIds.length > 0) {
            const deleteUrl = `${CATALYST_BASE_URL}/project/${CATALYST_PROJECT_ID}/table/${CHAT_MEMORY_TABLE_ID}/row?ids=${rowIds.join(',')}`;
            const delRes = await fetch(deleteUrl, {
              method: 'DELETE',
              headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'CATALYST-ORG': CATALYST_ORG_ID,
                'Environment': CATALYST_ENVIRONMENT
              }
            });
            if (delRes.ok) {
              clearedFromCatalyst = true;
              console.log(`[MemoryService] Cleared ${rowIds.length} rows from Catalyst for session [${sessionId}]`);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[MemoryService] Catalyst delete warning:', err.message);
  }

  return true;
}

export const memoryService = {
  saveConversationTurn,
  getConversationHistory,
  getRecentContext,
  clearConversationMemory
};

export default memoryService;

/**
 * KSP Sentinel AI — Investigation API Client (SOLID: SRP)
 * Encapsulates HTTP communication for Phase 3 AI Agent Handoff & Session Memory.
 */

const BASE_URL = 'http://127.0.0.1:5000/api/investigation';

export const InvestigationClient = {
  /**
   * Initializes a new investigation session with the geospatial context payload.
   * @param {Object} payload { spatial_context, hotspot_metadata, sample_records }
   * @returns {Promise<Object>} { success, session_id, greeting, district, threat_level }
   */
  async initInvestigation(payload) {
    try {
      const response = await fetch(`${BASE_URL}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[InvestigationClient] Failed to init session:', error);
      return {
        success: false,
        error: error.message,
        greeting: '### ⚠️ Connection Notice\n\nUnable to reach Sentinel API server. Operating in offline tactical mode.'
      };
    }
  },

  /**
   * Sends an officer message in an active investigation session.
   * @param {string} sessionId
   * @param {string} message
   * @returns {Promise<Object>} { success, response, tool_executions }
   */
  async sendMessage(sessionId, message) {
    try {
      const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message })
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[InvestigationClient] Failed to send message:', error);
      return {
        success: false,
        error: error.message,
        response: '⚠️ Unable to process query with Sentinel AI. Please verify backend connection.'
      };
    }
  },

  /**
   * Retrieves full conversation history and context for a session.
   * @param {string} sessionId
   */
  async getSession(sessionId) {
    try {
      const response = await fetch(`${BASE_URL}/session/${sessionId}`);
      return await response.json();
    } catch (error) {
      console.error('[InvestigationClient] Failed to get session:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Lists all logged Zoho Desk priority tickets.
   */
  async getTickets() {
    try {
      const response = await fetch(`${BASE_URL}/tickets`);
      return await response.json();
    } catch (error) {
      console.error('[InvestigationClient] Failed to get tickets:', error);
      return { success: false, tickets: [] };
    }
  },

  /**
   * Fetches repeat offenders for a district from Zoho CRM.
   */
  async getSuspects(district) {
    try {
      const url = district ? `${BASE_URL}/suspects?district=${encodeURIComponent(district)}` : `${BASE_URL}/suspects`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('[InvestigationClient] Failed to get suspects:', error);
      return { success: false, suspects: [] };
    }
  }
};

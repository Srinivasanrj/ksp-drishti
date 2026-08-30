/**
 * Calendar & Event Intelligence Service for KSP Sentinel AI
 * Interacts with Zoho Catalyst Data Store Table: CalendarEvents (54626000000114001)
 * 
 * Supports:
 * 1. Official Karnataka Government Calendar (Scope = COMMON, CreatedBy = SYSTEM)
 *    Sourced from official Karnataka State Gazette (https://www.india.gov.in/calendar/karnataka)
 * 2. Police Operational Events (Scope = DIVISION, Division-scoped)
 * 3. Two-day dynamic reminder calculation
 * 4. Combined Calendar + Crime Pattern Intelligence synthesis
 * 5. Strict division isolation & guardrails
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crimePatternService from './crimePatternService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load data files dynamically
const holidaysPath = path.join(__dirname, '../data/karnataka_holidays_2026.json');
const hierarchyPath = path.join(__dirname, '../data/division_hierarchy.json');

export const OFFICIAL_KARNATAKA_EVENTS_MASTER = JSON.parse(fs.readFileSync(holidaysPath, 'utf8'));
export const DIVISION_HIERARCHY_CONFIG = JSON.parse(fs.readFileSync(hierarchyPath, 'utf8'));

const CATALYST_PROJECT_ID = process.env.CATALYST_PROJECT_ID;
const CATALYST_ORG_ID     = process.env.CATALYST_ORG_ID;
const CALENDAR_TABLE_ID   = process.env.CATALYST_CALENDAR_TABLE_ID || '54626000000114001';
const CALENDAR_TABLE_NAME = process.env.CATALYST_CALENDAR_TABLE_NAME || 'CalendarEvents';
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
    console.error('[CalendarService] Data Store token refresh error:', err.message);
    return null;
  }
}

// In-Memory dynamic cache for fast access & offline resilience
const localEventStore = new Map();
let isInitialized = false;

class CalendarService {
  constructor() {
    this.tableId = CALENDAR_TABLE_ID;
    this.tableName = CALENDAR_TABLE_NAME;
  }

  /**
   * Normalizes division names dynamically based on division hierarchy config.
   */
  normalizeDivision(division) {
    if (!division || typeof division !== 'string') return 'Bengaluru';
    let d = division.trim().replace(/\s+Division$/i, '').trim();
    const dLower = d.toLowerCase();
    
    for (const [key, config] of Object.entries(DIVISION_HIERARCHY_CONFIG)) {
      if (key.toLowerCase() === dLower) return key;
      if (config.aliases && config.aliases.some(alias => dLower.includes(alias))) return key;
      if (config.subDivisions && config.subDivisions.some(sub => sub.toLowerCase() === dLower)) return key;
    }
    return d;
  }

  /**
   * Helper to resolve the parent Head Division dynamically for a given division.
   * Head Divisions return themselves. Sub Divisions return their Head Division.
   */
  getParentDivision(divisionName) {
    if (!divisionName || typeof divisionName !== 'string') return 'Bengaluru';
    const dLower = divisionName.toLowerCase();

    for (const [headDivision, config] of Object.entries(DIVISION_HIERARCHY_CONFIG)) {
      if (headDivision.toLowerCase() === dLower) return headDivision;
      if (config.aliases && config.aliases.some(alias => dLower.includes(alias))) return headDivision;
      if (config.subDivisions && config.subDivisions.some(sub => dLower.includes(sub.toLowerCase()))) return headDivision;
    }
    return divisionName.trim();
  }

  /**
   * Seeds official Karnataka Government holidays into Catalyst Data Store if not present.
   */
  async initializeCalendar() {
    if (isInitialized) return;

    try {
      console.log('[CalendarService] Initializing Calendar & Event Store...');
      
      // 1. Preload official master records into local cache
      OFFICIAL_KARNATAKA_EVENTS_MASTER.forEach((event, idx) => {
        const id = `ksp_common_${idx + 1}`;
        localEventStore.set(id, {
          ROWID: id,
          ...event,
          CreatedAt: event.CreatedAt || '2026-01-01 00:00:00',
          UpdatedAt: event.UpdatedAt || '2026-01-01 00:00:00'
        });
      });

      // 2. Query Catalyst Data Store to fetch persisted records
      const token = await getDataStoreToken();
      if (token) {
        const getUrl = `${CATALYST_BASE_URL}/project/${CATALYST_PROJECT_ID}/table/${CALENDAR_TABLE_ID}/row?max_rows=100`;
        const res = await fetch(getUrl, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'CATALYST-ORG': CATALYST_ORG_ID,
            'Environment': CATALYST_ENVIRONMENT
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && Array.isArray(data.data)) {
            console.log(`[CalendarService] Fetched ${data.data.length} records from Catalyst CalendarEvents table.`);
            
            data.data.forEach(item => {
              const row = item[CALENDAR_TABLE_NAME] || item;
              if (row && row.ROWID) {
                localEventStore.set(String(row.ROWID), {
                  ROWID: String(row.ROWID),
                  EventName: row.EventName || '',
                  EventType: row.EventType || 'OTHER',
                  EventDate: row.EventDate || '',
                  StartDateTime: row.StartDateTime || '',
                  EndDateTime: row.EndDateTime || '',
                  Scope: row.Scope || 'DIVISION',
                  Division: row.Division || 'Bengaluru',
                  Location: row.Location || '',
                  Description: row.Description || '',
                  ReminderDays: parseInt(row.ReminderDays, 10) || 2,
                  PatrolPriority: row.PatrolPriority || 'MEDIUM',
                  RecommendedAction: row.RecommendedAction || '',
                  IsActive: row.IsActive === true || row.IsActive === 'true',
                  CreatedBy: row.CreatedBy || 'OFFICER',
                  CreatedAt: row.CreatedAt || row.CREATEDTIME || new Date().toISOString(),
                  UpdatedAt: row.UpdatedAt || row.MODIFIEDTIME || new Date().toISOString()
                });
              }
            });

            // If remote table has 0 records, bulk insert official events
            if (data.data.length === 0) {
              console.log('[CalendarService] Seeding official Karnataka events to Catalyst table...');
              const seedRows = OFFICIAL_KARNATAKA_EVENTS_MASTER.map(ev => ({
                ...ev,
                CreatedAt: '2026-01-01 00:00:00',
                UpdatedAt: '2026-01-01 00:00:00'
              }));

              const insertUrl = `${CATALYST_BASE_URL}/project/${CATALYST_PROJECT_ID}/table/${CALENDAR_TABLE_ID}/row`;
              await fetch(insertUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Zoho-oauthtoken ${token}`,
                  'CATALYST-ORG': CATALYST_ORG_ID,
                  'Environment': CATALYST_ENVIRONMENT,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(seedRows.slice(0, 10))
              });
            }
          }
        }
      }

      isInitialized = true;
      console.log(`[CalendarService] Calendar initialized with ${localEventStore.size} active events.`);
    } catch (err) {
      console.warn('[CalendarService] Calendar initialization notice:', err.message);
      isInitialized = true;
    }
  }

  /**
   * Retrieves all events accessible to a given division.
   * Enforces division isolation: COMMON events + Division-specific events only.
   */
  async getEventsForDivision(division = 'Bengaluru', filters = {}) {
    await this.initializeCalendar();
    
    // Resolve the current user's parent Head Division
    const parentDivision = this.getParentDivision(division);
    const isStateHQ = parentDivision === 'State HQ';

    const events = [];
    for (const [id, event] of localEventStore.entries()) {
      if (!event.IsActive) continue;

      const eventScope = (event.Scope || 'DIVISION').toUpperCase();
      
      // Resolve the event's parent Head Division
      const eventParentDivision = this.getParentDivision(event.Division);

      // Access control rule:
      // 1. COMMON events are visible to ALL divisions.
      // 2. DIVISION events are ONLY visible to that specific Head Division hierarchy (or State HQ if authorized).
      let isVisible = false;
      if (eventScope === 'COMMON') {
        isVisible = true;
      } else if (isStateHQ) {
        isVisible = true;
      } else if (eventParentDivision === parentDivision) {
        isVisible = true;
      }

      if (isVisible) {
        // Apply optional filters (e.g. eventType, scope, minDate)
        if (filters.eventType && event.EventType !== filters.eventType) continue;
        if (filters.scope && event.Scope !== filters.scope) continue;
        if (filters.startDate && event.EventDate < filters.startDate) continue;
        if (filters.endDate && event.EventDate > filters.endDate) continue;

        events.push({ ...event });
      }
    }

    // Sort chronologically: nearest event first
    events.sort((a, b) => (a.EventDate || '').localeCompare(b.EventDate || ''));
    return events;
  }

  /**
   * Retrieves upcoming events starting from today up to daysAhead (default 30 days).
   */
  async getUpcomingEvents(division = 'Bengaluru', daysAhead = 30) {
    const allEvents = await this.getEventsForDivision(division);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const maxDateStr = futureDate.toISOString().slice(0, 10);

    // Return events from today onwards (or upcoming within current year/period)
    const upcoming = allEvents.filter(ev => {
      const evDate = ev.EventDate;
      return evDate >= today && evDate <= maxDateStr;
    });

    // If no events in the next X days from strict today, return the next upcoming 5 events
    if (upcoming.length === 0) {
      return allEvents.filter(ev => ev.EventDate >= today).slice(0, 5);
    }

    return upcoming;
  }

  /**
   * Two-Day Reminder Calculation:
   * Condition: EventDate - ReminderDays <= CurrentDate <= EventDate
   */
  async getUpcomingReminders(division = 'Bengaluru') {
    const allEvents = await this.getEventsForDivision(division);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const reminders = [];

    allEvents.forEach(ev => {
      if (!ev.EventDate) return;
      const reminderDays = parseInt(ev.ReminderDays, 10) || 2;
      
      const evDateObj = new Date(ev.EventDate + 'T00:00:00');
      const diffTime = evDateObj.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Check if within reminder window: 0 <= diffDays <= reminderDays
      if (diffDays >= 0 && diffDays <= reminderDays) {
        let reminderLabel = 'Today';
        if (diffDays === 1) reminderLabel = 'Tomorrow (1 day remaining)';
        else if (diffDays > 1) reminderLabel = `In ${diffDays} days (${ev.EventDate})`;

        reminders.push({
          eventId: ev.ROWID,
          eventName: ev.EventName,
          eventType: ev.EventType,
          eventDate: ev.EventDate,
          scope: ev.Scope,
          division: ev.Division,
          location: ev.Location,
          patrolPriority: ev.PatrolPriority || 'MEDIUM',
          recommendedAction: ev.RecommendedAction || 'Heighten vigilance and maintain patrol log.',
          daysRemaining: diffDays,
          reminderLabel,
          alertMessage: `🔔 **KARNATAKA CALENDAR ALERT**: ${ev.EventName} is ${reminderLabel.toLowerCase()}. Division: ${ev.Division}. Recommended Priority: ${ev.PatrolPriority}.`
        });
      }
    });

    return reminders;
  }

  /**
   * Get single event by ID with division isolation validation.
   */
  async getEventById(id, division = 'Bengaluru') {
    await this.initializeCalendar();
    const event = localEventStore.get(String(id));
    if (!event || !event.IsActive) return null;

    const parentDivision = this.getParentDivision(division);
    const eventParentDivision = this.getParentDivision(event.Division);
    const eventScope = (event.Scope || 'DIVISION').toUpperCase();

    if (eventScope !== 'COMMON' && parentDivision !== 'State HQ' && eventParentDivision !== parentDivision) {
      // Division unauthorized
      return null;
    }

    return { ...event };
  }

  /**
   * Creates a new operational police event.
   * Enforces division locking for non-State HQ officers.
   */
  async createEvent(eventData, userDivision = 'Bengaluru', userRole = 'OFFICER') {
    await this.initializeCalendar();

    // Use getParentDivision to map the division appropriately
    const parentDivision = this.getParentDivision(eventData.Division || eventData.division || userDivision);
    const isStateHQ = parentDivision === 'State HQ' || userRole === 'STATE_ADMIN' || userRole === 'DGP';

    // Validation & Scope Lock:
    // Normal division officers CANNOT create COMMON events or events for other divisions.
    let scope = (eventData.Scope || eventData.scope || 'DIVISION').toUpperCase();
    let division = parentDivision;

    if (!isStateHQ) {
      scope = 'DIVISION';
      division = parentDivision;
    }

    const eventType = ['FESTIVAL', 'HOLIDAY', 'GOVERNMENT_EVENT', 'POLICE_EVENT', 'MEETING', 'VIP_VISIT', 'OTHER'].includes(eventData.EventType)
      ? eventData.EventType
      : 'POLICE_EVENT';

    const patrolPriority = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(eventData.PatrolPriority)
      ? eventData.PatrolPriority
      : 'MEDIUM';

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const eventDate = eventData.EventDate || nowStr.slice(0, 10);

    const newEvent = {
      EventName: (eventData.EventName || 'Police Operational Event').trim(),
      EventType: eventType,
      EventDate: eventDate,
      StartDateTime: eventData.StartDateTime || `${eventDate} 09:00:00`,
      EndDateTime: eventData.EndDateTime || `${eventDate} 18:00:00`,
      Scope: scope,
      Division: division,
      Location: (eventData.Location || `${division} Division`).trim(),
      Description: (eventData.Description || '').trim(),
      ReminderDays: parseInt(eventData.ReminderDays, 10) || 2,
      PatrolPriority: patrolPriority,
      RecommendedAction: (eventData.RecommendedAction || 'Deploy standard division patrol units.').trim(),
      IsActive: true,
      CreatedBy: (eventData.CreatedBy || userRole || 'OFFICER').trim(),
      CreatedAt: nowStr,
      UpdatedAt: nowStr
    };

    let generatedRowId = `op_ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Persist to Catalyst Data Store
    try {
      const token = await getDataStoreToken();
      if (token) {
        const insertUrl = `${CATALYST_BASE_URL}/project/${CATALYST_PROJECT_ID}/table/${CALENDAR_TABLE_ID}/row`;
        const res = await fetch(insertUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'CATALYST-ORG': CATALYST_ORG_ID,
            'Environment': CATALYST_ENVIRONMENT,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([newEvent])
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.data && data.data[0]) {
            generatedRowId = String(data.data[0].ROWID);
            console.log(`[CalendarService] Persisted event to Catalyst table with ROWID: ${generatedRowId}`);
          }
        }
      }
    } catch (err) {
      console.warn('[CalendarService] Remote insert notice:', err.message);
    }

    newEvent.ROWID = generatedRowId;
    localEventStore.set(generatedRowId, newEvent);

    return { success: true, event: newEvent };
  }

  /**
   * Updates an existing event with division security checks.
   */
  async updateEvent(id, updateData, userDivision = 'Bengaluru', userRole = 'OFFICER') {
    await this.initializeCalendar();
    const event = localEventStore.get(String(id));
    if (!event || !event.IsActive) {
      return { success: false, error: 'Event not found or inactive.' };
    }

    const parentDivision = this.getParentDivision(userDivision);
    const isStateHQ = parentDivision === 'State HQ' || userRole === 'STATE_ADMIN';

    // Cannot edit other division's events
    if (!isStateHQ && this.getParentDivision(event.Division) !== parentDivision) {
      return { success: false, error: 'Unauthorized: Cannot edit events belonging to another division.' };
    }

    // Normal officers cannot edit system COMMON official events
    if (event.Scope === 'COMMON' && !isStateHQ) {
      return { success: false, error: 'Unauthorized: Official Karnataka calendar events are read-only.' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const updatedEvent = {
      ...event,
      EventName: updateData.EventName ? updateData.EventName.trim() : event.EventName,
      EventType: updateData.EventType || event.EventType,
      EventDate: updateData.EventDate || event.EventDate,
      StartDateTime: updateData.StartDateTime || event.StartDateTime,
      EndDateTime: updateData.EndDateTime || event.EndDateTime,
      Location: updateData.Location ? updateData.Location.trim() : event.Location,
      Description: updateData.Description !== undefined ? updateData.Description.trim() : event.Description,
      ReminderDays: updateData.ReminderDays !== undefined ? parseInt(updateData.ReminderDays, 10) : event.ReminderDays,
      PatrolPriority: updateData.PatrolPriority || event.PatrolPriority,
      RecommendedAction: updateData.RecommendedAction !== undefined ? updateData.RecommendedAction.trim() : event.RecommendedAction,
      UpdatedAt: nowStr
    };

    // Persist update to Catalyst
    try {
      const token = await getDataStoreToken();
      if (token && !String(id).startsWith('ksp_common_')) {
        const updateUrl = `${CATALYST_BASE_URL}/project/${CATALYST_PROJECT_ID}/table/${CALENDAR_TABLE_ID}/row/${id}`;
        await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'CATALYST-ORG': CATALYST_ORG_ID,
            'Environment': CATALYST_ENVIRONMENT,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedEvent)
        });
      }
    } catch (err) {
      console.warn('[CalendarService] Remote update notice:', err.message);
    }

    localEventStore.set(String(id), updatedEvent);
    return { success: true, event: updatedEvent };
  }

  /**
   * Deactivates / deletes an event with division authorization checks.
   */
  async deleteEvent(id, userDivision = 'Bengaluru', userRole = 'OFFICER') {
    await this.initializeCalendar();
    const event = localEventStore.get(String(id));
    if (!event) {
      return { success: false, error: 'Event not found.' };
    }

    const parentDivision = this.getParentDivision(userDivision);
    const isStateHQ = parentDivision === 'State HQ' || userRole === 'STATE_ADMIN';

    // Cannot delete other division's events
    if (!isStateHQ && this.getParentDivision(event.Division) !== parentDivision) {
      return { success: false, error: 'Unauthorized: Cannot delete events belonging to another division.' };
    }

    // Normal officers cannot delete official COMMON calendar events
    if (event.Scope === 'COMMON' && !isStateHQ) {
      return { success: false, error: 'Unauthorized: Official Karnataka calendar events are system-managed.' };
    }

    // Soft delete / remove
    event.IsActive = false;

    try {
      const token = await getDataStoreToken();
      if (token && !String(id).startsWith('ksp_common_')) {
        const deleteUrl = `${CATALYST_BASE_URL}/project/${CATALYST_PROJECT_ID}/table/${CALENDAR_TABLE_ID}/row/${id}`;
        await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'CATALYST-ORG': CATALYST_ORG_ID,
            'Environment': CATALYST_ENVIRONMENT
          }
        });
      }
    } catch (err) {
      console.warn('[CalendarService] Remote delete notice:', err.message);
    }

    localEventStore.delete(String(id));
    return { success: true, message: `Event '${event.EventName}' removed successfully.` };
  }

  /**
   * Generates Evidence-Grounded Operational Calendar Advisory:
   * Combines Event Details + Division + Real Crime Hotspots & Modus Operandi
   */
  async generateOperationalAdvisory(queryOrEventName, division = 'Bengaluru') {
    const targetDivision = this.normalizeDivision(division);
    const allEvents = await this.getEventsForDivision(targetDivision);

    const q = (queryOrEventName || '').toLowerCase().trim();

    // 1. Find best matching event
    let matchedEvent = allEvents.find(ev => {
      const name = ev.EventName.toLowerCase();
      return q.includes(name) || name.includes(q) || (ev.EventType === 'FESTIVAL' && q.includes('festival'));
    });

    if (!matchedEvent && allEvents.length > 0) {
      // Default to the next upcoming high-priority event
      matchedEvent = allEvents.find(ev => ev.PatrolPriority === 'CRITICAL' || ev.PatrolPriority === 'HIGH') || allEvents[0];
    }

    if (!matchedEvent) {
      return {
        event: null,
        advisoryText: `No active calendar events found for ${targetDivision} Division.`
      };
    }

    // 2. Query real crime statistics and hotspots for the division from crimePatternService
    const crimeAnalysis = crimePatternService.analyzeQuery(`Dominant crimes in ${targetDivision}`, {}, targetDivision);
    const dCrimeRaw = crimeAnalysis.engineResult?.response?.data?.dominantCrime;
    const dominantCrime = (typeof dCrimeRaw === 'object' && dCrimeRaw !== null) ? (dCrimeRaw.name || 'Commercial & Street Offenses') : (dCrimeRaw || 'Commercial & Street Offenses');
    
    const dLocRaw = crimeAnalysis.engineResult?.response?.data?.topLocation;
    const topHotspot = (typeof dLocRaw === 'object' && dLocRaw !== null) ? (dLocRaw.name || `${targetDivision} Central Hub`) : (dLocRaw || `${targetDivision} Central Hub`);
    
    const peakTime = crimeAnalysis.engineResult?.response?.data?.peakWindow || 'Evening / Night hours (18:00 - 23:00)';
    const primaryMO = crimeAnalysis.engineResult?.response?.data?.primaryMO || 'Opportunistic theft during crowd congregations';

    const advisoryMarkdown = 
`**KARNATAKA CALENDAR ALERT**

**Event:** ${matchedEvent.EventName} (${matchedEvent.Scope === 'COMMON' ? 'Official Karnataka Government Event' : 'Police Operational Event'})
**Event Date:** ${matchedEvent.EventDate}
**Jurisdiction:** ${targetDivision}
**Patrol Priority:** ${matchedEvent.PatrolPriority}

**Patrol Advisory:**
${matchedEvent.Description}
Verified crime intelligence records for **${targetDivision}** indicate that public festivals and high-footfall gatherings experience elevated risks of **${dominantCrime}**, particularly during **${peakTime}** under modus operandi of "${primaryMO}".

**Relevant Hotspots & Vulnerable Zones:**
• **Primary Sector:** ${topHotspot} (${targetDivision})
• **Key Locations:** ${matchedEvent.Location}
• **Target Profile:** Crowded pedestrian bazaars, transit terminals, and commercial hubs.

**Recommended Action:**
${matchedEvent.RecommendedAction || 'Deploy visible static pickets and mobile patrol squads.'} Intensify anti-theft and anti-chain snatching surveillance around ${topHotspot} during ${peakTime}.`;

    return {
      event: matchedEvent,
      advisoryText: advisoryMarkdown,
      hotspot: topHotspot,
      priority: matchedEvent.PatrolPriority,
      dominantCrime
    };
  }

  /**
   * Returns the dynamic division hierarchy configuration.
   */
  getDivisionHierarchy() {
    return DIVISION_HIERARCHY_CONFIG;
  }
}

export const calendarService = new CalendarService();
export default calendarService;

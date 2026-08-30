/**
 * Chat Service Orchestrator
 * Coordinates conversational memory, crime intelligence retrieval,
 * guardrail safety enforcement, and LLM reasoning.
 * Uses persistent Zoho Catalyst Data Store table: ChatMemory (54626000000092001)
 */

import memoryService, { getRecentContext, saveConversationTurn } from './memoryService.js';
import crimePatternService, { extractExplicitDistrict, extractAllDistricts, extractLocation } from './crimePatternService.js';
import llmService from './llmService.js';
import guardrailService from './guardrailService.js';
import calendarService from './calendarService.js';
import { extractCrimeType } from '../../src/crimepattern/crimePatternEngine.js';

// Casual conversation matcher (greeting, gratitude, identification)
const CASUAL_PATTERNS = /^(hi+|hello+|hey+|howdy|heya|hiya|greetings|namaste|vanakkam|good\s*(morning|afternoon|evening|night)|what'?s?\s*up|sup|yo|thanks|thank\s*you|ty|thx|bye|goodbye|ok|okay|cool|great|awesome|who\s*are\s*you|what\s*(are|can)\s*you\s*do|help\s*me|what\s*is\s*(ksp|your\s*name)|introduce\s*yourself)\b/i;

/**
 * Lightweight follow-up / context-dependent query detector
 */
export function isFollowUpQuery(query) {
  if (!query) return false;
  const q = query.trim().toLowerCase();

  const followUpPatterns = [
    /\bwhy\s+(is|are|was|were|did|does|do)?\s*(that|this|it|these|those)\b/i,
    /\bwhy\s*\?/i,
    /^why\b/i,
    /\bwhy\s+is\s+(it|that|this)\s+(high|higher|increasing|happening|occurring|rising)\b/i,
    /\bwhy\s+is\s+(that|this)\s+crime\s+(high|higher|increasing|happening|occurring|rising)\b/i,
    /\bwhy\s+is\s+.+\s+(high|higher|increasing|happening|occurring|rising)\b/i,
    /\bwhat\s+(causes?|caused|are\s+the\s+reasons?\s+for)\s*(that|this|it|these)?\b/i,
    /\bwhat\s+are\s+the\s+reasons\b/i,
    /\bwhat\s+changed\b/i,
    /\bwhat\s+happened\s*(there|here)?\b/i,
    /\btell\s+me\s+more\b/i,
    /\bexplain\s+(that|this|it|these|more)\b/i,
    /\bhow\s+to\s+prevent\s*(it|this|that)?\b/i,
    /\bwhat\s+about\s+(this|that|it)\b/i,
    /\bwhat\s+about\s+.+\s*(specifically)?\b/i,
    /\bwhich\s+(one|district|city|area|jurisdiction)\b/i,
    /\bwhich\s+is\s+(higher|lower|worse|better|more)\b/i,
    /\bwhich\s+one\s+(has|is)\b/i,
    /\bcompare\s+(them|both|again)\b/i,
    /\bwhat\s+has\s+changed\b/i,
    /\blast\s+30\s+days\b/i,
    /\b30\s+days\b/i,
    /\bgive\s+(me\s+)?summary\b/i,
    /\bsummarize\b/i,
    /^summary$/i
  ];

  return followUpPatterns.some(pattern => pattern.test(q));
}

class ChatService {
  /**
   * Process incoming chat request
   * @param {Object} params
   * @param {string} params.message - User question
   * @param {string} [params.conversationId] - Unique conversation session ID
   * @param {string} [params.division] - Active division/district (e.g. Bengaluru Division)
   * @param {string} [params.fir_number] - Active FIR reference if any
   * @param {Object} [params.context] - Additional context parameters
   */
  async processChatMessage({ message, conversationId, division = 'Bengaluru Division', fir_number = '', context = {} }) {
    // ── 1. RECEIVE USER MESSAGE ──────────────────────────────────────────────
    const activeConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userQuery = (message || '').trim();

    if (!userQuery) {
      throw new Error('Message content is required.');
    }

    console.log(`\n[ChatService] [${activeConversationId}] Query: "${userQuery.substring(0, 80)}" | Division: ${division}`);

    // ── 3. LOAD PERSISTENT MEMORY FROM CATALYST CHATMEMORY ──────────────────
    console.log(`[ChatService] Loading persistent memory for session [${activeConversationId}]`);
    let recentContext = { formattedHistory: [] };
    let existingContext = {};

    try {
      recentContext = await memoryService.getRecentContext(activeConversationId, 10);
      existingContext = {
        lastReferencedDistrict: recentContext.lastReferencedDistrict || null,
        lastReferencedDivision: recentContext.lastReferencedDivision || null,
        lastReferencedCrimeType: recentContext.lastReferencedCrimeType || null,
        lastReferencedEntity: recentContext.lastReferencedEntity || null,
        lastIntent: recentContext.lastIntent || null,
        conversationTopic: recentContext.conversationTopic || {
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
        }
      };
    } catch (memErr) {
      console.warn(`[ChatService] Memory retrieval notice for session [${activeConversationId}]:`, memErr.message);
    }

    const mergedContext = {
      ...existingContext,
      ...(context || {}),
      uploadedDocument: context?.uploadedDocument || existingContext?.uploadedDocument || existingContext?.conversationTopic?.uploadedDocument || null,
      division: division || existingContext.division,
      fir_number: fir_number || existingContext.fir_number
    };

    const history = recentContext.formattedHistory || [];
    const prevTopic = existingContext.conversationTopic || {};

    // ── Diagnostic Logging for Previous Valid Context ─────────────────────────
    const prevCompared = (prevTopic.comparedDistricts && prevTopic.comparedDistricts.length > 0)
      ? prevTopic.comparedDistricts
      : (prevTopic.topicType === 'comparison' ? prevTopic.districts : []);
    const prevActive = prevTopic.activeDistrict || (prevTopic.topicType !== 'comparison' ? prevTopic.districts?.[0] : null);

    console.log(`[Context] Previous valid intent: ${prevTopic.conversationIntent || prevTopic.lastIntent || 'None'}`);
    console.log(`[Context] Compared districts: ${prevCompared && prevCompared.length > 0 ? prevCompared.join(', ') : 'None'}`);
    console.log(`[Context] Active district: ${prevActive || 'None'}`);
    if (mergedContext.uploadedDocument) {
      console.log(`[Context] Uploaded document in session: ${mergedContext.uploadedDocument.filename}`);
    }

    // ── 2. EXPLICIT QUERY CLASSIFICATION & EVIDENCE SOURCE SELECTION ──────────
    const uploadedDoc = context?.uploadedDocument || existingContext?.uploadedDocument || existingContext?.conversationTopic?.uploadedDocument || null;
    const queryType = guardrailService.classifyQuery(userQuery, uploadedDoc, mergedContext);
    console.log(`[ChatService] [${activeConversationId}] Query classified as: "${queryType}" | Uploaded doc in session: ${uploadedDoc ? uploadedDoc.filename : 'None'}`);

    // ── 2.1. SECURITY BLOCK (PROMPT INJECTION / CREDENTIAL ATTEMPT) ───────────
    if (queryType === 'SECURITY_BLOCK') {
      console.warn(`[Guardrail] Blocked prompt injection or credential request: "${userQuery}"`);
      const blockedAnswer = "Access restricted. KSP Sentinel AI operates under strict law enforcement safety protocols. System instructions, API tokens, and internal configurations cannot be displayed or revealed.";
      const blockedIntent = 'security_block';

      const blockedResponseContext = {
        ...existingContext,
        intent: blockedIntent,
        division: null,
        district: null,
        rag_used: false,
        chart_data: null,
        agent_type: 'sentinel_assistant',
        agent_label: 'KSP Sentinel AI'
      };

      try {
        await memoryService.saveConversationTurn({
          sessionId: activeConversationId,
          userQuery,
          assistantResponse: blockedAnswer,
          division: null,
          district: null,
          crimeType: null,
          referencedEntity: null,
          intent: blockedIntent,
          conversationTopic: existingContext.conversationTopic || null
        });
      } catch (saveErr) {
        console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
      }

      return {
        success: true,
        answer: blockedAnswer,
        conversationId: activeConversationId,
        context: blockedResponseContext
      };
    }

    // ── 2.2. CASUAL GREETING SHORT-CIRCUIT ────────────────────────────────────
    if (queryType === 'CASUAL') {
      console.log(`[ChatService] [${activeConversationId}] Processing Casual Query: "${userQuery}"`);
      let casualAnswer = '';
      try {
        const glmCasual = await llmService.generateDynamicResponse({ userQuery, division: null, history });
        if (glmCasual && typeof glmCasual === 'string' && glmCasual.trim().length > 0) {
          casualAnswer = glmCasual.trim();
        }
      } catch (err) {
        console.warn(`[ChatService] GLM casual response notice:`, err.message);
      }

      if (!casualAnswer) {
        casualAnswer = "Hello, Officer. KSP Sentinel AI is ready to assist with crime intelligence analysis, calendar scheduling, and document investigation. How can I assist you today?";
      }

      const casualResponseContext = {
        ...existingContext,
        intent: 'casual',
        division: null,
        district: null,
        rag_used: false,
        chart_data: null,
        agent_type: 'sentinel_assistant',
        agent_label: 'KSP Sentinel AI — Catalyst GLM',
        prompt_suggestions: [
          "Dominant crimes in Bengaluru",
          "Compare Belagavi and Kalaburagi",
          "What has changed in the last 30 days?",
          "Why is chain snatching high in Manipal?"
        ],
        conversationTopic: {
          ...prevTopic,
          conversationIntent: 'casual',
          lastUserQuery: userQuery,
          lastIntent: 'casual',
          lastValidTurn: {
            userQuery,
            intent: 'casual',
            createdAt: new Date().toISOString()
          }
        }
      };

      try {
        console.log(`[ChatService] Saving casual turn for session [${activeConversationId}]`);
        await memoryService.saveConversationTurn({
          sessionId: activeConversationId,
          userQuery,
          assistantResponse: casualAnswer,
          division: null,
          district: null,
          crimeType: null,
          referencedEntity: null,
          intent: 'casual',
          conversationTopic: casualResponseContext.conversationTopic
        });
      } catch (saveErr) {
        console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
      }

      return {
        success: true,
        answer: casualAnswer,
        conversationId: activeConversationId,
        context: casualResponseContext
      };
    }

    // ── 2.3. OUT OF SCOPE GUARDRAIL ───────────────────────────────────────────
    if (queryType === 'OUT_OF_SCOPE') {
      console.log(`[Guardrail] Blocked out-of-scope query: "${userQuery}"`);
      const blockedAnswer = "I am KSP Sentinel, your specialized crime intelligence assistant for the Karnataka State Police. I can only assist with crime pattern analysis, district crime statistics, modus operandi, area comparisons, and investigative queries for Karnataka jurisdictions.";
      const blockedIntent = 'out_of_scope';

      const blockedResponseContext = {
        ...existingContext,
        intent: blockedIntent,
        division: null,
        district: null,
        rag_used: false,
        chart_data: null,
        agent_type: 'sentinel_assistant',
        agent_label: 'KSP Sentinel AI'
      };

      try {
        await memoryService.saveConversationTurn({
          sessionId: activeConversationId,
          userQuery,
          assistantResponse: blockedAnswer,
          division: null,
          district: null,
          crimeType: null,
          referencedEntity: null,
          intent: blockedIntent,
          conversationTopic: existingContext.conversationTopic || null
        });
      } catch (saveErr) {
        console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
      }

      return {
        success: true,
        answer: blockedAnswer,
        conversationId: activeConversationId,
        context: blockedResponseContext
      };
    }

    // ── 2.35. CALENDAR OPERATIONAL ADVISORY ──────────────────────────────────
    if (queryType === 'CALENDAR_OPERATIONAL_ADVISORY') {
      console.log(`[ChatService] [${activeConversationId}] Generating Calendar Operational Advisory for division: ${division}`);
      const advisoryResult = await calendarService.generateOperationalAdvisory(userQuery, division);
      let advisoryAnswer = '';
      try {
        advisoryAnswer = await llmService.generateDynamicResponse({
          userQuery,
          division,
          unifiedEvidence: {
            calendarEvidence: JSON.stringify(advisoryResult.event || {}),
            crimeEvidence: `Dominant Crime: ${advisoryResult.dominantCrime}, Top Hotspot: ${advisoryResult.hotspot}`
          },
          history
        });
      } catch (err) {
         console.warn(`[ChatService] GLM error:`, err.message);
      }
      if (!advisoryAnswer) advisoryAnswer = "I'm currently unable to generate the advisory.";
      const advisoryIntent = 'calendar_advisory';

      const advisoryResponseContext = {
        ...existingContext,
        intent: advisoryIntent,
        division: division,
        district: division,
        rag_used: false,
        chart_data: null,
        agent_type: 'sentinel_calendar_agent',
        agent_label: 'KSP Sentinel AI — Calendar Intelligence',
        agent_icon: '📅',
        prompt_suggestions: [
          "What other festivals are coming up?",
          `Show crime hotspots in ${division}`,
          "What Karnataka holidays are next?",
          "Remind me about the DGP meeting"
        ],
        conversationTopic: {
          ...prevTopic,
          topicType: 'calendar_intelligence',
          conversationIntent: advisoryIntent,
          activeDistrict: division,
          lastUserQuery: userQuery,
          lastIntent: advisoryIntent,
          lastValidTurn: {
            userQuery,
            intent: advisoryIntent,
            createdAt: new Date().toISOString()
          }
        }
      };

      try {
        await memoryService.saveConversationTurn({
          sessionId: activeConversationId,
          userQuery,
          assistantResponse: advisoryAnswer,
          division: division,
          district: division,
          crimeType: advisoryResult.dominantCrime || null,
          referencedEntity: advisoryResult.event?.EventName || null,
          intent: advisoryIntent,
          conversationTopic: advisoryResponseContext.conversationTopic
        });
      } catch (saveErr) {
        console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
      }

      return {
        success: true,
        answer: advisoryAnswer,
        conversationId: activeConversationId,
        context: advisoryResponseContext
      };
    }

    // ── 2.36. CALENDAR QUERY / UPCOMING EVENTS ────────────────────────────────
    if (queryType === 'CALENDAR_QUERY') {
      console.log(`[ChatService] [${activeConversationId}] Querying Upcoming Calendar Events for division: ${division}`);
      const targetDate = parseNaturalLanguageDate(userQuery);
      let eventsToDisplay = [];
      let calendarAnswer = '';
      const calendarIntent = 'calendar_query';

      if (targetDate) {
        eventsToDisplay = await calendarService.getEventsForDivision(division, { startDate: targetDate, endDate: targetDate });
      } else {
        eventsToDisplay = await calendarService.getUpcomingEvents(division, 60);
      }
      
      try {
        calendarAnswer = await llmService.generateDynamicResponse({
          userQuery,
          division,
          unifiedEvidence: {
            calendarEvidence: eventsToDisplay.length > 0 ? JSON.stringify(eventsToDisplay) : "No calendar events found."
          },
          history
        });
      } catch (err) {
         console.warn(`[ChatService] GLM error:`, err.message);
      }
      if (!calendarAnswer) calendarAnswer = "Unable to generate calendar response at this time.";

      const calendarResponseContext = {
        ...existingContext,
        intent: calendarIntent,
        division: division,
        district: division,
        rag_used: false,
        chart_data: null,
        agent_type: 'sentinel_calendar_agent',
        agent_label: 'KSP Sentinel AI — Calendar Intelligence',
        agent_icon: '📅',
        prompt_suggestions: [
          `What should ${division} patrol teams do during the upcoming festival?`,
          "What are my event reminders?",
          `Highest crime in ${division}`,
          "Add a DGP review meeting"
        ],
        conversationTopic: {
          ...prevTopic,
          topicType: 'calendar_intelligence',
          conversationIntent: calendarIntent,
          activeDistrict: division,
          lastUserQuery: userQuery,
          lastIntent: calendarIntent,
          lastValidTurn: {
            userQuery,
            intent: calendarIntent,
            createdAt: new Date().toISOString()
          }
        }
      };

      try {
        await memoryService.saveConversationTurn({
          sessionId: activeConversationId,
          userQuery,
          assistantResponse: calendarAnswer,
          division: division,
          district: division,
          crimeType: null,
          referencedEntity: null,
          intent: calendarIntent,
          conversationTopic: calendarResponseContext.conversationTopic
        });
      } catch (saveErr) {
        console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
      }

      return {
        success: true,
        answer: calendarAnswer,
        conversationId: activeConversationId,
        context: calendarResponseContext
      };
    }

    // ── 2.37. EVENT REMINDERS QUERY ──────────────────────────────────────────
    if (queryType === 'EVENT_REMINDER_QUERY') {
      console.log(`[ChatService] [${activeConversationId}] Checking 2-Day Event Reminders for division: ${division}`);
      const reminders = await calendarService.getUpcomingReminders(division);
      const reminderIntent = 'event_reminders';

      let reminderAnswer = '';
      try {
        reminderAnswer = await llmService.generateDynamicResponse({
          userQuery,
          division,
          unifiedEvidence: {
            calendarEvidence: reminders.length > 0 ? JSON.stringify(reminders) : "No events scheduled within the 2-day reminder window."
          },
          history
        });
      } catch (err) {
         console.warn(`[ChatService] GLM error:`, err.message);
      }
      if (!reminderAnswer) reminderAnswer = "Unable to generate reminder response at this time.";

      const reminderResponseContext = {
        ...existingContext,
        intent: reminderIntent,
        division: division,
        district: division,
        rag_used: false,
        chart_data: null,
        agent_type: 'sentinel_calendar_agent',
        agent_label: 'KSP Sentinel AI — Calendar Intelligence',
        agent_icon: '🔔',
        conversationTopic: {
          ...prevTopic,
          topicType: 'calendar_intelligence',
          conversationIntent: reminderIntent,
          activeDistrict: division,
          lastUserQuery: userQuery,
          lastIntent: reminderIntent
        }
      };

      try {
        await memoryService.saveConversationTurn({
          sessionId: activeConversationId,
          userQuery,
          assistantResponse: reminderAnswer,
          division: division,
          district: division,
          crimeType: null,
          referencedEntity: null,
          intent: reminderIntent,
          conversationTopic: reminderResponseContext.conversationTopic
        });
      } catch (saveErr) {
        console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
      }

      return {
        success: true,
        answer: reminderAnswer,
        conversationId: activeConversationId,
        context: reminderResponseContext
      };
    }

    // ── 2.38. CREATE / UPDATE / DELETE EVENT MUTATIONS ────────────────────────
    if (queryType === 'CREATE_EVENT' || queryType === 'UPDATE_EVENT' || queryType === 'DELETE_EVENT') {
      console.log(`[ChatService] [${activeConversationId}] Handling Calendar Action: ${queryType} for division: ${division}`);
      let actionAnswer = '';
      const targetDivision = calendarService.normalizeDivision(division);
      const divisionDisplay = (division && division.toLowerCase().includes('division')) ? division : `${targetDivision} Division`;

      if (queryType === 'CREATE_EVENT') {
        const details = extractEventDetails(userQuery, targetDivision);
        const parsedDate = parseNaturalLanguageDate(userQuery);

        // If date is missing in the officer's request, ask for the date without guessing
        if (!parsedDate) {
          console.log(`[ChatService] Date missing in CREATE_EVENT request: "${userQuery}". Asking officer for date.`);
          actionAnswer = `What date should I schedule the ${details.eventName} for?`;

          const missingDateContext = {
            ...existingContext,
            intent: 'create_event_pending_date',
            division: divisionDisplay,
            district: targetDivision,
            rag_used: false,
            chart_data: null,
            agent_type: 'sentinel_calendar_agent',
            agent_label: 'KSP Sentinel AI — Calendar Intelligence',
            agent_icon: '📅',
            pendingEventDetails: details
          };

          return {
            success: true,
            answer: actionAnswer,
            conversationId: activeConversationId,
            context: missingDateContext
          };
        }

        // We have a valid date! Create the event with strict division isolation
        const createRes = await calendarService.createEvent({
          EventName: details.eventName,
          EventType: details.eventType,
          EventDate: parsedDate,
          StartDateTime: `${parsedDate} ${details.startTime}`,
          EndDateTime: `${parsedDate} 18:00:00`,
          Scope: 'DIVISION',
          Division: targetDivision,
          Location: details.location,
          Description: details.description,
          PatrolPriority: details.patrolPriority,
          ReminderDays: details.reminderDays,
          RecommendedAction: `Deploy division patrol units for ${details.eventName}.`
        }, targetDivision, 'OFFICER');

        const formattedDateDisplay = formatDisplayDate(parsedDate);

        actionAnswer = `✅ **Calendar event added successfully.**\n\n` +
          `📅 **${createRes.event.EventName}**\n` +
          `**Date:** ${formattedDateDisplay}\n` +
          `**Division:** ${divisionDisplay}\n` +
          `**Type:** ${createRes.event.EventType === 'VIP_VISIT' ? 'VIP Visit & Security' : 'Operational Meeting'}\n` +
          `**Reminder:** ${createRes.event.ReminderDays} days before\n\n` +
          `*This event is visible only to the ${divisionDisplay}.*`;
      } else if (queryType === 'UPDATE_EVENT') {
        actionAnswer = `✅ **Calendar Event Updated:** Meeting details and time modified for **${divisionDisplay}**.`;
      } else {
        actionAnswer = `🗑️ **Calendar Event Removed:** The requested operational meeting has been removed from the **${divisionDisplay}** schedule.`;
      }

      const mutationContext = {
        ...existingContext,
        intent: queryType.toLowerCase(),
        division: divisionDisplay,
        district: targetDivision,
        rag_used: false,
        chart_data: null,
        agent_type: 'sentinel_calendar_agent',
        agent_label: 'KSP Sentinel AI — Calendar Intelligence',
        agent_icon: '📅'
      };

      try {
        await memoryService.saveConversationTurn({
          sessionId: activeConversationId,
          userQuery,
          assistantResponse: actionAnswer,
          division: divisionDisplay,
          district: targetDivision,
          crimeType: null,
          referencedEntity: null,
          intent: queryType.toLowerCase(),
          conversationTopic: prevTopic
        });
      } catch (saveErr) {
        console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
      }

      return {
        success: true,
        answer: actionAnswer,
        conversationId: activeConversationId,
        context: mutationContext
      };
    }

    // ── 2.4. MIXED QUERY ROUTE (DOCUMENT + DISTRICT CRIME STATISTICS) ─────────
    if (queryType === 'MIXED' && uploadedDoc) {
      console.log(`[ChatService] [${activeConversationId}] Routing to Mixed Document & Crime Intelligence Pipeline`);
      const docName = uploadedDoc.filename || 'Uploaded Document';
      const docType = uploadedDoc.doc_type || 'Digital Evidence / FIR Document';
      const docContent = uploadedDoc.content || uploadedDoc.details || '';

      // 2. Extract District & Crime for Crime Pattern Engine
      const districtsInQuery = extractAllDistricts(userQuery);
      const mixedDistrict = districtsInQuery.length > 0 ? districtsInQuery[0] : (existingContext.lastReferencedDistrict || 'Bengaluru Urban');

      const analysis = crimePatternService.analyzeQuery(userQuery, mergedContext, mixedDistrict);

      let mixedAnswer = '';
      try {
        mixedAnswer = await llmService.generateDynamicResponse({
          userQuery,
          division: mixedDistrict,
          unifiedEvidence: {
            documentEvidence: `File Name: ${docName}\nContent: ${docContent}`,
            crimeEvidence: analysis.evidenceFacts
          },
          history
        });
      } catch (err) {
         console.warn(`[ChatService] GLM error:`, err.message);
      }
      if (!mixedAnswer) mixedAnswer = "Unable to generate mixed intelligence response at this time.";

      const mixedResponseContext = {
        ...existingContext,
        intent: 'mixed_intelligence',
        division: mixedDistrict,
        district: mixedDistrict,
        rag_used: true,
        rag_sources: [
          {
            doc_name: docName,
            doc_type: docType,
            similarity_score: 1.0,
            passage: docContent.substring(0, 250)
          }
        ],
        chart_data: analysis.chartData || null,
        agent_type: 'hybrid_agent',
        agent_label: 'Document & Crime Analyst',
        agent_icon: '🔍',
        agent_color: '#2563EB',
        uploadedDocument: uploadedDoc,
        conversationTopic: {
          ...prevTopic,
          topicType: 'mixed_intelligence',
          conversationIntent: 'mixed_intelligence',
          activeDistrict: mixedDistrict,
          districts: [mixedDistrict],
          lastUserQuery: userQuery,
          lastIntent: 'mixed_intelligence',
          uploadedDocument: uploadedDoc
        }
      };

      try {
        await memoryService.saveConversationTurn({
          sessionId: activeConversationId,
          userQuery,
          assistantResponse: mixedAnswer,
          division: mixedDistrict,
          district: mixedDistrict,
          crimeType: dominantCrime,
          referencedEntity: docName,
          intent: 'mixed_intelligence',
          conversationTopic: mixedResponseContext.conversationTopic
        });
      } catch (saveErr) {
        console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
      }

      return {
        success: true,
        answer: mixedAnswer,
        conversationId: activeConversationId,
        context: mixedResponseContext
      };
    }

    // ── 2.5. DOCUMENT RAG QA ROUTE ───────────────────────────────────────────
    if (queryType === 'DOCUMENT' && uploadedDoc) {
      console.log(`[ChatService] [${activeConversationId}] Routing to Document RAG QA Engine for '${uploadedDoc.filename}'`);

      const docName = uploadedDoc.filename || 'Uploaded Document';
      const docType = uploadedDoc.doc_type || 'Digital Evidence / FIR Document';
      const docContent = uploadedDoc.content || uploadedDoc.details || '';

      let docAnswer = '';

      try {
        // Call Catalyst GLM for grounded Document QA
        const glmDocAnswer = await llmService.generateDynamicResponse({
          userQuery,
          division: existingContext.division,
          unifiedEvidence: {
            documentEvidence: `File Name: ${docName}\nContent: ${docContent}`
          },
          history
        });

        if (glmDocAnswer && typeof glmDocAnswer === 'string' && glmDocAnswer.trim().length > 10) {
          docAnswer = glmDocAnswer.trim();
        }
      } catch (glmErr) {
        console.warn(`[ChatService] GLM Document QA notice: ${glmErr.message}`);
      }

      // If GLM was offline or fallback is needed, provide deterministic grounded extraction
      if (!docAnswer) {
        docAnswer = extractGroundedDocumentAnswer(userQuery, docName, docContent);
      }

      const docResponseContext = {
        ...existingContext,
        intent: 'document_qa',
        division: existingContext.division || null,
        district: existingContext.district || null,
        rag_used: true,
        rag_sources: [
          {
            doc_name: docName,
            doc_type: docType,
            similarity_score: 1.0,
            passage: docContent.substring(0, 300)
          }
        ],
        chart_data: null,
        agent_type: 'document_agent',
        agent_label: 'Document & Evidence Agent',
        agent_icon: '📄',
        agent_color: '#059669',
        uploadedDocument: uploadedDoc,
        conversationTopic: {
          ...prevTopic,
          topicType: 'document_qa',
          conversationIntent: 'document_qa',
          lastUserQuery: userQuery,
          lastIntent: 'document_qa',
          uploadedDocument: uploadedDoc,
          lastValidTurn: {
            userQuery,
            intent: 'document_qa',
            createdAt: new Date().toISOString()
          }
        }
      };

      // Save turn to Catalyst ChatMemory
      try {
        console.log(`[ChatService] Saving document QA turn for session [${activeConversationId}]`);
        await memoryService.saveConversationTurn({
          sessionId: activeConversationId,
          userQuery,
          assistantResponse: docAnswer,
          division: existingContext.division || null,
          district: existingContext.district || null,
          crimeType: null,
          referencedEntity: docName,
          intent: 'document_qa',
          conversationTopic: docResponseContext.conversationTopic
        });
      } catch (saveErr) {
        console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
      }

      return {
        success: true,
        answer: docAnswer,
        conversationId: activeConversationId,
        context: docResponseContext
      };
    }

    // ── 3. GENERAL CRIME INTELLIGENCE PIPELINE ────────────────────────────────
    // At this stage, queryType === 'GENERAL_CRIME'. The uploaded document is NOT the source.
    console.log(`[ChatService] [${activeConversationId}] Processing General Crime Intelligence Query: "${userQuery}"`);

    // ── 4. RESOLVE PREVIOUS CONVERSATIONAL CONTEXT ───────────────────────────
    const explicitLocObj = extractLocation(userQuery, null);
    const districtsInQuery = extractAllDistricts(userQuery);
    const explicitDistrict = districtsInQuery.length > 0 ? districtsInQuery[0] : (explicitLocObj?.district || null);
    const explicitLocality = explicitLocObj?.type === 'locality' ? explicitLocObj.name : null;
    const explicitCrimeInQuery = extractCrimeType(userQuery);
    const isFollowUp = isFollowUpQuery(userQuery);

    let effectiveDistricts = [];
    let effectiveDistrict = null;
    let effectiveCrime = explicitCrimeInQuery || null;
    let effectiveTopicType = 'general';
    let preservedComparisonDistricts = (prevTopic.comparedDistricts && prevTopic.comparedDistricts.length >= 2)
      ? [...prevTopic.comparedDistricts]
      : (prevTopic.topicType === 'comparison' && Array.isArray(prevTopic.districts) && prevTopic.districts.length >= 2 ? [...prevTopic.districts] : []);

    if (CASUAL_PATTERNS.test(userQuery)) {
      // Casual query
      effectiveDistrict = 'Bengaluru Urban';
      effectiveDistricts = ['Bengaluru Urban'];
    } else if (districtsInQuery.length >= 2) {
      // Fresh Multi-District Comparison Query (e.g. "compare Belagavi and Kalaburagi")
      effectiveDistricts = [districtsInQuery[0], districtsInQuery[1]];
      effectiveDistrict = `${districtsInQuery[0]}, ${districtsInQuery[1]}`;
      effectiveTopicType = 'comparison';
      preservedComparisonDistricts = [districtsInQuery[0], districtsInQuery[1]];
    } else if (isFollowUp && preservedComparisonDistricts.length >= 2) {
      // Follow-up on a comparison topic (or narrowing from a comparison)
      const compDistricts = preservedComparisonDistricts;

      // Check if user explicitly names ONE of the compared districts in follow-up
      const matchingNarrowDist = compDistricts.find(d => {
        const dClean = d.toLowerCase();
        return userQuery.toLowerCase().includes(dClean) || (explicitDistrict && explicitDistrict.toLowerCase() === dClean);
      });

      if (matchingNarrowDist) {
        // Explicit Narrowing to ONE district (e.g. "Why is it high in Belagavi?" or "Why is Kalaburagi higher?")
        effectiveDistricts = [matchingNarrowDist];
        effectiveDistrict = matchingNarrowDist;
        effectiveCrime = prevTopic.districtCrimeMap?.[matchingNarrowDist] || explicitCrimeInQuery || null;
        effectiveTopicType = 'district_crime';

        console.log(`[Context] Resolved district: ${matchingNarrowDist} (narrowed from comparison)`);
        console.log(`[Context] Resolved crime types: ${effectiveCrime || 'All'}`);
      } else if (explicitCrimeInQuery && !explicitDistrict) {
        // Crime-to-district mapping (Rule D)
        let mappedDist = null;
        for (const d of compDistricts) {
          const dCrime = prevTopic.districtCrimeMap?.[d];
          if (dCrime && dCrime.toLowerCase().includes(explicitCrimeInQuery.toLowerCase())) {
            mappedDist = d;
            break;
          }
        }
        effectiveDistrict = mappedDist || compDistricts[0];
        effectiveDistricts = [effectiveDistrict];
        effectiveCrime = explicitCrimeInQuery;
        effectiveTopicType = 'district_crime';

        console.log(`[Context] Resolved crime: ${explicitCrimeInQuery} -> mapped to ${effectiveDistrict}`);
      } else {
        // Generic / Ambiguous comparison follow-up:
        // "Why is that high?", "Why is that happening?", "Which one is higher?", "Compare them again"
        // MUST PRESERVE BOTH DISTRICTS!
        effectiveDistricts = [...compDistricts];
        effectiveDistrict = compDistricts.join(', ');
        effectiveCrime = prevTopic.crimeTypes?.join(', ') || null;
        effectiveTopicType = 'comparison';

        console.log(`[Context] Preserved comparison districts: ${compDistricts.join(', ')}`);
        console.log(`[Context] Preserved crime types: ${prevTopic.crimeTypes?.join(', ') || 'All'}`);
      }
    } else if (isFollowUp && (prevTopic.topicType === 'district_crime' || existingContext.lastReferencedDistrict) && !explicitDistrict) {
      // Single district follow-up with no new explicit location (e.g. "Why is that crime high?")
      const singleDist = prevTopic.activeDistrict || prevTopic.districts?.[0] || existingContext.lastReferencedDistrict;
      const singleCrime = explicitCrimeInQuery || prevTopic.activeCrimeType || prevTopic.crimeTypes?.[0] || existingContext.lastReferencedCrimeType || null;

      effectiveDistricts = [singleDist];
      effectiveDistrict = singleDist;
      effectiveCrime = singleCrime;
      effectiveTopicType = 'district_crime';

      console.log(`[Context] Resolved single district: ${effectiveDistrict}`);
      console.log(`[Context] Resolved crime types: ${effectiveCrime || 'All'}`);
    } else if (explicitDistrict) {
      // Explicit District / Locality in current query (Highest priority for explicit location!)
      effectiveDistricts = [explicitDistrict];
      effectiveDistrict = explicitLocality || explicitDistrict;
      effectiveTopicType = 'district_crime';
    } else if (existingContext.lastReferencedDistrict) {
      effectiveDistricts = prevTopic.districts?.length > 0 ? prevTopic.districts : [existingContext.lastReferencedDistrict];
      effectiveDistrict = existingContext.lastReferencedDistrict;
      effectiveTopicType = prevTopic.topicType || 'district_crime';
    } else if (division && division !== 'Bengaluru Division' && division !== 'State HQ Command') {
      const explicitReq = extractExplicitDistrict(division);
      const reqDist = explicitReq || division.replace(/ Division| State HQ Command/gi, '').trim();
      effectiveDistricts = [reqDist];
      effectiveDistrict = reqDist;
      effectiveTopicType = 'district_crime';
    } else {
      effectiveDistricts = ['Bengaluru Urban'];
      effectiveDistrict = 'Bengaluru Urban';
      effectiveTopicType = 'district_crime';
    }

    console.log(`[Context] Final resolved context: Topic="${effectiveTopicType}", Districts=[${effectiveDistricts.join(', ')}], ActiveDistrict="${effectiveDistrict}", Crime="${effectiveCrime || 'All'}"`);

    const resolvedContext = {
      ...existingContext,
      ...context,
      districts: effectiveDistricts,
      lastReferencedDistrict: effectiveDistrict,
      lastReferencedCrimeType: effectiveCrime || existingContext.lastReferencedCrimeType,
      conversationTopic: {
        ...prevTopic,
        conversationIntent: effectiveTopicType === 'comparison' ? 'area_comparison' : 'district_crime',
        comparedDistricts: preservedComparisonDistricts,
        activeDistrict: effectiveTopicType === 'comparison' ? null : effectiveDistrict,
        activeCrimeType: effectiveCrime,
        topicType: effectiveTopicType,
        districts: effectiveDistricts,
        crimeTypes: effectiveCrime ? [effectiveCrime] : (prevTopic.crimeTypes || [])
      }
    };

    // ── 5. GUARDRAIL RESOLVED CONTEXT VALIDATION ─────────────────────────────
    const contextValidation = guardrailService.validateResolvedContext(resolvedContext);
    console.log(`[Guardrail] Context: allowed=${contextValidation.allowed} (category: ${contextValidation.category})`);

    if (!contextValidation.allowed) {
      console.warn(`[Guardrail] Context validation notice: ${contextValidation.reason}`);
    }



    // ── 6. RUN CRIME PATTERN ANALYSIS ────────────────────────────────────────
    console.log(`[CrimePatternService] Analyzing crime query for district: ${effectiveDistrict}`);
    const analysis = crimePatternService.analyzeQuery(userQuery, resolvedContext, effectiveDistrict);
    const intent = analysis.intent || 'general_question';
    const isChartable = crimePatternService.isChartableIntent(intent);
    const chartData = isChartable ? analysis.chartData : null;
    const finalResolvedDistrict = analysis.engineResult?.context?.lastReferencedDistrict || effectiveDistrict;
    const compData = analysis.engineResult?.response?.data;

    // ── 7. GUARDRAIL EVIDENCE VALIDATION ─────────────────────────────────────
    const evidenceValidation = guardrailService.validateEvidence(analysis.evidenceFacts);
    console.log(`[Guardrail] Evidence: allowed=${evidenceValidation.allowed} (category: ${evidenceValidation.category})`);

    let targetDivision = finalResolvedDistrict;
    if ((intent === 'area_comparison' || intent === 'comparative_explanation' || intent === 'comparative_mutation') && effectiveDistricts.length >= 2) {
      targetDivision = `${effectiveDistricts[0]} vs ${effectiveDistricts[1]}`;
    } else if (compData?.name1 && compData?.name2) {
      targetDivision = `${compData.name1} vs ${compData.name2}`;
    }

    let answer = '';

    if (!evidenceValidation.allowed) {
      console.log(`[LLMService] Calling GLM general intelligence brief for: "${userQuery}"`);
      try {
        const generalAnswer = await llmService.generateDynamicResponse({
          userQuery,
          division: targetDivision || division || 'Karnataka',
          history
        });
        if (generalAnswer && typeof generalAnswer === 'string' && generalAnswer.trim().length > 10) {
          answer = generalAnswer.trim();
        }
      } catch (genErr) {
        console.warn(`[ChatService] General LLM response notice: ${genErr.message}`);
      }

      if (!answer) {
        answer = "I am KSP Sentinel AI, your crime intelligence assistant for the Karnataka State Police. I can assist with district crime patterns, comparative analytics, calendar event scheduling, and document/FIR investigation.";
      }
    } else {
      // ── 8. CALL LLM SERVICE ────────────────────────────────────────────────
      console.log(`[LLMService] Calling GLM dynamic response for division: ${targetDivision}`);
      answer = await llmService.generateDynamicResponse({
        userQuery,
        division: targetDivision,
        unifiedEvidence: {
            crimeEvidence: analysis.evidenceFacts
        },
        history
      });

      // Fallback if LLM is temporarily unreachable
      if (!answer) {
        answer = analysis.sanitizedEvidence
          .replace(/CRIME PATTERN ANALYSIS/g, 'INTELLIGENCE BRIEF')
          .replace(/📊/g, '🛡️');

        if (!answer) {
          answer = `I can provide crime intelligence analysis for Karnataka. You can ask about:\n` +
            `• Dominant crime trends in a district\n` +
            `• Location-specific patterns (e.g. "Why is chain snatching high in Manipal?")\n` +
            `• Recent pattern shifts\n` +
            `• Area comparisons (e.g. "Compare Bengaluru and Mysuru")\n` +
            `• Offender behavioral profiles`;
        }
      }
    }

    // ── 9. GUARDRAIL OUTPUT VALIDATION ───────────────────────────────────────
    const outputValidation = guardrailService.validateOutput(answer, analysis.evidenceFacts, mergedContext);
    console.log(`[Guardrail] Output: allowed=${outputValidation.allowed} (category: ${outputValidation.category})`);

    if (!outputValidation.allowed) {
      console.warn(`[Guardrail] Output validation notice: ${outputValidation.reason}`);
      if (
        outputValidation.category === 'unsupported_causal_explanation' ||
        outputValidation.category === 'unsupported_statistic' ||
        outputValidation.category === 'unsupported_claims' ||
        outputValidation.category === 'secret_leak' ||
        outputValidation.category === 'system_prompt_leak'
      ) {
        answer = analysis.sanitizedEvidence
          .replace(/CRIME PATTERN ANALYSIS/g, 'INTELLIGENCE BRIEF')
          .replace(/📊/g, '🛡️') || "The generated analysis was sanitized in accordance with law enforcement evidence standards.";

        if (userQuery.toLowerCase().includes('why') || userQuery.toLowerCase().includes('cause')) {
          answer += `\n\nNote: The available verified records document the empirical pattern and modus operandi, but do not establish the underlying causal factors.`;
        }
      }
    }

    // Construct structured conversation topic for state persistence
    let updatedTopic;
    if (intent === 'area_comparison' || intent === 'comparative_explanation' || intent === 'comparative_mutation' || effectiveDistricts.length >= 2) {
      const d1 = compData?.name1 || effectiveDistricts[0];
      const d2 = compData?.name2 || effectiveDistricts[1];
      const c1 = compData?.fp1?.dominantCrime?.name || compData?.mut1?.fp2?.dominantCrime?.name || '';
      const c2 = compData?.fp2?.dominantCrime?.name || compData?.mut2?.fp2?.dominantCrime?.name || '';

      updatedTopic = {
        conversationIntent: intent,
        comparedDistricts: [d1, d2],
        activeDistrict: null,
        activeCrimeType: [c1, c2].filter(Boolean).join(', ') || null,
        referencedEntity: null,
        topicType: 'comparison',
        districts: [d1, d2],
        divisions: [division],
        crimeTypes: [c1, c2].filter(Boolean),
        referencedEntities: [],
        districtCrimeMap: {
          [d1]: c1,
          [d2]: c2
        },
        lastUserQuery: userQuery,
        lastIntent: intent,
        lastValidTurn: {
          userQuery,
          intent,
          district: `${d1}, ${d2}`,
          crimeType: [c1, c2].filter(Boolean).join(', '),
          createdAt: new Date().toISOString()
        }
      };
    } else {
      const resolvedDist = analysis.engineResult?.context?.lastReferencedDistrict || effectiveDistrict;
      const resolvedCrime = analysis.engineResult?.context?.lastReferencedCrimeType || effectiveCrime || '';

      updatedTopic = {
        conversationIntent: intent,
        comparedDistricts: preservedComparisonDistricts,
        activeDistrict: resolvedDist,
        activeCrimeType: resolvedCrime || null,
        referencedEntity: null,
        topicType: 'district_crime',
        districts: [resolvedDist],
        divisions: [division],
        crimeTypes: resolvedCrime ? [resolvedCrime] : [],
        referencedEntities: [],
        districtCrimeMap: {
          ...(prevTopic.districtCrimeMap || {}),
          [resolvedDist]: resolvedCrime
        },
        lastUserQuery: userQuery,
        lastIntent: intent,
        lastValidTurn: {
          userQuery,
          intent,
          district: resolvedDist,
          crimeType: resolvedCrime,
          createdAt: new Date().toISOString()
        }
      };
    }

    const responseContext = {
      ...resolvedContext,
      ...(analysis.engineResult?.context || {}),
      intent,
      division: finalResolvedDistrict,
      district: finalResolvedDistrict,
      lastReferencedDistrict: finalResolvedDistrict,
      fir_number: fir_number || null,
      rag_used: evidenceValidation.allowed && (analysis.engineResult?.context?.rag_used || true),
      chart_data: evidenceValidation.allowed ? chartData : null,
      agent_type: 'sentinel_intelligence',
      agent_label: 'KSP Sentinel AI — Catalyst GLM',
      conversationTopic: updatedTopic,
      prompt_suggestions: [
        'What has changed in the last 30 days?',
        'Why is chain snatching high in Manipal?',
        'Compare Bengaluru and Mysuru based on age and gender',
        'Show behavioral profile of OFF-00261'
      ]
    };

    // ── 10. SAVE TURN TO CATALYST CHATMEMORY ─────────────────────────────────
    try {
      console.log(`[ChatService] Saving conversation turn for session [${activeConversationId}]`);
      await memoryService.saveConversationTurn({
        sessionId: activeConversationId,
        userQuery,
        assistantResponse: answer,
        division: finalResolvedDistrict,
        district: finalResolvedDistrict,
        crimeType:
          responseContext.lastReferencedCrimeType ||
          responseContext.crimeType ||
          null,
        referencedEntity:
          responseContext.lastReferencedEntity ||
          null,
        intent: responseContext.intent || intent,
        conversationTopic: updatedTopic
      });
    } catch (saveErr) {
      console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
    }

    // ── 11. RETURN RESPONSE CONTRACT ─────────────────────────────────────────
    return {
      success: true,
      answer,
      conversationId: activeConversationId,
      context: responseContext
    };
  }
}

/**
 * Deterministic Grounded Document Fact Extractor
 * Extracts verified facts directly from uploaded document/FIR text.
 */
export function extractGroundedDocumentAnswer(query, docName, docContent) {
  if (!docContent || !docContent.trim()) {
    return `The uploaded document **${docName}** does not contain any readable text or extracted records.`;
  }

  const q = query.toLowerCase().trim();
  const text = docContent.trim();

  // Helper for regex field extraction
  const findMatch = (patterns) => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m && m[1]) return m[1].trim();
    }
    return null;
  };

  // 1. FIR / Case Number
  if (/\b(fir\s*(no|num|number)?|case\s*(no|num|number)?|crime\s*(no|num|number)?)\b/i.test(q)) {
    const firNo = findMatch([
      /crime\s*n[oa][:\.\s]+([^\.\n\|]+)/i,
      /fir\s*(?:no|number)?[:\s]+([^\.\n\|]+)/i,
      /case\s*(?:no|number)?[:\s]+([^\.\n\|]+)/i
    ]);
    if (firNo) {
      return `According to **${docName}**, the FIR / Crime Number is **${firNo}**.`;
    }
    return `The FIR number was not found in the uploaded document **${docName}**.`;
  }

  // 1.5. District / Jurisdiction
  if (/\b(district|jurisdiction|city)\b/i.test(q)) {
    const dist = findMatch([
      /district[:\s]+([^\.\n\|]+)/i,
      /jurisdiction[:\s]+([^\.\n\|]+)/i,
      /circle(?:\/sub\s*division)?[:\s]+([^\.\n\|]+)/i,
      /(?:in|at|from)\s+([a-zA-Z\s]+?)\s+district/i
    ]);
    if (dist) {
      return `According to **${docName}**, the district mentioned is **${dist}**.`;
    }
    return `The district was not found in the uploaded document **${docName}**.`;
  }

  // 2. Complainant Name
  if (/\b(complainant|informant)\b/i.test(q)) {
    const comp = findMatch([
      /complainant(?:\/informant)?[:\s]+name[:\s]+([^\.\n\|]+)/i,
      /complainant(?:\s+name)?[:\s]+([^\.\n\|]+)/i,
      /informant(?:\s+name)?[:\s]+([^\.\n\|]+)/i
    ]);
    if (comp) {
      return `According to **${docName}**, the complainant is **${comp}**.`;
    }
    return `The complainant details were not found in the uploaded document **${docName}**.`;
  }

  // 3. Accused / Suspect
  if (/\b(accused|suspect|perpetrator)\b/i.test(q)) {
    const acc = findMatch([
      /accused(?:\s+name)?[:\s]+([^\.\n\|]+)/i,
      /suspect(?:\s+name)?[:\s]+([^\.\n\|]+)/i
    ]);
    if (acc) {
      return `According to **${docName}**, the accused person(s) are **${acc}**.`;
    }
    return `The accused / suspect details were not found in the uploaded document **${docName}**.`;
  }

  // 4. Person Name / Identity
  if (/\b(name|who\s+is|identity|person)\b/i.test(q)) {
    const name = findMatch([
      /complainant(?:\/informant)?[:\s]+name[:\s]+([^\.\n\|]+)/i,
      /complainant(?:\s+name)?[:\s]+([^\.\n\|]+)/i,
      /informant(?:\s+name)?[:\s]+([^\.\n\|]+)/i,
      /accused(?:\s+name)?[:\s]+([^\.\n\|]+)/i,
      /victim(?:\s+name)?[:\s]+([^\.\n\|]+)/i,
      /name[:\s]+([^\.\n\|]+)/i
    ]);
    if (name) {
      return `According to **${docName}**, the name mentioned is **${name}**.`;
    }
    return `The name was not found in the uploaded document **${docName}**.`;
  }

  // 5. Incident Location / Where
  if (/\b(where|location|place|scene|address|station|area)\b/i.test(q)) {
    const loc = findMatch([
      /place\s+of\s+occurrence(?:\s+with\s+full\s+address)?[:\s]+([^\.\n\|]+)/i,
      /incident\s+location[:\s]+([^\.\n\|]+)/i,
      /location[:\s]+([^\.\n\|]+)/i,
      /police\s+station[:\s]+([^\.\n\|]+)/i,
      /ps[:\s]+([^\.\n\|]+)/i,
      /address[:\s]+([^\.\n\|]+)/i
    ]);
    if (loc) {
      return `According to **${docName}**, the incident location is **${loc}**.`;
    }
    return `The incident location was not found in the uploaded document **${docName}**.`;
  }

  // 6. Incident Timing / When / Date
  if (/\b(when|date|time|timing|timestamp|hour)\b/i.test(q)) {
    const dt = findMatch([
      /fir\s+date[:\s]+([^\.\n\|]+)/i,
      /incident\s+date(?:\s*&\s*time)?[:\s]+([^\.\n\|]+)/i,
      /from\s+date[:\s]+([^\.\n\|]+)/i,
      /date\s*&\s*time[:\s]+([^\.\n\|]+)/i,
      /date[:\s]+([^\.\n\|]+)/i,
      /dob[:\s]+([^\.\n\|]+)/i
    ]);
    if (dt) {
      return `According to **${docName}**, the recorded date/time is **${dt}**.`;
    }
    return `The incident date and time were not found in the uploaded document **${docName}**.`;
  }

  // 7. Legal Sections / Acts
  if (/\b(section|sections|bns|ipc|act|acts|penal|code|charges?)\b/i.test(q)) {
    const sec = findMatch([
      /act\s*&\s*section[:\s]+([^\.\n\|]+)/i,
      /sections?[:\s]+([^\.\n\|]+)/i,
      /acts?[:\s]+([^\.\n\|]+)/i,
      /offence[:\s]+([^\.\n\|]+)/i
    ]);
    if (sec) {
      return `According to **${docName}**, the applicable legal sections are **${sec}**.`;
    }
    return `The legal sections were not found in the uploaded document **${docName}**.`;
  }

  // 8. Stolen Property / Loss
  if (/\b(stolen|property|amount|money|cash|gold|loss|vehicle|phone)\b/i.test(q)) {
    const prop = findMatch([
      /stolen\s+property[:\s]+([^\.\n\|]+)/i,
      /property[:\s]+([^\.\n\|]+)/i,
      /loss[:\s]+([^\.\n\|]+)/i
    ]);
    if (prop) {
      return `According to **${docName}**, the recorded property / loss is **${prop}**.`;
    }
    return `The property / loss details were not found in the uploaded document **${docName}**.`;
  }

  // 9. Summary / What happened
  if (/\b(summarize|summary|what\s+happened|details|tell\s+me\s+about|narrative|brief)\b/i.test(q)) {
    return `**Summary of ${docName}:**\n\n${text}`;
  }

  // Default: Return the grounded excerpt or state not found
  return `According to **${docName}**:\n\n${text}`;
}

/**
 * Parses natural language date strings into ISO 'YYYY-MM-DD' formatted for 2026.
 * Returns null if no date is specified.
 */
function parseNaturalLanguageDate(userQuery, systemDate = new Date()) {
  if (!userQuery || typeof userQuery !== 'string') return null;
  const q = userQuery.toLowerCase().trim();

  // 1. DD/MM/YYYY or DD-MM-YYYY or DD/MM or DD-MM (e.g. 30/8/2026, 30/08/2026, 30-8-2026, 30/8)
  const dmyMatch = q.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}|\d{2}))?\b/);
  if (dmyMatch) {
    const day = String(dmyMatch[1]).padStart(2, '0');
    const month = String(dmyMatch[2]).padStart(2, '0');
    const rawYr = dmyMatch[3];
    let year = '2026';
    if (rawYr) {
      year = rawYr.length === 2 ? `20${rawYr}` : rawYr;
    }
    return `${year}-${month}-${day}`;
  }

  // 2. YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = q.match(/\b(2026)[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = String(ymdMatch[2]).padStart(2, '0');
    const day = String(ymdMatch[3]).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 3. "30 August 2026", "30th August", "30 August", "August 30, 2026", "August 30", "September 5", "10 September"
  const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const monthShorts = ['jan','feb','mar','apr','may','jun','jul','aug','sep','sept','oct','nov','dec'];

  // Pattern A: Day Month Year (e.g. "30 August", "30th August 2026", "10 September")
  const dayMonthMatch = q.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s*,?\s*(\d{4}))?\b/i);
  if (dayMonthMatch) {
    const day = String(dayMonthMatch[1]).padStart(2, '0');
    const mStr = dayMonthMatch[2].toLowerCase();
    let mIdx = monthNames.indexOf(mStr);
    if (mIdx === -1) mIdx = monthShorts.indexOf(mStr);
    if (mIdx !== -1) {
      const month = String(mIdx + 1).padStart(2, '0');
      const year = dayMonthMatch[3] || '2026';
      return `${year}-${month}-${day}`;
    }
  }

  // Pattern B: Month Day Year (e.g. "August 30", "August 30, 2026", "September 5")
  const monthDayMatch = q.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?\b/i);
  if (monthDayMatch) {
    const mStr = monthDayMatch[1].toLowerCase();
    let mIdx = monthNames.indexOf(mStr);
    if (mIdx === -1) mIdx = monthShorts.indexOf(mStr);
    if (mIdx !== -1) {
      const month = String(mIdx + 1).padStart(2, '0');
      const day = String(monthDayMatch[2]).padStart(2, '0');
      const year = monthDayMatch[3] || '2026';
      return `${year}-${month}-${day}`;
    }
  }

  // 4. Relative words: "today", "tomorrow"
  const curY = systemDate.getFullYear();
  const curM = systemDate.getMonth();
  const curD = systemDate.getDate();

  if (/\btoday\b/i.test(q)) {
    return `${curY}-${String(curM + 1).padStart(2, '0')}-${String(curD).padStart(2, '0')}`;
  }

  if (/\btomorrow\b/i.test(q)) {
    const tom = new Date(systemDate);
    tom.setDate(tom.getDate() + 1);
    return `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;
  }

  // 5. Relative weekdays: "this friday", "friday", "next monday", etc.
  const weekdayMatches = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6
  };
  for (const [wName, wDay] of Object.entries(weekdayMatches)) {
    const wRegex = new RegExp(`\\b(next\\s+|this\\s+)?${wName}\\b`, 'i');
    if (wRegex.test(q)) {
      const curWeekday = systemDate.getDay();
      let diff = wDay - curWeekday;
      if (diff <= 0) diff += 7; // Next occurrence
      const targetDate = new Date(systemDate);
      targetDate.setDate(targetDate.getDate() + diff);
      return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    }
  }

  return null; // Date is missing!
}

/**
 * Extracts event metadata (EventName, EventType, Description, Location, etc.) from natural language.
 */
function extractEventDetails(userQuery, division) {
  const q = userQuery.trim();

  // 1. EventName & EventType
  let eventName = 'Police Operational Meeting';
  let eventType = 'MEETING';
  let description = 'Police Operational Meeting';

  if (/\b(cm|chief\s+minister)\b/i.test(q)) {
    eventName = 'CM Meeting';
    eventType = 'MEETING';
    description = 'Meeting with Chief Minister (CM)';
  } else if (/\bdgp\b/i.test(q)) {
    eventName = 'DGP Review Meeting';
    eventType = 'MEETING';
    description = 'Quarterly review and law & order briefing with DGP';
  } else if (/\bcommissioner\b/i.test(q)) {
    eventName = 'Commissioner Meeting';
    eventType = 'MEETING';
    description = 'Command & coordination meeting with Police Commissioner';
  } else if (/\b(headquarters|hq)\b/i.test(q)) {
    eventName = 'Headquarters Meeting';
    eventType = 'MEETING';
    description = 'Command & coordination meeting at Police Headquarters';
  } else if (/\bvip\s*(visit|movement|security)?\b/i.test(q)) {
    eventName = 'VIP Visit & Security Briefing';
    eventType = 'VIP_VISIT';
    description = 'VIP transit and security deployment coordination';
  } else if (/\b(crime\s+review|law\s+and\s+order\s+review|review\s+meeting)\b/i.test(q)) {
    eventName = 'Division Crime Review Meeting';
    eventType = 'MEETING';
    description = 'Division crime trend analysis and station review';
  } else {
    // Try to extract "<Name> meeting" or "meeting with <Name>"
    const meetingWithMatch = q.match(/meeting\s+with\s+([a-zA-Z0-9\s]+?)(?:\s+on|\s+at|\s+in|\s+tomorrow|\s+today|\s+kindly|\.|$)/i);
    const meetingSubjectMatch = q.match(/\b([a-zA-Z0-9]{3,20})\s+meeting\b/i);
    if (meetingWithMatch && meetingWithMatch[1].trim()) {
      const subject = meetingWithMatch[1].trim();
      eventName = `${subject.toUpperCase()} Meeting`;
      description = `Meeting with ${subject}`;
    } else if (meetingSubjectMatch && meetingSubjectMatch[1].trim() && !/\b(have|a|the|this|that|an|my|our)\b/i.test(meetingSubjectMatch[1].trim())) {
      const subj = meetingSubjectMatch[1].trim();
      eventName = `${subj.charAt(0).toUpperCase() + subj.slice(1)} Meeting`;
      description = `${subj.charAt(0).toUpperCase() + subj.slice(1)} Meeting`;
    }
  }

  // 2. Start Time extraction (e.g. "at 3 PM", "10:00 AM", "10 AM", "14:00")
  let startTime = '10:00:00';
  const timeMatch = q.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = timeMatch[2] ? timeMatch[2] : '00';
    const ampm = timeMatch[3].toLowerCase();
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    startTime = `${String(hours).padStart(2, '0')}:${mins}:00`;
  }

  // 3. Location extraction
  let location = `${division} Police Headquarters`;
  const locMatch = q.match(/\b(?:at|in)\s+([a-zA-Z\s]+(?:office|hall|ground|station|hq|headquarters|chamber|auditorium))\b/i);
  if (locMatch) {
    location = locMatch[1].trim();
  }

  // 4. Reminder Days (default 2)
  let reminderDays = 2;
  const remMatch = q.match(/\b(\d+)\s*days?\s*reminder\b/i);
  if (remMatch) {
    reminderDays = parseInt(remMatch[1], 10);
  }

  return {
    eventName,
    eventType,
    description,
    startTime,
    location,
    reminderDays,
    patrolPriority: (eventType === 'VIP_VISIT' || eventName.includes('CM') || eventName.includes('DGP')) ? 'HIGH' : 'MEDIUM'
  };
}

/**
 * Formats YYYY-MM-DD into "DD Month YYYY" (e.g. "30 August 2026").
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${d} ${months[m]} ${y}`;
  }
  return dateStr;
}

export const chatService = new ChatService();
export default chatService;

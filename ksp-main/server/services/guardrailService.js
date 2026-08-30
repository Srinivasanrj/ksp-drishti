/**
 * 🛡️ KSP Sentinel AI — Guardrail & Safety Enforcement Service
 * 
 * Provides modular, deterministic input, context, evidence, and output validation:
 * 1. validateInput(message, context)
 * 2. validateResolvedContext(context)
 * 3. validateEvidence(evidenceFacts)
 * 4. validateOutput(answer, evidenceFacts, context)
 * 5. isCasualQuery(message)
 * 6. isOutOfScopeQuery(message)
 * 7. isPromptInjection(message)
 */

// ── 1. CASUAL PATTERNS ────────────────────────────────────────────────────────
const CASUAL_PATTERNS = [
  /^(hi+|hello+|hey+|howdy|heya|hiya|greetings|namaste|vanakkam)\b/i,
  /^good\s*(morning|afternoon|evening|night|day)\b/i,
  /^what'?s?\s*up\b/i,
  /^(sup|yo)\b/i,
  /^(thanks|thank\s*you|thank\s*u|ty|thx|many\s*thanks)\b/i,
  /^(bye|goodbye|cya|see\s*you|take\s*care)\b/i,
  /^(ok|okay|cool|great|awesome|understood|got\s*it|sure|alright|fine)\b/i,
  /^(who\s*are\s*you|what\s*(are|can)\s*you\s*do|help\s*me|what\s*is\s*(ksp|your\s*name)|introduce\s*yourself|what\s*is\s*your\s*purpose)\b/i,
  /^(how\s*are\s*you|how\s*do\s*you\s*work|tell\s*me\s*about\s*yourself)\b/i
];

// ── 2. PROMPT INJECTION & JAILBREAK PATTERNS ──────────────────────────────────
const PROMPT_INJECTION_PATTERNS = [
  /\bignore\s+(all\s+|your\s+|the\s+)?(previous|system|prior|above|safety)?\s*(instructions|prompts?|rules|commands?|context|guidelines|protocols)\b/i,
  /\b(reveal|show|print|display|dump|leak|output)\s+(me\s+)?(your|the|system)?\s*(system\s*prompt|initial\s*prompt|base\s*prompt|instructions|meta\s*prompt)\b/i,
  /\bwhat\s+(is|are)\s+(your|the)\s+(system\s*prompt|hidden\s*instructions|rules|initial\s*prompt)\b/i,
  /\b(show|reveal|print|give|get|leak|dump|provide)\s+(me\s+)?(the\s+)?(catalyst\s+|zoho\s+)?(api\s*key|access\s*token|refresh\s*token|client\s*secret|credentials?|password|auth\s*header|tokens?)\b/i,
  /\b(catalyst|zoho|oauth|secret)\s+(refresh\s*token|access\s*token|api\s*key|client\s*secret)\b/i,
  /\b(show|print|reveal|dump|read)\s+(the\s+)?(\.env|env\s*file|environment\s*variables?)\b/i,
  /\b(database|catalyst|zoho|postgresql|mysql|mongodb)\s*(credentials?|passwords?|connection\s*string|tokens?)\b/i,
  /\b(dan\s*mode|jailbreak|developer\s*mode\s*enabled|unfiltered\s*mode|bypass\s*filters?)\b/i,
  /\byou\s+are\s+now\s+(unrestricted|in\s+developer\s*mode|in\s+god\s*mode|free\s+of\s+rules)\b/i,
  /\b(system\s*override|override\s*system\s*instructions|disregard\s*rules)\b/i,
  /\b(show|reveal|leak|display)\s+.*(private|secret|unauthorized|other\s+division)\s*(calendar|events?|meetings?|chats?|conversations?)\b/i,
  /\bcat\s+(\/etc\/passwd|\.env|\/proc\/version)\b/i,
  /\bcurl\s+.*(metadata\.google|169\.254\.169\.254)\b/i,
  /\bprint\s+.*(process\.env|CATALYST_)\b/i
];

// ── 3. SENSITIVE SECRET & CREDENTIAL PATTERNS ─────────────────────────────────
const SENSITIVE_SECRET_PATTERNS = [
  /CATALYST_DATASTORE_REFRESH_TOKEN/i,
  /CATALYST_CLIENT_SECRET/i,
  /CATALYST_CLIENT_ID/i,
  /CATALYST_REFRESH_TOKEN/i,
  /CLIENT_SECRET/i,
  /ACCESS_TOKEN/i,
  /REFRESH_TOKEN/i,
  /Zoho-oauthtoken\s+[^\s]+/i,
  /\b1000\.[a-f0-9]{32}\.[a-f0-9]{32}\b/i, // Zoho OAuth Refresh Token format
  /\b1000\.[a-f0-9]{32}\b/i                // Zoho OAuth Client ID format
];

// ── 4. CRIME INTELLIGENCE TOPICAL KEYWORDS (ALLOWED DOMAIN) ───────────────────
const CRIME_TOPIC_PATTERNS = [
  /\b(crime|crimes|theft|robbery|burglary|murder|homicide|assault|snatching|chain\s*snatching|cyber|fraud|phishing|otp|counterfeit|currency|chit\s*fund|extortion|kidnapping|vandalism|pickpocket|smuggling|narcotics|drugs)\b/i,
  /\b(pattern|patterns|trends?|statistics|stats|hotspots?|locations?|localit(y|ies)|timing|time\s*pattern|modus\s*operandi|m\.?o\.?|offender|suspect|victim|demographics?|age|gender|profile|dossier|fir|cases?|incidents?|mutation|shift|baseline|30\s*days|last\s*30\s*days|historical)\b/i,
  /\b(ksp|police|interdiction|prevention|patrol|checkpoint|surveillance|arrests?|bengaluru|bangalore|mysuru|mysore|belagavi|belgaum|kalaburagi|gulbarga|kolar|udupi|manipal|mangalore|mangaluru|hubballi|dharwad|tumakuru|shivamogga|ballari|bidar|raichur|vijayapura|hassan|mandya|chikkamagaluru|chamarajanagar|davangere|koppal|gadag|bagalkot|haveri|yadgir|uttara\s*kannada|dakshina\s*kannada|kodagu|ramanagara|chikkaballapur)\b/i,
  /\b(compare|contrast|versus|vs\.?|difference\s+between|higher|lower|dominant|most\s*common|frequent)\b/i,
  /\b(why(\s+is\s+(it|that|this))?|what\s+causes?|reasons?|how\s+to\s+prevent|what\s+changed|tell\s+me\s+more|explain\s+(that|this|it)|summarize|summary|what\s+about)\b/i
];

// ── 5. OUT-OF-SCOPE DOMAIN PATTERNS (DISALLOWED) ──────────────────────────────
const OUT_OF_SCOPE_PATTERNS = [
  /\b(recipe|cook(ing)?|bake|baking|ingredients?|chocolate|cake|biryani|pasta|pizza|dessert|curry|soup|bread|dosa|idli|food|dish|tea|coffee|how\s+to\s+(make|cook|bake))\b/i,
  /\b(write\s+(a\s+)?(python|javascript|java|c\+\+|rust|php|ruby|html|css|sql)\s+(code|script|program|function)|leetcode|debug\s+my\s+code|fibonacci|binary\s*search)\b/i,
  /\b(movie\s*review|actor|actress|bollywood|hollywood|netflix|spotify|song\s*lyrics|chords|oscars?|celebrity\s*gossip|cinema|entertainment)\b/i,
  /\b(weather|climate|forecast|temperature|rain|raining|monsoon|cloudy|sunny|humidity|storm|cyclone|horoscope|zodiac|astrology|tarot)\b/i,
  /\b(symptoms?\s+of|cure\s+for|medical\s*advice|diagnose\s+my|dosage\s+of|prescription|disease|doctor|medicine|health\s*tips)\b/i,
  /\b(crypto(currency)?|bitcoin|ethereum|buy\s+stocks?|stock\s*market|forex\s*trading|nft|trading\s*strategy)\b/i,
  /\b(capital\s+of|who\s+won\s+the|who\s+is\s+the\s+president|who\s+was\s+napoleon|how\s+far\s+is\s+the\s+moon|cricket\s*score|football\s*score|world\s*cup|ipl|super\s*bowl)\b/i,
  /\b(tell\s+me\s+a\s+joke|write\s+a\s+(poem|essay|story|song)|play\s+a\s+game|riddle)\b/i,
  /\b(flight\s*booking|hotel\s*booking|train\s*status|irctc|tourism\s*packages|best\s*places\s*to\s*visit)\b/i
];

const FOLLOW_UP_PATTERNS = [
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

export function isFollowUp(query) {
  if (!query) return false;
  return FOLLOW_UP_PATTERNS.some(p => p.test(query.trim()));
}

/**
 * 1. Check if message is a casual conversation query (greeting, capability, etc.)
 * @param {string} message
 * @returns {boolean}
 */
export function isCasualQuery(message) {
  if (!message || typeof message !== 'string') return false;
  const q = message.trim();
  return CASUAL_PATTERNS.some(p => p.test(q));
}

/**
 * 2. Check if message is a prompt injection or security exploitation attempt
 * @param {string} message
 * @returns {boolean}
 */
export function isPromptInjection(message) {
  if (!message || typeof message !== 'string') return false;
  const q = message.trim();
  return PROMPT_INJECTION_PATTERNS.some(p => p.test(q));
}

// ── District and Query Classification Helpers ──────────────────────────────
const DISTRICT_PATTERN = /\b(bengaluru(\s+urban|\s+rural)?|bangalore|mysuru|mysore|belagavi|belgaum|kalaburagi|gulbarga|kolar|udupi|manipal|mangalore|mangaluru|hubballi|dharwad|tumakuru|tumkur|shivamogga|shimoga|ballari|bellary|bidar|raichur|vijayapura|bijapur|hassan|mandya|chikkamagaluru|chikmagalur|chamarajanagar|davangere|koppal|gadag|bagalkot|haveri|yadgir|uttara\s*kannada|dakshina\s*kannada|kodagu|coorg|ramanagara|chikkaballapur)\b/i;

const GENERAL_CRIME_INQUIRY_PATTERNS = [
  /\bhighest\s+crime\b/i,
  /\bdominant\s+crime(s)?\b/i,
  /\btop\s+crime(s)?\b/i,
  /\bmost\s+common\s+crime(s)?\b/i,
  /\bcrime\s+trend(s)?\b/i,
  /\bcrime\s+statistic(s)?\b/i,
  /\bcrime(s)?\s+in\s+[a-z]+/i,
  /\bhotspot(s)?\s+in\s+[a-z]+/i,
  /\bcompare\s+[a-z]+\s+(and|vs|versus)\s+[a-z]+/i,
  /\bwhich\s+district\s+has\s+the\s+highest\b/i,
  /\bwhich\s+district\b/i,
  /\bshow\s+crime\b/i,
  /\bchain\s+snatching\s+high\s+in\b/i,
  /\bwhy\s+is\s+.+\s+high\s+in\s+[a-z]+/i,
  /\blast\s*30\s*days\b/i,
  /\b30\s*days\s*trend\b/i,
  /\bbehavioral\s+profile\b/i
];

const DOC_ANCHOR_PATTERNS = [
  /\b(in\s+this|from\s+this|in\s+the|from\s+the|according\s+to\s+the|based\s+on\s+the)\s+(fir|document|uploaded\s*file|file|image|photo|report|record)\b/i,
  /\b(the\s+uploaded|uploaded\s+(fir|file|document|image|photo|pdf))\b/i,
  /\bwhat\s+does\s+\S+\.(webp|jpg|jpeg|png|pdf)\s+say\b/i,
  /\b(summarize|summary|overview|brief|details)\b.*\b(fir|document|uploaded|file|case)\b/i,
  /\b(give\s+)?summary(\s+of\s+(this\s+)?(fir|document|file|case))?\b/i,
  /^summary$/i,
  /^summarize$/i,
  /\bgive\s+(me\s+)?summary\b/i,
  /\bwhat\s+is\s+this\s+(fir|document|case|file)\s+about\b/i
];

const DOC_FIELD_PATTERNS = [
  /\b(who\s+is\s+the\s+accused|accused\s*name|name\s+of\s+accused|suspect\s*name|who\s+is\s+the\s+suspect)\b/i,
  /\b(who\s+is\s+the\s+complainant|complainant\s*name|informant\s*name|who\s+reported|complainant\s+details)\b/i,
  /\b(what\s+sections?|which\s+sections?|sections?\s+mentioned|what\s+section\s+was\s+applied|charged\s+under|ipc\s+sections?|bns\s+sections?|legal\s+sections?)\b/i,
  /\b(fir\s*(no\.?|num|number)|crime\s*(no\.?|num|number)|case\s*(no\.?|num|number))\b/i,
  /\b(incident\s+date|what\s+is\s+the\s+date|date\s+of\s+incident|when\s+did\s+it\s+happen|time\s+of\s+incident|date\s+mentioned)\b/i,
  /\b(place\s+of\s+occurrence|where\s+did\s+it\s+happen|incident\s+location|station\s+name|which\s+police\s+station|doddapete)\b/i,
  /\b(what\s+is\s+name|what\s+is\s+the\s+name|name\s+mentioned|person\s+name)\b/i,
  /\b(what\s+was\s+stolen|stolen\s+property|property\s+stolen|loss\s+amount|value\s+of\s+property)\b/i,
  /\b(what\s+happened\s+in\s+the\s+fir|summary\s+of\s+this\s+fir|details\s+of\s+this\s+fir)\b/i
];

const CALENDAR_ADVISORY_PATTERNS = [
  /\b(patrol\s+teams?\s+do|patrol\s+advisory|operational\s+advisory|increase(d)?\s+patrols?\s+during|why\s+should\s+patrols?\s+be\s+increased|patrol\s+recommendation|patrol\s+strategy\s+for\s+(this\s+)?(festival|holiday|event|celebration))\b/i,
  /\b(security\s+plan|advisory\s+for\s+(ganesh|dasara|deepavali|eid|ugadi|festival|holiday|event))\b/i,
  /\b(how\s+should\s+we\s+deploy\s+police|which\s+events\s+require\s+(increased\s+)?patrol|deployment\s+plan\s+for\s+(this\s+)?(festival|event))\b/i
];

const CALENDAR_MUTATION_PATTERNS = {
  CREATE: [
    /\b(add|create|schedule|set\s*up|book|put|save|insert|register|mark)\s+.*(meeting|event|briefing|visit|session|conference|appointment|gathering|parade|inspection|bandobast|deployment)\b/i,
    /\b(meeting|event|briefing|visit|session|conference|appointment|gathering|parade|inspection|bandobast|deployment)\s+.*(schedule\s+it|add\s+it|book\s+it|put\s+it|save\s+it|create\s+it|schedule\s+this|add\s+this)\b/i,
    /\b(i\s+have|we\s+have|there\s+is|got)\s+.*(meeting|event|briefing|visit|session|conference|appointment|gathering|parade|inspection|bandobast|deployment)\b/i,
    /\b(kindly|please)?\s*(update|add|put|save|insert|mark|set)\s+(this\s+)?(in|into|to|on)\s+(the\s+|my\s+|our\s+)?calendar\b/i,
    /\b(add|schedule|put|save|mark|set)\s+.*(to|in|on)\s+(my\s+|the\s+|our\s+)?calendar\b/i,
    /\b(schedule\s+it|schedule\s+this|add\s+this\s+event|add\s+event|add\s+meeting|create\s+event)\b/i,
    /\b(meeting\s+with|visit\s+by|visit\s+of|inspection\s+by)\b/i,
    /\badd\s+(a\s+)?(new\s+)?(event|meeting)\b/i
  ],
  UPDATE: [
    /\b(change|reschedule|update|move|postpone)\s+(the\s+)?(dgp|cm|commissioner|vip|police|division|review|patrol|operational)?\s*(meeting|event|briefing|visit|deployment)\b/i
  ],
  DELETE: [
    /\b(remove|delete|cancel|drop)\s+(the\s+|tomorrow'?s\s+|upcoming\s+)?(dgp|cm|commissioner|vip|police|division|review|patrol|operational)?\s*(meeting|event|briefing|visit|deployment)\b/i
  ],
  REMINDER: [
    /\bremind\s+me\s+about\b/i,
    /\b(what\s+are\s+(my\s+)?(event\s+)?reminders|any\s+(upcoming\s+)?reminders|show\s+reminders)\b/i
  ]
};

const CALENDAR_QUERY_PATTERNS = [
  /\b(what\s+(festivals?|holidays?|karnataka\s+holidays?|government\s+events?|police\s+events?|events?)\s+(are\s+coming\s+up|are\s+next|are\s+in\s+the\s+calendar|are\s+happening|this\s+week|this\s+month|in\s+[a-z]+))\b/i,
  /\b(what\s+events?\s+(are\s+)?(on|scheduled\s+on|for)\b)/i,
  /\b(events?\s+(on|for)\s+[a-z0-9\/\-]+)\b/i,
  /\b(what\s+events?\s+are\s+on\b)/i,
  /\b(when\s+is\s+the\s+next\s+(karnataka\s+)?(holiday|festival|government\s+event|event))\b/i,
  /\b(upcoming\s+(festivals?|holidays?|karnataka\s+holidays?|events?|police\s+events?|meetings?))\b/i,
  /\b(karnataka\s+calendar|official\s+calendar|karnataka\s+holidays?|festivals?\s+in\s+karnataka|holiday\s+calendar)\b/i,
  /\b(what\s+is\s+happening\s+in\s+(bengaluru|mysuru|belagavi|kalaburagi|kolar|karnataka)\s+(this\s+week|today|tomorrow|next\s+week|on\s+[a-z0-9\/\-]+))\b/i,
  /\b(are\s+there\s+any\s+(karnataka\s+)?(festivals?|holidays?|events?)\s+(today|tomorrow|this\s+week|on\s+[a-z0-9\/\-]+))\b/i,
  /\b(show|view|list|check)\s+(the\s+)?(calendar|events|holidays|festivals|schedule)\b/i,
  /\b(what\s+festivals\s+are\s+coming\s+up|what\s+karnataka\s+holidays\s+are\s+next|what\s+events\s+are\s+in\s+the\s+calendar)\b/i
];

/**
 * Explicit Query & Context Classifier
 * Returns one of:
 * - 'SECURITY_BLOCK'
 * - 'CASUAL'
 * - 'OUT_OF_SCOPE'
 * - 'CALENDAR_OPERATIONAL_ADVISORY'
 * - 'CREATE_EVENT'
 * - 'UPDATE_EVENT'
 * - 'DELETE_EVENT'
 * - 'EVENT_REMINDER_QUERY'
 * - 'CALENDAR_QUERY'
 * - 'MIXED'
 * - 'DOCUMENT'
 * - 'GENERAL_CRIME'
 */
export function classifyQuery(query, uploadedDoc = null, context = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return 'OUT_OF_SCOPE';
  }

  const q = query.trim();

  // 1. Prompt Injection / Security Check
  if (isPromptInjection(q)) {
    return 'SECURITY_BLOCK';
  }

  // Check for unauthorized cross-division event exfiltration attempts
  if (/\b(ignore\s+(your\s+)?(rules|instructions|protocols|safety|system)|reveal|show\s+all|leak)\b.*\b(private\s+meetings?|other\s+divisions?|secret\s+events?|mysuru|belagavi|kalaburagi|bengaluru)\b/i.test(q)) {
    return 'SECURITY_BLOCK';
  }

  // Check for unauthorized cross-division or Head division conversation history extraction attempts
  if (/\b(what\s+did\s+(the\s+)?(head|other|previous|another)\s*(division\s+)?(just\s+|recently\s+)?(talk|say|ask|discuss|chat)|(head|other\s+division)'?s\s+(chat|conversation|history|memory))\b/i.test(q)) {
    return 'SECURITY_BLOCK';
  }

  // 2. Casual Greeting / Identity Check
  if (isCasualQuery(q)) {
    return 'CASUAL';
  }

  // 3. Out of Scope Check (recipes, sports, weather, crypto, etc.)
  if (OUT_OF_SCOPE_PATTERNS.some(p => p.test(q))) {
    return 'OUT_OF_SCOPE';
  }

  // ── 3.1. CALENDAR & EVENT INTELLIGENCE CHECKS ──────────────────────────────
  if (CALENDAR_ADVISORY_PATTERNS.some(p => p.test(q))) {
    return 'CALENDAR_OPERATIONAL_ADVISORY';
  }

  if (CALENDAR_MUTATION_PATTERNS.CREATE.some(p => p.test(q))) {
    return 'CREATE_EVENT';
  }

  if (CALENDAR_MUTATION_PATTERNS.UPDATE.some(p => p.test(q))) {
    return 'UPDATE_EVENT';
  }

  if (CALENDAR_MUTATION_PATTERNS.DELETE.some(p => p.test(q))) {
    return 'DELETE_EVENT';
  }

  if (CALENDAR_MUTATION_PATTERNS.REMINDER.some(p => p.test(q))) {
    return 'EVENT_REMINDER_QUERY';
  }

  if (CALENDAR_QUERY_PATTERNS.some(p => p.test(q))) {
    return 'CALENDAR_QUERY';
  }

  const hasDistrict = DISTRICT_PATTERN.test(q);
  const isGeneralCrimeInquiry = GENERAL_CRIME_INQUIRY_PATTERNS.some(p => p.test(q));
  const isComparison = /\b(compare|versus|vs\.?|difference\s+between)\b/i.test(q);
  const hasDocAnchor = DOC_ANCHOR_PATTERNS.some(p => p.test(q));
  const hasDocField = DOC_FIELD_PATTERNS.some(p => p.test(q));

  // 4. MIXED Query Check:
  // e.g. "Based on the FIR, what crime occurred and how common is that crime in Bengaluru?"
  if (uploadedDoc && hasDocAnchor && (hasDistrict || isGeneralCrimeInquiry || isComparison)) {
    return 'MIXED';
  }

  // 5. GENERAL CRIME takes priority if the query is a district crime statistical question or comparison
  if ((hasDistrict && isGeneralCrimeInquiry) || isComparison || (hasDistrict && !hasDocAnchor && !hasDocField)) {
    return 'GENERAL_CRIME';
  }

  // 6. DOCUMENT Query Check:
  if (uploadedDoc) {
    // Explicit doc anchor
    if (hasDocAnchor) {
      return 'DOCUMENT';
    }

    // Explicit doc field without an overriding general crime inquiry
    if (hasDocField && !isGeneralCrimeInquiry && !isComparison) {
      return 'DOCUMENT';
    }

    // Follow-up on a previous document turn
    const prevTurnWasDoc = context?.conversationTopic?.topicType === 'document_qa' || context?.conversationTopic?.lastIntent === 'document_qa';
    if (prevTurnWasDoc && !hasDistrict && !isGeneralCrimeInquiry && !isComparison) {
      if (/\b(section|name|who|where|when|date|time|station|age|caste|religion|occupation|accused|complainant|witness|stolen|amount|why|details|officer|suspect)\b/i.test(q)) {
        return 'DOCUMENT';
      }
    }
  }

  // 7. General Crime Intelligence domain match
  if (CRIME_TOPIC_PATTERNS.some(p => p.test(q)) || hasDistrict || isGeneralCrimeInquiry) {
    return 'GENERAL_CRIME';
  }

  // 8. Follow-up on active crime topic
  const hasActiveCrimeTopic = context?.conversationTopic?.topicType && context.conversationTopic.topicType !== 'document_qa' && context.conversationTopic.topicType !== 'general';
  if (hasActiveCrimeTopic && isFollowUp(q)) {
    return 'GENERAL_CRIME';
  }

  // If uploadedDoc exists and message is asking a specific question without district/comparison, default to DOCUMENT
  if (uploadedDoc && !hasDistrict && !isGeneralCrimeInquiry && !isComparison) {
    return 'DOCUMENT';
  }

  return 'GENERAL_CRIME';
}

export function isDocumentQuery(query, uploadedDoc, context = {}) {
  if (!uploadedDoc) return false;
  return classifyQuery(query, uploadedDoc, context) === 'DOCUMENT';
}

/**
 * 3. Check if message is outside the supported crime intelligence domain
 * @param {string} message
 * @param {Object} [context={}]
 * @returns {boolean}
 */
export function isOutOfScopeQuery(message, context = {}) {
  if (!message || typeof message !== 'string') return true;
  const uploadedDoc = context?.uploadedDocument || context?.conversationTopic?.uploadedDocument || null;
  const classification = classifyQuery(message, uploadedDoc, context);
  return classification === 'OUT_OF_SCOPE';
}

/**
 * 4. Validate incoming user input message
 * @param {string} message
 * @param {Object} [context={}]
 * @returns {{ allowed: boolean, reason: string|null, category: string }}
 */
export function validateInput(message, context = {}) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return {
      allowed: false,
      reason: 'Message content is required.',
      category: 'invalid_input'
    };
  }

  const cleanMessage = message.trim();

  // Check Prompt Injection
  if (isPromptInjection(cleanMessage)) {
    return {
      allowed: false,
      reason: 'Security violation: prompt injection, system instruction extraction, or credential exfiltration detected.',
      category: 'prompt_injection'
    };
  }

  // Check Casual Query
  if (isCasualQuery(cleanMessage)) {
    return {
      allowed: true,
      reason: null,
      category: 'casual'
    };
  }

  // Check Out of Scope Query
  if (isOutOfScopeQuery(cleanMessage, context)) {
    return {
      allowed: false,
      reason: 'This question is outside the supported scope of Karnataka State Police crime intelligence analysis.',
      category: 'out_of_scope'
    };
  }

  // Valid Crime Intelligence Query
  return {
    allowed: true,
    reason: null,
    category: 'crime_intelligence'
  };
}

/**
 * 5. Validate resolved conversational context before processing
 * @param {Object} context
 * @returns {{ allowed: boolean, reason: string|null, category: string }}
 */
export function validateResolvedContext(context) {
  if (!context || typeof context !== 'object') {
    return {
      allowed: true,
      reason: null,
      category: 'valid_context'
    };
  }

  const topic = context.conversationTopic || {};

  // Validate comparison topic coherence (Requirement 6)
  if (topic.topicType === 'comparison') {
    const districts = Array.isArray(topic.districts) ? topic.districts : [];
    if (districts.length < 2) {
      return {
        allowed: false,
        reason: 'Incoherent comparison context: expected at least 2 comparison jurisdictions but found only 1.',
        category: 'invalid_context'
      };
    }
  }

  return {
    allowed: true,
    reason: null,
    category: 'valid_context'
  };
}

/**
 * 6. Validate retrieved evidence facts before sending to LLM
 * @param {string} evidenceFacts
 * @returns {{ allowed: boolean, reason: string|null, category: string }}
 */
export function validateEvidence(evidenceFacts) {
  if (!evidenceFacts || typeof evidenceFacts !== 'string' || evidenceFacts.trim().length === 0) {
    return {
      allowed: false,
      reason: 'Insufficient verified crime data for this question.',
      category: 'insufficient_evidence'
    };
  }

  const clean = evidenceFacts.trim().toLowerCase();

  if (
    clean === 'no specific intelligence facts available for this query.' ||
    clean === 'no specific intelligence facts available.' ||
    clean.includes('no specific location hotspots documented') ||
    clean.includes('no recorded synthetic cases found') ||
    clean.includes('no recorded cases found') ||
    clean.includes('0 matching cases') ||
    clean.includes('0 documented cases') ||
    clean.includes('0 total cases') ||
    clean.length < 15
  ) {
    return {
      allowed: false,
      reason: 'Insufficient verified crime data for this question.',
      category: 'insufficient_evidence'
    };
  }

  return {
    allowed: true,
    reason: null,
    category: 'sufficient_evidence'
  };
}

/**
 * 7. Validate LLM generated output response before returning to user
 * @param {string} answer
 * @param {string} [evidenceFacts='']
 * @param {Object} [context={}]
 * @returns {{ allowed: boolean, reason: string|null, category: string }}
 */
export function validateOutput(answer, evidenceFacts = '', context = {}) {
  if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
    return {
      allowed: false,
      reason: 'Generated response is empty.',
      category: 'empty_response'
    };
  }

  // 1. Secret & Credential Leakage Check (Requirement 5 & 8)
  for (const secretPattern of SENSITIVE_SECRET_PATTERNS) {
    if (secretPattern.test(answer)) {
      return {
        allowed: false,
        reason: 'Security violation: potential credential, token, or secret exposure detected in generated output.',
        category: 'secret_leak'
      };
    }
  }

  // 2. System Instruction Leakage Check
  const systemEchoPatterns = [
    /You are a senior crime intelligence analyst/i,
    /Verified Intelligence Facts:/i,
    /naturalPrompt/i,
    /templateInstruction/i,
    /Produce a structured intelligence briefing/i
  ];
  for (const echoPattern of systemEchoPatterns) {
    if (echoPattern.test(answer)) {
      return {
        allowed: false,
        reason: 'System instruction exposure detected in generated response.',
        category: 'system_prompt_leak'
      };
    }
  }

  // 3. Unsupported / Fabricated Database Claims (Requirement 8)
  const fabricatedClaims = [
    /\b(according\s+to|accessing|querying)\s+(aadhaar|uidai)\s*(database|records?)/i,
    /\b(cbi|interpol|raw|fbi|cia)\s+(national\s+)?(central\s+database|classified\s+server)/i,
    /\baccessing\s+(banking\s+network|live\s+cctv\s+feeds?|intercepting\s+phone\s+calls?)/i
  ];
  for (const fabPattern of fabricatedClaims) {
    if (fabPattern.test(answer)) {
      return {
        allowed: false,
        reason: 'Response contains unsupported claims regarding external database or surveillance access.',
        category: 'unsupported_claims'
      };
    }
  }

  const efClean = (evidenceFacts || '').toLowerCase();

  // 4. Unsupported Causal & Motivation Speculation (Strict Evidence Grounding)
  if (evidenceFacts && evidenceFacts.trim().length > 0) {
    const unsupportedCausalPatterns = [
      /\b(exploits?\s+the\s+trust\s+dynamics|provides?\s+a\s+cover\s+of\s+darkness|high\s+cash\s+turnover\s+makes|vehicles?\s+are\s+frequently\s+left\s+unattended|target\s+cash-rich\s+businesses|exploit\s+financially\s+desperate|fewer\s+witnesses\s+allow|because\s+it\s+has\s+many\s+vulnerable\s+shopkeepers|because\s+there\s+are\s+fewer\s+witnesses|offenders?\s+choose\s+.*because|offenders?\s+target\s+.*because\s+they\s+are\s+vulnerable)\b/i
    ];

    for (const causalPattern of unsupportedCausalPatterns) {
      if (causalPattern.test(answer) && !causalPattern.test(efClean)) {
        return {
          allowed: false,
          reason: 'Response contains unsupported causal or motivational claims not established by verified evidence.',
          category: 'unsupported_causal_explanation'
        };
      }
    }
  }

  // 5. Unsupported Percentage Statistics Grounding Check
  if (evidenceFacts && evidenceFacts.trim().length > 0) {
    const percentageMatches = answer.match(/\b(\d{1,3})%/g) || [];
    for (const pMatch of percentageMatches) {
      const numStr = pMatch.replace('%', '');
      if (!efClean.includes(pMatch) && !efClean.includes(`${numStr}%`) && !efClean.includes(numStr)) {
        return {
          allowed: false,
          reason: `Response contains unsupported percentage (${pMatch}) not established by evidence facts.`,
          category: 'unsupported_statistic'
        };
      }
    }
  }

  return {
    allowed: true,
    reason: null,
    category: 'verified_output'
  };
}

export const guardrailService = {
  validateInput,
  validateResolvedContext,
  validateEvidence,
  validateOutput,
  isCasualQuery,
  isOutOfScopeQuery,
  isPromptInjection,
  isDocumentQuery,
  classifyQuery
};

export default guardrailService;

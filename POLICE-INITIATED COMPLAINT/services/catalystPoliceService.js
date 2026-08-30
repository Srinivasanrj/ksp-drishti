/**
 * ZOHO CATALYST DATASTORE AUTOMATIC POLICE-INITIATED COMPLAINT SYNC SERVICE
 * Handles real-time INSERT, UPDATE, and ZCQL query execution for PoliceInitiatedComplaints table.
 */

import { savePoliceComplaint, getPoliceComplaints } from '../dataset/police_complaint_catalyst_dataset';

/**
 * Automatically pushes new police-initiated / suo-motu case to Catalyst DataStore
 */
export async function pushPoliceCaseToCatalyst(caseData) {
  console.log('📡 Pushing Police-Initiated Case to Catalyst DataStore...', caseData.CaseId || caseData.id);

  // 1. Save to local synchronized state engine
  const savedRecord = savePoliceComplaint(caseData);

  // 2. Call the live Zoho Catalyst Serverless Function endpoint (with automatic cloud retry fallback)
  try {
    const PROXY_URL = '/catalyst-api/server/submit_police_case/';
    const DIRECT_CLOUD_URL = 'https://kspcrimeintelligenceplatform-60077159195.development.catalystserverless.in/server/submit_police_case/';

    // Prepare sanitized payload strictly matching Catalyst PoliceInitiatedComplaints schema
    const catalystPayload = {
      CaseId: String(savedRecord.CaseId || 'KSP-POL-2026-00000'),
      FirNumber: String(savedRecord.FirNumber || 'FIR-2026-BLR-0000'),
      OfficerBadge: String(savedRecord.OfficerBadge || 'KGID-00000'),
      OfficerName: String(savedRecord.OfficerName || 'Duty Officer'),
      OfficerRank: String(savedRecord.OfficerRank || 'Police Sub-Inspector (PSI)'),
      Division: String(savedRecord.Division || 'Bengaluru'),
      SubDivision: String(savedRecord.SubDivision || 'Bengaluru Urban'),
      PoliceStation: String(savedRecord.PoliceStation || 'Central PS'),
      BeatUnit: String(savedRecord.BeatUnit || 'Beat Sector 1'),
      CrimeCategory: String(savedRecord.CrimeCategory || 'Spot Operation'),
      IncidentDate: String(savedRecord.IncidentDate || new Date().toISOString().split('T')[0]),
      SpotLocation: String(savedRecord.SpotLocation || 'Karnataka'),
      SpotNarrative: String(savedRecord.SpotNarrative || 'Patrol discovery logged.'),
      SuspectStatus: String(savedRecord.SuspectStatus || 'Apprehended'),
      SuspectName: String(savedRecord.SuspectName || 'Unknown Accused'),
      SuspectDetails: String(savedRecord.SuspectDetails || 'N/A'),
      SeizedItems: String(savedRecord.SeizedItems || 'No property listed'),
      SeizureValue: String(savedRecord.SeizureValue || '0'),
      PanchaWitness: String(savedRecord.PanchaWitness || 'Independent Witness'),
      EvidenceCount: String(savedRecord.EvidenceCount || '1'),
      CaseStatus: String(savedRecord.CaseStatus || 'ACCUSED_IN_CUSTODY'),
      FilingTimestamp: String(savedRecord.FilingTimestamp || new Date().toISOString()),
      InvestigationSummary: String(savedRecord.InvestigationSummary || 'Officer initiated investigation on spot under BNSS Sec 105.')
    };

    console.log('🚀 Sending Police Case payload to Catalyst Cloud Function...', catalystPayload);

    let response;
    try {
      response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catalystPayload)
      });
    } catch (proxyErr) {
      console.warn('Proxy route unavailable for police case, falling back to direct cloud endpoint...', proxyErr);
    }

    if (!response || !response.ok) {
      response = await fetch(DIRECT_CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catalystPayload)
      });
    }

    if (response && response.ok) {
      const data = await response.json();
      console.log('🎉 SUCCESS! Catalyst PoliceInitiatedComplaints row written. Result:', data);
      return { success: true, record: savedRecord, cloudResult: data };
    } else {
      console.warn('Catalyst server response status:', response?.status);
    }
  } catch (cloudErr) {
    console.warn('⚠️ Catalyst Cloud API call error (Offline persistence preserved):', cloudErr);
  }
}

/**
 * Automatically updates case status in Catalyst DataStore (e.g. from ACCUSED_IN_CUSTODY to REMAND_EXTENDED or CHARGESHEET_FILED)
 */
export async function updatePoliceCaseInCatalyst(caseIdOrFir, updates = {}) {
  console.log('🔄 Updating Police Case in Catalyst DataStore:', caseIdOrFir, updates);

  const records = getPoliceComplaints();
  const index = records.findIndex(r => r.CaseId === caseIdOrFir || r.FirNumber === caseIdOrFir);

  if (index !== -1) {
    records[index] = { ...records[index], ...updates };
    try {
      localStorage.setItem('ksp_police_initiated_cases_v1', JSON.stringify(records));
      window.dispatchEvent(new CustomEvent('ksp-police-case-updated', { detail: { updated: records[index] } }));
    } catch (e) {}

    // Cloud ZCQL Update
    try {
      if (typeof window !== 'undefined' && window.catalyst && window.catalyst.zcql) {
        const updateSet = Object.entries(updates)
          .map(([k, v]) => `${k} = '${String(v).replace(/'/g, "''")}'`)
          .join(', ');
        
        await window.catalyst.zcql().executeZCQLQuery(
          `UPDATE PoliceInitiatedComplaints SET ${updateSet} WHERE CaseId = '${records[index].CaseId}'`
        );
        console.log('✅ Catalyst Cloud update completed for Police Case:', records[index].CaseId);
      }
    } catch (cloudErr) {
      console.warn('Catalyst ZCQL update warning:', cloudErr);
    }

    return records[index];
  }

  return null;
}

export default {
  pushPoliceCaseToCatalyst,
  updatePoliceCaseInCatalyst
};

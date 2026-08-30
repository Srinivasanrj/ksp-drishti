/**
 * ZOHO CATALYST DATASTORE AUTOMATIC COMPLAINT SYNC SERVICE
 * Handles real-time INSERT, UPDATE, and ZCQL query execution for EComplaints table.
 */

import { saveEComplaint, getEComplaints } from '../dataset/e_complaint_catalyst_dataset';

/**
 * Automatically pushes new complaint record to Catalyst DataStore
 */
export async function pushComplaintToCatalyst(complaintData) {
  console.log('📡 Pushing new complaint record to Catalyst DataStore...', complaintData.ComplaintId || complaintData.id);

  // 1. Save to local synchronized state engine
  const savedRecord = saveEComplaint(complaintData);

  // 2. Call the live Zoho Catalyst Serverless Function endpoint (with automatic cloud retry fallback)
  try {
    const PROXY_URL = '/catalyst-api/server/submit_complaint/';
    const DIRECT_CLOUD_URL = 'https://kspcrimeintelligenceplatform-60077159195.development.catalystserverless.in/server/submit_complaint/';
    
    // Prepare sanitized payload strictly matching Catalyst EComplaints schema
    const catalystPayload = {
      ComplaintId: String(savedRecord.ComplaintId || 'KSP-EC-2026-00000'),
      FirNumber: String(savedRecord.FirNumber || 'FIR-2026-BLR-0000'),
      ComplainantName: String(savedRecord.ComplainantName || 'Citizen Applicant'),
      Mobile: String(savedRecord.Mobile || '9999999999'),
      Email: String(savedRecord.Email || ''),
      Division: String(savedRecord.Division || 'Bengaluru'),
      SubDivision: String(savedRecord.SubDivision || 'Bengaluru Urban'),
      PoliceStation: String(savedRecord.PoliceStation || 'Bengaluru Urban Main PS'),
      CrimeCategory: String(savedRecord.CrimeCategory || 'Reported E-Complaint'),
      IncidentDate: String(savedRecord.IncidentDate || new Date().toISOString().split('T')[0]),
      IncidentLocation: String(savedRecord.IncidentLocation || 'Karnataka'),
      ComplaintDescription: String(savedRecord.ComplaintDescription || 'E-Complaint filed by citizen.'),
      ComplaintStatus: String(savedRecord.ComplaintStatus || 'REGISTERED'),
      FilingTimestamp: String(savedRecord.FilingTimestamp || new Date().toISOString())
    };

    console.log('🚀 Sending sanitized payload to Catalyst Cloud Function...', catalystPayload);
    
    let response;
    try {
      response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catalystPayload)
      });
    } catch (proxyErr) {
      console.warn('Proxy route unavailable, falling back to direct cloud endpoint...', proxyErr);
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
      console.log('🎉 SUCCESS! Catalyst Cloud Database row written. Result:', data);
      return { success: true, record: savedRecord, cloudResult: data };
    } else {
      console.warn('Catalyst server response status:', response?.status);
    }
  } catch (cloudErr) {
    console.warn('⚠️ Catalyst Cloud API call error (Offline persistence preserved):', cloudErr);
  }

  return { success: true, record: savedRecord, source: 'local_synced' };
}

/**
 * Automatically updates an existing complaint status in Catalyst DataStore
 */
export async function updateComplaintInCatalyst(complaintIdOrFir, updates = {}) {
  console.log('🔄 Updating complaint in Catalyst DataStore:', complaintIdOrFir, updates);

  const records = getEComplaints();
  const index = records.findIndex(r => r.ComplaintId === complaintIdOrFir || r.FirNumber === complaintIdOrFir);

  if (index !== -1) {
    records[index] = { ...records[index], ...updates };
    try {
      localStorage.setItem('ksp_e_complaints_records_v1', JSON.stringify(records));
      window.dispatchEvent(new CustomEvent('ksp-ecomplaint-updated', { detail: { updated: records[index] } }));
    } catch (e) {}

    // Cloud ZCQL Update
    try {
      if (typeof window !== 'undefined' && window.catalyst && window.catalyst.zcql) {
        const updateSet = Object.entries(updates)
          .map(([k, v]) => `${k} = '${String(v).replace(/'/g, "''")}'`)
          .join(', ');
        
        await window.catalyst.zcql().executeZCQLQuery(
          `UPDATE EComplaints SET ${updateSet} WHERE ComplaintId = '${records[index].ComplaintId}'`
        );
        console.log('✅ Catalyst Cloud update completed for:', records[index].ComplaintId);
      }
    } catch (cloudErr) {
      console.warn('Catalyst ZCQL update warning:', cloudErr);
    }

    return records[index];
  }

  return null;
}

export default {
  pushComplaintToCatalyst,
  updateComplaintInCatalyst
};

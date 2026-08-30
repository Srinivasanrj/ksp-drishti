/**
 * KARNATAKA STATE POLICE (KSP) — POLICE-INITIATED COMPLAINT / SUO-MOTU FIR DATASET ENGINE
 * Synchronized with Zoho Catalyst Data Store table: `PoliceInitiatedComplaints`.
 * Handles duty officer patrol logging, panchanama seizure records, and instant database syncing.
 */

const LOCAL_STORAGE_KEY = 'ksp_police_initiated_cases_v1';

export const DEFAULT_POLICE_CASES = [
  {
    CaseId: 'KSP-POL-2026-48912',
    FirNumber: 'FIR-2026-BLR-0891',
    OfficerBadge: 'KSP-88421',
    OfficerName: 'Inspector M. Venkatesh',
    OfficerRank: 'Police Inspector (PI)',
    Division: 'Bengaluru',
    SubDivision: 'Bengaluru Urban',
    PoliceStation: 'Koramangala PS',
    BeatUnit: 'Night Patrol Beat #4',
    CrimeCategory: 'Vehicle Theft / Spot Recovery',
    IncidentDate: '2026-08-23 02:15',
    SpotLocation: 'Near 100ft Road Junction, Koramangala 4th Block',
    SpotNarrative: 'During night vehicle check, flagged down two suspicious individuals riding a KTM Duke motorcycle without number plate. Accused attempted to flee on foot but apprehended by beat staff.',
    SuspectStatus: 'Apprehended on Spot',
    SuspectName: 'Imran Pasha (24 yrs)',
    SuspectDetails: 'Height 5ft 8in, scar on left eyebrow. Native of Goripalya, Bengaluru. Confessed to lifting motorcycle from Indiranagar.',
    SeizedItems: '1 KTM Duke Motorcycle (Engine No: KA-01-ET-4491), 1 Master Lock-picking tool set',
    SeizureValue: 'Rs. 2,10,000',
    PanchaWitness: 'Santhosh M. (Security Guard, Hotel Grand)',
    EvidenceCount: 3,
    EvidenceList: [
      'Spot Recovery Panchanama with pancha signatures',
      'Vehicle Chassis and Engine Number Photographs',
      'CCTV Snapshot from junction checkpost'
    ],
    ApplicableSections: ['BNS Sec 303(2) (Theft)', 'BNS Sec 317(2) (Dishonestly receiving stolen property)'],
    CaseStatus: 'ACCUSED_IN_CUSTODY',
    FilingTimestamp: '2026-08-23T04:00:00',
    InvestigationSummary: 'Suo-motu seizure during night beat patrol. Accused produced before jurisdictional magistrate. Remanded to 3 days police custody.'
  },
  {
    CaseId: 'KSP-POL-2026-31045',
    FirNumber: 'FIR-2026-BAL-0312',
    OfficerBadge: 'KSP-67120',
    OfficerName: 'PSI Anand Nayak',
    OfficerRank: 'Police Sub-Inspector (PSI)',
    Division: 'Kalaburagi',
    SubDivision: 'Ballari',
    PoliceStation: 'Gandhinagar PS',
    BeatUnit: 'Sector Patrol Unit #2',
    CrimeCategory: 'Illegal Arms & Weapon Seizure',
    IncidentDate: '2026-08-24 23:40',
    SpotLocation: 'Old Railway Goods Shed, Gandhinagar, Ballari',
    SpotNarrative: 'Acting on source intelligence regarding illegal country pistol trade, team raided abandoned warehouse. One country-made pistol and 4 live rounds seized under Mahazar.',
    SuspectStatus: 'Apprehended on Spot',
    SuspectName: 'Ramesh Reddy (31 yrs)',
    SuspectDetails: 'Previous history in Arms Act violation. Resident of Cowl Bazaar, Ballari.',
    SeizedItems: '1 Country-made 7.65mm Pistol, 4 Live Cartridges, Rs. 42,000 cash',
    SeizureValue: 'Rs. 85,000',
    PanchaWitness: 'K. Nagaraj (Local Merchant)',
    EvidenceCount: 4,
    EvidenceList: [
      'Arms Seizure Mahazar Copy',
      'Ballistic inspection preliminary report',
      'Photographs of seized firearm and ammunition',
      'Cash denomination inventory list'
    ],
    ApplicableSections: ['Arms Act Sec 25(1)(a)', 'BNS Sec 111 (Organized Crime Gang Activity)'],
    CaseStatus: 'ACCUSED_IN_CUSTODY',
    FilingTimestamp: '2026-08-25T01:30:00',
    InvestigationSummary: 'Illegal firearms trafficking bust. Forwarded pistol to FSL Bengaluru for ballistic examination.'
  }
];

export function getPoliceComplaints() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_POLICE_CASES));
  } catch (e) {}

  return DEFAULT_POLICE_CASES;
}

export function savePoliceComplaint(caseData) {
  const records = getPoliceComplaints();

  const caseId = caseData.CaseId || `KSP-POL-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const subDiv = caseData.SubDivision || caseData.incidentDistrict || 'BLR';
  const prefix = subDiv.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
  const firNum = caseData.FirNumber || `FIR-2026-${prefix}-${Math.floor(100 + Math.random() * 900)}`;

  const newRecord = {
    CaseId: caseId,
    FirNumber: firNum,
    OfficerBadge: caseData.OfficerBadge || caseData.officerBadge || 'KSP-OFFICER',
    OfficerName: caseData.OfficerName || caseData.officerName || 'Duty Officer',
    OfficerRank: caseData.OfficerRank || caseData.officerRank || 'Police Sub-Inspector',
    Division: caseData.Division || 'Bengaluru',
    SubDivision: caseData.SubDivision || caseData.incidentDistrict || 'Bengaluru Urban',
    PoliceStation: caseData.PoliceStation || caseData.selectedStation || 'Central PS',
    BeatUnit: caseData.BeatUnit || caseData.beatUnit || 'Beat Patrol Unit',
    CrimeCategory: caseData.CrimeCategory || caseData.crimeCategory || 'Field Operation / Seizure',
    IncidentDate: caseData.IncidentDate || `${caseData.incidentDate || ''} ${caseData.incidentTime || ''}`.trim() || new Date().toISOString(),
    SpotLocation: caseData.SpotLocation || caseData.spotLocation || '',
    SpotNarrative: caseData.SpotNarrative || caseData.spotNarrative || 'Field patrol incident recorded by duty officer.',
    SuspectStatus: caseData.SuspectStatus || caseData.suspectStatus || 'Unknown',
    SuspectName: caseData.SuspectName || caseData.suspectName || 'Unknown Accused',
    SuspectDetails: caseData.SuspectDetails || `${caseData.suspectAge ? 'Age: ' + caseData.suspectAge + '. ' : ''}${caseData.suspectMarks || ''}`,
    SeizedItems: caseData.SeizedItems || caseData.recoveredProperty || 'None listed',
    SeizureValue: caseData.SeizureValue || caseData.seizureValue || 'Rs. 0',
    PanchaWitness: caseData.PanchaWitness || caseData.panchaName || 'Local independent witness',
    EvidenceCount: caseData.EvidenceCount || 2,
    EvidenceList: caseData.EvidenceList || ['Field Seizure Panchanama', 'Spot Inspection Photo'],
    ApplicableSections: caseData.ApplicableSections || ['BNS Sec 303 (General Investigation)'],
    CaseStatus: caseData.CaseStatus || 'ACCUSED_IN_CUSTODY',
    FilingTimestamp: caseData.FilingTimestamp || new Date().toISOString(),
    InvestigationSummary: caseData.InvestigationSummary || 'Suo-motu police field case registered under CCTNS. Investigation in progress.'
  };

  records.unshift(newRecord);

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('ksp-police-case-updated', { detail: { newCase: newRecord } }));
  } catch (e) {}

  return newRecord;
}

export function findPoliceCaseByFirOrId(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toUpperCase();
  const records = getPoliceComplaints();

  return records.find(r => {
    const fir = (r.FirNumber || '').toUpperCase();
    const id = (r.CaseId || '').toUpperCase();
    const suspect = (r.SuspectName || '').toUpperCase();
    return fir.includes(q) || id.includes(q) || (suspect.length > 3 && (q.includes(suspect) || suspect.includes(q)));
  }) || null;
}

export default {
  DEFAULT_POLICE_CASES,
  getPoliceComplaints,
  savePoliceComplaint,
  findPoliceCaseByFirOrId
};

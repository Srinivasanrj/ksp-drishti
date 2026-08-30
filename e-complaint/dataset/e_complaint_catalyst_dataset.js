/**
 * KARNATAKA STATE POLICE (KSP) — E-COMPLAINT & FIR MASTER DATASET & CATALYST CONNECTOR
 * Synchronized with Zoho Catalyst Data Store table: `EComplaints`.
 * Handles citizen E-Complaint filing, persistent storage, FIR case lookup, and AI summarization.
 */

const LOCAL_STORAGE_KEY = 'ksp_e_complaints_records_v1';

// Initial realistic master cases across Karnataka
export const DEFAULT_E_COMPLAINTS = [
  {
    ComplaintId: 'KSP-EC-2026-89412',
    FirNumber: 'FIR-2026-BLR-0412',
    ComplainantName: 'Priya Sharma',
    Gender: 'Female',
    DateOfBirth: '1992-06-14',
    AadhaarNumber: 'XXXX-XXXX-8921',
    Mobile: '9845012345',
    Email: 'priya.sharma@example.com',
    PresentAddress: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
    PermanentAddress: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
    Division: 'Bengaluru',
    SubDivision: 'Bengaluru Urban',
    PoliceStation: 'Koramangala PS',
    CrimeCategory: 'Cyber Financial Fraud / UPI Phishing',
    IncidentDate: '2026-08-20 22:30',
    IncidentLocation: '80 Feet Road, 4th Block, Koramangala',
    ComplaintDescription: 'Received a fraudulent electricity bill disconnection SMS with a malicious APK link. After installing the app, phone screen went blank for 2 minutes and unauthorized debit of ₹1,45,000 occurred across 3 transactions to unknown VPA.',
    SuspectDetails: 'Suspect Mobile: +91 9123456789. Beneficiary UPI ID: pay-electricity.blr@axl (Linked to Jamtara mule network).',
    EvidenceCount: 4,
    EvidenceList: [
      'Fake SMS screenshot with malicious URL',
      'Bank statement showing ₹1,45,000 debit with UTR numbers',
      'Malicious APK file package dump',
      'WhatsApp chat transcript'
    ],
    ApplicableSections: ['BNS Sec 318(4) (Cheating)', 'IT Act Sec 66C (Identity Theft)', 'IT Act Sec 66D (Cheating by Impersonation)'],
    ComplaintStatus: 'UNDER_INVESTIGATION',
    AssignedIO: 'PSI Chethan Kumar (KSP-IO-402)',
    FilingTimestamp: '2026-08-21T09:15:00',
    InvestigationSummary: 'Cyber financial fraud involving fake electricity APK. Bank accounts flagged under 1930 portal. ₹85,000 lien marked in beneficiary Axis Bank mule account.'
  },
  {
    ComplaintId: 'KSP-EC-2026-77210',
    FirNumber: 'FIR-2026-BAL-0104',
    ComplainantName: 'Girish Patil',
    Gender: 'Male',
    DateOfBirth: '1984-11-03',
    AadhaarNumber: 'XXXX-XXXX-4412',
    Mobile: '9840019283',
    Email: 'girish.patil@example.com',
    PresentAddress: '#45, Gandhinagar 2nd Cross, Ballari',
    PermanentAddress: '#45, Gandhinagar 2nd Cross, Ballari',
    Division: 'Kalaburagi',
    SubDivision: 'Ballari',
    PoliceStation: 'Gandhinagar PS',
    CrimeCategory: 'Commercial Burglary & Theft',
    IncidentDate: '2026-08-22 03:15',
    IncidentLocation: 'Patil Electronics, Main Bazaar Road, Gandhinagar, Ballari',
    ComplaintDescription: 'Shutter lock broken during early morning hours. 14 brand new smartphones, 3 laptops, and ₹65,000 cash from the counter cash drawer stolen. CCTV wire was cut before entry.',
    SuspectDetails: 'Two unidentified males wearing dark hoodies and face masks caught on nearby bakery CCTV fleeing on a black Pulsar motorcycle without number plate.',
    EvidenceCount: 3,
    EvidenceList: [
      'Bakery CCTV footage clip (03:12 AM to 03:25 AM)',
      'Forensic fingerprint lifting report from shutter handle',
      'Invoice inventory list of 14 stolen phone IMEI numbers'
    ],
    ApplicableSections: ['BNS Sec 305 (Lurking House-trespass by night)', 'BNS Sec 303(2) (Theft in building/shop)'],
    ComplaintStatus: 'FIR_FILED',
    AssignedIO: 'PSI Anand Nayak (KSP-IO-108)',
    FilingTimestamp: '2026-08-22T08:30:00',
    InvestigationSummary: 'Commercial burglary with forced shutter entry. IMEI numbers blacklisted on CEIR portal. 1 phone triggered tower location near Hosapete bypass.'
  },
  {
    ComplaintId: 'KSP-EC-2026-65109',
    FirNumber: 'FIR-2026-BEL-0205',
    ComplainantName: 'Sunil Hegde',
    Gender: 'Male',
    DateOfBirth: '1979-04-18',
    AadhaarNumber: 'XXXX-XXXX-6719',
    Mobile: '9980112233',
    Email: 'sunil.hegde@example.com',
    PresentAddress: 'Plot 12, Camp Area, Belagavi',
    PermanentAddress: 'Plot 12, Camp Area, Belagavi',
    Division: 'Belagavi',
    SubDivision: 'Belagavi District',
    PoliceStation: 'Market PS',
    CrimeCategory: 'Vehicle Theft (Automobile)',
    IncidentDate: '2026-08-24 19:45',
    IncidentLocation: 'Market Complex Parking Lot, Khade Bazaar, Belagavi',
    ComplaintDescription: 'Parked Royal Enfield Classic 350 (Reg: KA-22-EM-9901) was stolen between 7:30 PM and 8:30 PM while complainant was inside grocery mart.',
    SuspectDetails: 'Traffic junction camera shows the bike being driven towards Kolhapur Highway by a tall male in a blue helmet at 8:05 PM.',
    EvidenceCount: 2,
    EvidenceList: [
      'Vehicle RC book and purchase invoice',
      'Traffic camera snapshot at Belagavi toll plaza'
    ],
    ApplicableSections: ['BNS Sec 303(2) (Theft of Motor Vehicle)'],
    ComplaintStatus: 'UNDER_INVESTIGATION',
    AssignedIO: 'HC Basavaraj (KSP-CON-1890)',
    FilingTimestamp: '2026-08-24T21:10:00',
    InvestigationSummary: 'Motor vehicle theft from commercial zone. ANPR camera alert sent to border checkposts on Maharashtra-Karnataka boundary.'
  }
];

/**
 * Fetch all E-Complaints from LocalStorage or fallback to default dataset
 */
export function getEComplaints() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading E-Complaints from localStorage:', e);
  }

  // Initialize with default master cases
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_E_COMPLAINTS));
  } catch (e) {}

  return DEFAULT_E_COMPLAINTS;
}

/**
 * Save new complaint into dataset and dispatch sync event
 */
export function saveEComplaint(complaintData) {
  const records = getEComplaints();
  
  const complaintId = complaintData.ComplaintId || `KSP-EC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const subDiv = complaintData.SubDivision || complaintData.district || 'BLR';
  const prefix = subDiv.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
  const firNum = complaintData.FirNumber || `FIR-2026-${prefix}-${Math.floor(100 + Math.random() * 900)}`;

  const newRecord = {
    ComplaintId: complaintId,
    FirNumber: firNum,
    ComplainantName: complaintData.ComplainantName || complaintData.fullName || 'Anonymous',
    Gender: complaintData.Gender || complaintData.gender || 'Not Specified',
    DateOfBirth: complaintData.DateOfBirth || complaintData.dob || '',
    AadhaarNumber: complaintData.AadhaarNumber || (complaintData.mobileNumber ? `XXXX-XXXX-${complaintData.mobileNumber.slice(-4)}` : 'XXXX-XXXX-0000'),
    Mobile: complaintData.Mobile || complaintData.mobileNumber || '',
    Email: complaintData.Email || complaintData.email || '',
    PresentAddress: complaintData.PresentAddress || complaintData.presentAddress || '',
    PermanentAddress: complaintData.PermanentAddress || complaintData.permanentAddress || '',
    Division: complaintData.Division || complaintData.division || 'Bengaluru',
    SubDivision: complaintData.SubDivision || complaintData.district || 'Bengaluru Urban',
    PoliceStation: complaintData.PoliceStation || complaintData.policeStation || 'Central PS',
    CrimeCategory: complaintData.CrimeCategory || complaintData.incidentCategory || 'General Complaint',
    IncidentDate: complaintData.IncidentDate || `${complaintData.incidentDate || ''} ${complaintData.incidentTime || ''}`.trim() || new Date().toISOString(),
    IncidentLocation: complaintData.IncidentLocation || complaintData.incidentSpot || '',
    ComplaintDescription: complaintData.ComplaintDescription || complaintData.description || 'No description provided.',
    SuspectDetails: complaintData.SuspectDetails || complaintData.suspectDetails || 'Unknown suspect',
    EvidenceCount: complaintData.EvidenceCount || (complaintData.evidenceFiles ? Object.values(complaintData.evidenceFiles).flat().length : 0),
    EvidenceList: complaintData.EvidenceList || ['Identity Proof Uploaded', 'Incident Description Document'],
    ApplicableSections: complaintData.ApplicableSections || ['BNS Sec 318 (General Investigation)'],
    ComplaintStatus: complaintData.ComplaintStatus || 'REGISTERED',
    AssignedIO: complaintData.AssignedIO || 'Duty Officer / PSI Endorsement Pending',
    FilingTimestamp: complaintData.FilingTimestamp || new Date().toISOString(),
    InvestigationSummary: complaintData.InvestigationSummary || 'Complaint registered via Citizen E-Portal. Initial preliminary inquiry initiated by Duty PSI.'
  };

  records.unshift(newRecord);

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('ksp-ecomplaint-updated', { detail: { complaint: newRecord, total: records.length } }));
  } catch (e) {
    console.error('Error saving E-Complaint:', e);
  }

  return newRecord;
}

/**
 * Search complaint by FIR Number, Complaint Reference ID, or Complainant Name
 * Supports both direct codes and natural language sentences (e.g. "Find case file for FIR-2026-BLR-0412")
 */
export function findComplaintByFirOrId(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toUpperCase();
  const records = getEComplaints();

  return records.find(r => {
    const fir = (r.FirNumber || '').toUpperCase();
    const id = (r.ComplaintId || '').toUpperCase();
    const name = (r.ComplainantName || '').toUpperCase();

    // Check if query contains the FIR or ID (e.g. "Summarize FIR-2026-BLR-0412")
    if (fir && (q.includes(fir) || fir.includes(q))) return true;
    if (id && (q.includes(id) || id.includes(q))) return true;
    if (name && name.length > 3 && (q.includes(name) || name.includes(q))) return true;

    // Check for regex match of FIR or KSP-EC patterns
    const firMatch = q.match(/FIR-2026-[A-Z]{3}-\d{3,4}/);
    if (firMatch && fir === firMatch[0]) return true;

    const ecMatch = q.match(/KSP-EC-2026-\d{4,5}/);
    if (ecMatch && id === ecMatch[0]) return true;

    return false;
  }) || null;
}

export default {
  DEFAULT_E_COMPLAINTS,
  getEComplaints,
  saveEComplaint,
  findComplaintByFirOrId
};

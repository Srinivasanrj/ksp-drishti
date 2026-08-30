/**
 * KARNATAKA STATE POLICE (KSP) — PASSPORT POLICE VERIFICATION MASTER DATASET
 * Multi-Subdivision CCTNS Dataset formatted for Zoho Catalyst Cloud DataStore.
 * Covers all 3 Divisions & 31 Sub-Divisions / Police Station Units (620+ records).
 */

export const DIVISIONS_CONFIG = {
  "Kalaburagi": {
    "Ballari": ["Cowl Bazaar PS", "Brucepet PS", "Gandhinagar PS", "Siruguppa PS"],
    "Bidar": ["Bidar Town PS", "Gandhi Gunj PS", "Humnabad PS", "Bhalki PS"],
    "Kalaburagi District": ["Brahampur PS", "Station Bazaar PS", "Sedam PS", "Aland PS"],
    "Koppal": ["Koppal Town PS", "Gangavathi PS", "Kushtagi PS"],
    "Raichur": ["Raichur West PS", "Netaji Nagar PS", "Manvi PS", "Sindhanur PS"],
    "Vijayanagara": ["Hospet Town PS", "Hampi PS", "Harapanahalli PS", "Kudligi PS"],
    "Yadgir": ["Yadgir Town PS", "Shahapur PS", "Shorapur PS"]
  },
  "Belagavi": {
    "Bagalkote": ["Bagalkot Town PS", "Navanagar PS", "Jamkhandi PS", "Ilkal PS"],
    "Belagavi District": ["Market PS", "Camp PS", "Khade Bazaar PS", "Gokak PS", "Chikkodi PS"],
    "Dharwad": ["Hubballi Town PS", "Subhash Nagar PS", "Vidyagiri PS", "Dharwad Town PS"],
    "Gadag": ["Gadag Town PS", "Betageri PS", "Shirahatti PS", "Ron PS"],
    "Haveri": ["Haveri Town PS", "Ranebennur PS", "Byadgi PS"],
    "Uttara Kannada": ["Karwar Town PS", "Bhatkal PS", "Sirsi Town PS", "Kumta PS"],
    "Vijayapura": ["Gandhi Chowk PS", "Gol Gumbaz PS", "Indi PS", "Muddebihal PS"]
  },
  "Bengaluru": {
    "Bengaluru Urban": ["Koramangala PS", "Indiranagar PS", "Jayanagar PS", "Hebbal PS", "Rajajinagar PS", "Whitefield PS", "Electronic City PS", "Malleswaram PS"],
    "Bengaluru Rural": ["Doddaballapura PS", "Hoskote PS", "Nelamangala PS", "Devanahalli PS"],
    "Chikkaballapura": ["Chikkaballapur Town PS", "Gauribidanur PS", "Sidlaghatta PS", "Bagepalli PS"],
    "Chitradurga": ["Chitradurga Town PS", "Challakere PS", "Hiriyur PS", "Holalkere PS"],
    "Davanagere": ["Vidyanagar PS", "KTJ Nagar PS", "Harihar PS", "Honnali PS"],
    "Kolar": ["Kolar Town PS", "Mulbagal PS", "Srinivaspur PS", "Bangarapet PS"],
    "Kolar Gold Fields (KGF)": ["Robertsonpet PS", "Champion Reefs PS", "Andersonpet PS"],
    "Ramanagara": ["Ramanagara Town PS", "Channapatna PS", "Kanakapura PS", "Magadi PS"],
    "Tumakuru": ["Tumakuru Town PS", "Kyatsandra PS", "Tiptur PS", "Kunigal PS", "Sira PS"],
    "Chamarajanagara": ["Chamarajanagar Town PS", "Gundlupet PS", "Kollegal PS", "Yelandur PS"],
    "Chikkamagaluru": ["Chikkamagaluru Town PS", "Kadur PS", "Mudigere PS", "Tarikere PS"],
    "Dakshina Kannada": ["Kadri PS", "Mangaluru North PS", "Bunder PS", "Ullal PS", "Puttur PS", "Bantwal PS"],
    "Hassan": ["Hassan City PS", "Hassan Extension PS", "Arsikere PS", "Channarayapatna PS", "Sakleshpur PS"],
    "Kodagu": ["Madikeri Town PS", "Kushalnagar PS", "Virajpet PS", "Somwarpet PS"],
    "Mandya": ["Mandya West PS", "Maddur PS", "Pandavapura PS", "Srirangapatna PS", "Malavalli PS"],
    "Mysuru City": ["Devaraja PS", "Saraswathipuram PS", "Vijayanagar PS", "Kuvempunagar PS", "Narasimharaja PS"],
    "Udupi": ["Udupi Town PS", "Manipal PS", "Kundapura PS", "Malpe PS", "Karkala PS"]
  }
};

const FIRST_NAMES = [
  "Ramesh", "Priya", "Suresh", "Anjali", "Harish", "Vidya", "Sachin", "Sneha", "Karthik", "Deepa",
  "Vijay", "Rashmi", "Manoj", "Kavya", "Rahul", "Swathi", "Arun", "Shweta", "Sanjay", "Nandini",
  "Praveen", "Chaithra", "Girish", "Aishwarya", "Naveen", "Bhavya", "Deepak", "Roopa", "Vinod", "Preeti",
  "Sunil", "Monika", "Santosh", "Pallavi", "Venkatesh", "Sunitha", "Manjunath", "Shruthi", "Raghavendra", "Ananya"
];

const LAST_NAMES = [
  "Gowda", "Patil", "Shetty", "Hegde", "Bhat", "Kulkarni", "Joshi", "Deshmukh", "Nayak", "Sharma",
  "Varma", "Mishra", "Rao", "Reddy", "Kumar", "Singh", "Das", "Menon", "Pillai", "Acharya",
  "Choudhury", "Banerjee", "Verma", "Shukla", "Shekhar", "Prasad", "Iyengar", "Murthy", "Nambiar", "Gupta"
];

const PURPOSES = [
  { purpose: "Work Visa (USA)", country: "United States of America" },
  { purpose: "Higher Studies (UK/Europe)", country: "United Kingdom" },
  { purpose: "Higher Studies (UK/Europe)", country: "Germany" },
  { purpose: "Higher Studies (UK/Europe)", country: "Ireland" },
  { purpose: "Employment (Gulf)", country: "United Arab Emirates" },
  { purpose: "Employment (Gulf)", country: "Saudi Arabia" },
  { purpose: "Tourism", country: "France" },
  { purpose: "Tourism", country: "Singapore" },
  { purpose: "Tourism", country: "Australia" },
  { purpose: "Family Visit", country: "Canada" },
  { purpose: "Family Visit", country: "Japan" },
  { purpose: "Conference / Event", country: "Netherlands" }
];

const CONSTABLES = [
  { name: "HC Basavaraj M.", id: "KSP-CON-1890" },
  { name: "PC Ningappa H.", id: "KSP-CON-8032" },
  { name: "HC Ramaiah B.", id: "KSP-CON-4421" },
  { name: "WHC Renuka B.", id: "KSP-CON-3891" },
  { name: "PC Suresh K.", id: "KSP-CON-3189" },
  { name: "WPC Geetha R.", id: "KSP-CON-4902" },
  { name: "PC Anand Kumar T.", id: "KSP-CON-7104" },
  { name: "HC Manjunatha S.", id: "KSP-CON-2044" },
  { name: "PC Shivakumar N.", id: "KSP-CON-6721" },
  { name: "PC Praveen Gowda", id: "KSP-CON-5120" },
  { name: "WHC Savitha D.", id: "KSP-CON-3310" },
  { name: "PC Chethan V.", id: "KSP-CON-6245" },
  { name: "HC Mallikarjun K.", id: "KSP-CON-1678" },
  { name: "PC Venkatesh G.", id: "KSP-CON-5512" },
  { name: "HC Raghavendra P.", id: "KSP-CON-2987" }
];

const ADVERSE_REASONS = [
  "Applicant untraceable and neighbours confirmed relocation to unknown place",
  "Address proof submitted found forged or non-verifiable",
  "Discrepancy found in date of birth between Aadhaar and School Certificate",
  "Applicant failed to produce original documents during physical verification",
  "Active court injunction / travel restriction recorded in CCTNS",
  "Adverse report: Ongoing criminal investigation and FIR pending"
];

function generateMasterDataset() {
  const records = [];
  let appIdCounter = 1;

  for (const [division, subDivMap] of Object.entries(DIVISIONS_CONFIG)) {
    for (const [subDivision, stations] of Object.entries(subDivMap)) {
      for (let i = 0; i < 20; i++) {
        const subPrefix = subDivision.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
        const appId = `PV-2026-${subPrefix}-${String(appIdCounter).padStart(4, '0')}`;
        appIdCounter++;

        const firstName = FIRST_NAMES[(appIdCounter * 7 + i) % FIRST_NAMES.length];
        const lastName = LAST_NAMES[(appIdCounter * 11 + i) % LAST_NAMES.length];
        const name = `${firstName} ${lastName}`;
        const gender = ["Priya", "Anjali", "Vidya", "Sneha", "Deepa", "Rashmi", "Kavya", "Swathi", "Shweta", "Nandini", "Chaithra", "Aishwarya", "Bhavya", "Roopa", "Preeti", "Monika", "Pallavi", "Sunitha", "Shruthi", "Ananya"].includes(firstName) ? "Female" : "Male";

        const birthYear = 1965 + ((appIdCounter * 13 + i * 3) % 42);
        const birthMonth = String(1 + ((i * 2 + 5) % 12)).padStart(2, '0');
        const birthDay = String(1 + ((i * 3 + 7) % 28)).padStart(2, '0');
        const dob = `${birthYear}-${birthMonth}-${birthDay}`;

        const aadhaar = `XXXX-XXXX-${String(1000 + (appIdCounter * 37) % 9000)}`;
        const mobile = `98${String(40000000 + (appIdCounter * 7919) % 59999999)}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${appIdCounter % 99}@example.com`;

        const station = stations[i % stations.length];
        const constable = CONSTABLES[(appIdCounter + i) % CONSTABLES.length];
        const targetPurpose = PURPOSES[(appIdCounter + i) % PURPOSES.length];

        const addressPresent = `#${10 + (i * 15)}, Main Road, ${subDivision}`;
        const addressPerm = `#${10 + (i * 15)}, Main Road, ${subDivision}`;

        let status = 'VERIFIED';
        let priority = 'NORMAL';
        let criminalRecord = false;
        let firLinked = '';
        let courtCasePending = false;
        let lookoutNotice = false;
        let rejectionReason = '';
        let officerRemarks = 'Clear verification report approved. No adverse records found in CCTNS Karnataka database. Passport grant recommended.';
        let fieldVisitCompleted = true;
        let verificationDate = '2026-07-20T14:30:00';

        // Distribution of 20 records per sub-division:
        // 0..11 -> Verified
        // 12..14 -> Pending
        // 15..16 -> Field Visit Done
        // 17 -> Tatkal Pending
        // 18 -> Flagged
        // 19 -> Rejected
        if (i >= 12 && i <= 14) {
          status = 'PENDING';
          fieldVisitCompleted = false;
          verificationDate = '';
          officerRemarks = '';
        } else if (i >= 15 && i <= 16) {
          status = 'FIELD_VISIT_DONE';
          fieldVisitCompleted = true;
          verificationDate = '';
          officerRemarks = '';
        } else if (i === 17) {
          status = 'PENDING';
          priority = 'TATKAL';
          fieldVisitCompleted = false;
          verificationDate = '';
          officerRemarks = '';
        } else if (i === 18) {
          status = 'FLAGGED';
          priority = 'URGENT';
          criminalRecord = true;
          firLinked = `FIR-2025-${String(100 + (appIdCounter % 899))}/${subPrefix}`;
          courtCasePending = true;
          officerRemarks = `FLAGGED TO SPECIAL BRANCH / CID: Linked to ${firLinked}. Case pending in jurisdictional court.`;
          verificationDate = '2026-06-15T11:20:00';
        } else if (i === 19) {
          status = 'REJECTED';
          rejectionReason = ADVERSE_REASONS[appIdCounter % ADVERSE_REASONS.length];
          officerRemarks = `Application rejected by Police Sub-Inspector. Reason: ${rejectionReason}`;
          verificationDate = '2026-05-10T16:00:00';
        }

        if (i % 5 === 0 && status === 'VERIFIED') {
          priority = 'TATKAL';
        } else if (i % 7 === 0 && status === 'VERIFIED') {
          priority = 'URGENT';
        }

        const passportType = priority === 'TATKAL' ? 'Tatkal' : (i % 3 === 0 ? 'Renewal' : 'Fresh');

        records.push({
          application_id: appId,
          applicant_name: name,
          date_of_birth: dob,
          gender: gender,
          aadhaar_number: aadhaar,
          mobile: mobile,
          email: email,
          present_address: addressPresent,
          permanent_address: addressPerm,
          division: division,
          sub_division: subDivision,
          police_station: station,
          passport_type: passportType,
          priority: priority,
          purpose: targetPurpose.purpose,
          travel_country: targetPurpose.country,
          status: status,
          assigned_constable_name: constable.name,
          assigned_constable_id: constable.id,
          field_visit_completed: fieldVisitCompleted,
          field_visit_date: fieldVisitCompleted ? '2026-07-15' : '',
          criminal_record: criminalRecord,
          fir_linked: firLinked,
          court_case_pending: courtCasePending,
          lookout_notice: lookoutNotice,
          lok_adalat_pending: false,
          posh_cases: false,
          rejection_reason: rejectionReason,
          field_officer_remarks: fieldVisitCompleted ? 'Applicant personally met at given address. Identity and residential tenure verified by neighbours.' : '',
          verification_officer_id: status === 'VERIFIED' ? 'KSP-PSI-1001' : (status === 'REJECTED' ? 'KSP-PSI-1002' : ''),
          verification_remarks: officerRemarks,
          submission_date: '2026-06-25T10:30:00',
          verification_date: verificationDate,
          documents: {
            aadhaar_uploaded: true,
            birth_certificate: true,
            address_proof: status !== 'REJECTED',
            photo: true,
            signature: true,
            previous_passport: passportType === 'Renewal'
          }
        });
      }
    }
  }

  return records;
}

const MASTER_DATASET = generateMasterDataset();

// Storage key for persistent state
const LOCAL_STORAGE_KEY = 'ksp_passport_verification_records_v2';

/**
 * Initialize / fetch records from LocalStorage or fallback to master dataset
 */
export function getPassportRecords() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading passport records from localStorage:', e);
  }
  
  // Save initial master dataset to localStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MASTER_DATASET));
  } catch (e) {}

  return MASTER_DATASET;
}

/**
 * Save updated records to LocalStorage and dispatch sync event
 */
export function savePassportRecords(records) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('ksp-passport-updated', { detail: { records } }));
  } catch (e) {
    console.error('Error saving passport records:', e);
  }
}

/**
 * Mark an application as VERIFIED
 */
export function approvePassportVerification(applicationId, officerId = 'KSP-PSI-1001', remarks = 'Clear verification report approved. No adverse records found in CCTNS Karnataka database. Passport grant recommended.') {
  const records = getPassportRecords();
  const index = records.findIndex(r => r.application_id === applicationId);
  if (index !== -1) {
    records[index].status = 'VERIFIED';
    records[index].verification_date = new Date().toISOString();
    records[index].verification_officer_id = officerId;
    records[index].verification_remarks = remarks;
    records[index].field_visit_completed = true;
    savePassportRecords(records);
    return records[index];
  }
  return null;
}

/**
 * Reject an application with adverse reason
 */
export function rejectPassportVerification(applicationId, rejectionReason, officerId = 'KSP-PSI-1001') {
  const records = getPassportRecords();
  const index = records.findIndex(r => r.application_id === applicationId);
  if (index !== -1) {
    records[index].status = 'REJECTED';
    records[index].verification_date = new Date().toISOString();
    records[index].rejection_reason = rejectionReason;
    records[index].verification_officer_id = officerId;
    records[index].verification_remarks = `Application rejected by Police Sub-Inspector. Reason: ${rejectionReason}`;
    savePassportRecords(records);
    return records[index];
  }
  return null;
}

/**
 * Flag an application to Special Branch / CID
 */
export function flagPassportVerification(applicationId, flagReason, officerId = 'KSP-PSI-1001') {
  const records = getPassportRecords();
  const index = records.findIndex(r => r.application_id === applicationId);
  if (index !== -1) {
    records[index].status = 'FLAGGED';
    records[index].verification_officer_id = officerId;
    records[index].verification_remarks = `FLAGGED TO SPECIAL BRANCH / CID: ${flagReason}`;
    savePassportRecords(records);
    return records[index];
  }
  return null;
}

/**
 * Reset dataset back to original factory records
 */
export function resetPassportRecords() {
  savePassportRecords(MASTER_DATASET);
  return MASTER_DATASET;
}

/**
 * Get active pending count for side panel badge
 */
export function getPendingPassportCount() {
  const records = getPassportRecords();
  return records.filter(r => r.status === 'PENDING' || r.status === 'FIELD_VISIT_DONE').length;
}

export default {
  DIVISIONS_CONFIG,
  getPassportRecords,
  savePassportRecords,
  approvePassportVerification,
  rejectPassportVerification,
  flagPassportVerification,
  resetPassportRecords,
  getPendingPassportCount,
};

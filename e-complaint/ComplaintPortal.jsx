import React, { useState } from 'react';
import { 
  ShieldCheck, FileText, CheckCircle2, ArrowRight, ArrowLeft, Upload, Check, Download, 
  AlertCircle, Phone, Lock, Calendar, MapPin, User, FilePlus, X, Eye, 
  Edit3, Camera, FileCheck, Paperclip, Plus, Minus, Image, Film, Smartphone, 
  Mic, FileCode, BadgeCheck, HardDrive
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { pushComplaintToCatalyst } from '../services/catalystComplaintService';

const KARNATAKA_DISTRICTS_STATIONS = {
  'Bengaluru Urban': ['Bengaluru Urban Main PS', 'Indiranagar PS', 'Koramangala PS', 'Whitefield Cyber PS', 'Electronic City PS'],
  'Bengaluru Rural': ['Bengaluru Rural SP Office PS', 'Doddaballapura PS', 'Hosakote PS', 'Nelamangala PS'],
  'Chikkaballapura': ['Chikkaballapura Central PS', 'Gauribidanur PS', 'Chintamani PS', 'Bagepalli PS'],
  'Chitradurga': ['Chitradurga Town PS', 'Chitradurga Rural PS', 'Challakere PS', 'Hiriyur PS'],
  'Davanagere': ['Davanagere City PS', 'Harihar PS', 'Honnali PS', 'Channagiri PS'],
  'Kolar': ['Kolar Town PS', 'Mulbagal PS', 'Srinivaspur PS', 'Bangarapet PS'],
  'Kolar Gold Fields (KGF)': ['KGF Champion Reefs PS', 'Oorgaum PS', 'Marikuppam PS', 'Robertsonpet PS'],
  'Ramanagara': ['Ramanagara Town PS', 'Channapatna PS', 'Kanakapura PS', 'Magadi PS'],
  'Tumakuru': ['Tumakuru Town PS', 'Tiptur PS', 'Kunigal PS', 'Sira PS'],
  'Mysuru City': ['Mysuru Palace City PS', 'Vidyaranyapuram PS', 'Devaraja PS', 'Nazarbad PS'],
  'Mandya': ['Mandya Central PS', 'Maddur PS', 'Srirangapatna PS'],
  'Dakshina Kannada': ['Mangaluru North PS', 'Panambur Port PS', 'Bantwal PS'],
  'Belagavi District': ['Belagavi City PS', 'Gokak PS', 'Chikkodi PS'],
  'Kalaburagi District': ['Kalaburagi Central PS', 'Sedam PS', 'Shahabad PS']
};

/**
 * LIGHT MODE E-COMPLAINT PORTAL MODULE
 * Features:
 * 1. Clean Light Mode UI Theme
 * 2. Step-by-step complaint registration wizard
 * 3. Upload section for manual script / handwritten physical complaint document
 * 4. 7 Categorized Evidence Collection counters (Photos, Videos, Documents, Screenshots, Audio, Digital Files, Identity Documents)
 * 5. Dynamic slot generation based on specified count for each evidence type
 * 6. Complaint Preview -> Edit -> Confirm & Submit flow with PDF generation
 * 7. Unique Complaint Reference ID generation (e.g. KSP-EC-2026-89412)
 */
function ComplaintPortal({ onClose, onRegisterComplaint, initialStation = '' }) {
  const [currentStep, setCurrentStep] = useState('welcome'); // welcome, step1, step2, step3, step4, step5 (preview), confirmation
  const [loginMobile, setLoginMobile] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Complainant Details
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [relationType, setRelationType] = useState('Son of');
  const [relativeName, setRelativeName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [state, setState] = useState('Karnataka');
  const [district, setDistrict] = useState('Bengaluru Urban');
  const [pinCode, setPinCode] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [sameAsPresent, setSameAsPresent] = useState(false);
  const [idProofType, setIdProofType] = useState('Aadhaar Card');
  const [idProofNumber, setIdProofNumber] = useState('');

  // Step 2: Incident Details
  const [natureOfComplaint, setNatureOfComplaint] = useState('Mobile Snatching / Theft');
  const [dateFrom, setDateFrom] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [incidentDistrict, setIncidentDistrict] = useState('Bengaluru Urban');
  const [selectedStation, setSelectedStation] = useState(initialStation || 'Bengaluru Urban Main PS');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');

  // Step 3: Suspect & Witness Information
  const [knowSuspect, setKnowSuspect] = useState('No');
  const [suspectName, setSuspectName] = useState('');
  const [suspectAge, setSuspectAge] = useState('');
  const [suspectDescription, setSuspectDescription] = useState('');
  const [hasWitness, setHasWitness] = useState('No');
  const [witnessName, setWitnessName] = useState('');
  const [witnessMobile, setWitnessMobile] = useState('');
  const [witnessAddress, setWitnessAddress] = useState('');

  // Step 4: Manual Script & 7 Evidence Categories Counts
  const [propertyStolen, setPropertyStolen] = useState('Yes');
  const [propertyType, setPropertyType] = useState('Mobile Phone');
  const [itemDescription, setItemDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  
  // Manual Script File
  const [handwrittenDocName, setHandwrittenDocName] = useState('');

  // 7 Evidence Category Counts
  const [photosCount, setPhotosCount] = useState(1);
  const [videosCount, setVideosCount] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [screenshotsCount, setScreenshotsCount] = useState(0);
  const [audioCount, setAudioCount] = useState(0);
  const [digitalFilesCount, setDigitalFilesCount] = useState(0);
  const [identityDocsCount, setIdentityDocsCount] = useState(1);

  // Dynamic Uploaded Files Map
  const [evidenceFiles, setEvidenceFiles] = useState({});

  // Step 5: Review & Final Submission
  const [declarationConsent, setDeclarationConsent] = useState(false);
  const [submitOtp, setSubmitOtp] = useState('');
  const [submitOtpSent, setSubmitOtpSent] = useState(false);

  const handleSendLoginOtp = () => {
    if (!loginMobile || loginMobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    setIsOtpSent(true);
    setMobileNumber(loginMobile);
    alert(`OTP [123456] sent to +91 ${loginMobile}`);
  };

  const handleVerifyLoginAndStart = () => {
    if (!isOtpSent) {
      alert('Please click "Get OTP" first');
      return;
    }
    if (loginOtp !== '123456' && loginOtp.length < 4) {
      alert('Demo OTP code: 123456');
      return;
    }
    setCurrentStep('step1');
  };

  const handleDistrictChange = (dist) => {
    setIncidentDistrict(dist);
    const stations = KARNATAKA_DISTRICTS_STATIONS[dist] || [dist + ' Main PS'];
    setSelectedStation(stations[0]);
  };

  // --- MANUAL SCRIPT UPLOAD HANDLER ---
  const handleHandwrittenFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setHandwrittenDocName(file.name);
  };

  // --- DYNAMIC SLOT FILE CHANGE HANDLER ---
  const handleSlotFileChange = (slotKey, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEvidenceFiles(prev => ({
      ...prev,
      [slotKey]: {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type || 'Media File'
      }
    }));
  };

  const handleRemoveSlotFile = (slotKey) => {
    setEvidenceFiles(prev => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  const handleSendSubmitOtp = () => {
    setSubmitOtpSent(true);
    alert(`Verification OTP [998877] sent to +91 ${mobileNumber || loginMobile}`);
  };

  // --- SUBMIT & SAVE TO DATABASE ---
  const handleSubmitComplaint = async () => {
    if (!declarationConsent) {
      alert('Please check the legal declaration consent box before submitting.');
      return;
    }

    setIsSubmitting(true);

    const generatedRef = `KSP-EC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    setRefNumber(generatedRef);

    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const uploadedEvidenceList = Object.entries(evidenceFiles).map(([slotKey, fileInfo]) => ({
      slot: slotKey,
      name: fileInfo.name,
      size: fileInfo.size
    }));

    const complaintRecord = {
      id: generatedRef,
      reference_number: generatedRef,
      status: 'UNDER INVESTIGATION / ASSIGNED TO SUB-INSPECTOR',
      filing_date: formattedDate,
      timestamp: timestamp,
      complainant: {
        full_name: fullName || 'Citizen Applicant',
        gender, dob, relation_type: relationType, relative_name: relativeName,
        mobile: mobileNumber || loginMobile, email, present_address: presentAddress,
        state, district, pin_code: pinCode, permanent_address: permanentAddress,
        id_proof_type: idProofType, id_proof_number: idProofNumber
      },
      incident: {
        nature: natureOfComplaint, date_from: dateFrom, time_from: timeFrom,
        date_to: dateTo, time_to: timeTo, state, district: incidentDistrict,
        police_station: selectedStation, location: incidentLocation, description: incidentDescription
      },
      suspect: {
        known: knowSuspect === 'Yes', name: suspectName, approx_age: suspectAge, description: suspectDescription
      },
      witness: {
        known: hasWitness === 'Yes', name: witnessName, mobile: witnessMobile, address: witnessAddress
      },
      evidence: {
        property_stolen: propertyStolen === 'Yes', property_type: propertyType,
        item_description: itemDescription, estimated_value: estimatedValue,
        manual_script: handwrittenDocName || 'Not Uploaded',
        counts: {
          photos: photosCount,
          videos: videosCount,
          documents: documentsCount,
          screenshots: screenshotsCount,
          audio: audioCount,
          digital_files: digitalFilesCount,
          identity_docs: identityDocsCount
        },
        files: uploadedEvidenceList
      },
      investigator: 'Sub-Inspector R. Patil (Crime Branch)',
      section_laws: natureOfComplaint.includes('Cyber') ? 'Sec 66D IT Act, Sec 318 BNS' : 'Sec 303 BNS, Sec 65B Evidence Act'
    };

    try {
      const existingStr = localStorage.getItem('ksp_registered_complaints');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.unshift(complaintRecord);
      localStorage.setItem('ksp_registered_complaints', JSON.stringify(existing));

      // Save & Automatically Push to Catalyst Cloud DataStore
      await pushComplaintToCatalyst({
        ComplaintId: generatedRef,
        ComplainantName: fullName || 'Citizen Applicant',
        Gender: gender,
        DateOfBirth: dob,
        Mobile: mobileNumber || loginMobile,
        Email: email,
        PresentAddress: presentAddress,
        PermanentAddress: permanentAddress,
        Division: 'Bengaluru',
        SubDivision: incidentDistrict || 'Bengaluru Urban',
        PoliceStation: selectedStation || 'Indiranagar PS',
        CrimeCategory: natureOfComplaint || 'Cyber Financial Fraud / Online Scam',
        IncidentDate: `${dateFrom} ${timeFrom}`.trim() || '2026-08-26 12:00',
        IncidentLocation: incidentLocation || 'Indiranagar 100ft Road',
        ComplaintDescription: incidentDescription || 'Complaint filed via Citizen Portal.',
        SuspectDetails: suspectDescription || (knowSuspect === 'Yes' ? suspectName : 'Unknown suspect'),
        EvidenceCount: Object.keys(evidenceFiles).length || 1,
        EvidenceList: Object.values(evidenceFiles).map(f => f.name) || ['Attached Evidence File'],
        ComplaintStatus: 'REGISTERED',
        AssignedIO: 'Sub-Inspector R. Patil (Crime Branch)',
        FilingTimestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error saving to localStorage & Catalyst dataset:", err);
    }

    window.KSP_REGISTERED_COMPLAINTS = window.KSP_REGISTERED_COMPLAINTS || [];
    window.KSP_REGISTERED_COMPLAINTS.unshift(complaintRecord);

    window.dispatchEvent(new CustomEvent('ksp_complaint_registered', { detail: complaintRecord }));

    if (onRegisterComplaint) {
      onRegisterComplaint(complaintRecord);
    }

    setIsSubmitting(false);
    setCurrentStep('confirmation');
    setCurrentStep('confirmation');
  };

  // --- DOWNLOAD OFFICIAL ACKNOWLEDGMENT PDF ---
  const downloadAcknowledgmentPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1.5);
    doc.rect(8, 8, 194, 280);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('KARNATAKA STATE POLICE', 105, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text('STATE CRIME RECORDS BUREAU (SCRB) • OFFICIAL e-COMPLAINT ACKNOWLEDGMENT', 105, 26, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(15, 30, 195, 30);

    doc.setFillColor(239, 246, 255);
    doc.rect(15, 34, 180, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text(`COMPLAINT REFERENCE ID: ${refNumber || 'KSP-EC-2026-89412'}`, 20, 44);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Filing Timestamp: ${now}  |  Assigned Police Station: ${selectedStation}`, 20, 52);

    let y = 68;
    const totalAttachedCount = Object.keys(evidenceFiles).length;

    const sections = [
      ['1. COMPLAINANT DETAILS', [
        ['Full Name:', fullName || 'Ramesh Kumar'],
        ['Mobile Number:', mobileNumber || loginMobile || '9845012345'],
        ['Gender / DOB:', `${gender} | ${dob || '1991-05-14'}`],
        ['Relation:', `${relationType} ${relativeName || 'Suresh Kumar'}`],
        ['Address:', `${presentAddress || 'Bengaluru'}, ${district}, ${pinCode}`],
        ['ID Proof:', `${idProofType}: ${idProofNumber || 'XXXX-XXXX-8821'}`]
      ]],
      ['2. INCIDENT DETAILS', [
        ['Nature of Crime:', natureOfComplaint],
        ['Date & Time:', `${dateFrom || '2026-08-24'} at ${timeFrom || '10:00 AM'}`],
        ['Jurisdiction Station:', selectedStation],
        ['Incident Location:', incidentLocation || 'Near Metro Station Gate 2'],
        ['Description:', incidentDescription || 'Complaint regarding reported incident. Registered for investigation.']
      ]],
      ['3. EVIDENCE & MANUAL SCRIPT SUMMARY', [
        ['Manual Script File:', handwrittenDocName ? `Uploaded (${handwrittenDocName})` : 'Not Uploaded'],
        ['Evidence Counts:', `Photos: ${photosCount} | Videos: ${videosCount} | Docs: ${documentsCount} | Screenshots: ${screenshotsCount} | Audio: ${audioCount} | Digital Files: ${digitalFilesCount} | ID Docs: ${identityDocsCount}`],
        ['Total Files Attached:', `${totalAttachedCount} File(s)`],
        ['Stolen Property/Loss:', `${propertyStolen} (${propertyType} — Rs. ${estimatedValue || '0'})`]
      ]]
    ];

    sections.forEach(([secTitle, fields]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(37, 99, 235);
      doc.text(secTitle, 15, y);
      y += 6;

      fields.forEach(([label, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(label, 20, y);

        doc.setFont('helvetica', 'normal');
        const splitVal = doc.splitTextToSize(val, 125);
        doc.text(splitVal, 65, y);
        y += Math.max(5, splitVal.length * 4.5);
      });
      y += 4;
    });

    y += 6;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100);
    doc.text('Certified Electronic Document under Section 65B Indian Evidence Act & IT Act 2000.', 15, y);

    doc.save(`eComplaint_Acknowledgment_${refNumber || 'Receipt'}.pdf`);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
      zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '16px'
    }}>
      {/* LIGHT MODE CONTAINER CARD */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        color: '#0f172a',
        width: '100%', maxWidth: '920px', maxHeight: '94vh', borderRadius: '24px',
        boxShadow: '0 25px 60px rgba(30, 58, 138, 0.25)', border: '2px solid #bfdbfe',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>

        {/* TOP HEADER - POLICE DEEP BLUE */}
        <div style={{
          background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)',
          color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', zIndex: 1, boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.4)'
            }}>
              <ShieldCheck size={26} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, letterSpacing: '0.01em', lineHeight: 1.1 }}>
                KARNATAKA STATE POLICE • e-COMPLAINT PORTAL
              </h2>
              <p style={{ fontSize: '0.72rem', color: '#bfdbfe', margin: 0, fontWeight: 600 }}>
                State Crime Records Bureau (SCRB) • Official Citizen Incident & Evidence Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close Portal"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP PROGRESS INDICATOR - LIGHT THEME */}
        {currentStep !== 'welcome' && currentStep !== 'confirmation' && (
          <div style={{ background: '#f1f5f9', padding: '12px 24px', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
            {[
              { id: 'step1', label: '1. Complainant' },
              { id: 'step2', label: '2. Incident Details' },
              { id: 'step3', label: '3. Suspect/Witness' },
              { id: 'step4', label: '4. Evidence Collection' },
              { id: 'step5', label: '5. Preview & Submit' }
            ].map((s, i) => {
              const active = currentStep === s.id;
              const stepNums = { step1: 1, step2: 2, step3: 3, step4: 4, step5: 5 };
              const currentNum = stepNums[currentStep] || 1;
              const thisNum = i + 1;
              const completed = thisNum < currentNum;

              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(s.id)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 800,
                    color: active ? '#1d4ed8' : (completed ? '#059669' : '#64748b')
                  }}
                >
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: active ? '#2563eb' : (completed ? '#059669' : '#cbd5e1'),
                    color: active || completed ? 'white' : '#475569',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800
                  }}>
                    {completed ? <Check size={13} /> : thisNum}
                  </div>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* MAIN BODY CONTAINER */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, zIndex: 1 }}>

          {/* WELCOME / ENTRY SCREEN */}
          {currentStep === 'welcome' && (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: 'white', width: '64px', height: '64px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 10px 25px rgba(37,99,235,0.3)' }}>
                <FilePlus size={32} />
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1e3a8a', marginBottom: '8px' }}>
                Electronic Complaint Registration Portal
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '580px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
                File an official e-Complaint with Karnataka State Police. Secured via Mobile OTP verification, multi-format evidence collection, and Section 65B IT Act certificate.
              </p>

              {/* OTP AUTHENTICATION BOX - LIGHT */}
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1.5px solid #bfdbfe', maxWidth: '440px', margin: '0 auto', textAlign: 'left', boxShadow: '0 8px 24px rgba(30,58,138,0.08)' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} style={{ color: '#2563eb' }} /> Mobile OTP Verification (Required to Begin)
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Complainant Mobile Number:*</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="e.g. 9845012345"
                      value={loginMobile}
                      onChange={(e) => setLoginMobile(e.target.value)}
                      style={lightInputStyle}
                    />
                    <button
                      onClick={handleSendLoginOtp}
                      style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', padding: '0 16px', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {isOtpSent ? 'Resend' : 'Get OTP'}
                    </button>
                  </div>
                </div>

                {isOtpSent && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Enter OTP (Default: 123456):*</label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value)}
                      style={{ ...lightInputStyle, width: '100%', color: '#1d4ed8', fontSize: '0.9rem', letterSpacing: '3px', fontWeight: 800 }}
                    />
                  </div>
                )}

                <button
                  onClick={handleVerifyLoginAndStart}
                  style={{ width: '100%', background: 'linear-gradient(90deg, #1d4ed8, #2563eb)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}
                >
                  <span>Authenticate & Start Complaint Form</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: COMPLAINANT DETAILS */}
          {currentStep === 'step1' && (
            <div style={stepCardStyle}>
              <h4 style={stepTitleStyle}>
                <User size={18} style={{ color: '#2563eb' }} /> Step 1: Complainant Details (Applicant Information)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Full Name:*</label>
                  <input type="text" placeholder="e.g. Ramesh Kumar" value={fullName} onChange={e => setFullName(e.target.value)} style={lightInputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Gender:*</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} style={lightInputStyle}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Date of Birth:*</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={lightInputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Relation Type:</label>
                  <select value={relationType} onChange={e => setRelationType(e.target.value)} style={lightInputStyle}>
                    <option value="Son of">Son of</option>
                    <option value="Daughter of">Daughter of</option>
                    <option value="Wife of">Wife of</option>
                    <option value="Care of">Care of</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Relative's Name:</label>
                  <input type="text" placeholder="e.g. Suresh Kumar" value={relativeName} onChange={e => setRelativeName(e.target.value)} style={lightInputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Mobile Number:*</label>
                  <input type="text" value={mobileNumber || loginMobile} onChange={e => setMobileNumber(e.target.value)} style={lightInputStyle} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Email Address:</label>
                  <input type="email" placeholder="e.g. applicant@gmail.com" value={email} onChange={e => setEmail(e.target.value)} style={lightInputStyle} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Present Residential Address:*</label>
                  <textarea rows={2} placeholder="Door No, Street Name, Cross, Landmark..." value={presentAddress} onChange={e => setPresentAddress(e.target.value)} style={lightInputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>State:*</label>
                  <select value={state} onChange={e => setState(e.target.value)} style={lightInputStyle}>
                    <option value="Karnataka">Karnataka</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>District:*</label>
                  <select value={district} onChange={e => setDistrict(e.target.value)} style={lightInputStyle}>
                    {Object.keys(KARNATAKA_DISTRICTS_STATIONS).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>PIN Code:</label>
                  <input type="text" placeholder="e.g. 560001" value={pinCode} onChange={e => setPinCode(e.target.value)} style={lightInputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>ID Proof Type:*</label>
                  <select value={idProofType} onChange={e => setIdProofType(e.target.value)} style={lightInputStyle}>
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                    <option value="PAN Card">PAN Card</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>ID Proof Number / Aadhaar Number:*</label>
                  <input type="text" placeholder="e.g. XXXX-XXXX-8821" value={idProofNumber} onChange={e => setIdProofNumber(e.target.value)} style={lightInputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button onClick={() => setCurrentStep('step2')} style={btnPrimaryLight}>
                  <span>Proceed to Incident Details</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INCIDENT DETAILS */}
          {currentStep === 'step2' && (
            <div style={stepCardStyle}>
              <h4 style={stepTitleStyle}>
                <MapPin size={18} style={{ color: '#2563eb' }} /> Step 2: Incident & Jurisdiction Details
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Category / Nature of Complaint:*</label>
                  <select value={natureOfComplaint} onChange={e => setNatureOfComplaint(e.target.value)} style={lightInputStyle}>
                    <option value="Mobile Snatching / Theft">Mobile Snatching / Theft</option>
                    <option value="Cyber Financial Fraud / Online Scam">Cyber Financial Fraud / Online Scam</option>
                    <option value="Physical Assault / Altercation">Physical Assault / Altercation</option>
                    <option value="Housebreaking / Theft">Housebreaking / Theft</option>
                    <option value="Vehicle Theft (Bike/Car)">Vehicle Theft (Bike/Car)</option>
                    <option value="Harassment / Cyber Bullying">Harassment / Cyber Bullying</option>
                    <option value="Extortion / Threats">Extortion / Threats</option>
                    <option value="Missing Person">Missing Person</option>
                    <option value="Narcotics / Drug Offense">Narcotics / Drug Offense</option>
                    <option value="Other Criminal Incident">Other Criminal Incident</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Incident Date From:*</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={lightInputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Approximate Time:*</label>
                  <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} style={lightInputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>District Jurisdiction:*</label>
                  <select value={incidentDistrict} onChange={e => handleDistrictChange(e.target.value)} style={lightInputStyle}>
                    {Object.keys(KARNATAKA_DISTRICTS_STATIONS).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Assigned Police Station:*</label>
                  <select value={selectedStation} onChange={e => setSelectedStation(e.target.value)} style={lightInputStyle}>
                    {(KARNATAKA_DISTRICTS_STATIONS[incidentDistrict] || ['Main Police Station']).map(ps => (
                      <option key={ps} value={ps}>{ps}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Exact Incident Location / Landmark:*</label>
                  <input type="text" placeholder="e.g. Near Indiranagar Metro Gate 2, 100ft Road" value={incidentLocation} onChange={e => setIncidentLocation(e.target.value)} style={lightInputStyle} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Detailed Incident Narrative / Description:*</label>
                  <textarea rows={4} placeholder="Describe chronologically what happened, suspects involved, how the offense took place..." value={incidentDescription} onChange={e => setIncidentDescription(e.target.value)} style={lightInputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button onClick={() => setCurrentStep('step1')} style={btnSecondaryLight}><ArrowLeft size={16} /> Back</button>
                <button onClick={() => setCurrentStep('step3')} style={btnPrimaryLight}>
                  <span>Proceed to Suspect/Witness Details</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUSPECT & WITNESS INFORMATION */}
          {currentStep === 'step3' && (
            <div style={stepCardStyle}>
              <h4 style={stepTitleStyle}>
                <User size={18} style={{ color: '#2563eb' }} /> Step 3: Suspect & Witness Information
              </h4>

              <div style={{ marginBottom: '18px', padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ ...labelStyle, fontSize: '0.82rem', color: '#1e3a8a', marginBottom: '8px' }}>Do you know or suspect any specific person?</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['No', 'Yes'].map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                      <input type="radio" name="knowSuspect" value={opt} checked={knowSuspect === opt} onChange={e => setKnowSuspect(e.target.value)} />
                      <span>{opt === 'Yes' ? 'Yes, I have suspect details' : 'No, Unknown suspect(s)'}</span>
                    </label>
                  ))}
                </div>

                {knowSuspect === 'Yes' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }}>
                    <div>
                      <label style={labelStyle}>Suspect Name / Alias:</label>
                      <input type="text" placeholder="e.g. Raju or 'Caller from +91...'" value={suspectName} onChange={e => setSuspectName(e.target.value)} style={lightInputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Approximate Age:</label>
                      <input type="text" placeholder="e.g. 25 - 30 years" value={suspectAge} onChange={e => setSuspectAge(e.target.value)} style={lightInputStyle} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Suspect Physical Description / Vehicle No / Phone:</label>
                      <textarea rows={2} placeholder="Height, clothes, vehicle model/number, phone number, accent..." value={suspectDescription} onChange={e => setSuspectDescription(e.target.value)} style={lightInputStyle} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ ...labelStyle, fontSize: '0.82rem', color: '#1e3a8a', marginBottom: '8px' }}>Are there any eyewitnesses to the incident?</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['No', 'Yes'].map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                      <input type="radio" name="hasWitness" value={opt} checked={hasWitness === opt} onChange={e => setHasWitness(e.target.value)} />
                      <span>{opt === 'Yes' ? 'Yes, I have witness information' : 'No eyewitnesses'}</span>
                    </label>
                  ))}
                </div>

                {hasWitness === 'Yes' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }}>
                    <div>
                      <label style={labelStyle}>Witness Name:</label>
                      <input type="text" placeholder="Witness Full Name" value={witnessName} onChange={e => setWitnessName(e.target.value)} style={lightInputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Witness Mobile Number:</label>
                      <input type="text" placeholder="e.g. 9876543210" value={witnessMobile} onChange={e => setWitnessMobile(e.target.value)} style={lightInputStyle} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Witness Address / Contact Info:</label>
                      <input type="text" placeholder="Witness address..." value={witnessAddress} onChange={e => setWitnessAddress(e.target.value)} style={lightInputStyle} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button onClick={() => setCurrentStep('step2')} style={btnSecondaryLight}><ArrowLeft size={16} /> Back</button>
                <button onClick={() => setCurrentStep('step4')} style={btnPrimaryLight}>
                  <span>Proceed to Evidence Collection</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: MANUAL SCRIPT & 7 EVIDENCE CATEGORIES COLLECTION */}
          {currentStep === 'step4' && (
            <div style={stepCardStyle}>
              <h4 style={stepTitleStyle}>
                <Paperclip size={18} style={{ color: '#2563eb' }} /> Step 4: Evidence Collection & Manual Script Upload
              </h4>

              {/* 1. MANUAL SCRIPT / HANDWRITTEN COMPLAINT UPLOAD SECTION */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '18px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#1e3a8a', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <Camera size={18} style={{ color: '#2563eb' }} /> Upload Manual Script / Handwritten Complaint Document
                </div>
                <p style={{ fontSize: '0.74rem', color: '#475569', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                  Attach a photo or PDF copy of an existing manual paper complaint.
                </p>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{ background: '#2563eb', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} /> Upload Manual Script File
                    <input type="file" accept="image/*,.pdf" onChange={handleHandwrittenFileUpload} style={{ display: 'none' }} />
                  </label>

                  {handwrittenDocName ? (
                    <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                      <FileCheck size={16} /> Uploaded: {handwrittenDocName}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>No manual script file selected</span>
                  )}
                </div>
              </div>

              {/* 2. 7 CATEGORIZED EVIDENCE COUNTERS & DYNAMIC SLOTS */}
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '18px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1e3a8a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Paperclip size={18} style={{ color: '#2563eb' }} /> Evidence Collection 
                </div>
                <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '0 0 16px 0' }}>
                  Add image or video evidence to support the complaint, select number of evidence items and upload the evidence.
                </p>

                {/* 7 EVIDENCE CATEGORIES COUNTER GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  
                  {/* 1. Photos */}
                  <div style={countCardLight}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 800, color: '#1d4ed8' }}>
                      <Image size={15} /> 📷 Photos
                    </div>
                    <div style={counterControlLight}>
                      <button onClick={() => setPhotosCount(Math.max(0, photosCount - 1))} style={counterBtnLight}><Minus size={12} /></button>
                      <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a', width: '24px', textAlign: 'center' }}>{photosCount}</span>
                      <button onClick={() => setPhotosCount(Math.min(20, photosCount + 1))} style={counterBtnLight}><Plus size={12} /></button>
                    </div>
                  </div>

                  {/* 2. Videos */}
                  <div style={countCardLight}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 800, color: '#7e22ce' }}>
                      <Film size={15} /> 🎥 Videos
                    </div>
                    <div style={counterControlLight}>
                      <button onClick={() => setVideosCount(Math.max(0, videosCount - 1))} style={counterBtnLight}><Minus size={12} /></button>
                      <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a', width: '24px', textAlign: 'center' }}>{videosCount}</span>
                      <button onClick={() => setVideosCount(Math.min(10, videosCount + 1))} style={counterBtnLight}><Plus size={12} /></button>
                    </div>
                  </div>

                  {/* 3. Documents */}
                  <div style={countCardLight}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 800, color: '#047857' }}>
                      <FileText size={15} /> 📄 Documents
                    </div>
                    <div style={counterControlLight}>
                      <button onClick={() => setDocumentsCount(Math.max(0, documentsCount - 1))} style={counterBtnLight}><Minus size={12} /></button>
                      <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a', width: '24px', textAlign: 'center' }}>{documentsCount}</span>
                      <button onClick={() => setDocumentsCount(Math.min(10, documentsCount + 1))} style={counterBtnLight}><Plus size={12} /></button>
                    </div>
                  </div>

                  {/* 4. Screenshots */}
                  <div style={countCardLight}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 800, color: '#b45309' }}>
                      <Camera size={15} /> 📸 Screenshots
                    </div>
                    <div style={counterControlLight}>
                      <button onClick={() => setScreenshotsCount(Math.max(0, screenshotsCount - 1))} style={counterBtnLight}><Minus size={12} /></button>
                      <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a', width: '24px', textAlign: 'center' }}>{screenshotsCount}</span>
                      <button onClick={() => setScreenshotsCount(Math.min(15, screenshotsCount + 1))} style={counterBtnLight}><Plus size={12} /></button>
                    </div>
                  </div>

                  {/* 5. Audio */}
                  <div style={countCardLight}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 800, color: '#0369a1' }}>
                      <Mic size={15} /> 🎙️ Audio
                    </div>
                    <div style={counterControlLight}>
                      <button onClick={() => setAudioCount(Math.max(0, audioCount - 1))} style={counterBtnLight}><Minus size={12} /></button>
                      <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a', width: '24px', textAlign: 'center' }}>{audioCount}</span>
                      <button onClick={() => setAudioCount(Math.min(10, audioCount + 1))} style={counterBtnLight}><Plus size={12} /></button>
                    </div>
                  </div>

                  {/* 6. Digital Files */}
                  <div style={countCardLight}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 800, color: '#4338ca' }}>
                      <Smartphone size={15} /> 📱 Digital Files
                    </div>
                    <div style={counterControlLight}>
                      <button onClick={() => setDigitalFilesCount(Math.max(0, digitalFilesCount - 1))} style={counterBtnLight}><Minus size={12} /></button>
                      <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a', width: '24px', textAlign: 'center' }}>{digitalFilesCount}</span>
                      <button onClick={() => setDigitalFilesCount(Math.min(15, digitalFilesCount + 1))} style={counterBtnLight}><Plus size={12} /></button>
                    </div>
                  </div>

                  {/* 7. Identity Documents */}
                  <div style={countCardLight}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 800, color: '#be185d' }}>
                      <BadgeCheck size={15} /> 🪪 Identity Documents
                    </div>
                    <div style={counterControlLight}>
                      <button onClick={() => setIdentityDocsCount(Math.max(0, identityDocsCount - 1))} style={counterBtnLight}><Minus size={12} /></button>
                      <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a', width: '24px', textAlign: 'center' }}>{identityDocsCount}</span>
                      <button onClick={() => setIdentityDocsCount(Math.min(5, identityDocsCount + 1))} style={counterBtnLight}><Plus size={12} /></button>
                    </div>
                  </div>

                </div>

                {/* DYNAMIC UPLOAD SLOTS GENERATOR FOR ALL 7 CATEGORIES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* 1. Photo Upload Slots */}
                  {photosCount > 0 && (
                    <div style={evidenceGroupLight}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1d4ed8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Image size={14} /> 📷 Photo Upload Slots ({photosCount}):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {Array.from({ length: photosCount }).map((_, idx) => {
                          const slotKey = `photo_${idx + 1}`;
                          const fileObj = evidenceFiles[slotKey];
                          return (
                            <div key={slotKey} style={uploadSlotLight}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>📷 Photo #{idx + 1}</div>
                              {fileObj ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>✓ {fileObj.name}</span>
                                  <button onClick={() => handleRemoveSlotFile(slotKey)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={13} /></button>
                                </div>
                              ) : (
                                <label style={slotUploadBtnLight}>
                                  <span>Upload Photo</span>
                                  <input type="file" accept="image/*" onChange={(e) => handleSlotFileChange(slotKey, e)} style={{ display: 'none' }} />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Video Upload Slots */}
                  {videosCount > 0 && (
                    <div style={evidenceGroupLight}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7e22ce', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Film size={14} /> 🎥 Video Upload Slots ({videosCount}):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {Array.from({ length: videosCount }).map((_, idx) => {
                          const slotKey = `video_${idx + 1}`;
                          const fileObj = evidenceFiles[slotKey];
                          return (
                            <div key={slotKey} style={uploadSlotLight}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>🎥 Video #{idx + 1}</div>
                              {fileObj ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>✓ {fileObj.name}</span>
                                  <button onClick={() => handleRemoveSlotFile(slotKey)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={13} /></button>
                                </div>
                              ) : (
                                <label style={slotUploadBtnLight}>
                                  <span>Upload Video</span>
                                  <input type="file" accept="video/*" onChange={(e) => handleSlotFileChange(slotKey, e)} style={{ display: 'none' }} />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Document Upload Slots */}
                  {documentsCount > 0 && (
                    <div style={evidenceGroupLight}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#047857', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} /> 📄 Document Upload Slots ({documentsCount}):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {Array.from({ length: documentsCount }).map((_, idx) => {
                          const slotKey = `doc_${idx + 1}`;
                          const fileObj = evidenceFiles[slotKey];
                          return (
                            <div key={slotKey} style={uploadSlotLight}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>📄 Document #{idx + 1}</div>
                              {fileObj ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>✓ {fileObj.name}</span>
                                  <button onClick={() => handleRemoveSlotFile(slotKey)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={13} /></button>
                                </div>
                              ) : (
                                <label style={slotUploadBtnLight}>
                                  <span>Upload Document</span>
                                  <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleSlotFileChange(slotKey, e)} style={{ display: 'none' }} />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. Screenshot Upload Slots */}
                  {screenshotsCount > 0 && (
                    <div style={evidenceGroupLight}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b45309', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Camera size={14} /> 📸 Screenshot Upload Slots ({screenshotsCount}):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {Array.from({ length: screenshotsCount }).map((_, idx) => {
                          const slotKey = `screenshot_${idx + 1}`;
                          const fileObj = evidenceFiles[slotKey];
                          return (
                            <div key={slotKey} style={uploadSlotLight}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>📸 Screenshot #{idx + 1}</div>
                              {fileObj ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>✓ {fileObj.name}</span>
                                  <button onClick={() => handleRemoveSlotFile(slotKey)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={13} /></button>
                                </div>
                              ) : (
                                <label style={slotUploadBtnLight}>
                                  <span>Upload Screenshot</span>
                                  <input type="file" accept="image/*" onChange={(e) => handleSlotFileChange(slotKey, e)} style={{ display: 'none' }} />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 5. Audio Upload Slots */}
                  {audioCount > 0 && (
                    <div style={evidenceGroupLight}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0369a1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mic size={14} /> 🎙️ Audio Recording Slots ({audioCount}):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {Array.from({ length: audioCount }).map((_, idx) => {
                          const slotKey = `audio_${idx + 1}`;
                          const fileObj = evidenceFiles[slotKey];
                          return (
                            <div key={slotKey} style={uploadSlotLight}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>🎙️ Audio Recording #{idx + 1}</div>
                              {fileObj ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>✓ {fileObj.name}</span>
                                  <button onClick={() => handleRemoveSlotFile(slotKey)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={13} /></button>
                                </div>
                              ) : (
                                <label style={slotUploadBtnLight}>
                                  <span>Upload Audio</span>
                                  <input type="file" accept="audio/*" onChange={(e) => handleSlotFileChange(slotKey, e)} style={{ display: 'none' }} />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 6. Digital Files Upload Slots */}
                  {digitalFilesCount > 0 && (
                    <div style={evidenceGroupLight}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4338ca', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Smartphone size={14} /> 📱 Digital File Slots ({digitalFilesCount}):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {Array.from({ length: digitalFilesCount }).map((_, idx) => {
                          const slotKey = `digital_${idx + 1}`;
                          const fileObj = evidenceFiles[slotKey];
                          return (
                            <div key={slotKey} style={uploadSlotLight}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>📱 Digital File #{idx + 1}</div>
                              {fileObj ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>✓ {fileObj.name}</span>
                                  <button onClick={() => handleRemoveSlotFile(slotKey)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={13} /></button>
                                </div>
                              ) : (
                                <label style={slotUploadBtnLight}>
                                  <span>Upload File</span>
                                  <input type="file" onChange={(e) => handleSlotFileChange(slotKey, e)} style={{ display: 'none' }} />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 7. Identity Documents Upload Slots */}
                  {identityDocsCount > 0 && (
                    <div style={evidenceGroupLight}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#be185d', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BadgeCheck size={14} /> 🪪 Identity Document Slots ({identityDocsCount}):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {Array.from({ length: identityDocsCount }).map((_, idx) => {
                          const slotKey = `id_doc_${idx + 1}`;
                          const fileObj = evidenceFiles[slotKey];
                          return (
                            <div key={slotKey} style={uploadSlotLight}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>🪪 Identity Doc #{idx + 1}</div>
                              {fileObj ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>✓ {fileObj.name}</span>
                                  <button onClick={() => handleRemoveSlotFile(slotKey)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={13} /></button>
                                </div>
                              ) : (
                                <label style={slotUploadBtnLight}>
                                  <span>Upload ID Proof</span>
                                  <input type="file" accept="image/*,.pdf" onChange={(e) => handleSlotFileChange(slotKey, e)} style={{ display: 'none' }} />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button onClick={() => setCurrentStep('step3')} style={btnSecondaryLight}><ArrowLeft size={16} /> Back</button>
                <button onClick={() => setCurrentStep('step5')} style={btnPrimaryLight}>
                  <span>Proceed to Preview & Submit</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: COMPLAINT PREVIEW -> EDIT -> CONFIRM & SUBMIT FLOW */}
          {currentStep === 'step5' && (
            <div style={stepCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '2px solid #eff6ff', paddingBottom: '10px' }}>
                <h4 style={{ ...stepTitleStyle, margin: 0, border: 'none', padding: 0 }}>
                  <Eye size={18} style={{ color: '#2563eb' }} /> Step 5: Complaint Preview & Verification
                </h4>
                <button onClick={() => setCurrentStep('step1')} style={{ ...btnSecondaryLight, padding: '4px 10px', fontSize: '0.72rem', color: '#2563eb', borderColor: '#93c5fd' }}>
                  <Edit3 size={13} /> Edit Complaint
                </button>
              </div>

              {/* COMPLAINT PREVIEW CARD - LIGHT */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginBottom: '16px', maxHeight: '280px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#1e3a8a' }}>👤 Complainant Info:</span>
                  <span style={{ color: '#059669', fontWeight: 800 }}>ID Proof: {idProofType} ({idProofNumber || 'Attached'})</span>
                </div>
                <div style={{ color: '#334155', marginBottom: '12px', lineHeight: 1.5 }}>
                  <b>Name:</b> {fullName || 'Applicant'} | <b>Mobile:</b> {mobileNumber || loginMobile} | <b>Gender:</b> {gender}<br />
                  <b>Address:</b> {presentAddress || 'N/A'}, {district}, {state} ({pinCode})
                </div>

                <div style={{ fontWeight: 800, color: '#1e3a8a', marginBottom: '6px' }}>📍 Incident & Jurisdiction:</div>
                <div style={{ color: '#334155', marginBottom: '12px', lineHeight: 1.5 }}>
                  <b>Nature of Crime:</b> {natureOfComplaint}<br />
                  <b>Date & Time:</b> {dateFrom} at {timeFrom}<br />
                  <b>Jurisdiction Station:</b> <span style={{ color: '#1d4ed8', fontWeight: 800 }}>{selectedStation}</span> ({incidentDistrict})<br />
                  <b>Exact Location:</b> {incidentLocation}<br />
                  <b>Narrative:</b> "{incidentDescription}"
                </div>

                <div style={{ fontWeight: 800, color: '#1e3a8a', marginBottom: '6px' }}>📁 Manual Script & Evidence Summary:</div>
                <div style={{ color: '#334155', lineHeight: 1.5 }}>
                  <b>Manual Script:</b> {handwrittenDocName ? `Uploaded (${handwrittenDocName})` : 'Not Uploaded'}<br />
                  <b>Evidence Counts:</b> Photos ({photosCount}), Videos ({videosCount}), Docs ({documentsCount}), Screenshots ({screenshotsCount}), Audio ({audioCount}), Digital Files ({digitalFilesCount}), ID Docs ({identityDocsCount})<br />
                  <b>Attached Files:</b> {Object.values(evidenceFiles).map(f => f.name).join(', ') || 'None attached'}
                </div>
              </div>

              {/* DECLARATION CONSENT CHECKBOX */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.75rem', color: '#92400e', fontWeight: 700 }}>
                  <input type="checkbox" checked={declarationConsent} onChange={e => setDeclarationConsent(e.target.checked)} style={{ marginTop: '2px' }} />
                  <span>I solemnly affirm that the statements made above are true and accurate. I understand that submitting false police information is punishable under Section 217 Bharateeya Nyaya Sanhita (BNS) & IT Act.</span>
                </label>
              </div>

              {/* FINAL OTP VERIFICATION */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '12px', marginBottom: '18px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534', marginBottom: '8px' }}>Final Mobile OTP Authentication:</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="text" placeholder="OTP (998877)" value={submitOtp} onChange={e => setSubmitOtp(e.target.value)} style={{ ...lightInputStyle, width: '160px', letterSpacing: '2px', fontWeight: 800 }} />
                  <button onClick={handleSendSubmitOtp} style={{ background: '#059669', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                    {submitOtpSent ? 'Resend OTP' : 'Get OTP'}
                  </button>
                  <span style={{ fontSize: '0.7rem', color: '#15803d' }}>{submitOtpSent && '✓ Verification OTP sent'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setCurrentStep('step1')} style={btnSecondaryLight}><Edit3 size={15} /> Edit Form</button>
                <button onClick={handleSubmitComplaint} disabled={isSubmitting} style={{ ...btnPrimaryLight, background: 'linear-gradient(90deg, #059669, #10b981)', padding: '10px 20px', fontSize: '0.85rem' }}>
                  {isSubmitting ? 'Registering e-Complaint...' : 'Confirm & Submit Complaint'}
                  <CheckCircle2 size={18} />
                </button>
              </div>
            </div>
          )}

          {/* CONFIRMATION & UNIQUE COMPLAINT ID GENERATION SCREEN */}
          {currentStep === 'confirmation' && (
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div style={{ background: '#10b981', color: 'white', width: '64px', height: '64px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 10px 30px rgba(16,185,129,0.3)' }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#065f46', marginBottom: '4px' }}>
                e-Complaint Successfully Registered!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '18px' }}>
                Your complaint case record has been generated and stored in the official database.
              </p>

              {/* UNIQUE COMPLAINT ID DISPLAY BOX */}
              <div style={{ background: '#ffffff', border: '2px dashed #059669', padding: '18px', borderRadius: '18px', maxWidth: '460px', margin: '0 auto 24px auto', boxShadow: '0 4px 16px rgba(5,150,105,0.1)' }}>
                <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Official Unique Complaint Reference ID</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '1.5px', marginTop: '4px', marginBottom: '4px' }}>
                  {refNumber || 'KSP-EC-2026-89412'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Assigned Station: <b>{selectedStation}</b></div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                <button
                  onClick={downloadAcknowledgmentPDF}
                  style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}
                >
                  <Download size={18} /> Download Official Receipt (PDF)
                </button>
                <button
                  onClick={onClose}
                  style={{ background: '#ffffff', color: '#1e3a8a', border: '1.5px solid #cbd5e1', padding: '12px 22px', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  Return to Sentinel Chatbot
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

const stepCardStyle = {
  background: '#ffffff',
  padding: '24px',
  borderRadius: '20px',
  border: '1px solid #cbd5e1',
  boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
};

const stepTitleStyle = {
  fontSize: '1rem',
  fontWeight: 900,
  color: '#1e3a8a',
  marginBottom: '16px',
  borderBottom: '2px solid #eff6ff',
  paddingBottom: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const labelStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#334155',
  display: 'block',
  marginBottom: '4px'
};

const lightInputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  fontSize: '0.82rem',
  marginTop: '2px',
  outline: 'none',
  background: '#f8fafc',
  color: '#0f172a',
  fontWeight: 600
};

const btnPrimaryLight = {
  background: 'linear-gradient(90deg, #1d4ed8, #2563eb)',
  color: 'white',
  border: 'none',
  padding: '10px 18px',
  borderRadius: '10px',
  fontWeight: 800,
  fontSize: '0.82rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  boxShadow: '0 4px 14px rgba(37,99,235,0.25)'
};

const btnSecondaryLight = {
  background: '#ffffff',
  color: '#334155',
  border: '1px solid #cbd5e1',
  padding: '10px 18px',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '0.82rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const countCardLight = {
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '8px'
};

const counterControlLight = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  padding: '3px 6px'
};

const counterBtnLight = {
  background: '#2563eb',
  color: 'white',
  border: 'none',
  width: '22px',
  height: '22px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const evidenceGroupLight = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '12px'
};

const uploadSlotLight = {
  background: '#ffffff',
  border: '1.5px dashed #93c5fd',
  borderRadius: '10px',
  padding: '8px 10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const slotUploadBtnLight = {
  background: '#eff6ff',
  border: '1px solid #93c5fd',
  color: '#1d4ed8',
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '0.7rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-block',
  textAlign: 'center',
  marginTop: '2px'
};

export default ComplaintPortal;

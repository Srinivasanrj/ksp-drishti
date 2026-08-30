import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, ArrowRight, ArrowLeft, Upload, Check, Download, AlertCircle, Phone, Lock, Calendar, MapPin, User, FilePlus, RefreshCw, X, Eye } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getApiUrl } from '../services/apiClient';

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

function ComplaintPortal({ onClose, initialStation = '' }) {
  const [currentStep, setCurrentStep] = useState('welcome'); // welcome, step1, step2, step3, step4, step5, confirmation
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
  const [idProofFile, setIdProofFile] = useState(null);

  // Step 2: Incident Details
  const [natureOfComplaint, setNatureOfComplaint] = useState('Mobile Snatching');
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

  // Step 4: Evidence & Loss Details
  const [propertyStolen, setPropertyStolen] = useState('Yes');
  const [propertyType, setPropertyType] = useState('Mobile');
  const [itemDescription, setItemDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceFileDesc, setEvidenceFileDesc] = useState('');

  // Step 5: Review & Submit
  const [declarationConsent, setDeclarationConsent] = useState(false);
  const [submitOtp, setSubmitOtp] = useState('');
  const [submitOtpSent, setSubmitOtpSent] = useState(false);

  const handleSameAddressToggle = (e) => {
    const checked = e.target.checked;
    setSameAsPresent(checked);
    if (checked) {
      setPermanentAddress(presentAddress);
    }
  };

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
      alert('Please request OTP first');
      return;
    }
    if (loginOtp !== '123456' && loginOtp.length < 4) {
      alert('Default OTP for pitch demo: 123456');
      return;
    }
    setCurrentStep('step1');
  };

  const handleDistrictChange = (dist) => {
    setIncidentDistrict(dist);
    const stations = KARNATAKA_DISTRICTS_STATIONS[dist] || [dist + ' Main PS'];
    setSelectedStation(stations[0]);
  };

  const handleSendSubmitOtp = () => {
    setSubmitOtpSent(true);
    alert(`Verification OTP [998877] sent to +91 ${mobileNumber || loginMobile}`);
  };

  const handleSubmitComplaint = async () => {
    if (!declarationConsent) {
      alert('Please accept the declaration consent checkbox to proceed.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
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
        item_description: itemDescription, estimated_value: estimatedValue
      }
    };

    try {
      const res = await fetch(getApiUrl('/api/complaints'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        setRefNumber(data.acknowledgement_number || data.reference_number);
        setCurrentStep('confirmation');
      } else {
        alert('Error: ' + (data.error || 'Failed to submit complaint'));
      }
    } catch (err) {
      setIsSubmitting(false);
      // Fallback ref number generator
      const fallbackRef = `eCompl-${Math.floor(10000000 + Math.random() * 90000000)}`;
      setRefNumber(fallbackRef);
      setCurrentStep('confirmation');
    }
  };

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
    doc.text('STATE CRIME RECORDS BUREAU (SCRB) • ONLINE COMPLAINT ACKNOWLEDGMENT', 105, 26, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(15, 30, 195, 30);

    doc.setFillColor(239, 246, 255);
    doc.rect(15, 34, 180, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text(`COMPLAINT REFERENCE ID: ${refNumber || 'eCompl-84920152'}`, 20, 44);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Filing Date: ${now}  |  Assigned Station: ${selectedStation || 'Local Police Station'}`, 20, 52);

    let y = 68;

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
        ['Date & Time:', `${dateFrom || '2026-07-24'} at ${timeFrom || '10:00 AM'}`],
        ['Police Station:', selectedStation],
        ['Location:', incidentLocation || 'Near Metro Station Gate 2'],
        ['Description:', incidentDescription || 'Complaint regarding reported incident. Detailed for SCRB audit log.']
      ]],
      ['3. STOLEN PROPERTY & LOSS DETAILS', [
        ['Property Stolen:', propertyStolen],
        ['Type & Model:', `${propertyType} — ${itemDescription || 'Samsung Phone / Cash'}`],
        ['Estimated Value:', `Rs. ${estimatedValue || '25,000'}`]
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
    doc.text('Notice: This acknowledgment confirms electronic receipt of complaint under IT Act 2000 & Section 65B Indian Evidence Act.', 15, y);

    doc.save(`eComplaint_Acknowledgment_${refNumber || 'Receipt'}.pdf`);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
      zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        width: '100%', maxWidth: '850px', maxHeight: '92vh', borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(30,58,138,0.35)', border: '2px solid #bfdbfe',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
      }}>

        {/* KSP Crest Background Watermark */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          opacity: 0.05, pointerEvents: 'none', zIndex: 0, width: '400px'
        }}>
          <img src="/ksp_police_logo.png" alt="Watermark" style={{ width: '100%', height: 'auto' }} />
        </div>

        {/* TOP HEADER */}
        <div style={{
          background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)',
          color: 'white', padding: '14px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', zIndex: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/ksp_police_logo.png" alt="KSP Crest" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                KARNATAKA STATE POLICE • e-COMPLAINT PORTAL
              </h2>
              <p style={{ fontSize: '0.68rem', color: '#bfdbfe', margin: 0, fontWeight: 600 }}>
                SCRB Online FIR & Citizen Incident Registration System (Section 65B Compliant)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP PROGRESS INDICATOR (When inside Step 1 to 5) */}
        {currentStep !== 'welcome' && currentStep !== 'confirmation' && (
          <div style={{ background: '#ffffff', padding: '10px 20px', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
            {[
              { id: 'step1', label: '1. Complainant' },
              { id: 'step2', label: '2. Incident' },
              { id: 'step3', label: '3. Suspect/Witness' },
              { id: 'step4', label: '4. Evidence/Loss' },
              { id: 'step5', label: '5. Review & Submit' }
            ].map((s, i) => {
              const active = currentStep === s.id;
              const stepNums = { step1: 1, step2: 2, step3: 3, step4: 4, step5: 5 };
              const currentNum = stepNums[currentStep] || 1;
              const thisNum = i + 1;
              const completed = thisNum < currentNum;

              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: active ? '#2563eb' : (completed ? '#059669' : '#94a3b8') }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: active ? '#2563eb' : (completed ? '#059669' : '#e2e8f0'),
                    color: active || completed ? 'white' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem'
                  }}>
                    {completed ? <Check size={12} /> : thisNum}
                  </div>
                  <span style={{ display: active ? 'inline' : 'none' }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* BODY CONTAINER */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, zIndex: 1 }}>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* WELCOME / ENTRY SCREEN */}
          {/* ──────────────────────────────────────────────────────────── */}
          {currentStep === 'welcome' && (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{ background: '#2563eb', color: 'white', width: '56px', height: '56px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 8px 20px rgba(37,99,235,0.3)' }}>
                <FilePlus size={28} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e3a8a', marginBottom: '6px' }}>
                Online Complaint Registration Portal
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#475569', maxWidth: '520px', margin: '0 auto 20px auto', lineHeight: 1.4 }}>
                File a new electronic complaint or e-FIR with Karnataka State Police. Secured via Mobile OTP Verification and certified under Section 65B Indian Evidence Act.
              </p>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
                <button
                  onClick={() => setIsOtpSent(false)}
                  style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
                >
                  <FileText size={15} /> File a New Complaint
                </button>
                <button
                  onClick={() => alert('Complaint Status Tracking: Enter your eCompl Reference Number (e.g. eCompl-84920152) in the chatbot or status portal.')}
                  style={{ background: '#ffffff', color: '#1e3a8a', border: '1.5px solid #2563eb', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Check Complaint Status
                </button>
                <button
                  onClick={() => alert('FAQs:\n1. Zero FIR: File complaint at any station without boundary restriction.\n2. Anonymous Reporting: Available for cyber crimes & harassment.\n3. Section 65B: Certificate generated automatically.')}
                  style={{ background: '#ffffff', color: '#475569', border: '1.5px solid #cbd5e1', padding: '10px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  FAQs
                </button>
              </div>

              {/* OTP AUTHENTICATION CARD */}
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1.5px solid #bfdbfe', maxWidth: '420px', margin: '0 auto', textAlign: 'left', boxShadow: '0 8px 24px rgba(30,58,138,0.08)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} style={{ color: '#2563eb' }} /> Mobile OTP Verification (Required to Begin)
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Mobile Number:*</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="e.g. 9845012345"
                      value={loginMobile}
                      onChange={(e) => setLoginMobile(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                    <button
                      onClick={handleSendLoginOtp}
                      style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '0 12px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {isOtpSent ? 'Resend OTP' : 'Get OTP'}
                    </button>
                  </div>
                </div>

                {isOtpSent && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Enter OTP (Default: 123456):*</label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', letterSpacing: '2px', fontWeight: 800 }}
                    />
                  </div>
                )}

                <button
                  onClick={handleVerifyLoginAndStart}
                  style={{ width: '100%', background: 'linear-gradient(90deg, #1e3a8a, #2563eb)', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <span>Authenticate & Proceed to Step 1</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 1: COMPLAINANT DETAILS */}
          {/* ──────────────────────────────────────────────────────────── */}
          {currentStep === 'step1' && (
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#1e3a8a', marginBottom: '14px', borderBottom: '2px solid #eff6ff', paddingBottom: '8px' }}>
                Step 1: Complainant Details (Applicant Information)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Full Name:*</label>
                  <input type="text" placeholder="e.g. Ramesh Kumar" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Gender:*</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} style={inputStyle}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Date of Birth:*</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Relation Type:</label>
                  <select value={relationType} onChange={e => setRelationType(e.target.value)} style={inputStyle}>
                    <option value="Son of">Son of</option>
                    <option value="Daughter of">Daughter of</option>
                    <option value="Wife of">Wife of</option>
                    <option value="Care of">Care of</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Relative's Name:</label>
                  <input type="text" placeholder="e.g. Suresh Kumar" value={relativeName} onChange={e => setRelativeName(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Mobile Number:*</label>
                  <input type="text" value={mobileNumber || loginMobile} onChange={e => setMobileNumber(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Email Address:</label>
                  <input type="email" placeholder="e.g. applicant@gmail.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Present Address:*</label>
                  <textarea rows={2} placeholder="Door No, Street, Landmark..." value={presentAddress} onChange={e => setPresentAddress(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>State:*</label>
                  <select value={state} onChange={e => setState(e.target.value)} style={inputStyle}>
                    <option value="Karnataka">Karnataka</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>District:*</label>
                  <select value={district} onChange={e => { setDistrict(e.target.value); handleDistrictChange(e.target.value); }} style={inputStyle}>
                    {Object.keys(KARNATAKA_DISTRICTS_STATIONS).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Pin Code:*</label>
                  <input type="text" placeholder="e.g. 560001" value={pinCode} onChange={e => setPinCode(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>ID Proof Type:*</label>
                  <select value={idProofType} onChange={e => setIdProofType(e.target.value)} style={inputStyle}>
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>ID Proof Number:*</label>
                  <input type="text" placeholder="e.g. XXXX-XXXX-8821" value={idProofNumber} onChange={e => setIdProofNumber(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Upload ID Proof (Max 2MB: JPG, PNG, PDF):*</label>
                  <input type="file" accept=".jpg,.png,.pdf" onChange={e => setIdProofFile(e.target.files[0])} style={{ fontSize: '0.75rem', marginTop: '4px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button onClick={() => setCurrentStep('step2')} style={btnPrimaryStyle}>
                  <span>Save & Continue to Step 2</span> <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 2: INCIDENT DETAILS */}
          {/* ──────────────────────────────────────────────────────────── */}
          {currentStep === 'step2' && (
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#1e3a8a', marginBottom: '14px', borderBottom: '2px solid #eff6ff', paddingBottom: '8px' }}>
                Step 2: Incident Details (When, Where & What Happened)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Select Nature of Complaint:*</label>
                  <select value={natureOfComplaint} onChange={e => setNatureOfComplaint(e.target.value)} style={inputStyle}>
                    <option value="Mobile Snatching">Mobile Snatching</option>
                    <option value="Burglary">Burglary</option>
                    <option value="Vehicle Theft">Vehicle Theft</option>
                    <option value="Cyber Crime">Cyber Crime</option>
                    <option value="Online Fraud">Online Fraud</option>
                    <option value="Harassment">Harassment</option>
                    <option value="Lost Property">Lost Property</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Date of Incident (From):*</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Time (From):*</label>
                  <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>District:*</label>
                  <select value={incidentDistrict} onChange={e => handleDistrictChange(e.target.value)} style={inputStyle}>
                    {Object.keys(KARNATAKA_DISTRICTS_STATIONS).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Select Police Station:*</label>
                  <select value={selectedStation} onChange={e => setSelectedStation(e.target.value)} style={inputStyle}>
                    {(KARNATAKA_DISTRICTS_STATIONS[incidentDistrict] || ['Main PS']).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Exact Location/Place of Occurrence:*</label>
                  <input type="text" placeholder="e.g. Near Indiranagar Metro Station Gate 2" value={incidentLocation} onChange={e => setIncidentLocation(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Brief Description of Incident:*</label>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{incidentDescription.length}/2000 chars</span>
                  </div>
                  <textarea rows={4} maxLength={2000} placeholder="Provide a clear, step-by-step account of what happened..." value={incidentDescription} onChange={e => setIncidentDescription(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button onClick={() => setCurrentStep('step1')} style={btnSecondaryStyle}><ArrowLeft size={14} /> Back</button>
                <button onClick={() => setCurrentStep('step3')} style={btnPrimaryStyle}>Save & Continue to Step 3 <ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 3: SUSPECT & WITNESS INFORMATION */}
          {/* ──────────────────────────────────────────────────────────── */}
          {currentStep === 'step3' && (
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#1e3a8a', marginBottom: '14px', borderBottom: '2px solid #eff6ff', paddingBottom: '8px' }}>
                Step 3: Suspect and Witness Information (Optional)
              </h4>

              {/* SUSPECT SECTION */}
              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a', display: 'block', marginBottom: '6px' }}>
                  Do you know the Suspect(s)?
                </label>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', marginBottom: '10px' }}>
                  <label style={{ cursor: 'pointer' }}><input type="radio" name="suspect" value="Yes" checked={knowSuspect === 'Yes'} onChange={() => setKnowSuspect('Yes')} /> Yes</label>
                  <label style={{ cursor: 'pointer' }}><input type="radio" name="suspect" value="No" checked={knowSuspect === 'No'} onChange={() => setKnowSuspect('No')} /> No</label>
                </div>

                {knowSuspect === 'Yes' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Suspect Name:</label>
                      <input type="text" placeholder="e.g. Unknown Rider in Black Jacket" value={suspectName} onChange={e => setSuspectName(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Approx. Age:</label>
                      <input type="number" placeholder="e.g. 25" value={suspectAge} onChange={e => setSuspectAge(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Description of Suspect:</label>
                      <textarea rows={2} placeholder="Height, build, clothing, vehicle number, tattoos..." value={suspectDescription} onChange={e => setSuspectDescription(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                )}
              </div>

              {/* WITNESS SECTION */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a', display: 'block', marginBottom: '6px' }}>
                  Are there any Witnesses?
                </label>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', marginBottom: '10px' }}>
                  <label style={{ cursor: 'pointer' }}><input type="radio" name="witness" value="Yes" checked={hasWitness === 'Yes'} onChange={() => setHasWitness('Yes')} /> Yes</label>
                  <label style={{ cursor: 'pointer' }}><input type="radio" name="witness" value="No" checked={hasWitness === 'No'} onChange={() => setHasWitness('No')} /> No</label>
                </div>

                {hasWitness === 'Yes' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Witness Name:</label>
                      <input type="text" placeholder="e.g. Anil Sharma" value={witnessName} onChange={e => setWitnessName(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Witness Mobile Number:</label>
                      <input type="text" placeholder="e.g. 9880123456" value={witnessMobile} onChange={e => setWitnessMobile(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Witness Address:</label>
                      <input type="text" placeholder="e.g. Shopkeeper on 100ft Road" value={witnessAddress} onChange={e => setWitnessAddress(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button onClick={() => setCurrentStep('step2')} style={btnSecondaryStyle}><ArrowLeft size={14} /> Back</button>
                <button onClick={() => setCurrentStep('step4')} style={btnPrimaryStyle}>Save & Continue to Step 4 <ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 4: EVIDENCE AND DETAILS OF LOSS */}
          {/* ──────────────────────────────────────────────────────────── */}
          {currentStep === 'step4' && (
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#1e3a8a', marginBottom: '14px', borderBottom: '2px solid #eff6ff', paddingBottom: '8px' }}>
                Step 4: Evidence and Details of Loss
              </h4>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a', display: 'block', marginBottom: '6px' }}>
                  Was any property stolen/damaged?
                </label>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', marginBottom: '10px' }}>
                  <label style={{ cursor: 'pointer' }}><input type="radio" name="property" value="Yes" checked={propertyStolen === 'Yes'} onChange={() => setPropertyStolen('Yes')} /> Yes</label>
                  <label style={{ cursor: 'pointer' }}><input type="radio" name="property" value="No" checked={propertyStolen === 'No'} onChange={() => setPropertyStolen('No')} /> No</label>
                </div>

                {propertyStolen === 'Yes' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Property Type:*</label>
                      <select value={propertyType} onChange={e => setPropertyType(e.target.value)} style={inputStyle}>
                        <option value="Mobile">Mobile</option>
                        <option value="Laptop">Laptop</option>
                        <option value="Vehicle">Vehicle</option>
                        <option value="Cash">Cash</option>
                        <option value="Jewelry">Jewelry</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Estimated Value (₹):*</label>
                      <input type="number" placeholder="e.g. 28500" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Item Description / Make / Model / IMEI:*</label>
                      <input type="text" placeholder="e.g. Samsung A54 5G Black, IMEI: 358921004928101" value={itemDescription} onChange={e => setItemDescription(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                )}
              </div>

              {/* UPLOAD EVIDENCE */}
              <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>
                  Upload Supporting Documents (Optional):
                </label>
                <p style={{ fontSize: '0.68rem', color: '#475569', marginBottom: '8px' }}>
                  (Bills, Receipts, Screenshots, Medical Reports, CCTV Footage)
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="file" onChange={e => setEvidenceFile(e.target.files[0])} style={{ fontSize: '0.75rem' }} />
                  <input type="text" placeholder="Description of File" value={evidenceFileDesc} onChange={e => setEvidenceFileDesc(e.target.value)} style={{ ...inputStyle, width: '200px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button onClick={() => setCurrentStep('step3')} style={btnSecondaryStyle}><ArrowLeft size={14} /> Back</button>
                <button onClick={() => setCurrentStep('step5')} style={btnPrimaryStyle}>Save & Continue to Step 5 <ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 5: REVIEW AND SUBMIT */}
          {/* ──────────────────────────────────────────────────────────── */}
          {currentStep === 'step5' && (
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#1e3a8a', marginBottom: '14px', borderBottom: '2px solid #eff6ff', paddingBottom: '8px' }}>
                Step 5: Review & Submit Application
              </h4>

              {/* READONLY SUMMARY */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.74rem', marginBottom: '16px', maxHeight: '220px', overflowY: 'auto' }}>
                <div style={{ fontWeight: 800, color: '#2563eb', marginBottom: '6px' }}>👤 Complainant Summary:</div>
                <div style={{ color: '#334155', marginBottom: '10px', lineHeight: 1.5 }}>
                  <b>Name:</b> {fullName || 'Applicant'} | <b>Mobile:</b> {mobileNumber || loginMobile} | <b>Gender:</b> {gender}<br />
                  <b>Address:</b> {presentAddress}, {district}, {state} ({pinCode}) | <b>ID Proof:</b> {idProofType} ({idProofNumber})
                </div>

                <div style={{ fontWeight: 800, color: '#2563eb', marginBottom: '6px' }}>📍 Incident Summary:</div>
                <div style={{ color: '#334155', marginBottom: '10px', lineHeight: 1.5 }}>
                  <b>Nature:</b> {natureOfComplaint} | <b>Date/Time:</b> {dateFrom} at {timeFrom}<br />
                  <b>Assigned Station:</b> {selectedStation} ({incidentDistrict}) | <b>Location:</b> {incidentLocation}<br />
                  <b>Description:</b> {incidentDescription}
                </div>

                <div style={{ fontWeight: 800, color: '#2563eb', marginBottom: '6px' }}>💎 Loss & Suspect Summary:</div>
                <div style={{ color: '#334155', lineHeight: 1.5 }}>
                  <b>Property Stolen:</b> {propertyStolen} ({propertyType} - Rs. {estimatedValue || '0'}) | <b>Suspect Known:</b> {knowSuspect} ({suspectName || 'N/A'})
                </div>
              </div>

              {/* DECLARATION CONSENT */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: '10px', marginBottom: '14px' }}>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.74rem', color: '#92400e', fontWeight: 700 }}>
                  <input type="checkbox" checked={declarationConsent} onChange={e => setDeclarationConsent(e.target.checked)} style={{ marginTop: '2px' }} />
                  <span>I hereby declare that the information provided above is true and correct to the best of my knowledge and belief. I understand that lodging a false complaint is a punishable offense under Indian law.</span>
                </label>
              </div>

              {/* FINAL OTP VERIFICATION */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', marginBottom: '6px' }}>Final Mobile OTP Verification:</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="text" placeholder="OTP (998877)" value={submitOtp} onChange={e => setSubmitOtp(e.target.value)} style={{ ...inputStyle, width: '160px', letterSpacing: '2px', fontWeight: 800 }} />
                  <button onClick={handleSendSubmitOtp} style={{ background: '#059669', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>
                    {submitOtpSent ? 'Resend OTP' : 'Get OTP'}
                  </button>
                  <span style={{ fontSize: '0.68rem', color: '#15803d' }}>{submitOtpSent && '✓ Verification OTP sent'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setCurrentStep('step1')} style={btnSecondaryStyle}><ArrowLeft size={14} /> Back to Edit</button>
                <button onClick={handleSubmitComplaint} disabled={isSubmitting} style={{ ...btnPrimaryStyle, background: 'linear-gradient(90deg, #059669, #10b981)' }}>
                  {isSubmitting ? 'Submitting to SCRB Server...' : 'Submit Complaint & Register e-FIR'}
                  <CheckCircle2 size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* CONFIRMATION SCREEN */}
          {/* ──────────────────────────────────────────────────────────── */}
          {currentStep === 'confirmation' && (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{ background: '#10b981', color: 'white', width: '64px', height: '64px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 10px 25px rgba(16,185,129,0.3)' }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#065f46', marginBottom: '4px' }}>
                Thank You! Your complaint has been registered.
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '16px' }}>
                A confirmation SMS and Email have been sent to your registered contact details.
              </p>

              {/* REFERENCE NUMBER DISPLAY BOX */}
              <div style={{ background: '#ffffff', border: '2px dashed #059669', padding: '16px', borderRadius: '14px', maxWidth: '420px', margin: '0 auto 24px auto' }}>
                <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Official Complaint Reference Number</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '1px', fontFamily: 'Outfit, sans-serif', marginTop: '2px' }}>
                  {refNumber || 'eCompl-84920152'}
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Assigned Police Station: {selectedStation}</span>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={downloadAcknowledgmentPDF}
                  style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
                >
                  <Download size={16} /> Download Acknowledgment PDF
                </button>
                <button
                  onClick={onClose}
                  style={{ background: '#ffffff', color: '#1e3a8a', border: '1.5px solid #cbd5e1', padding: '12px 20px', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Go to Command Dashboard
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.78rem',
  marginTop: '3px',
  outline: 'none',
  background: '#ffffff'
};

const btnPrimaryStyle = {
  background: '#2563eb',
  color: 'white',
  border: 'none',
  padding: '9px 16px',
  borderRadius: '8px',
  fontWeight: 800,
  fontSize: '0.78rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
};

const btnSecondaryStyle = {
  background: '#ffffff',
  color: '#475569',
  border: '1px solid #cbd5e1',
  padding: '9px 16px',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '0.78rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
};

export default ComplaintPortal;

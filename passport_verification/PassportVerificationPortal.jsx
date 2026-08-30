import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Download,
  Clock,
  UserCheck,
  UserX,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  RotateCcw,
  Check,
  FileCheck,
  BadgeAlert,
  Flame,
  Shield,
  Send,
  AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  DIVISIONS_CONFIG,
  getPassportRecords,
  savePassportRecords,
  approvePassportVerification,
  rejectPassportVerification,
  flagPassportVerification,
  resetPassportRecords
} from './dataset/passport_verification_dataset';
import { syncPassportVerificationToCatalyst } from './services/catalystPassportService';

export default function PassportVerificationPortal({ onClose }) {
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'tatkal' | 'flagged' | 'verified' | 'rejected' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [selectedSubDivision, setSelectedSubDivision] = useState('ALL');
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [selectedPassportType, setSelectedPassportType] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null); // For full dossier modal
  const [rejectModalRecord, setRejectModalRecord] = useState(null); // For reject dialog
  const [rejectReason, setRejectReason] = useState('Applicant untraceable and neighbours confirmed relocation to unknown place');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [officerRemarks, setOfficerRemarks] = useState('Clear verification report approved. No adverse records found in CCTNS Karnataka database. Passport grant recommended.');
  const [toastMsg, setToastMsg] = useState(null);

  // Load records
  const loadData = () => {
    const data = getPassportRecords();
    setRecords([...data]);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('ksp-passport-updated', handleUpdate);
    return () => window.removeEventListener('ksp-passport-updated', handleUpdate);
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Available sub-divisions based on selected division
  const availableSubDivisions = useMemo(() => {
    if (selectedDivision === 'ALL') {
      const allSub = [];
      Object.values(DIVISIONS_CONFIG).forEach(subMap => {
        allSub.push(...Object.keys(subMap));
      });
      return Array.from(new Set(allSub)).sort();
    }
    return Object.keys(DIVISIONS_CONFIG[selectedDivision] || {}).sort();
  }, [selectedDivision]);

  // Stations list based on selected division and sub-division
  const policeStations = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      if (selectedDivision !== 'ALL' && r.division !== selectedDivision) return;
      if (selectedSubDivision !== 'ALL' && r.sub_division !== selectedSubDivision) return;
      if (r.police_station) set.add(r.police_station);
    });
    return Array.from(set).sort();
  }, [records, selectedDivision, selectedSubDivision]);

  // Scope records matching division, sub-division, station, passport type, and search filters
  const scopeRecords = useMemo(() => {
    return records.filter(r => {
      // Division filter
      if (selectedDivision !== 'ALL' && r.division !== selectedDivision) return false;

      // Sub-Division filter
      if (selectedSubDivision !== 'ALL' && r.sub_division !== selectedSubDivision) return false;

      // Station filter
      if (selectedStation !== 'ALL' && r.police_station !== selectedStation) return false;

      // Passport Type filter
      if (selectedPassportType !== 'ALL' && r.passport_type !== selectedPassportType) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.applicant_name?.toLowerCase().includes(q);
        const matchId = r.application_id?.toLowerCase().includes(q);
        const matchAadhaar = r.aadhaar_number?.toLowerCase().includes(q);
        const matchMobile = r.mobile?.includes(q);
        const matchAddr = r.present_address?.toLowerCase().includes(q) || r.permanent_address?.toLowerCase().includes(q);
        const matchTravel = r.travel_country?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchAadhaar && !matchMobile && !matchAddr && !matchTravel) return false;
      }

      return true;
    });
  }, [records, selectedDivision, selectedSubDivision, selectedStation, selectedPassportType, searchQuery]);

  // Dynamic metric counts updating according to the filtered jurisdiction/scope
  const stats = useMemo(() => {
    const total = scopeRecords.length;
    const pending = scopeRecords.filter(r => r.status === 'PENDING' || r.status === 'FIELD_VISIT_DONE').length;
    const tatkalPending = scopeRecords.filter(r => (r.status === 'PENDING' || r.status === 'FIELD_VISIT_DONE') && (r.priority === 'TATKAL' || r.priority === 'URGENT')).length;
    const flagged = scopeRecords.filter(r => r.status === 'FLAGGED').length;
    const verified = scopeRecords.filter(r => r.status === 'VERIFIED').length;
    const rejected = scopeRecords.filter(r => r.status === 'REJECTED').length;
    return { total, pending, tatkalPending, flagged, verified, rejected };
  }, [scopeRecords]);

  // Filtered records for the active tab
  const filteredRecords = useMemo(() => {
    return scopeRecords.filter(r => {
      // Tab filter
      if (activeTab === 'queue') {
        return r.status === 'PENDING' || r.status === 'FIELD_VISIT_DONE';
      } else if (activeTab === 'tatkal') {
        return (r.status === 'PENDING' || r.status === 'FIELD_VISIT_DONE') && (r.priority === 'TATKAL' || r.priority === 'URGENT');
      } else if (activeTab === 'flagged') {
        return r.status === 'FLAGGED';
      } else if (activeTab === 'verified') {
        return r.status === 'VERIFIED';
      } else if (activeTab === 'rejected') {
        return r.status === 'REJECTED';
      }
      return true;
    });
  }, [scopeRecords, activeTab]);

  // Action: Approve
  const handleApprove = (appId, name) => {
    const updated = approvePassportVerification(appId, 'KSP-PSI-1001', officerRemarks);
    if (updated) {
      syncPassportVerificationToCatalyst(updated, 'APPROVE');
    }
    loadData();
    if (selectedRecord?.application_id === appId) {
      setSelectedRecord(null);
    }
    showToast(`✅ Passport Clearance Granted for ${name} (${appId}). Synced to Catalyst DataStore.`, 'success');
  };

  // Action: Reject confirm
  const handleConfirmReject = () => {
    if (!rejectModalRecord) return;
    const finalReason = rejectReason === 'OTHER' ? customRejectReason : rejectReason;
    if (!finalReason) {
      alert('Please specify a rejection reason.');
      return;
    }
    const updated = rejectPassportVerification(rejectModalRecord.application_id, finalReason, 'KSP-PSI-1001');
    if (updated) {
      syncPassportVerificationToCatalyst(updated, 'REJECT');
    }
    loadData();
    const appName = rejectModalRecord.applicant_name;
    const appId = rejectModalRecord.application_id;
    setRejectModalRecord(null);
    setCustomRejectReason('');
    if (selectedRecord?.application_id === appId) {
      setSelectedRecord(null);
    }
    showToast(`❌ Verification Adverse Report Issued for ${appName} (${appId}). Synced to Catalyst DataStore.`, 'danger');
  };

  // Action: Flag to Special Branch
  const handleFlag = (appId, name) => {
    const updated = flagPassportVerification(appId, 'Case kept in abeyance pending court clearance / CID Special Branch review.', 'KSP-PSI-1001');
    if (updated) {
      syncPassportVerificationToCatalyst(updated, 'FLAG');
    }
    loadData();
    if (selectedRecord?.application_id === appId) {
      setSelectedRecord(null);
    }
    showToast(`⚠️ Application for ${name} (${appId}) FLAGGED to CID / Special Branch & Synced to Catalyst.`, 'warning');
  };

  // Action: Reset Database
  const handleResetData = () => {
    if (window.confirm('Reset the passport verification queue back to original CCTNS dataset state?')) {
      resetPassportRecords();
      loadData();
      showToast('🔄 Passport verification dataset reset to initial state.', 'info');
    }
  };

  // Action: Generate Official PDF Clearance Certificate
  const generatePdfCertificate = (r) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('GOVERNMENT OF KARNATAKA — POLICE DEPARTMENT', 105, 14, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('POLICE VERIFICATION REPORT (PVR) FOR PASSPORT ISSUANCE', 105, 22, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Jurisdiction: ${r.police_station} | District: ${r.district}`, 105, 29, { align: 'center' });

    // Status Banner
    let bannerColor = [16, 185, 129]; // Green
    if (r.status === 'REJECTED') bannerColor = [239, 68, 68];
    if (r.status === 'FLAGGED') bannerColor = [245, 158, 11];
    if (r.status === 'PENDING' || r.status === 'FIELD_VISIT_DONE') bannerColor = [59, 130, 246];

    doc.setFillColor(...bannerColor);
    doc.roundedRect(15, 42, 180, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`VERIFICATION STATUS: ${r.status.replace('_', ' ')} ${r.status === 'VERIFIED' ? '— CLEARANCE GRANTED' : ''}`, 105, 51, { align: 'center' });

    // Section 1: Applicant Details
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. APPLICANT IDENTIFICATION & APPLICATION DETAILS', 15, 66);
    doc.setDrawColor(203, 213, 225);
    doc.line(15, 68, 195, 68);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Application Reference No: ${r.application_id}`, 18, 76);
    doc.text(`Submission Date: ${r.submission_date?.split('T')[0] || 'N/A'}`, 120, 76);
    doc.text(`Applicant Name: ${r.applicant_name}`, 18, 83);
    doc.text(`Gender / DOB: ${r.gender} | ${r.date_of_birth}`, 120, 83);
    doc.text(`Aadhaar Number: ${r.aadhaar_number}`, 18, 90);
    doc.text(`PAN Number: ${r.pan_number || 'N/A'}`, 120, 90);
    doc.text(`Contact Mobile: +91 ${r.mobile}`, 18, 97);
    doc.text(`Email Address: ${r.email}`, 120, 97);
    doc.text(`Passport Service Type: ${r.passport_type} (${r.priority} Priority)`, 18, 104);
    doc.text(`Travel Purpose / Destination: ${r.purpose} (${r.travel_country || 'Abroad'})`, 120, 104);
    if (r.previous_passport_number) {
      doc.text(`Previous Passport No: ${r.previous_passport_number}`, 18, 111);
    }

    // Section 2: Address Verification
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. RESIDENTIAL ADDRESS TENURE AUDIT', 15, 122);
    doc.line(15, 124, 195, 124);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Present Address: ${r.present_address}`, 18, 132);
    doc.text(`Permanent Address: ${r.permanent_address}`, 18, 139);
    doc.text(`Jurisdictional Taluk / PIN: ${r.taluk} — ${r.pin_code}`, 18, 146);

    // Section 3: Background & Criminal Antecedent Check
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('3. CCTNS CRIMINAL ANTECEDENT & COURT RECORD SCRUTINY', 15, 157);
    doc.line(15, 159, 195, 159);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Criminal Record Check: ${r.criminal_record ? '⚠️ ADVERSE RECORD FOUND' : '✅ NO ADVERSE RECORD FOUND'}`, 18, 167);
    doc.text(`FIRs Linked in CCTNS: ${r.fir_linked || 'None'}`, 120, 167);
    doc.text(`Court Proceedings Pending: ${r.court_case_pending ? 'YES (Court NOC Required)' : 'NO'}`, 18, 174);
    doc.text(`Lookout Notice / LOC Active: ${r.lookout_notice ? '⚠️ ACTIVE (Withhold Passport)' : 'NO'}`, 120, 174);
    doc.text(`Lok Adalat / Other Legal Matters: ${r.lok_adalat_pending ? 'Pending' : 'Clear'}`, 18, 181);

    // Section 4: Officer Endorsement
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('4. FIELD VERIFICATION & SUB-INSPECTOR ENDORSEMENT', 15, 192);
    doc.line(15, 194, 195, 194);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Assigned Beat Constable: ${r.assigned_constable_name} (${r.assigned_constable_id})`, 18, 202);
    doc.text(`Field Visit Date: ${r.field_visit_date || 'Awaited'} | Completed: ${r.field_visit_completed ? 'YES' : 'NO'}`, 120, 202);
    doc.text(`Field Officer Remarks: "${r.field_officer_remarks || 'Inspection completed.'}"`, 18, 209);
    doc.text(`Approving Sub-Inspector ID: ${r.verification_officer_id || 'KSP-PSI-1001'}`, 18, 222);
    doc.text(`Verification Timestamp: ${r.verification_date || 'In Progress'}`, 120, 222);
    doc.text(`Final Remarks: "${r.verification_remarks || (r.status === 'VERIFIED' ? 'Recommended for passport issuance.' : 'Pending review.')}"`, 18, 229);

    // Footer & Digital Seal
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 245, 180, 32, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(15, 245, 180, 32, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('This is a digitally certified police verification report generated by Karnataka State Police Sentinel Command Intelligence Portal.', 18, 253);
    doc.text('Authenticated via CCTNS Karnataka Regional Node. Valid for submission to Regional Passport Office (RPO Bengaluru).', 18, 260);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('DIGITALLY SIGNED & VERIFIED BY STATION HOUSE OFFICER (SHO / PSI)', 18, 270);

    doc.save(`KSP_Passport_Verification_${r.application_id}.pdf`);
    showToast(`📄 PDF Verification Certificate downloaded for ${r.applicant_name}`, 'success');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '1280px',
        height: '92vh',
        borderRadius: '16px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}>
        {/* TOP HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e3a8a 100%)',
          color: 'white',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              padding: '10px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={28} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.3px', color: '#ffffff' }}>
                  KSP DRISHTI — Passport Police Verification & PVR Portal
                </span>
                <span style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  letterSpacing: '0.5px'
                }}>
                  CCTNS LIVE
                </span>
                <span style={{
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  letterSpacing: '0.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a7f3d0' }} />
                  ZOHO CATALYST DATASTORE
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                Karnataka State Police • Regional Passport Office (RPO) Verification Clearance & CCTNS Background Screening (620+ Records)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleResetData}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              title="Reset records to default master dataset"
            >
              <RotateCcw size={13} /> Reset Dataset
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: 'white',
                border: 'none',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Close Portal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* METRICS COUNTER RIBBON */}
        <div style={{
          background: '#f8fafc',
          padding: '12px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '12px'
        }}>
          <div 
            onClick={() => setActiveTab('queue')}
            style={{
              background: activeTab === 'queue' ? '#eff6ff' : '#ffffff',
              border: `1.5px solid ${activeTab === 'queue' ? '#3b82f6' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '8px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} color="#2563eb" /> Active Queue
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e3a8a', marginTop: '2px' }}>
              {stats.pending}
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('tatkal')}
            style={{
              background: activeTab === 'tatkal' ? '#fef2f2' : '#ffffff',
              border: `1.5px solid ${activeTab === 'tatkal' ? '#ef4444' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '8px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Flame size={13} color="#ef4444" /> Tatkal / Urgent
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#dc2626', marginTop: '2px' }}>
              {stats.tatkalPending}
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('flagged')}
            style={{
              background: activeTab === 'flagged' ? '#fffbeb' : '#ffffff',
              border: `1.5px solid ${activeTab === 'flagged' ? '#f59e0b' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '8px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <BadgeAlert size={13} color="#f59e0b" /> Flagged / LOC
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#b45309', marginTop: '2px' }}>
              {stats.flagged}
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('verified')}
            style={{
              background: activeTab === 'verified' ? '#f0fdf4' : '#ffffff',
              border: `1.5px solid ${activeTab === 'verified' ? '#10b981' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '8px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle size={13} color="#10b981" /> Verified / Cleared
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
              {stats.verified}
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('rejected')}
            style={{
              background: activeTab === 'rejected' ? '#fef2f2' : '#ffffff',
              border: `1.5px solid ${activeTab === 'rejected' ? '#f87171' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '8px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <XCircle size={13} color="#dc2626" /> Adverse / Rejected
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#991b1b', marginTop: '2px' }}>
              {stats.rejected}
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('all')}
            style={{
              background: activeTab === 'all' ? '#f1f5f9' : '#ffffff',
              border: `1.5px solid ${activeTab === 'all' ? '#64748b' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '8px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FileText size={13} color="#64748b" /> Total Database
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#334155', marginTop: '2px' }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div style={{
          padding: '12px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* SEARCH BOX */}
          <div style={{
            position: 'relative',
            flex: '1',
            minWidth: '260px',
            maxWidth: '380px'
          }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by Name, App ID (PV-2026-...), Address, Aadhaar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                color: '#0f172a'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* DIVISION FILTER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Division:</span>
            <select
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value);
                setSelectedSubDivision('ALL');
                setSelectedStation('ALL');
              }}
              style={{
                padding: '6px 8px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#1e293b',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="ALL">All Divisions (3)</option>
              <option value="Kalaburagi">Kalaburagi Division (7)</option>
              <option value="Belagavi">Belagavi Division (7)</option>
              <option value="Bengaluru">Bengaluru Division (17)</option>
            </select>
          </div>

          {/* SUB-DIVISION / UNIT FILTER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Sub-Division / Unit:</span>
            <select
              value={selectedSubDivision}
              onChange={(e) => {
                setSelectedSubDivision(e.target.value);
                setSelectedStation('ALL');
              }}
              style={{
                padding: '6px 8px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#1e293b',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="ALL">All Sub-Divisions ({availableSubDivisions.length})</option>
              {availableSubDivisions.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* POLICE STATION FILTER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Station:</span>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              style={{
                padding: '6px 8px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#1e293b',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="ALL">All Stations ({policeStations.length})</option>
              {policeStations.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* PASSPORT TYPE FILTER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Type:</span>
            <select
              value={selectedPassportType}
              onChange={(e) => setSelectedPassportType(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#1e293b',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="ALL">All Types</option>
              <option value="Fresh">Fresh Passport</option>
              <option value="Renewal">Renewal / Re-issue</option>
              <option value="Tatkal">Tatkal Scheme</option>
            </select>
          </div>

          {/* RESULT BADGE */}
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
            Showing <strong style={{ color: '#0f172a' }}>{filteredRecords.length}</strong> application(s)
          </div>
        </div>

        {/* TOAST NOTIFICATION */}
        {toastMsg && (
          <div style={{
            background: toastMsg.type === 'danger' ? '#ef4444' : toastMsg.type === 'warning' ? '#f59e0b' : toastMsg.type === 'info' ? '#3b82f6' : '#10b981',
            color: '#ffffff',
            padding: '10px 20px',
            fontSize: '0.8rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.2s ease-in'
          }}>
            <span>{toastMsg.msg}</span>
            <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* MAIN LIST CONTENT */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          background: '#f8fafc'
        }}>
          {filteredRecords.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1'
            }}>
              <CheckCircle size={44} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                No Pending Passport Applications in this View
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px', maxWidth: '400px', margin: '6px auto 0 auto' }}>
                All applications matching current filters have been processed or moved to their respective status archives.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredRecords.map(r => {
                const isUrgent = r.priority === 'TATKAL' || r.priority === 'URGENT';
                const isPending = r.status === 'PENDING' || r.status === 'FIELD_VISIT_DONE';

                return (
                  <div
                    key={r.application_id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      border: isUrgent && isPending ? '1.5px solid #f87171' : '1px solid #e2e8f0',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'grid',
                      gridTemplateColumns: '80px 1.4fr 1.6fr 1fr 180px',
                      gap: '16px',
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* AVATAR & BADGE */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: r.gender === 'Female' ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 900,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        {r.applicant_name ? r.applicant_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'PV'}
                      </div>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: r.priority === 'TATKAL' ? '#fef2f2' : r.priority === 'URGENT' ? '#fffbeb' : '#f1f5f9',
                        color: r.priority === 'TATKAL' ? '#dc2626' : r.priority === 'URGENT' ? '#d97706' : '#475569',
                        border: `1px solid ${r.priority === 'TATKAL' ? '#fca5a5' : r.priority === 'URGENT' ? '#fcd34d' : '#cbd5e1'}`
                      }}>
                        {r.priority}
                      </span>
                    </div>

                    {/* APPLICANT CORE DETAILS */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                          {r.applicant_name}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                          ({r.gender}, DOB: {r.date_of_birth})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, marginTop: '2px', fontFamily: 'monospace' }}>
                        {r.application_id}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Aadhaar: <strong style={{ color: '#0f172a' }}>{r.aadhaar_number}</strong></span>
                        <span>•</span>
                        <span>Mob: <strong style={{ color: '#0f172a' }}>{r.mobile}</strong></span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                        Purpose: <strong style={{ color: '#334155' }}>{r.purpose}</strong> ({r.travel_country || 'Abroad'})
                      </div>
                    </div>

                    {/* LOCATION & BEAT OFFICER */}
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <MapPin size={13} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{r.present_address}</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', marginLeft: '17px' }}>
                        Station: <strong style={{ color: '#1e3a8a' }}>{r.police_station}</strong> {r.sub_division && <span style={{ color: '#475569', fontWeight: 600 }}>({r.sub_division} • {r.division})</span>}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '2px', marginLeft: '17px' }}>
                        Beat Officer: <strong>{r.assigned_constable_name}</strong> ({r.assigned_constable_id})
                      </div>
                      <div style={{ fontSize: '0.66rem', marginTop: '3px', marginLeft: '17px' }}>
                        {r.field_visit_completed ? (
                          <span style={{ color: '#059669', fontWeight: 800 }}>✅ Field Visit Completed ({r.field_visit_date})</span>
                        ) : (
                          <span style={{ color: '#d97706', fontWeight: 800 }}>⏳ Physical Inspection Scheduled</span>
                        )}
                      </div>
                    </div>

                    {/* CCTNS & CRIME CHECK */}
                    <div>
                      {r.criminal_record || r.court_case_pending || r.lookout_notice ? (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 8px' }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} /> CCTNS Adverse Tag
                          </div>
                          <div style={{ fontSize: '0.64rem', color: '#991b1b', marginTop: '2px', lineHeight: 1.2 }}>
                            {r.fir_linked ? `Linked FIR: ${r.fir_linked}` : r.lookout_notice ? 'Lookout Notice Active' : 'Court Case Pending'}
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 8px' }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Clear Antecedent
                          </div>
                          <div style={{ fontSize: '0.64rem', color: '#15803d', marginTop: '2px' }}>
                            No criminal cases in CCTNS
                          </div>
                        </div>
                      )}

                      {/* Documents Uploaded check */}
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.6rem', padding: '1px 4px', borderRadius: '3px', background: r.documents.aadhaar_uploaded ? '#e0f2fe' : '#fee2e2', color: r.documents.aadhaar_uploaded ? '#0369a1' : '#991b1b', fontWeight: 700 }}>Aadhaar</span>
                        <span style={{ fontSize: '0.6rem', padding: '1px 4px', borderRadius: '3px', background: r.documents.address_proof ? '#e0f2fe' : '#fee2e2', color: r.documents.address_proof ? '#0369a1' : '#991b1b', fontWeight: 700 }}>Addr Proof</span>
                        <span style={{ fontSize: '0.6rem', padding: '1px 4px', borderRadius: '3px', background: r.documents.photo ? '#e0f2fe' : '#fee2e2', color: r.documents.photo ? '#0369a1' : '#991b1b', fontWeight: 700 }}>Photo</span>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleApprove(r.application_id, r.applicant_name)}
                            style={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 4px rgba(16,185,129,0.2)'
                            }}
                            title="Approve verification and mark as completed"
                          >
                            <Check size={13} /> Verify & Clear
                          </button>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                            <button
                              onClick={() => setSelectedRecord(r)}
                              style={{
                                background: '#f1f5f9',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px'
                              }}
                              title="Inspect full application dossier"
                            >
                              <Eye size={11} /> View
                            </button>

                            <button
                              onClick={() => {
                                setRejectModalRecord(r);
                                setRejectReason('Applicant untraceable and neighbours confirmed relocation to unknown place');
                              }}
                              style={{
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px'
                              }}
                              title="Reject with adverse report"
                            >
                              <XCircle size={11} /> Reject
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{
                            textAlign: 'center',
                            padding: '4px',
                            borderRadius: '6px',
                            background: r.status === 'VERIFIED' ? '#dcfce7' : r.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                            color: r.status === 'VERIFIED' ? '#15803d' : r.status === 'REJECTED' ? '#b91c1c' : '#b45309',
                            fontSize: '0.7rem',
                            fontWeight: 800
                          }}>
                            {r.status === 'VERIFIED' ? '✅ VERIFIED' : r.status === 'REJECTED' ? '❌ REJECTED' : '⚠️ FLAGGED'}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                            <button
                              onClick={() => setSelectedRecord(r)}
                              style={{
                                background: '#f1f5f9',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px'
                              }}
                            >
                              <Eye size={11} /> Dossier
                            </button>

                            <button
                              onClick={() => generatePdfCertificate(r)}
                              style={{
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px'
                              }}
                              title="Download official PDF report"
                            >
                              <Download size={11} /> PDF
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* REJECT MODAL DIALOG */}
        {rejectModalRecord && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid #fecaca'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', marginBottom: '14px' }}>
                <AlertTriangle size={24} />
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  Issue Adverse Passport Verification Report
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '16px' }}>
                You are about to issue an adverse verification report for <strong>{rejectModalRecord.applicant_name}</strong> (App ID: <code>{rejectModalRecord.application_id}</code>). This will notify the Regional Passport Office (RPO).
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                  Select Statutory Adverse Reason:
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.8rem',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                >
                  <option value="Applicant untraceable and neighbours confirmed relocation to unknown place">
                    Applicant untraceable and neighbours confirmed relocation
                  </option>
                  <option value="Address proof submitted found forged or non-verifiable">
                    Address proof submitted found forged or non-verifiable
                  </option>
                  <option value="Discrepancy found in date of birth between Aadhaar and School Certificate">
                    Discrepancy found in date of birth between Aadhaar & records
                  </option>
                  <option value="Applicant failed to produce original documents during physical verification">
                    Applicant failed to produce original documents during physical verification
                  </option>
                  <option value="Active court injunction / travel restriction recorded in CCTNS">
                    Active court injunction / travel restriction recorded in CCTNS
                  </option>
                  <option value="Adverse report: Ongoing criminal investigation and FIR pending">
                    Adverse report: Ongoing criminal investigation and FIR pending
                  </option>
                  <option value="OTHER">Other Custom Adverse Grounds...</option>
                </select>
              </div>

              {rejectReason === 'OTHER' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                    Type Detailed Officer Adverse Remarks:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter explicit factual grounds for adverse clearance..."
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #fca5a5',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setRejectModalRecord(null)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Confirm Adverse Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULL DOSSIER MODAL */}
        {selectedRecord && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* DOSSIER HEADER */}
              <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                color: 'white',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Dossier: {selectedRecord.applicant_name}</span>
                    <span style={{ fontSize: '0.72rem', background: '#2563eb', padding: '2px 8px', borderRadius: '12px' }}>
                      {selectedRecord.application_id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                    {selectedRecord.police_station} • {selectedRecord.district}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRecord(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* DOSSIER BODY */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* 1. STATUS & DATES */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>CURRENT STATUS</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 900, color: selectedRecord.status === 'VERIFIED' ? '#059669' : selectedRecord.status === 'REJECTED' ? '#dc2626' : '#2563eb', marginTop: '2px' }}>
                      {selectedRecord.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>PRIORITY SCHEME</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 900, color: selectedRecord.priority === 'TATKAL' ? '#dc2626' : '#1e293b', marginTop: '2px' }}>
                      {selectedRecord.priority} ({selectedRecord.passport_type})
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>SUBMISSION DATE</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                      {selectedRecord.submission_date?.replace('T', ' ') || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>DESTINATION</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                      {selectedRecord.travel_country || 'Abroad'} ({selectedRecord.purpose})
                    </div>
                  </div>
                </div>

                {/* 2. PERSONAL & ADDRESS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                      👤 Personal Identification
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div><strong>Full Name:</strong> {selectedRecord.applicant_name}</div>
                      <div><strong>Gender / DOB:</strong> {selectedRecord.gender} | {selectedRecord.date_of_birth}</div>
                      <div><strong>Aadhaar:</strong> {selectedRecord.aadhaar_number}</div>
                      <div><strong>PAN Card:</strong> {selectedRecord.pan_number || 'N/A'}</div>
                      <div><strong>Mobile:</strong> +91 {selectedRecord.mobile}</div>
                      <div><strong>Email:</strong> {selectedRecord.email}</div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                      📍 Address & Beat Police Station
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div><strong>Present Address:</strong> {selectedRecord.present_address}</div>
                      <div><strong>Permanent Address:</strong> {selectedRecord.permanent_address}</div>
                      <div><strong>Police Station:</strong> {selectedRecord.police_station}</div>
                      <div><strong>Beat Officer:</strong> {selectedRecord.assigned_constable_name} ({selectedRecord.assigned_constable_id})</div>
                      <div><strong>Field Visit:</strong> {selectedRecord.field_visit_completed ? `Completed (${selectedRecord.field_visit_date})` : 'Inspection Scheduled'}</div>
                    </div>
                  </div>
                </div>

                {/* 3. CCTNS CRIMINAL ANTECEDENT AUDIT */}
                {(() => {
                  const hasAdverseCheck = selectedRecord.criminal_record || selectedRecord.fir_linked || selectedRecord.court_case_pending || selectedRecord.lookout_notice || selectedRecord.lok_adalat_pending || selectedRecord.posh_cases;
                  
                  return (
                    <div style={{
                      background: hasAdverseCheck ? '#fef2f2' : '#f0fdf4',
                      border: `1.5px solid ${hasAdverseCheck ? '#fca5a5' : '#bbf7d0'}`,
                      borderRadius: '10px',
                      padding: '14px'
                    }}>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 900,
                        color: hasAdverseCheck ? '#b91c1c' : '#15803d',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={16} /> CCTNS Karnataka Background Check Results
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: hasAdverseCheck ? '#fee2e2' : '#dcfce7',
                          color: hasAdverseCheck ? '#dc2626' : '#166534',
                          border: `1px solid ${hasAdverseCheck ? '#f87171' : '#86efac'}`
                        }}>
                          {hasAdverseCheck ? '⚠️ ADVERSE HIT DETECTED' : '✅ 100% CLEAR RECORD'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.76rem' }}>
                        {/* 1. Criminal Record */}
                        <div style={{ background: 'rgba(255,255,255,0.85)', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${selectedRecord.criminal_record ? '#fca5a5' : 'rgba(0,0,0,0.06)'}` }}>
                          <span style={{ color: '#475569', fontWeight: 600, display: 'block', fontSize: '0.68rem', marginBottom: '2px' }}>Criminal Record:</span>
                          <strong style={{ color: selectedRecord.criminal_record ? '#dc2626' : '#15803d', fontWeight: 800 }}>
                            {selectedRecord.criminal_record ? '⚠️ YES (Adverse Record Found)' : '✅ None (Clear)'}
                          </strong>
                        </div>

                        {/* 2. Linked FIRs */}
                        <div style={{ background: 'rgba(255,255,255,0.85)', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${selectedRecord.fir_linked ? '#fca5a5' : 'rgba(0,0,0,0.06)'}` }}>
                          <span style={{ color: '#475569', fontWeight: 600, display: 'block', fontSize: '0.68rem', marginBottom: '2px' }}>Linked FIRs:</span>
                          <strong style={{ color: selectedRecord.fir_linked ? '#dc2626' : '#0f172a', fontWeight: 800 }}>
                            {selectedRecord.fir_linked ? `⚠️ YES (${selectedRecord.fir_linked})` : 'None'}
                          </strong>
                        </div>

                        {/* 3. Lookout Circular */}
                        <div style={{ background: 'rgba(255,255,255,0.85)', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${selectedRecord.lookout_notice ? '#fca5a5' : 'rgba(0,0,0,0.06)'}` }}>
                          <span style={{ color: '#475569', fontWeight: 600, display: 'block', fontSize: '0.68rem', marginBottom: '2px' }}>Lookout Circular (LOC):</span>
                          <strong style={{ color: selectedRecord.lookout_notice ? '#dc2626' : '#0f172a', fontWeight: 800 }}>
                            {selectedRecord.lookout_notice ? '⚠️ YES (Active LOC - Withhold)' : 'None'}
                          </strong>
                        </div>

                        {/* 4. Pending Court Case */}
                        <div style={{ background: 'rgba(255,255,255,0.85)', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${selectedRecord.court_case_pending ? '#fca5a5' : 'rgba(0,0,0,0.06)'}` }}>
                          <span style={{ color: '#475569', fontWeight: 600, display: 'block', fontSize: '0.68rem', marginBottom: '2px' }}>Pending Court Case:</span>
                          <strong style={{ color: selectedRecord.court_case_pending ? '#dc2626' : '#0f172a', fontWeight: 800 }}>
                            {selectedRecord.court_case_pending ? '⚠️ YES (Court NOC Required)' : 'None'}
                          </strong>
                        </div>

                        {/* 5. Lok Adalat */}
                        <div style={{ background: 'rgba(255,255,255,0.85)', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${selectedRecord.lok_adalat_pending ? '#fde68a' : 'rgba(0,0,0,0.06)'}` }}>
                          <span style={{ color: '#475569', fontWeight: 600, display: 'block', fontSize: '0.68rem', marginBottom: '2px' }}>Lok Adalat:</span>
                          <strong style={{ color: selectedRecord.lok_adalat_pending ? '#b45309' : '#0f172a', fontWeight: 800 }}>
                            {selectedRecord.lok_adalat_pending ? '⚠️ YES (Dispute Pending)' : 'None'}
                          </strong>
                        </div>

                        {/* 6. POSH Record */}
                        <div style={{ background: 'rgba(255,255,255,0.85)', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${selectedRecord.posh_cases ? '#fca5a5' : 'rgba(0,0,0,0.06)'}` }}>
                          <span style={{ color: '#475569', fontWeight: 600, display: 'block', fontSize: '0.68rem', marginBottom: '2px' }}>POSH Record:</span>
                          <strong style={{ color: selectedRecord.posh_cases ? '#dc2626' : '#0f172a', fontWeight: 800 }}>
                            {selectedRecord.posh_cases ? '⚠️ YES (Complaint Recorded)' : 'None (Clean)'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. OFFICER REMARKS & SIGNATURE */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px' }}>
                    ✍️ Field Remarks & Sub-Inspector Endorsement
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '8px' }}>
                    <strong>Beat Constable Notes:</strong> "{selectedRecord.field_officer_remarks || 'Identity and residential tenure verified by neighbours.'}"
                  </div>

                  {selectedRecord.status === 'PENDING' || selectedRecord.status === 'FIELD_VISIT_DONE' ? (
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Officer Verification Remarks / Recommendation:
                      </label>
                      <textarea
                        rows={2}
                        value={officerRemarks}
                        onChange={(e) => setOfficerRemarks(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.75rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                      <strong>Final Endorsement:</strong> "{selectedRecord.verification_remarks}" (Officer ID: {selectedRecord.verification_officer_id || 'KSP-PSI-1001'})
                    </div>
                  )}
                </div>
              </div>

              {/* DOSSIER FOOTER ACTIONS */}
              <div style={{
                background: '#f8fafc',
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <button
                  onClick={() => generatePdfCertificate(selectedRecord)}
                  style={{
                    background: '#ffffff',
                    color: '#1d4ed8',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} /> Download PDF Clearance Certificate
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {selectedRecord.status === 'PENDING' || selectedRecord.status === 'FIELD_VISIT_DONE' ? (
                    <>
                      <button
                        onClick={() => handleFlag(selectedRecord.application_id, selectedRecord.applicant_name)}
                        style={{
                          background: '#fffbeb',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        ⚠️ Flag to CID / Special Branch
                      </button>

                      <button
                        onClick={() => {
                          setRejectModalRecord(selectedRecord);
                          setRejectReason('Applicant untraceable and neighbours confirmed relocation to unknown place');
                        }}
                        style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        ❌ Issue Adverse Rejection
                      </button>

                      <button
                        onClick={() => handleApprove(selectedRecord.application_id, selectedRecord.applicant_name)}
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 18px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                        }}
                      >
                        <Check size={16} /> Approve & Grant Clearance
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelectedRecord(null)}
                      style={{
                        background: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Close Dossier
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

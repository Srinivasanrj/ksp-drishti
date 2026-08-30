import React, { useState } from 'react';
import { Shield, Lock, User, Key, Building2, MapPin, Compass, Flame, Radio, ArrowRight, CheckCircle2, AlertCircle, Crown, ChevronDown, ChevronRight, Check } from 'lucide-react';

const LOCAL_POLICE_ROLES = [
  'SHO (Station House Officer - Police Inspector)',
  'PSI (Police Sub-Inspector)',
  'ASI (Assistant Police Sub-Inspector)',
  'HC (Head Constable / Beat Commander)',
  'PC (Police Constable / Field Patrol Officer)',
  'CPI (Circle Police Inspector)',
  'DySP / ACP (Deputy SP / Assistant Commissioner)',
  'SP (Superintendent of Police Command)',
  'Division Head (IGP / ADGP Command)',
  'State Control Room Chief Duty Officer'
];

const DIVISIONS = [
  {
    id: 'bengaluru',
    name: 'Bengaluru Division',
    title: 'Bengaluru Division Command',
    tag: 'Capital Sector Command',
    color: '#132B20',
    gradient: 'linear-gradient(135deg, #132B20 0%, #0c1a13 100%)',
    icon: Building2,
    badge: 'HQ-BGLR-01',
    headUnit: {
      name: 'Bengaluru Division Head (IGP / ADGP)',
      username: 'ksp.bengaluru.head',
      password: 'bengaluru_head_pass2026',
      role: 'Division Head (IGP / ADGP Command)',
      coords: [12.9716, 77.5946]
    },
    stations: [
      { name: 'Bengaluru Urban', username: 'ksp.bengaluru.urban', password: 'bglr_urban_pass', role: 'SHO (Station House Officer - Police Inspector)', coords: [12.9716, 77.5946] },
      { name: 'Bengaluru Rural', username: 'ksp.bengaluru.rural', password: 'bglr_rural_pass', role: 'SP (Superintendent of Police Command)', coords: [13.0827, 77.5877] },
      { name: 'Chikkaballapura', username: 'ksp.chikkaballapura', password: 'chk_pass2026', role: 'PSI (Police Sub-Inspector)', coords: [13.4355, 77.7315] },
      { name: 'Chitradurga', username: 'ksp.chitradurga', password: 'chitra_pass2026', role: 'SHO (Station House Officer - Police Inspector)', coords: [14.2251, 76.3980] },
      { name: 'Davanagere', username: 'ksp.davanagere', password: 'dav_pass2026', role: 'SP (Superintendent of Police Command)', coords: [14.4644, 75.9218] },
      { name: 'Kolar', username: 'ksp.kolar', password: 'kolar_pass2026', role: 'PSI (Police Sub-Inspector)', coords: [13.1367, 78.1292] },
      { name: 'Kolar Gold Fields (KGF)', username: 'ksp.kgf', password: 'kgf_station_pass', role: 'CPI (Circle Police Inspector)', coords: [12.9598, 78.2711] },
      { name: 'Ramanagara', username: 'ksp.ramanagara', password: 'ram_pass2026', role: 'SHO (Station House Officer - Police Inspector)', coords: [12.7209, 77.2799] },
      { name: 'Tumakuru', username: 'ksp.tumakuru', password: 'tum_pass2026', role: 'SP (Superintendent of Police Command)', coords: [13.3379, 77.1173] }
    ]
  },
  {
    id: 'mysuru',
    name: 'Mysuru Division',
    title: 'Mysuru Division Command',
    tag: 'Southern Range Sector',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    icon: Compass,
    badge: 'HQ-MYS-02',
    headUnit: {
      name: 'Mysuru Division Head (IGP / ADGP)',
      username: 'ksp.mysuru.head',
      password: 'mysuru_head_pass2026',
      role: 'Division Head (IGP / ADGP Command)',
      coords: [12.2958, 76.6394]
    },
    stations: [
      { name: 'Chamarajanagara', username: 'ksp.chamarajanagara', password: 'cham_pass2026', role: 'SHO (Station House Officer - Police Inspector)', coords: [11.9261, 76.9437] },
      { name: 'Chikkamagaluru', username: 'ksp.chikkamagaluru', password: 'chkmglr_pass2026', role: 'SP (Superintendent of Police Command)', coords: [13.3161, 75.7720] },
      { name: 'Dakshina Kannada', username: 'ksp.dakshina.kannada', password: 'dk_pass2026', role: 'DySP / ACP (Deputy SP / Assistant Commissioner)', coords: [12.9141, 74.8560] },
      { name: 'Hassan', username: 'ksp.hassan', password: 'hassan_pass2026', role: 'SP (Superintendent of Police Command)', coords: [13.0072, 76.1017] },
      { name: 'Kodagu', username: 'ksp.kodagu', password: 'kodagu_pass2026', role: 'CPI (Circle Police Inspector)', coords: [12.4244, 75.7382] },
      { name: 'Mandya', username: 'ksp.mandya', password: 'mandya_pass2026', role: 'SP (Superintendent of Police Command)', coords: [12.5218, 76.8951] },
      { name: 'Mysuru City', username: 'ksp.mysuru.city', password: 'mysuru_pass2026', role: 'SHO (Station House Officer - Police Inspector)', coords: [12.2958, 76.6394] },
      { name: 'Udupi', username: 'ksp.udupi', password: 'udupi_pass2026', role: 'SP (Superintendent of Police Command)', coords: [13.3409, 74.7421] }
    ]
  },
  {
    id: 'belagavi',
    name: 'Belagavi Division',
    title: 'Belagavi Division Command',
    tag: 'Northern Frontier Sector',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    icon: MapPin,
    badge: 'HQ-BLG-03',
    headUnit: {
      name: 'Belagavi Division Head (IGP / ADGP)',
      username: 'ksp.belagavi.head',
      password: 'belagavi_head_pass2026',
      role: 'Division Head (IGP / ADGP Command)',
      coords: [15.8497, 74.4977]
    },
    stations: [
      { name: 'Bagalkote', username: 'ksp.bagalkote', password: 'bag_pass2026', role: 'SP (Superintendent of Police Command)', coords: [16.1855, 75.6968] },
      { name: 'Belagavi District', username: 'ksp.belagavi.dist', password: 'belagavi_pass2026', role: 'SHO (Station House Officer - Police Inspector)', coords: [15.8497, 74.4977] },
      { name: 'Dharwad', username: 'ksp.dharwad', password: 'dharwad_pass2026', role: 'DySP / ACP (Deputy SP / Assistant Commissioner)', coords: [15.4589, 75.0078] },
      { name: 'Gadag', username: 'ksp.gadag', password: 'gadag_pass2026', role: 'PSI (Police Sub-Inspector)', coords: [15.4317, 75.6355] },
      { name: 'Haveri', username: 'ksp.haveri', password: 'haveri_pass2026', role: 'SP (Superintendent of Police Command)', coords: [14.7937, 75.4014] },
      { name: 'Uttara Kannada', username: 'ksp.uttara.kannada', password: 'uk_pass2026', role: 'CPI (Circle Police Inspector)', coords: [14.8184, 74.1354] },
      { name: 'Vijayapura', username: 'ksp.vijayapura', password: 'vjp_pass2026', role: 'SP (Superintendent of Police Command)', coords: [16.8302, 75.7100] }
    ]
  },
  {
    id: 'kalaburagi',
    name: 'Kalaburagi Division',
    title: 'Kalaburagi Division Command',
    tag: 'Kalyana Karnataka Sector',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    icon: Flame,
    badge: 'HQ-KLB-04',
    headUnit: {
      name: 'Kalaburagi Division Head (IGP / ADGP)',
      username: 'ksp.kalaburagi.head',
      password: 'kalaburagi_head_pass2026',
      role: 'Division Head (IGP / ADGP Command)',
      coords: [17.3297, 76.8343]
    },
    stations: [
      { name: 'Ballari', username: 'ksp.ballari', password: 'ballari_pass2026', role: 'SP (Superintendent of Police Command)', coords: [15.1394, 76.9214] },
      { name: 'Bidar', username: 'ksp.bidar', password: 'bidar_pass2026', role: 'SP (Superintendent of Police Command)', coords: [17.9104, 77.5199] },
      { name: 'Kalaburagi District', username: 'ksp.kalaburagi.dist', password: 'klb_pass2026', role: 'SHO (Station House Officer - Police Inspector)', coords: [17.3297, 76.8343] },
      { name: 'Koppal', username: 'ksp.koppal', password: 'koppal_pass2026', role: 'PSI (Police Sub-Inspector)', coords: [15.3499, 76.1557] },
      { name: 'Raichur', username: 'ksp.raichur', password: 'raichur_pass2026', role: 'SP (Superintendent of Police Command)', coords: [16.2076, 77.3463] },
      { name: 'Vijayanagara', username: 'ksp.vijayanagara', password: 'vjn_pass2026', role: 'CPI (Circle Police Inspector)', coords: [15.2689, 76.3909] },
      { name: 'Yadgir', username: 'ksp.yadgir', password: 'yadgir_pass2026', role: 'SP (Superintendent of Police Command)', coords: [16.7700, 77.1378] }
    ]
  },
  {
    id: 'control_room',
    name: 'State Control Room',
    title: 'State Police Control Room Command',
    tag: 'Statewide Emergency & Dispatch Nodal Desk',
    color: '#dc2626',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    icon: Radio,
    badge: 'HQ-SCR-05',
    headUnit: {
      name: 'State Control Room Head (DGP Command)',
      username: 'ksp.controlroom.head',
      password: 'state_head_pass2026',
      role: 'State Control Room Chief Duty Officer',
      coords: [14.5204, 75.7224]
    },
    stations: [
      { name: 'Emergency Response 112 Desk', username: 'ksp.112.desk', password: '112_desk_pass', role: 'State Control Room Chief Duty Officer', coords: [14.5204, 75.7224] },
      { name: 'SCRB Cyber Crime Desk', username: 'ksp.cyber.desk', password: 'cyber_desk_pass', role: 'SHO (Station House Officer - Police Inspector)', coords: [12.9716, 77.5946] }
    ]
  }
];

function Login({ onLogin }) {
  const [selectedDivision, setSelectedDivision] = useState(DIVISIONS[0]);
  const [expandedDivId, setExpandedDivId] = useState(DIVISIONS[0].id);
  const [selectedUnit, setSelectedUnit] = useState(DIVISIONS[0].headUnit);
  const [username, setUsername] = useState(DIVISIONS[0].headUnit.username);
  const [password, setPassword] = useState(DIVISIONS[0].headUnit.password);
  const [role, setRole] = useState(DIVISIONS[0].headUnit.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectDivision = (div) => {
    // Toggle expand/collapse if clicking the same division
    if (expandedDivId === div.id) {
      setExpandedDivId(null);
    } else {
      setExpandedDivId(div.id);
      // Only change selection if clicking a different division
      if (selectedDivision.id !== div.id) {
        setSelectedDivision(div);
        setSelectedUnit(div.headUnit);
        setUsername(div.headUnit.username);
        setPassword(div.headUnit.password);
        setRole(div.headUnit.role);
        setError('');
      }
    }
  };

  const handleSelectUnit = (unit) => {
    setSelectedUnit(unit);
    setUsername(unit.username);
    setPassword(unit.password);
    setRole(unit.role);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a valid officer badge ID / username');
      return;
    }
    if (!password) {
      setError('Please enter your access password');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      onLogin({
        username,
        role,
        unitName: selectedUnit.name,
        division: selectedDivision
      });
    }, 600);
  };

  return (
    <div className="login-screen-overlay">
      <div className="login-card-container">
        
        {/* LEFT SIDE PANEL: Expandable Accordion Division & Station List */}
        <div className="login-left-panel">
          <div className="login-left-header">
            <div className="ksp-gold-emblem">
              <img src="/ksp_police_logo.png" alt="KSP Crest" />
            </div>
            <div>
              <h3>KARNATAKA STATE POLICE</h3>
              <p>State Crime Records Bureau (SCRB) • Division Select</p>
            </div>
          </div>

          <div className="divisions-list-title">
            <span>SELECT DIVISION (CLICK TO DROP DOWN STATIONS)</span>
          </div>

          <div className="divisions-scroll-list">
            {DIVISIONS.map((div) => {
              const IconComp = div.icon;
              const isSelected = selectedDivision.id === div.id;
              const isExpanded = expandedDivId === div.id;
              
              return (
                <div key={div.id} className="division-accordion-group">
                  {/* Division Header Card */}
                  <div
                    className={`division-card ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => handleSelectDivision(div)}
                  >
                    <div className="division-icon-box">
                      <IconComp size={20} />
                    </div>

                    <div className="division-info">
                      <div className="division-top-row">
                        <h4>{div.name}</h4>
                        <div className="chevron-container">
                          {isExpanded ? (
                            <ChevronDown size={16} className="chevron-icon" />
                          ) : (
                            <ChevronRight size={16} className="chevron-icon" />
                          )}
                        </div>
                      </div>
                      <p className="division-tag">{div.tag}</p>
                    </div>
                  </div>

                  {/* INLINE POP DOWN STATIONS LIST UNDER THE SAME DIVISION CARD */}
                  {isExpanded && (
                    <div className="stations-popdown-container">
                      {/* Division Head Unit */}
                      <div
                        className={`station-popdown-item head-item ${selectedUnit.name === div.headUnit.name ? 'active' : ''}`}
                        onClick={() => handleSelectUnit(div.headUnit)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Crown size={14} className="crown-icon" />
                          <span className="station-name-text">👑 {div.headUnit.name}</span>
                        </div>
                        {selectedUnit.name === div.headUnit.name && <Check size={14} className="check-icon" />}
                      </div>

                      {/* Station Units Sub-List */}
                      <div className="stations-popdown-subtext">SELECT POLICE STATION UNIT:</div>
                      {div.stations.map((st) => {
                        const isUnitActive = selectedUnit.name === st.name;
                        return (
                          <div
                            key={st.username}
                            className={`station-popdown-item ${isUnitActive ? 'active' : ''}`}
                            onClick={() => handleSelectUnit(st)}
                          >
                            <span className="station-name-text">• {st.name}</span>
                            {isUnitActive && <CheckCircle2 size={12} className="check-icon" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="login-left-footer">
            <span><Lock size={12} style={{ color: '#D97706', display: 'inline', marginBottom: '-2px' }} /> Encrypted SCRB Terminal • 1100+ Police Stations Active</span>
          </div>
        </div>

        {/* RIGHT SIDE PANEL: Selected Station Details & Login Form */}
        <div className="login-right-panel">
          
          {/* Header Banner customized with Selected Unit Title */}
          <div className="division-title-banner">
            <div className="banner-badge">
              {selectedDivision.badge}
            </div>
            <h2>{selectedUnit.name}</h2>
            <p>Official Authentication for {selectedDivision.name} • Local Police Station Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error-msg">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="input-group">
              <label>
                <User size={14} /> Station / Unit Login ID (Auto-Filled)
              </label>
              <input
                type="text"
                placeholder="e.g. ksp.bengaluru.urban"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>
                <Lock size={14} /> Unit Access Password (Auto-Filled)
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* AUTHORIZED UNIT COMMAND ROLE DROPDOWN SELECTOR (LOCAL POLICE ROLES) */}
            <div className="input-group">
              <label>
                <Shield size={14} /> Authorized Unit Command Role (Local Station Ranks)
              </label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                style={{ background: '#ffffff', cursor: 'pointer' }}
              >
                {LOCAL_POLICE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Authenticate & Launch {selectedUnit.name}</span>
                  <ArrowRight size={16} className="submit-arrow-icon" />
                </>
              )}
            </button>
          </form>

          <div className="login-security-notice">
            <CheckCircle2 size={13} style={{ color: '#059669' }} />
            <span>Secured via KSP DRISHTI OAuth • Local Police Station Certified Session</span>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;

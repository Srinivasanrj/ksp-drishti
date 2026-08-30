import React, { useState, useEffect } from 'react';
import { ShieldAlert, Phone, Power, CheckCircle, Navigation, Radio, X, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Icons for police cars and user
const policeIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="background-color:#3b82f6; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px #3b82f6; display:flex; align-items:center; justify-content:center; color:white; font-size:9px; font-weight:800;">P</div>`,
  iconSize: [16, 16]
});

const userIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="background-color:#ef4444; width:14px; height:14px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px #ef4444; animation: panic-pulse 1s infinite;"></div>`,
  iconSize: [14, 14]
});

function PanicSOS({ onClose }) {
  const [countdown, setCountdown] = useState(10);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showCloseNotice, setShowCloseNotice] = useState(false);
  const [sosStatus, setSosStatus] = useState('Transmitting encrypted distress beacon...');
  
  // Patrol vehicle positions that move closer to the user over time
  const userLatLng = [12.9716, 77.5946];
  const [patrol1, setPatrol1] = useState([12.9850, 77.6100]);
  const [patrol2, setPatrol2] = useState([12.9580, 77.5750]);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSosStatus('PATROL EN ROUTE - KSP Command notified.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Update status based on countdown
    if (countdown === 8) setSosStatus('Coordinates Locked: 12.9716° N, 77.5946° E');
    if (countdown === 6) setSosStatus('Dispatch Patrol units KSP-24 & KSP-10 assigned.');
    if (countdown === 4) setSosStatus('Live audio/telemetry link established.');

    return () => clearInterval(timer);
  }, [countdown]);

  // Patrol movement loop (converging on user coords)
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setPatrol1(prev => {
        const dLat = (userLatLng[0] - prev[0]) * 0.15;
        const dLng = (userLatLng[1] - prev[1]) * 0.15;
        return [prev[0] + dLat, prev[1] + dLng];
      });
      setPatrol2(prev => {
        const dLat = (userLatLng[0] - prev[0]) * 0.12;
        const dLng = (userLatLng[1] - prev[1]) * 0.12;
        return [prev[0] + dLat, prev[1] + dLng];
      });
    }, 1000);

    return () => clearInterval(moveInterval);
  }, []);

  // Emergency Deactivation Action
  const handleConfirmDeactivate = () => {
    setShowDeactivateConfirm(false);
    onClose(); // Cleanly unmounts PanicSOS, resets parent state, and halts all intervals
  };

  // Close (X) handler: prompts user to use Deactivate Alert or confirm deactivation
  const handleAttemptClose = () => {
    setShowCloseNotice(true);
  };

  return (
    <div 
      className="calculator-overlay" 
      style={{ 
        background: '#04060e', 
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        boxShadow: 'inset 0 0 100px rgba(239, 68, 68, 0.15)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10001
      }}
    >
      {/* Alarm Siren Flasher effect */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: countdown % 2 === 0 ? 'var(--danger, #ef4444)' : '#3b82f6',
          boxShadow: `0 0 20px ${countdown % 2 === 0 ? 'var(--danger, #ef4444)' : '#3b82f6'}`,
          zIndex: 1000,
          transition: 'background 0.5s'
        }}
      ></div>

      {/* SOS Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
          <Radio className="weather-icon-anim" size={20} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Tactical Emergency Channel
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="status-container" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '100px', padding: '5px 12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
            <div className="status-dot" style={{ backgroundColor: '#ef4444', boxShadow: '0 0 8px #ef4444', width: '8px', height: '8px', borderRadius: '50%' }}></div>
            <span>SOS BROADCAST ACTIVE</span>
          </div>

          {/* Close (X) Button with safety guard */}
          <button
            onClick={handleAttemptClose}
            title="Close View (Emergency will remain active)"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Alert Card */}
      <div 
        style={{
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '24px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.1)'
        }}
      >
        <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '12px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'white', marginBottom: '8px' }}>
          EMERGENCY DISPATCH TRIGGERED
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
          Silent distress signal transmitted to SCRB Head Station. GPS location broadcasting.
        </p>

        {countdown > 0 ? (
          <div style={{ margin: '16px 0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Patrol Unit Launch In</div>
            <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#ef4444' }}>
              {countdown}s
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#10b981', margin: '24px 0', fontSize: '1rem', fontWeight: 700 }}>
            <CheckCircle size={20} /> PATROL EN ROUTE (ETA 3.8m)
          </div>
        )}

        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
          {sosStatus}
        </div>
      </div>

      {/* Tactical Map ( converges vehicles ) */}
      <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px', position: 'relative' }}>
        <MapContainer
          center={userLatLng}
          zoom={14}
          zoomControl={false}
          attributionControl={false}
          style={{ width: '100%', height: '100%', background: '#090c15' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* User Location Pin */}
          <Marker position={userLatLng} icon={userIcon}>
            <Popup><b style={{ color: 'red' }}>User Location (Distress Signal)</b></Popup>
          </Marker>

          {/* Converging Patrol Cars */}
          <Marker position={patrol1} icon={policeIcon}>
            <Popup><b>KSP Patrol Unit 24</b><br/>En Route</Popup>
          </Marker>
          <Marker position={patrol2} icon={policeIcon}>
            <Popup><b>KSP Patrol Unit 10</b><br/>En Route</Popup>
          </Marker>
        </MapContainer>
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 1000, background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.65rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Navigation size={10} style={{ transform: 'rotate(45deg)' }} /> Telemetry: Patrol convergence active
        </div>
      </div>

      {/* Bottom Command Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => window.open('tel:112')}
          style={{
            flex: 1,
            background: '#1e293b',
            border: '1px solid #334155',
            color: 'white',
            borderRadius: '16px',
            padding: '14px 20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Phone size={14} /> Call Control Room (112)
        </button>
        <button
          onClick={() => setShowDeactivateConfirm(true)}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            border: '1px solid #ef4444',
            color: 'white',
            borderRadius: '16px',
            padding: '14px 20px',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 18px rgba(220, 38, 38, 0.45)',
            letterSpacing: '0.3px'
          }}
        >
          <Power size={15} /> Deactivate Alert
        </button>
      </div>

      {/* Close (X) Safety Guard Notice Modal */}
      {showCloseNotice && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            zIndex: 10003,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div 
            style={{
              background: '#0d111e',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
            }}
          >
            <AlertTriangle size={42} style={{ color: '#f59e0b', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
              Active Emergency in Progress
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
              The Close (✕) button does not cancel an active distress signal. To completely stop dispatch telemetry and cancel the alert, please use <b>Deactivate Alert</b>.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowCloseNotice(false)}
                style={{
                  flex: 1,
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Return to Broadcast
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCloseNotice(false);
                  setShowDeactivateConfirm(true);
                }}
                style={{
                  flex: 1,
                  background: '#dc2626',
                  border: 'none',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Deactivate Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Step: "Deactivate Emergency Alert?" */}
      {showDeactivateConfirm && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            zIndex: 10003,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div 
            style={{
              background: '#0d111e',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '24px',
              padding: '28px 24px',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
            }}
          >
            <div style={{ 
              width: '54px', 
              height: '54px', 
              borderRadius: '50%', 
              background: 'rgba(239, 68, 68, 0.12)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px auto' 
            }}>
              <ShieldAlert size={28} style={{ color: '#ef4444' }} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
              Deactivate Emergency Alert?
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '22px' }}>
              Are you sure you want to stop the countdown and cancel the active patrol dispatch? This will terminate the broadcast immediately and return to the normal dashboard.
            </p>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                style={{
                  flex: 1,
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#cbd5e1',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Keep Alert Active
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Power size={14} /> Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PanicSOS;


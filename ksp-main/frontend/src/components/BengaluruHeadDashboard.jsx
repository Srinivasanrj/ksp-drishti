import React from 'react';
import DivisionDashboard from './DivisionDashboard';

const BENGALURU_OVERALL_STATS = {
  totalCases: 384120,
  disposalRate: '91.2%',
  pendingCases: 33510,
  highThreatCases: 133400
};

const BENGALURU_ZONES_DATA = [
  { name: 'Bengaluru Urban', username: 'ksp.bengaluru.urban', role: 'SHO - Police Inspector', coords: [12.9716, 77.5946], cases: 78910, color: '#2563eb', sector: 'Capital Urban Sector', disposalRate: '92.4%', pendingCases: 5200, highThreatCases: 24500, categories: [{ name: 'Cyber Crimes', cases: 24500, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 28100, color: '#10b981' }, { name: 'Robbery', cases: 9200, color: '#f59e0b' }, { name: 'Assault', cases: 17110, color: '#8b5cf6' }] },
  { name: 'Bengaluru Rural', username: 'ksp.bengaluru.rural', role: 'SP Command Officer', coords: [13.0827, 77.5877], cases: 46120, color: '#0284c7', sector: 'North Peripheral Sector', disposalRate: '88.5%', pendingCases: 4800, highThreatCases: 14200, categories: [{ name: 'Cyber Crimes', cases: 14200, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 18500, color: '#10b981' }, { name: 'Robbery', cases: 5100, color: '#f59e0b' }, { name: 'Assault', cases: 8320, color: '#8b5cf6' }] },
  { name: 'Chikkaballapura', username: 'ksp.chikkaballapura', role: 'PSI Sub-Inspector', coords: [13.4355, 77.7315], cases: 28140, color: '#059669', sector: 'Granite Belt Sector', disposalRate: '87.4%', pendingCases: 3200, highThreatCases: 6800, categories: [{ name: 'Cyber Crimes', cases: 6800, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 12400, color: '#10b981' }, { name: 'Robbery', cases: 3800, color: '#f59e0b' }, { name: 'Assault', cases: 5140, color: '#8b5cf6' }] },
  { name: 'Chitradurga', username: 'ksp.chitradurga', role: 'SHO - Police Inspector', coords: [14.2251, 76.3980], cases: 38290, color: '#d97706', sector: 'Fort City Sector', disposalRate: '89.1%', pendingCases: 3900, highThreatCases: 11200, categories: [{ name: 'Cyber Crimes', cases: 11200, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 15400, color: '#10b981' }, { name: 'Robbery', cases: 4800, color: '#f59e0b' }, { name: 'Assault', cases: 6890, color: '#8b5cf6' }] },
  { name: 'Davanagere', username: 'ksp.davanagere', role: 'SP Command Officer', coords: [14.4644, 75.9218], cases: 41840, color: '#7c3aed', sector: 'Central Industrial Sector', disposalRate: '90.2%', pendingCases: 4100, highThreatCases: 12800, categories: [{ name: 'Cyber Crimes', cases: 12800, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 16200, color: '#10b981' }, { name: 'Robbery', cases: 5400, color: '#f59e0b' }, { name: 'Assault', cases: 7440, color: '#8b5cf6' }] },
  { name: 'Kolar', username: 'ksp.kolar', role: 'PSI Sub-Inspector', coords: [13.1367, 78.1292], cases: 33210, color: '#ec4899', sector: 'East Border Sector', disposalRate: '88.0%', pendingCases: 3500, highThreatCases: 8900, categories: [{ name: 'Cyber Crimes', cases: 8900, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 13800, color: '#10b981' }, { name: 'Robbery', cases: 4100, color: '#f59e0b' }, { name: 'Assault', cases: 6410, color: '#8b5cf6' }] },
  { name: 'Kolar Gold Fields (KGF)', username: 'ksp.kgf', role: 'Circle Inspector (CPI)', coords: [12.9598, 78.2711], cases: 26450, color: '#dc2626', sector: 'Mining Heritage Sector', disposalRate: '86.5%', pendingCases: 3100, highThreatCases: 7400, categories: [{ name: 'Cyber Crimes', cases: 7400, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 10400, color: '#10b981' }, { name: 'Robbery', cases: 3400, color: '#f59e0b' }, { name: 'Assault', cases: 5250, color: '#8b5cf6' }] },
  { name: 'Ramanagara', username: 'ksp.ramanagara', role: 'SHO - Police Inspector', coords: [12.7209, 77.2799], cases: 54190, color: '#84cc16', sector: 'Silk City Sector', disposalRate: '91.0%', pendingCases: 4800, highThreatCases: 16500, categories: [{ name: 'Cyber Crimes', cases: 16500, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 19400, color: '#10b981' }, { name: 'Robbery', cases: 6800, color: '#f59e0b' }, { name: 'Assault', cases: 11490, color: '#8b5cf6' }] },
  { name: 'Tumakuru', username: 'ksp.tumakuru', role: 'SP Command Officer', coords: [13.3379, 77.1173], cases: 37970, color: '#eab308', sector: 'Smart City Sector', disposalRate: '89.8%', pendingCases: 4100, highThreatCases: 11100, categories: [{ name: 'Cyber Crimes', cases: 11100, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 14800, color: '#10b981' }, { name: 'Robbery', cases: 4600, color: '#f59e0b' }, { name: 'Assault', cases: 7470, color: '#8b5cf6' }] }
];

const BENGALURU_CENTER = [13.5, 77.2];

const BENGALURU_HOTSPOTS = [
  { id: 'b_h1', coords: [12.9784, 77.6408], radius: 450, color: '#ef4444', label: 'Indiranagar Tech Scam Zone' },
  { id: 'b_h2', coords: [12.9352, 77.6244], radius: 500, color: '#f59e0b', label: 'Koramangala Commercial Zone' },
  { id: 'b_h3', coords: [12.9598, 78.2711], radius: 600, color: '#ef4444', label: 'KGF Mining Transport Zone' },
  { id: 'b_h4', coords: [14.4644, 75.9218], radius: 500, color: '#8b5cf6', label: 'Davanagere Industrial Beat' }
];

function BengaluruHeadDashboard({ currentUser, onLogout }) {
  return (
    <DivisionDashboard
      divisionName="Bengaluru"
      overallStats={BENGALURU_OVERALL_STATS}
      zonesData={BENGALURU_ZONES_DATA}
      centerCoords={BENGALURU_CENTER}
      initialZoom={8}
      hotspots={BENGALURU_HOTSPOTS}
      currentUser={currentUser}
      onLogout={onLogout}
    />
  );
}

export default BengaluruHeadDashboard;

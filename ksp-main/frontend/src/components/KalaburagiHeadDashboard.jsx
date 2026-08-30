import React from 'react';
import DivisionDashboard from './DivisionDashboard';

const KALABURAGI_OVERALL_STATS = {
  totalCases: 186400,
  disposalRate: '86.8%',
  pendingCases: 23150,
  highThreatCases: 48900
};

const KALABURAGI_ZONES_DATA = [
  { name: 'Kalaburagi District', username: 'ksp.kalaburagi.dist', role: 'SHO - Police Inspector', coords: [17.3297, 76.8343], color: '#d97706', cases: 45200, sector: 'Central Headquarters Sector', disposalRate: '86.9%', pendingCases: 5920, highThreatCases: 9100, categories: [{ name: 'Cyber Crimes', cases: 9100, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 18200, color: '#10b981' }, { name: 'Robbery', cases: 7100, color: '#f59e0b' }, { name: 'Hurt', cases: 10800, color: '#8b5cf6' }] },
  { name: 'Ballari', username: 'ksp.ballari', role: 'SP Command Officer', coords: [15.1394, 76.9214], color: '#ef4444', cases: 34100, sector: 'Steel & Mining Sector', disposalRate: '88.1%', pendingCases: 4050, highThreatCases: 7400, categories: [{ name: 'Cyber Crimes', cases: 7400, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 14100, color: '#10b981' }, { name: 'Robbery', cases: 5200, color: '#f59e0b' }, { name: 'Hurt', cases: 7400, color: '#8b5cf6' }] },
  { name: 'Bidar', username: 'ksp.bidar', role: 'SP Command Officer', coords: [17.9104, 77.5199], color: '#8b5cf6', cases: 24100, sector: 'Northern Frontier Fort', disposalRate: '86.2%', pendingCases: 3320, highThreatCases: 4200, categories: [{ name: 'Cyber Crimes', cases: 4200, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 10100, color: '#10b981' }, { name: 'Robbery', cases: 3900, color: '#f59e0b' }, { name: 'Hurt', cases: 5900, color: '#8b5cf6' }] },
  { name: 'Koppal', username: 'ksp.koppal', role: 'PSI Sub-Inspector', coords: [15.3499, 76.1557], color: '#06b6d4', cases: 20400, sector: 'Koppal Rice Sector', disposalRate: '87.0%', pendingCases: 2650, highThreatCases: 3200, categories: [{ name: 'Cyber Crimes', cases: 3200, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 8800, color: '#10b981' }, { name: 'Robbery', cases: 3100, color: '#f59e0b' }, { name: 'Hurt', cases: 5300, color: '#8b5cf6' }] },
  { name: 'Raichur', username: 'ksp.raichur', role: 'SP Command Officer', coords: [16.2076, 77.3463], color: '#10b981', cases: 26800, sector: 'Thermal & Doab Sector', disposalRate: '85.6%', pendingCases: 3860, highThreatCases: 4800, categories: [{ name: 'Cyber Crimes', cases: 4800, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 11200, color: '#10b981' }, { name: 'Robbery', cases: 4100, color: '#f59e0b' }, { name: 'Hurt', cases: 6700, color: '#8b5cf6' }] },
  { name: 'Vijayanagara', username: 'ksp.vijayanagara', role: 'Circle Inspector (CPI)', coords: [15.2689, 76.3909], color: '#f59e0b', cases: 18600, sector: 'Hampi Heritage Sector', disposalRate: '88.4%', pendingCases: 2150, highThreatCases: 3400, categories: [{ name: 'Cyber Crimes', cases: 3400, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 7900, color: '#10b981' }, { name: 'Robbery', cases: 2800, color: '#f59e0b' }, { name: 'Hurt', cases: 4500, color: '#8b5cf6' }] },
  { name: 'Yadgir', username: 'ksp.yadgir', role: 'SP Command Officer', coords: [16.7700, 77.1378], color: '#ec4899', cases: 17200, sector: 'Krishna Valley Sector', disposalRate: '84.8%', pendingCases: 2610, highThreatCases: 2100, categories: [{ name: 'Cyber Crimes', cases: 2100, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 7400, color: '#10b981' }, { name: 'Robbery', cases: 2900, color: '#f59e0b' }, { name: 'Hurt', cases: 4800, color: '#8b5cf6' }] }
];

const KALABURAGI_CENTER = [16.4000, 76.8000];

const KALABURAGI_HOTSPOTS = [
  { id: 'klb_h1', coords: [17.3297, 76.8343], radius: 500, color: '#d97706', label: 'Kalaburagi Central Transit Patrol' },
  { id: 'klb_h2', coords: [15.1394, 76.9214], radius: 450, color: '#ef4444', label: 'Ballari Mining Transport Sector' },
  { id: 'klb_h3', coords: [15.2689, 76.3909], radius: 550, color: '#8b5cf6', label: 'Vijayanagara Heritage Sector' }
];

function KalaburagiHeadDashboard({ currentUser, onLogout }) {
  return (
    <DivisionDashboard
      divisionName="Kalaburagi"
      overallStats={KALABURAGI_OVERALL_STATS}
      zonesData={KALABURAGI_ZONES_DATA}
      centerCoords={KALABURAGI_CENTER}
      initialZoom={8}
      hotspots={KALABURAGI_HOTSPOTS}
      currentUser={currentUser}
      onLogout={onLogout}
    />
  );
}

export default KalaburagiHeadDashboard;

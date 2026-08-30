import React from 'react';
import DivisionDashboard from './DivisionDashboard';

const MYSURU_OVERALL_STATS = {
  totalCases: 198450,
  disposalRate: '89.4%',
  pendingCases: 21020,
  highThreatCases: 54100
};

const MYSURU_ZONES_DATA = [
  { name: 'Mysuru City', username: 'ksp.mysuru.city', role: 'SHO - Police Inspector', coords: [12.2958, 76.6394], color: '#7c3aed', cases: 42100, sector: 'Palace City Central', disposalRate: '90.1%', pendingCases: 4160, highThreatCases: 11500, categories: [{ name: 'Cyber Crimes', cases: 11500, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 16200, color: '#10b981' }, { name: 'Robbery', cases: 5100, color: '#f59e0b' }, { name: 'Hurt', cases: 9300, color: '#8b5cf6' }] },
  { name: 'Chamarajanagara', username: 'ksp.chamarajanagara', role: 'SHO - Police Inspector', coords: [11.9261, 76.9437], color: '#10b981', cases: 18200, sector: 'Border Forest Sector', disposalRate: '85.4%', pendingCases: 2650, highThreatCases: 2400, categories: [{ name: 'Cyber Crimes', cases: 2400, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 8100, color: '#10b981' }, { name: 'Robbery', cases: 2800, color: '#f59e0b' }, { name: 'Hurt', cases: 4900, color: '#8b5cf6' }] },
  { name: 'Chikkamagaluru', username: 'ksp.chikkamagaluru', role: 'SP Command Officer', coords: [13.3161, 75.7720], color: '#84cc16', cases: 14540, sector: 'Hill Beat Sector', disposalRate: '89.8%', pendingCases: 1650, highThreatCases: 3100, categories: [{ name: 'Cyber Crimes', cases: 3100, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 6400, color: '#10b981' }, { name: 'Robbery', cases: 2100, color: '#f59e0b' }, { name: 'Hurt', cases: 2940, color: '#8b5cf6' }] },
  { name: 'Dakshina Kannada', username: 'ksp.dakshina.kannada', role: 'DySP / ACP Command', coords: [12.9141, 74.8560], color: '#06b6d4', cases: 24100, sector: 'Coastal Port Sector', disposalRate: '89.5%', pendingCases: 2530, highThreatCases: 7800, categories: [{ name: 'Cyber Crimes', cases: 7800, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 9200, color: '#10b981' }, { name: 'Robbery', cases: 3100, color: '#f59e0b' }, { name: 'Hurt', cases: 4000, color: '#8b5cf6' }] },
  { name: 'Hassan', username: 'ksp.hassan', role: 'SP Command Officer', coords: [13.0072, 76.1017], color: '#3b82f6', cases: 24800, sector: 'Malnad Hinterland Sector', disposalRate: '88.2%', pendingCases: 2920, highThreatCases: 4100, categories: [{ name: 'Cyber Crimes', cases: 4100, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 10800, color: '#10b981' }, { name: 'Robbery', cases: 3700, color: '#f59e0b' }, { name: 'Hurt', cases: 6200, color: '#8b5cf6' }] },
  { name: 'Kodagu', username: 'ksp.kodagu', role: 'Circle Inspector (CPI)', coords: [12.4244, 75.7382], color: '#ef4444', cases: 14600, sector: 'Coffee Hills Sector', disposalRate: '91.2%', pendingCases: 1285, highThreatCases: 2100, categories: [{ name: 'Cyber Crimes', cases: 2100, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 6400, color: '#10b981' }, { name: 'Robbery', cases: 2100, color: '#f59e0b' }, { name: 'Hurt', cases: 4000, color: '#8b5cf6' }] },
  { name: 'Mandya', username: 'ksp.mandya', role: 'SP Command Officer', coords: [12.5218, 76.8951], color: '#f59e0b', cases: 26150, sector: 'Sugar Belt Sector', disposalRate: '86.9%', pendingCases: 3420, highThreatCases: 4800, categories: [{ name: 'Cyber Crimes', cases: 4800, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 11200, color: '#10b981' }, { name: 'Robbery', cases: 3900, color: '#f59e0b' }, { name: 'Hurt', cases: 6250, color: '#8b5cf6' }] },
  { name: 'Udupi', username: 'ksp.udupi', role: 'SP Command Officer', coords: [13.3409, 74.7421], color: '#8b5cf6', cases: 20100, sector: 'Temple Coast Sector', disposalRate: '90.8%', pendingCases: 1850, highThreatCases: 6200, categories: [{ name: 'Cyber Crimes', cases: 6200, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 7800, color: '#10b981' }, { name: 'Robbery', cases: 2600, color: '#f59e0b' }, { name: 'Hurt', cases: 3500, color: '#8b5cf6' }] }
];

const MYSURU_CENTER = [12.6500, 75.8500];

const MYSURU_HOTSPOTS = [
  { id: 'm_h1', coords: [12.3052, 76.6552], radius: 450, color: '#7c3aed', label: 'Palace Commercial Beat Sector' },
  { id: 'm_h2', coords: [12.9141, 74.8560], radius: 500, color: '#ef4444', label: 'Mangaluru Port High Vigilance Area' },
  { id: 'm_h3', coords: [12.5218, 76.8951], radius: 400, color: '#f59e0b', label: 'Mandya Highway Beat Sector' },
  { id: 'm_h4', coords: [13.3409, 74.7421], radius: 550, color: '#059669', label: 'Udupi Coastal Patrol Sector' }
];

function MysuruHeadDashboard({ currentUser, onLogout }) {
  return (
    <DivisionDashboard
      divisionName="Mysuru"
      overallStats={MYSURU_OVERALL_STATS}
      zonesData={MYSURU_ZONES_DATA}
      centerCoords={MYSURU_CENTER}
      initialZoom={8}
      hotspots={MYSURU_HOTSPOTS}
      currentUser={currentUser}
      onLogout={onLogout}
    />
  );
}

export default MysuruHeadDashboard;

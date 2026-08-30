import React from 'react';
import DivisionDashboard from './DivisionDashboard';

const BELAGAVI_OVERALL_STATS = {
  totalCases: 214800,
  disposalRate: '88.7%',
  pendingCases: 24260,
  highThreatCases: 58600
};

const BELAGAVI_ZONES_DATA = [
  { name: 'Belagavi District', username: 'ksp.belagavi.dist', role: 'SHO - Police Inspector', coords: [15.8497, 74.4977], color: '#059669', cases: 38400, sector: 'Frontier Border Sector', disposalRate: '87.1%', pendingCases: 4950, highThreatCases: 6400, categories: [{ name: 'Cyber Crimes', cases: 6400, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 16800, color: '#10b981' }, { name: 'Robbery', cases: 5900, color: '#f59e0b' }, { name: 'Hurt', cases: 9300, color: '#8b5cf6' }] },
  { name: 'Bagalkote', username: 'ksp.bagalkote', role: 'SP Command Officer', coords: [16.1855, 75.6968], color: '#ec4899', cases: 22800, sector: 'Malaprabha Basin Sector', disposalRate: '86.4%', pendingCases: 3100, highThreatCases: 3800, categories: [{ name: 'Cyber Crimes', cases: 3800, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 9900, color: '#10b981' }, { name: 'Robbery', cases: 3800, color: '#f59e0b' }, { name: 'Hurt', cases: 5300, color: '#8b5cf6' }] },
  { name: 'Dharwad', username: 'ksp.dharwad', role: 'DySP / ACP Command', coords: [15.4589, 75.0078], color: '#7c3aed', cases: 44800, sector: 'Education & Twin City', disposalRate: '91.4%', pendingCases: 3855, highThreatCases: 14200, categories: [{ name: 'Cyber Crimes', cases: 14200, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 16900, color: '#10b981' }, { name: 'Robbery', cases: 6100, color: '#f59e0b' }, { name: 'Hurt', cases: 7600, color: '#8b5cf6' }] },
  { name: 'Gadag', username: 'ksp.gadag', role: 'PSI Sub-Inspector', coords: [15.4317, 75.6355], color: '#eab308', cases: 18540, sector: 'Print & Wind Sector', disposalRate: '86.8%', pendingCases: 2410, highThreatCases: 3200, categories: [{ name: 'Cyber Crimes', cases: 3200, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 8900, color: '#10b981' }, { name: 'Robbery', cases: 2800, color: '#f59e0b' }, { name: 'Hurt', cases: 3640, color: '#8b5cf6' }] },
  { name: 'Haveri', username: 'ksp.haveri', role: 'SP Command Officer', coords: [14.7937, 75.4014], color: '#0284c7', cases: 16210, sector: 'Cardamom City Sector', disposalRate: '87.5%', pendingCases: 2100, highThreatCases: 2800, categories: [{ name: 'Cyber Crimes', cases: 2800, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 7400, color: '#10b981' }, { name: 'Robbery', cases: 2400, color: '#f59e0b' }, { name: 'Hurt', cases: 3610, color: '#8b5cf6' }] },
  { name: 'Uttara Kannada', username: 'ksp.uttara.kannada', role: 'Circle Inspector (CPI)', coords: [14.8184, 74.1354], color: '#10b981', cases: 19100, sector: 'Coastal Karwar Sector', disposalRate: '89.9%', pendingCases: 1930, highThreatCases: 3100, categories: [{ name: 'Cyber Crimes', cases: 3100, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 8400, color: '#10b981' }, { name: 'Robbery', cases: 2800, color: '#f59e0b' }, { name: 'Hurt', cases: 4800, color: '#8b5cf6' }] },
  { name: 'Vijayapura', username: 'ksp.vijayapura', role: 'SP Command Officer', coords: [16.8302, 75.7100], color: '#f97316', cases: 26400, sector: 'Gol Gumbaz Heritage', disposalRate: '85.9%', pendingCases: 3720, highThreatCases: 4200, categories: [{ name: 'Cyber Crimes', cases: 4200, color: '#3b82f6' }, { name: 'Theft & Larceny', cases: 11100, color: '#10b981' }, { name: 'Robbery', cases: 4200, color: '#f59e0b' }, { name: 'Hurt', cases: 6900, color: '#8b5cf6' }] }
];

const BELAGAVI_CENTER = [15.8500, 75.1000];

const BELAGAVI_HOTSPOTS = [
  { id: 'blg_h1', coords: [15.8497, 74.4977], radius: 500, color: '#059669', label: 'Belagavi Industrial Border Patrol' },
  { id: 'blg_h2', coords: [15.4589, 75.0078], radius: 450, color: '#7c3aed', label: 'Hubli-Dharwad Commercial Beat' },
  { id: 'blg_h3', coords: [16.8302, 75.7100], radius: 600, color: '#f97316', label: 'Vijayapura Heritage Transit Sector' }
];

function BelagaviHeadDashboard({ currentUser, onLogout }) {
  return (
    <DivisionDashboard
      divisionName="Belagavi"
      overallStats={BELAGAVI_OVERALL_STATS}
      zonesData={BELAGAVI_ZONES_DATA}
      centerCoords={BELAGAVI_CENTER}
      initialZoom={8}
      hotspots={BELAGAVI_HOTSPOTS}
      currentUser={currentUser}
      onLogout={onLogout}
    />
  );
}

export default BelagaviHeadDashboard;

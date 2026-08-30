import React, { useState } from 'react';
import PortalSidebar from './components/PortalSidebar';
import PortalHeader from './components/PortalHeader';
import DatasetUploadGuard from './components/DatasetUploadGuard';
import OverviewDashboard from './modules/OverviewDashboard';
import NetworkGraphView from './modules/NetworkGraphView';
import { initialDatasetState, parseCSV } from './services/datasetStore';

export default function AnalyticsDashboard({
  divisionName = "Bengaluru Division",
  onBackToChat,
  datasetState = initialDatasetState,
  initialTab = 'dashboard',
  onDatasetLoaded,
  onUpdateFilters,
  onResetFilters
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: '#0f172a'
    }}>
      {/* LEFT NAVIGATION RAIL */}
      <PortalSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBackToChat={onBackToChat}
        isDatasetLoaded={datasetState.isLoaded}
        recordCount={datasetState.rawRecords?.length || 0}
      />

      {/* RIGHT MAIN PORTAL CANVAS */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* TOP COMMAND BAR */}
        <PortalHeader
          divisionName={divisionName}
          onQuickSearchClick={onBackToChat}
        />

        {/* SCROLLABLE MODULE BODY */}
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0a0f1d' }}>
          
          {/* WORKSPACE: NETWORK & LINK INTELLIGENCE */}
          {activeTab === 'network_graph' ? (
            <NetworkGraphView
              datasetState={datasetState}
              onBackToChat={onBackToChat}
              onDatasetLoaded={onDatasetLoaded}
            />
          ) : !datasetState.isLoaded ? (
            /* EMPTY-STATE GUARD */
            <DatasetUploadGuard onDatasetLoaded={onDatasetLoaded} />
          ) : (
            /* WORKSPACE 1: POWER BI STYLE DASHBOARD & FILTER SLICERS */
            activeTab === 'dashboard' && (
              <OverviewDashboard
                datasetState={datasetState}
                onUpdateFilters={onUpdateFilters}
                onResetFilters={onResetFilters}
              />
            )
          )}

        </main>
      </div>
    </div>
  );
}

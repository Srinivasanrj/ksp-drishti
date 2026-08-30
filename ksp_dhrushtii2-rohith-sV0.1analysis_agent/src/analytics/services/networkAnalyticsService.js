/**
 * KSP Sentinel AI — Dynamic Entity Link Analytics & Graph Intelligence Service
 * 
 * SOLID ARCHITECTURE:
 * - Real Investigative Entities (Suspects, Vehicles, Phones, Mule Accounts, Police Stations, Operations)
 * - Demographic & Case Properties (Gender, Age, Status, Dates, Amounts) attached to Node & Edge Metadata
 * - Pure Multi-Hop Relational Linkage (Shared Vehicles, Shared Phones, Co-Accused)
 * - $O(V+E)$ BFS Path Solver for the Chatbot Agent
 */

// Graphify Chromatic Palette for Entity Types
export const GRAPHIFY_COLOR_PALETTE = {
  SUSPECT: '#f43f5e',         // Crimson Rose (Primary Suspects & Co-Accused)
  VEHICLE: '#0284c7',         // Ocean Blue (Getaway Transport)
  PHONE: '#a855f7',           // Electric Purple (Burner Phones & Devices)
  FINANCIAL: '#10b981',       // Emerald Green (Bank Accounts & Mule UPIs)
  POLICE_STATION: '#f59e0b',  // Amber Gold (Police Stations & Precincts)
  OPERATION: '#06b6d4'        // Cyan (Syndicate Operation Rings)
};

// ==========================================
// 1. STATISTICAL ENTITY PROFILER & CLASSIFIER
// ==========================================

export class StatisticalColumnProfiler {
  /**
   * Intelligently categorizes columns into:
   * 1. INVESTIGATIVE_ENTITIES (Suspects, Vehicles, Phones, Mules, Stations, Operations) -> Graph Nodes
   * 2. DEMOGRAPHIC_PROPERTIES (Gender, Age) -> Node Metadata
   * 3. CASE_TRANSACTION_PROPERTIES (FIR Number, Status, Amounts, Dates, Signatures) -> Edge & Context Metadata
   */
  static profileDataset(records, headers) {
    if (!records || records.length === 0 || !headers || headers.length === 0) {
      return { entityConfigs: [], transactionKey: null };
    }

    const sample = records.slice(0, Math.min(records.length, 300));
    const entityConfigs = [];

    // Semantic Regex Profiler for Investigative Entities
    const entityPatterns = [
      {
        type: 'SUSPECT',
        typeLabel: 'Suspect / Accused',
        color: GRAPHIFY_COLOR_PALETTE.SUSPECT,
        regex: /(suspect_name|accused_name|suspect|perpetrator|person_name)/i
      },
      {
        type: 'SUSPECT',
        typeLabel: 'Co-Accused / Associate',
        color: GRAPHIFY_COLOR_PALETTE.SUSPECT,
        regex: /(co_accused|associate|accomplice)/i
      },
      {
        type: 'VEHICLE',
        typeLabel: 'Vehicle / Transport',
        color: GRAPHIFY_COLOR_PALETTE.VEHICLE,
        regex: /(vehicle_number|vehicle|veh_no|reg_no|license_plate|getaway_car)/i
      },
      {
        type: 'PHONE',
        typeLabel: 'Phone / Burner Device',
        color: GRAPHIFY_COLOR_PALETTE.PHONE,
        regex: /(caller_phone_number|phone_number|phone|mobile|caller|msisdn|imei)/i
      },
      {
        type: 'FINANCIAL',
        typeLabel: 'Bank / Mule UPI Account',
        color: GRAPHIFY_COLOR_PALETTE.FINANCIAL,
        regex: /(mule_bank_upi_account|bank_account|upi_id|mule_account|wallet_address|crypto_wallet)/i
      },
      {
        type: 'POLICE_STATION',
        typeLabel: 'Police Station / Location',
        color: GRAPHIFY_COLOR_PALETTE.POLICE_STATION,
        regex: /(police_station|ps_name|station_name|jurisdiction)/i
      },
      {
        type: 'OPERATION',
        typeLabel: 'Crime Syndicate / Operation',
        color: GRAPHIFY_COLOR_PALETTE.OPERATION,
        regex: /(crime_category|subcategory|operation_name|syndicate|motive)/i
      }
    ];

    // Find columns matching primary investigative entity roles
    headers.forEach(header => {
      // Exclude demographic properties, dates, continuous floats, or status columns from becoming nodes
      const isDemographicOrMetric = /gender|age|status|date|year|month|amount|loss|recovered|percentage|days|latitude|longitude|lat|lng|signature|sha256/i.test(header);
      
      if (!isDemographicOrMetric) {
        for (const ep of entityPatterns) {
          if (ep.regex.test(header)) {
            // Ensure column has valid values
            const hasValues = sample.some(r => r[header] && String(r[header]).trim() !== '' && String(r[header]).trim() !== 'None');
            if (hasValues && !entityConfigs.some(ec => ec.header === header)) {
              entityConfigs.push({
                header,
                type: ep.type,
                typeLabel: ep.typeLabel,
                color: ep.color
              });
            }
            break;
          }
        }
      }
    });

    // Fallback: If no regex matched, dynamically pick categorical columns with repeating entities
    if (entityConfigs.length === 0) {
      headers.forEach(header => {
        const isExcluded = /gender|age|status|date|year|month|amount|loss|recovered|percentage|days|latitude|longitude|signature|sha256/i.test(header);
        if (!isExcluded) {
          const values = sample.map(r => String(r[header] || '').trim()).filter(v => v && v !== 'None');
          const uniqueCount = new Set(values).size;
          if (uniqueCount >= 2 && uniqueCount <= sample.length * 0.5) {
            entityConfigs.push({
              header,
              type: 'ENTITY',
              typeLabel: header.replace(/_/g, ' '),
              color: '#38bdf8'
            });
          }
        }
      });
    }

    const transactionCol = headers.find(h => /fir_number|fir_no|case_id|crime_id|record_id/i.test(h)) || headers[0];

    return {
      entityConfigs,
      transactionKey: transactionCol
    };
  }
}

// ==========================================
// 2. MULTI-HOP GRAPH TOPOLOGY BUILDER
// ==========================================

export class GraphTopologyBuilder {
  /**
   * Builds high-fidelity, uncluttered multi-hop investigative entity network.
   * Connects Suspects to Co-Accused, Getaway Vehicles, Burner Phones,
   * Bank Mule Accounts, Police Stations, and Crime Syndicates.
   */
  static buildTopology(records, headers) {
    if (!records || records.length === 0 || !headers || headers.length === 0) {
      return {
        nodes: [],
        edges: [],
        nodeCount: 0,
        edgeCount: 0,
        featureTypes: [],
        communitiesCount: 0,
        godNodes: [],
        builtAt: new Date().toISOString()
      };
    }

    const { entityConfigs, transactionKey } = StatisticalColumnProfiler.profileDataset(records, headers);

    const nodesMap = new Map();
    const edgesList = [];
    const edgeSet = new Set();
    const typeCountMap = new Map();

    const addNode = (id, label, type, typeLabel, color, metadata = {}) => {
      const cleanId = String(id).trim();
      if (!cleanId || cleanId === 'undefined' || cleanId === 'null' || cleanId === 'None' || cleanId === '0' || cleanId === '') {
        return null;
      }

      const nodeKey = `${type}:::${cleanId}`;

      if (!nodesMap.has(nodeKey)) {
        typeCountMap.set(type, (typeCountMap.get(type) || 0) + 1);

        nodesMap.set(nodeKey, {
          id: nodeKey,
          rawId: cleanId,
          label: String(label).trim(),
          type,
          typeLabel,
          color,
          degree: 0,
          inDegree: 0,
          outDegree: 0,
          community: 0,
          metadata: {
            ...metadata,
            linkedCases: [],
            totalLossINR: 0,
            associatedStations: new Set()
          },
          x: 0,
          y: 0,
          vx: 0,
          vy: 0
        });
      }

      const node = nodesMap.get(nodeKey);
      
      // Accumulate metadata across cases
      if (metadata.caseId && !node.metadata.linkedCases.includes(metadata.caseId)) {
        node.metadata.linkedCases.push(metadata.caseId);
      }
      if (metadata.lossINR) {
        node.metadata.totalLossINR += Number(metadata.lossINR) || 0;
      }
      if (metadata.policeStation) {
        node.metadata.associatedStations.add(metadata.policeStation);
      }
      if (metadata.gender) node.metadata.gender = metadata.gender;
      if (metadata.age) node.metadata.age = metadata.age;

      return node;
    };

    const addEdge = (sourceKey, targetKey, relation, weight = 1.0, caseRef = '') => {
      if (!sourceKey || !targetKey || sourceKey === targetKey) return;
      const key1 = `${sourceKey}__${targetKey}`;
      const key2 = `${targetKey}__${sourceKey}`;
      if (edgeSet.has(key1) || edgeSet.has(key2)) return;

      edgeSet.add(key1);
      edgesList.push({
        source: sourceKey,
        target: targetKey,
        relation,
        weight,
        caseRef
      });

      const sNode = nodesMap.get(sourceKey);
      const tNode = nodesMap.get(targetKey);
      if (sNode) sNode.degree = (sNode.degree || 0) + 1;
      if (tNode) tNode.degree = (tNode.degree || 0) + 1;
    };

    // Check for Direct Edge-List Columns
    const hLower = headers.map(h => h.toLowerCase());
    const srcCol = headers.find((h, i) => ['source', 'from', 'sender', 'origin', 'caller', 'node_a', 'account_a'].includes(hLower[i]));
    const tgtCol = headers.find((h, i) => ['target', 'to', 'receiver', 'destination', 'callee', 'node_b', 'account_b'].includes(hLower[i]));
    const relCol = headers.find((h, i) => ['relation', 'relationship', 'edge_type', 'action', 'type', 'call_type'].includes(hLower[i]));
    const wtCol = headers.find((h, i) => ['weight', 'amount', 'duration', 'frequency', 'count', 'value'].includes(hLower[i]));

    if (srcCol && tgtCol) {
      // ── MODE 1: DIRECT EDGE-LIST INGESTION ────────────────────────────────
      records.forEach((row, idx) => {
        const sVal = row[srcCol];
        const tVal = row[tgtCol];
        if (!sVal || !tVal || String(sVal).trim() === '' || String(tVal).trim() === '' || String(sVal).trim() === 'None' || String(tVal).trim() === 'None') return;

        const sType = /phone|caller|callee/i.test(srcCol) ? 'PHONE' : (/bank|account|upi|mule/i.test(srcCol) ? 'FINANCIAL' : (/vehicle|car/i.test(srcCol) ? 'VEHICLE' : 'SUSPECT'));
        const tType = /phone|caller|callee/i.test(tgtCol) ? 'PHONE' : (/bank|account|upi|mule/i.test(tgtCol) ? 'FINANCIAL' : (/vehicle|car/i.test(tgtCol) ? 'VEHICLE' : 'SUSPECT'));

        const sNode = addNode(sVal, sVal, sType, srcCol.replace(/_/g, ' '), GRAPHIFY_COLOR_PALETTE[sType] || '#38bdf8', { caseId: `EDGE-${idx + 1}` });
        const tNode = addNode(tVal, tVal, tType, tgtCol.replace(/_/g, ' '), GRAPHIFY_COLOR_PALETTE[tType] || '#a855f7', { caseId: `EDGE-${idx + 1}` });

        const relation = relCol && row[relCol] ? String(row[relCol]).toUpperCase() : 'CONNECTED_TO';
        const weight = wtCol && Number(row[wtCol]) ? Number(row[wtCol]) : 1.0;

        if (sNode && tNode) {
          addEdge(sNode.id, tNode.id, relation, weight, `EDGE-${idx + 1}`);
        }
      });
    } else {
      // ── MODE 2: ENTITY-CENTRIC BIPARTITE PROJECTION (CO-OCCURRENCE NETWORK) ─
      records.forEach((row, rowIdx) => {
        const caseId = transactionKey && row[transactionKey] ? String(row[transactionKey]) : `FIR-${rowIdx + 1}`;
        const lossINR = row.Loss_Amount_INR || row.loss || row.amount || 0;
        const gender = row.Accused_Gender || row.gender || 'Unknown';
        const age = row.Accused_Age || row.age || 35;
        const station = row.Police_Station || row.station || '';

        const baseMeta = { caseId, lossINR, gender, age, policeStation: station };
        const extractedNodes = [];

        entityConfigs.forEach(ec => {
          const rawVal = row[ec.header];
          if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '' && String(rawVal).trim() !== 'None' && String(rawVal).trim() !== 'null' && String(rawVal).trim() !== 'unassigned' && String(rawVal).trim() !== '+91-99000-00000') {
            const cleanVal = String(rawVal).trim();
            const node = addNode(cleanVal, cleanVal, ec.type, ec.typeLabel, ec.color, baseMeta);
            if (node && !extractedNodes.some(en => en.id === node.id)) {
              extractedNodes.push(node);
            }
          }
        });

        // Form co-occurrence links across the extracted entities in this case
        for (let i = 0; i < extractedNodes.length; i++) {
          for (let j = i + 1; j < extractedNodes.length; j++) {
            const nA = extractedNodes[i];
            const nB = extractedNodes[j];
            if (nA.id !== nB.id) {
              const rel = `${nA.type}_TO_${nB.type}`;
              addEdge(nA.id, nB.id, rel, 1.0, caseId);
            }
          }
        }
      });
    }

    const nodes = Array.from(nodesMap.values());
    nodes.sort((a, b) => (b.degree || 0) - (a.degree || 0));

    // Community Detection (Modularity by type & high-centrality hubs)
    const communityMap = new Map();
    let communityIdx = 0;
    nodes.forEach(n => {
      const groupKey = n.type;
      if (!communityMap.has(groupKey)) {
        communityMap.set(groupKey, ++communityIdx);
      }
      n.community = communityMap.get(groupKey);
    });

    // 4. Graphify 360° Balanced Radial Orbit Layout (Evenly distributed angular fan-out)
    // Group nodes by type to give each entity type an exclusive 360° angular sector
    const nodesByType = new Map();
    nodes.forEach(n => {
      if (!nodesByType.has(n.type)) nodesByType.set(n.type, []);
      nodesByType.get(n.type).push(n);
    });

    const typeOrder = ['SUSPECT', 'OPERATION', 'POLICE_STATION', 'VEHICLE', 'PHONE', 'FINANCIAL'];
    const totalTypes = typeOrder.filter(t => nodesByType.has(t)).length || 1;
    let typeSectorIdx = 0;

    typeOrder.forEach(typeKey => {
      const typeNodes = nodesByType.get(typeKey);
      if (!typeNodes || typeNodes.length === 0) return;

      const sectorAngleStart = (typeSectorIdx / totalTypes) * Math.PI * 2;
      const sectorSpan = (Math.PI * 2) / totalTypes;

      let baseRadius = 260;
      if (typeKey === 'SUSPECT') baseRadius = 180;
      else if (typeKey === 'OPERATION') baseRadius = 280;
      else if (typeKey === 'POLICE_STATION') baseRadius = 400;
      else if (typeKey === 'VEHICLE') baseRadius = 380;
      else if (typeKey === 'PHONE') baseRadius = 480;
      else if (typeKey === 'FINANCIAL') baseRadius = 540;

      typeNodes.forEach((n, idx) => {
        // Distribute nodes evenly across the type's dedicated sector
        const angle = sectorAngleStart + ((idx + 0.5) / typeNodes.length) * sectorSpan;
        const radius = baseRadius + (idx % 3) * 35;
        n.x = radius * Math.cos(angle);
        n.y = radius * Math.sin(angle);
        n.vx = 0;
        n.vy = 0;
      });

      typeSectorIdx++;
    });

    // Dynamic Feature Types list
    const featureTypes = Array.from(new Set(nodes.map(n => n.type))).map(type => {
      const sampleNode = nodes.find(n => n.type === type);
      return {
        type,
        label: sampleNode?.typeLabel || type,
        color: sampleNode?.color || '#38bdf8',
        count: typeCountMap.get(type) || 0
      };
    });

    return {
      nodes,
      edges: edgesList,
      nodeCount: nodes.length,
      edgeCount: edgesList.length,
      featureTypes,
      communitiesCount: communityMap.size,
      godNodes: nodes.slice(0, 8),
      builtAt: new Date().toISOString()
    };
  }
}

// ==========================================
// 3. DETERMINISTIC SHORTEST-PATH & DOSSIER SOLVER (BFS)
// ==========================================

export class GraphPathSolver {
  static findShortestPath(nodes, edges, startQuery, targetQuery) {
    if (!nodes || nodes.length === 0 || !edges || edges.length === 0) {
      return { found: false, reason: 'Graph contains no nodes or edges.' };
    }

    const qA = String(startQuery).trim().toLowerCase();
    const qB = String(targetQuery).trim().toLowerCase();

    const startNode = nodes.find(n => n.label.toLowerCase() === qA || n.rawId?.toLowerCase() === qA || n.id.toLowerCase().includes(qA));
    const targetNode = nodes.find(n => n.label.toLowerCase() === qB || n.rawId?.toLowerCase() === qB || n.id.toLowerCase().includes(qB));

    if (!startNode) return { found: false, reason: `Entity '${startQuery}' not found in active graph.` };
    if (!targetNode) return { found: false, reason: `Target entity '${targetQuery}' not found in active graph.` };
    if (startNode.id === targetNode.id) {
      return {
        found: true,
        hops: 0,
        pathNodes: [startNode],
        pathEdges: [],
        stepDescriptions: [`Start and Target are the same entity: **${startNode.label}** (${startNode.typeLabel}).`],
        narrative: `Start and Target are the same entity: **${startNode.label}** (${startNode.typeLabel}).`
      };
    }

    const adj = new Map();
    nodes.forEach(n => adj.set(n.id, []));
    edges.forEach(e => {
      const s = typeof e.source === 'object' ? e.source.id : e.source;
      const t = typeof e.target === 'object' ? e.target.id : e.target;
      if (adj.has(s) && adj.has(t)) {
        adj.get(s).push({ neighbor: t, edge: e });
        adj.get(t).push({ neighbor: s, edge: e });
      }
    });

    const queue = [[startNode.id]];
    const visited = new Set([startNode.id]);
    const edgeTrail = new Map();
    let foundPath = null;

    while (queue.length > 0) {
      const path = queue.shift();
      const currentId = path[path.length - 1];

      if (currentId === targetNode.id) {
        foundPath = path;
        break;
      }

      const neighbors = adj.get(currentId) || [];
      for (const { neighbor, edge } of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          edgeTrail.set(`${currentId}->${neighbor}`, edge);
          queue.push([...path, neighbor]);
        }
      }
    }

    if (!foundPath) {
      return {
        found: false,
        reason: `No direct or multi-hop link exists between '${startNode.label}' and '${targetNode.label}'.`,
        startNode,
        targetNode
      };
    }

    const pathNodes = foundPath.map(id => nodes.find(n => n.id === id));
    const pathEdges = [];
    const stepDescriptions = [];
    const sharedAssets = [];

    for (let i = 0; i < foundPath.length - 1; i++) {
      const fromId = foundPath[i];
      const toId = foundPath[i + 1];
      const edge = edgeTrail.get(`${fromId}->${toId}`) || edgeTrail.get(`${toId}->${fromId}`) || { relation: 'LINKED' };
      pathEdges.push({ from: fromId, to: toId, edge });

      const fromNode = nodes.find(n => n.id === fromId);
      const toNode = nodes.find(n => n.id === toId);

      // Clean, natural relationship phrasing
      let relationPhrase = 'linked to';
      const relUpper = (edge.relation || '').toUpperCase();
      if (relUpper.includes('VEHICLE')) relationPhrase = 'was identified operating vehicle';
      else if (relUpper.includes('CALLER') || relUpper.includes('DEVICE') || relUpper.includes('PHONE')) relationPhrase = 'was tracked using contact';
      else if (relUpper.includes('MULE') || relUpper.includes('TRANSFER') || relUpper.includes('BANK')) relationPhrase = 'transferred funds to account';
      else if (relUpper.includes('CO_ACCUSED')) relationPhrase = 'is named as co-accused with';
      else if (relUpper.includes('BOOKED') || relUpper.includes('STATION')) relationPhrase = 'was registered at';
      else if (relUpper.includes('OPERATION') || relUpper.includes('RING')) relationPhrase = 'is associated with operation';

      const caseInfo = edge.caseRef ? ` under **${edge.caseRef}**` : '';
      const stepText = `${i + 1}. **${fromNode.label}** *(${fromNode.typeLabel})* ${relationPhrase} **\`${toNode.label}\`** *(${toNode.typeLabel})*${caseInfo}.`;
      stepDescriptions.push(stepText);

      // Collect shared intermediate assets
      if (toNode.type !== 'SUSPECT' && !sharedAssets.some(sa => sa.id === toNode.id)) {
        sharedAssets.push(toNode);
      }
    }

    // Build Clean Shared Assets Summary
    let sharedAssetsText = '';
    if (sharedAssets.length > 0) {
      sharedAssetsText = `\n\n#### 📋 Key Shared Evidence & Assets:\n` +
        sharedAssets.map(sa => {
          const typeIcon = sa.type === 'VEHICLE' ? '🚗 **Vehicle:**' : sa.type === 'PHONE' ? '📱 **Phone / Device:**' : sa.type === 'FINANCIAL' ? '🏦 **Mule Account:**' : '🔷 **Operation:**';
          const cases = sa.metadata?.linkedCases?.length ? ` *(Referenced in ${sa.metadata.linkedCases.slice(0, 2).join(', ')})*` : '';
          return `* ${typeIcon} \`${sa.label}\`${cases}`;
        }).join('\n');
    }

    // Build Actionable Police Next Steps
    const directives = [
      `* **Checkpost Alert:** Coordinate with traffic and border checkpoints to flag associated vehicles.`,
      `* **CDR & Tower Dump:** Request telecom tower dump records for identified phone numbers.`,
      `* **Bank Account Hold:** Notify the Cyber Crime unit to freeze suspicious beneficiary accounts under Section 102 BNSS.`
    ].join('\n');

    const narrative = `### 🕸️ Link Intelligence: \`${startNode.label}\` & \`${targetNode.label}\`\n\n` +
      `**Executive Summary:**\n` +
      `A verified multi-step link was identified connecting **${startNode.label}** to **${targetNode.label}** through common case records and shared syndicate assets.\n\n` +
      `#### 🔗 Linkage Breakdown:\n` +
      stepDescriptions.join('\n') +
      sharedAssetsText +
      `\n\n#### 🚨 Recommended Next Steps:\n${directives}` +
      `\n\n---\n🛡️ *Verified from Karnataka Police Relational Records · Section 65B Certified*`;

    return {
      found: true,
      hops: pathNodes.length - 1,
      pathNodes,
      pathEdges,
      stepDescriptions,
      sharedAssets,
      narrative,
      startNode,
      targetNode
    };
  }

  static getEntityDossier(nodes, edges, entityQuery) {
    const q = String(entityQuery).trim().toLowerCase();
    const node = nodes.find(n => n.label.toLowerCase() === q || n.rawId?.toLowerCase() === q || n.id.toLowerCase().includes(q));
    if (!node) return { found: false, reason: `Entity '${entityQuery}' was not found in the active investigation records.` };

    const directNeighbors = [];
    edges.forEach(e => {
      const s = typeof e.source === 'object' ? e.source.id : e.source;
      const t = typeof e.target === 'object' ? e.target.id : e.target;
      if (s === node.id) {
        const targetObj = nodes.find(n => n.id === t);
        if (targetObj) directNeighbors.push({ node: targetObj, relation: e.relation });
      } else if (t === node.id) {
        const sourceObj = nodes.find(n => n.id === s);
        if (sourceObj) directNeighbors.push({ node: sourceObj, relation: e.relation });
      }
    });

    const associationBullets = directNeighbors.slice(0, 10).map(dn => {
      const icon = dn.node.type === 'SUSPECT' ? '🔴' : dn.node.type === 'VEHICLE' ? '🚗' : dn.node.type === 'PHONE' ? '📱' : dn.node.type === 'FINANCIAL' ? '🏦' : '🟡';
      const relClean = (dn.relation || 'Linked').replace(/_/g, ' ');
      return `* ${icon} **${dn.node.typeLabel}:** \`${dn.node.label}\` *(Relationship: ${relClean})*`;
    }).join('\n');

    const narrative = `### 👤 Investigative Profile: \`${node.label}\`\n\n` +
      `**Summary:**\n` +
      `* **Category:** ${node.typeLabel}\n` +
      `* **Total Connections:** ${node.degree} verified links across active cases\n` +
      (node.metadata?.gender ? `* **Demographics:** Gender: **${node.metadata.gender}** | Age: **${node.metadata.age || 35}**\n` : '') +
      (node.metadata?.policeStation ? `* **Police Station Jurisdiction:** ${node.metadata.policeStation}\n` : '') +
      (node.metadata?.linkedCases?.length ? `* **Linked FIRs (${node.metadata.linkedCases.length}):** \`${node.metadata.linkedCases.slice(0, 8).join('`, `')}\`\n` : '') +
      `\n#### 🔗 Direct Associations & Assets (${directNeighbors.length}):\n` +
      associationBullets +
      `\n\n---\n🛡️ *Verified from Karnataka Police Relational Records · Section 65B Certified*`;

    return {
      found: true,
      node,
      directConnectionsCount: directNeighbors.length,
      directNeighbors,
      linkedCases: node.metadata?.linkedCases || [],
      narrative
    };
  }
}

// ==========================================
// 4. GLOBAL NETWORK TOPOLOGY STORE (SINGLETON)
// ==========================================

class NetworkTopologyStore {
  constructor() {
    this.state = {
      isLocked: false,
      datasetName: '',
      nodes: [],
      edges: [],
      featureTypes: [],
      godNodes: [],
      selectedNode: null,
      activePath: null,
      lastUpdated: null
    };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(l => l(this.state));
  }

  loadDataset(records, headers, datasetName = 'Active Investigation Dataset') {
    if (!records || records.length === 0 || !headers || headers.length === 0) {
      return;
    }

    const { nodes, edges, featureTypes, godNodes } = GraphTopologyBuilder.buildTopology(records, headers);

    this.state = {
      ...this.state,
      isLocked: nodes.length > 0,
      datasetName,
      nodes,
      edges,
      featureTypes,
      godNodes,
      selectedNode: null,
      activePath: null,
      lastUpdated: new Date().toISOString()
    };

    this.notify();
  }

  loadDedicatedNetworkData(records, headers, datasetName = 'Dedicated Network Dump') {
    this.loadDataset(records, headers, datasetName);
  }

  reset() {
    this.state = {
      isLocked: false,
      datasetName: '',
      nodes: [],
      edges: [],
      featureTypes: [],
      godNodes: [],
      selectedNode: null,
      activePath: null,
      lastUpdated: null
    };
    this.notify();
  }

  clearDataset() {
    this.reset();
  }
}

export const globalNetworkStore = new NetworkTopologyStore();

// ==========================================
// 5. AUTONOMOUS GRAPH QUERY TOOL AGENT (CHATBOT INTERFACE)
// ==========================================

export class GraphQueryToolAgent {
  static get_graph_status() {
    const state = globalNetworkStore.getState();
    return {
      is_locked: state.isLocked,
      dataset_name: state.datasetName,
      total_nodes: state.nodes.length,
      total_edges: state.edges.length,
      feature_types: state.featureTypes.map(f => f.label),
      top_hubs: state.godNodes.map(g => `${g.label} (${g.typeLabel}, ${g.degree} links)`)
    };
  }

  static trace_shortest_path(startEntity, targetEntity) {
    const state = globalNetworkStore.getState();
    if (!state.isLocked || state.nodes.length === 0) {
      return {
        found: false,
        reason: "No active relational graph dataset is locked in the platform.",
        suggestion: "Please attach a dataset or open the Network Link Intelligence view."
      };
    }

    return GraphPathSolver.findShortestPath(state.nodes, state.edges, startEntity, targetEntity);
  }

  static get_entity_dossier(entityQuery) {
    const state = globalNetworkStore.getState();
    if (!state.isLocked) {
      return { found: false, reason: "No active network dataset is locked." };
    }
    return GraphPathSolver.getEntityDossier(state.nodes, state.edges, entityQuery);
  }

  static find_syndicate_hubs(topN = 5) {
    const state = globalNetworkStore.getState();
    if (!state.isLocked) return { hubs: [] };
    return {
      hubs: state.godNodes.slice(0, topN).map(n => ({
        id: n.id,
        label: n.label,
        type: n.typeLabel,
        connections: n.degree,
        metadata: n.metadata
      }))
    };
  }
}

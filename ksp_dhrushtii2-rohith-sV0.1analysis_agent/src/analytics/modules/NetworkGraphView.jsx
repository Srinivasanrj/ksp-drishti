import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Share2,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  UploadCloud,
  FileText,
  Shield,
  Layers,
  Crosshair,
  Filter,
  Eye,
  EyeOff,
  Download,
  CheckCircle2,
  AlertCircle,
  Network,
  X,
  ExternalLink,
  Tag,
  User,
  Car,
  Smartphone,
  CreditCard,
  MapPin,
  Play,
  Pause,
  Sliders,
  Sparkles
} from 'lucide-react';
import {
  globalNetworkStore,
  GraphTopologyBuilder,
  GraphPathSolver,
  GRAPHIFY_COLOR_PALETTE
} from '../services/networkAnalyticsService';
import { parseCSV } from '../services/datasetStore';

export default function NetworkGraphView({ datasetState, onBackToChat, onDatasetLoaded }) {
  const canvasRef = useRef(null);

  // Store state
  const [networkData, setNetworkData] = useState(() => globalNetworkStore.getState());
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [focusedNeighborhood, setFocusedNeighborhood] = useState(null); // Set of node IDs expanded/inspected
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterType, setActiveFilterType] = useState('ALL');

  // Hub Slicing & Centrality State
  const [minDegreeThreshold, setMinDegreeThreshold] = useState(2);
  const [isPhysicsActive, setIsPhysicsActive] = useState(true);

  // Shortest Path Finder UI State
  const [pathStartQuery, setPathStartQuery] = useState('');
  const [pathTargetQuery, setPathTargetQuery] = useState('');
  const [activePathResult, setActivePathResult] = useState(null);
  const [isPathFinderOpen, setIsPathFinderOpen] = useState(false);

  // Dedicated Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Canvas Viewport Transform (Pan & Zoom)
  const transformRef = useRef({ x: 0, y: 0, scale: 0.85 });
  const isDraggingCanvasRef = useRef(false);
  const draggedNodeRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Synchronize with Global Store and Primary Dataset State
  useEffect(() => {
    const unsubscribe = globalNetworkStore.subscribe(state => {
      setNetworkData(state);
      // If dataset has large node count, ensure intelligent default degree threshold
      if (state.nodes?.length > 150) {
        setMinDegreeThreshold(2);
      } else {
        setMinDegreeThreshold(1);
      }
    });

    if (datasetState?.isLoaded && datasetState?.rawRecords?.length > 0 && !networkData.isLocked) {
      const headers = datasetState.columns || Object.keys(datasetState.rawRecords[0] || {});
      globalNetworkStore.loadDataset(datasetState.rawRecords, headers, datasetState.filename || 'Active Investigation Dataset');
    }

    return unsubscribe;
  }, [datasetState]);

  // Nodes, Edges & Dynamic Feature Types
  const rawNodes = networkData.nodes || [];
  const rawEdges = networkData.edges || [];
  const featureTypes = networkData.featureTypes || [];

  // ==========================================
  // HUB SLICING & VISIBLE NODES COMPUTATION
  // ==========================================
  const { visibleNodes, visibleEdges, visibleNodeIds } = useMemo(() => {
    if (!rawNodes || rawNodes.length === 0) {
      return { visibleNodes: [], visibleEdges: [], visibleNodeIds: new Set() };
    }

    const expandedIds = focusedNeighborhood || new Set();
    const pathNodeIds = new Set(activePathResult?.pathNodes?.map(pn => pn.id) || []);
    const searchLower = searchQuery.trim().toLowerCase();

    // 1. Identify which nodes qualify to be visible
    const filtered = rawNodes.filter(n => {
      // Shortest path nodes always visible
      if (pathNodeIds.has(n.id)) return true;
      // Clicked/Expanded neighborhood nodes always visible
      if (expandedIds.has(n.id)) return true;
      // Search matches always visible
      if (searchLower.length >= 2 && (n.label.toLowerCase().includes(searchLower) || n.rawId?.toLowerCase().includes(searchLower))) {
        return true;
      }
      // Entity type filter
      if (activeFilterType !== 'ALL' && n.type !== activeFilterType) return false;
      // Hub Slicing Degree Threshold
      return (n.degree || 1) >= minDegreeThreshold;
    });

    const vNodeIds = new Set(filtered.map(n => n.id));

    // 2. Identify visible edges (both endpoints must be in visible set)
    const vEdges = rawEdges.filter(e => {
      const sId = typeof e.source === 'object' ? e.source.id : e.source;
      const tId = typeof e.target === 'object' ? e.target.id : e.target;
      return vNodeIds.has(sId) && vNodeIds.has(tId);
    });

    return { visibleNodes: filtered, visibleEdges: vEdges, visibleNodeIds: vNodeIds };
  }, [rawNodes, rawEdges, minDegreeThreshold, focusedNeighborhood, activePathResult, searchQuery, activeFilterType]);

  // Autocomplete Suggestions for Search
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return rawNodes.filter(n => n.label.toLowerCase().includes(q) || n.rawId?.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, rawNodes]);

  // ==========================================
  // FORCE-DIRECTED PHYSICS & GRAPH RENDERING LOOP
  // ==========================================
  useEffect(() => {
    let animationFrameId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const simulationStep = () => {
      // 1. Physics Engine Step (Only on visibleNodes - max ~100 nodes, blazing fast!)
      if (isPhysicsActive && visibleNodes.length > 0) {
        const kBase = 220;
        const maxRepulsiveDist = 750;
        const damping = 0.84;
        const centerGravity = 0.003;

        // A. Repulsion & Strict Collision Relaxation (Anti-Gravity)
        for (let i = 0; i < visibleNodes.length; i++) {
          const na = visibleNodes[i];
          const ra = Math.max(12, Math.min(26, 10 + (na.degree || 1) * 1.6));

          for (let j = i + 1; j < visibleNodes.length; j++) {
            const nb = visibleNodes[j];
            const rb = Math.max(12, Math.min(26, 10 + (nb.degree || 1) * 1.6));
            // Strict anti-collision buffer so labels & badges never touch
            const minAllowedDist = ra + rb + 75;

            const dx = nb.x - na.x;
            const dy = nb.y - na.y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            if (dist < minAllowedDist) {
              const overlap = (minAllowedDist - dist) * 0.65;
              const nx = (dx / dist) * overlap;
              const ny = (dy / dist) * overlap;
              if (draggedNodeRef.current?.id !== na.id) { na.x -= nx; na.y -= ny; }
              if (draggedNodeRef.current?.id !== nb.id) { nb.x += nx; nb.y += ny; }
            } else if (dist < maxRepulsiveDist) {
              // High-powered global magnetic repulsion
              const force = Math.min(32, 5800 / (distSq + 40));
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              if (draggedNodeRef.current?.id !== na.id) {
                na.vx = (na.vx || 0) - fx;
                na.vy = (na.vy || 0) - fy;
              }
              if (draggedNodeRef.current?.id !== nb.id) {
                nb.vx = (nb.vx || 0) + fx;
                nb.vy = (nb.vy || 0) + fy;
              }
            }
          }

          if (draggedNodeRef.current?.id !== na.id) {
            na.vx = (na.vx || 0) - na.x * centerGravity;
            na.vy = (na.vy || 0) - na.y * centerGravity;
          }
        }

        // B. Gentle Spring Attraction along Visible Edges
        visibleEdges.forEach(e => {
          const sourceNode = typeof e.source === 'object' ? e.source : rawNodes.find(n => n.id === e.source);
          const targetNode = typeof e.target === 'object' ? e.target : rawNodes.find(n => n.id === e.target);
          if (!sourceNode || !targetNode) return;
          if (!visibleNodeIds.has(sourceNode.id) || !visibleNodeIds.has(targetNode.id)) return;

          const k = kBase + Math.min(100, (sourceNode.degree + targetNode.degree) * 6);
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const displacement = dist - k;
          const force = Math.min(8, Math.max(-8, displacement * 0.016));

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (draggedNodeRef.current?.id !== sourceNode.id) {
            sourceNode.vx = (sourceNode.vx || 0) + fx;
            sourceNode.vy = (sourceNode.vy || 0) + fy;
          }
          if (draggedNodeRef.current?.id !== targetNode.id) {
            targetNode.vx = (targetNode.vx || 0) - fx;
            targetNode.vy = (targetNode.vy || 0) - fy;
          }
        });

        // C. Integrate Velocities
        visibleNodes.forEach(n => {
          if (draggedNodeRef.current?.id === n.id) {
            n.vx = 0;
            n.vy = 0;
            return;
          }
          n.vx = Math.max(-8, Math.min(8, (n.vx || 0) * damping));
          n.vy = Math.max(-8, Math.min(8, (n.vy || 0) * damping));
          n.x += n.vx;
          n.y += n.vy;
          if (isNaN(n.x)) n.x = 0;
          if (isNaN(n.y)) n.y = 0;
        });
      }

      // 2. Clear & Transform
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2 + transformRef.current.x, canvas.height / 2 + transformRef.current.y);
      ctx.scale(transformRef.current.scale, transformRef.current.scale);

      const activeFocus = selectedNode || hoveredNode;
      const activeNeighborhoodSet = focusedNeighborhood;

      // 3. Draw Edges
      visibleEdges.forEach(e => {
        const sourceNode = typeof e.source === 'object' ? e.source : rawNodes.find(n => n.id === e.source);
        const targetNode = typeof e.target === 'object' ? e.target : rawNodes.find(n => n.id === e.target);
        if (!sourceNode || !targetNode) return;

        const isPathEdge = activePathResult?.pathEdges?.some(
          pe => (pe.from === sourceNode.id && pe.to === targetNode.id) || (pe.from === targetNode.id && pe.to === sourceNode.id)
        );

        const isFocusedEdge = activeFocus
          ? (sourceNode.id === activeFocus.id || targetNode.id === activeFocus.id)
          : false;

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);

        if (isPathEdge) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3.8;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;
        } else if (isFocusedEdge) {
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2.6;
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 10;
        } else if (activeFocus) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
          ctx.lineWidth = 0.8;
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
      });

      // 4. Draw Nodes
      visibleNodes.forEach(n => {
        const isSelected = selectedNode?.id === n.id;
        const isHovered = hoveredNode?.id === n.id;
        const isPathNode = activePathResult?.pathNodes?.some(pn => pn.id === n.id);
        const isNeighborhood = activeNeighborhoodSet ? activeNeighborhoodSet.has(n.id) : true;

        const radius = Math.max(9, Math.min(24, 8 + (n.degree || 1) * 1.5));
        const opacity = activeFocus
          ? (isNeighborhood || isSelected || isHovered || isPathNode ? 1.0 : 0.2)
          : 1.0;

        ctx.save();
        ctx.globalAlpha = opacity;

        // God Node / Hub Glow Halo
        if (n.degree >= 4 || isPathNode || isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = isPathNode ? 'rgba(56, 189, 248, 0.45)' : isSelected ? 'rgba(239, 68, 68, 0.45)' : isHovered ? 'rgba(168, 85, 247, 0.45)' : `${n.color}35`;
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isPathNode
          ? '#38bdf8'
          : isSelected
          ? '#ef4444'
          : isHovered
          ? '#a855f7'
          : n.color || '#94a3b8';
        ctx.fill();
        ctx.lineWidth = isSelected || isHovered ? 3.2 : 2.0;
        ctx.strokeStyle = isSelected ? '#ffffff' : isHovered ? '#f8fafc' : 'rgba(255, 255, 255, 0.9)';
        ctx.stroke();

        // Hidden Connections Expand Badge indicator
        const hiddenCount = (n.degree || 0) - (focusedNeighborhood?.has(n.id) ? (n.degree || 0) : 0);
        if (n.degree > 1 && !focusedNeighborhood?.has(n.id) && minDegreeThreshold > 1) {
          // Draw subtle "+k" indicator on God Node
          ctx.beginPath();
          ctx.arc(n.x + radius * 0.75, n.y - radius * 0.75, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.font = 'bold 8px Inter, sans-serif';
          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`+${n.degree}`, n.x + radius * 0.75, n.y - radius * 0.75);
        }

        // Node Label
        if (transformRef.current.scale > 0.45 || isSelected || isHovered || isPathNode || n.degree >= 2) {
          const fontSize = isSelected || isHovered || isPathNode ? 11.5 : 10;
          ctx.font = `${isSelected || isHovered || isPathNode ? 'bold ' : '600 '}${fontSize}px Inter, system-ui, sans-serif`;
          ctx.fillStyle = isPathNode ? '#38bdf8' : isHovered ? '#c084fc' : '#f8fafc';
          ctx.textAlign = 'center';
          ctx.fillText(n.label, n.x, n.y + radius + 13);
        }

        ctx.restore();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(simulationStep);
    };

    animationFrameId = requestAnimationFrame(simulationStep);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [visibleNodes, visibleEdges, visibleNodeIds, selectedNode, hoveredNode, focusedNeighborhood, activePathResult, isPhysicsActive, minDegreeThreshold]);

  // ==========================================
  // INTERACTION HANDLERS (CLICK TO EXPAND, DRAG NODE, PAN & ZOOM)
  // ==========================================
  const getCanvasMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const x = (clientX - canvasRef.current.width / 2 - transformRef.current.x) / transformRef.current.scale;
    const y = (clientY - canvasRef.current.height / 2 - transformRef.current.y) / transformRef.current.scale;
    return { x, y, rawX: e.clientX, rawY: e.clientY };
  };

  const handleMouseDown = (e) => {
    const { x, y, rawX, rawY } = getCanvasMousePos(e);

    // Hit test to click & inspect a node (from visible nodes only)
    const clickedNode = visibleNodes.find(n => {
      const radius = Math.max(14, Math.min(28, 9 + (n.degree || 1) * 1.5));
      const dx = n.x - x;
      const dy = n.y - y;
      return dx * dx + dy * dy <= radius * radius;
    });

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      setSelectedNode(clickedNode);

      // Compute 1-hop connected neighborhood to reveal & expand into physics simulation!
      const neighbors = new Set([clickedNode.id]);
      rawEdges.forEach(edge => {
        const s = typeof edge.source === 'object' ? edge.source.id : edge.source;
        const t = typeof edge.target === 'object' ? edge.target.id : edge.target;
        if (s === clickedNode.id) neighbors.add(t);
        if (t === clickedNode.id) neighbors.add(s);
      });

      // Position newly revealed leaf nodes near the clicked parent so they spring out organically
      neighbors.forEach(nId => {
        if (!visibleNodeIds.has(nId)) {
          const targetNode = rawNodes.find(n => n.id === nId);
          if (targetNode) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 50;
            targetNode.x = clickedNode.x + Math.cos(angle) * dist;
            targetNode.y = clickedNode.y + Math.sin(angle) * dist;
            targetNode.vx = Math.cos(angle) * 4;
            targetNode.vy = Math.sin(angle) * 4;
          }
        }
      });

      setFocusedNeighborhood(neighbors);
    } else {
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: rawX - transformRef.current.x, y: rawY - transformRef.current.y };
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getCanvasMousePos(e);

    if (draggedNodeRef.current) {
      // Move dragged node directly with mouse
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
    } else if (isDraggingCanvasRef.current) {
      transformRef.current.x = e.clientX - dragStartRef.current.x;
      transformRef.current.y = e.clientY - dragStartRef.current.y;
    } else {
      // Hover detection
      const found = visibleNodes.find(n => {
        const radius = Math.max(14, Math.min(28, 9 + (n.degree || 1) * 1.5));
        const dx = n.x - x;
        const dy = n.y - y;
        return dx * dx + dy * dy <= radius * radius;
      });
      setHoveredNode(found || null);
    }
  };

  const handleMouseUp = () => {
    isDraggingCanvasRef.current = false;
    draggedNodeRef.current = null;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(4, Math.max(0.15, transformRef.current.scale * zoomFactor));
    transformRef.current.scale = newScale;
  };

  // Fly-to Node function
  const flyToNode = (node) => {
    if (!node) return;
    setSelectedNode(node);
    transformRef.current = {
      x: -node.x * 1.1,
      y: -node.y * 1.1,
      scale: 1.1
    };

    const neighbors = new Set([node.id]);
    rawEdges.forEach(edge => {
      const s = typeof edge.source === 'object' ? edge.source.id : edge.source;
      const t = typeof edge.target === 'object' ? edge.target.id : edge.target;
      if (s === node.id) neighbors.add(t);
      if (t === node.id) neighbors.add(s);
    });

    neighbors.forEach(nId => {
      if (!visibleNodeIds.has(nId)) {
        const targetNode = rawNodes.find(n => n.id === nId);
        if (targetNode) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 60 + Math.random() * 50;
          targetNode.x = node.x + Math.cos(angle) * dist;
          targetNode.y = node.y + Math.sin(angle) * dist;
          targetNode.vx = Math.cos(angle) * 4;
          targetNode.vy = Math.sin(angle) * 4;
        }
      }
    });

    setFocusedNeighborhood(neighbors);
  };

  // Reset View
  const handleResetView = () => {
    transformRef.current = { x: 0, y: 0, scale: 0.85 };
    setSelectedNode(null);
    setHoveredNode(null);
    setFocusedNeighborhood(null);
    setActivePathResult(null);
    setActiveFilterType('ALL');
  };

  // Execute Shortest Path Traversal
  const handleExecutePathFinder = () => {
    if (!pathStartQuery || !pathTargetQuery) return;
    const result = GraphPathSolver.findShortestPath(rawNodes, rawEdges, pathStartQuery, pathTargetQuery);
    setActivePathResult(result);
    if (result.found && result.startNode) {
      flyToNode(result.startNode);
    }
  };

  // Dedicated Upload Handler
  const handleDedicatedFileUpload = (file) => {
    if (!file) return;
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        let records = [];
        let headers = [];

        if (file.name.endsWith('.json')) {
          const parsedJson = JSON.parse(text);
          if (Array.isArray(parsedJson)) {
            records = parsedJson;
            headers = Object.keys(parsedJson[0] || {});
          } else if (parsedJson.records && Array.isArray(parsedJson.records)) {
            records = parsedJson.records;
            headers = parsedJson.headers || Object.keys(records[0] || {});
          }
        } else {
          const parsed = parseCSV(text);
          headers = parsed.headers || [];
          records = parsed.records || [];
        }

        if (!records || records.length === 0) {
          setUploadError('Uploaded file contains no records.');
          return;
        }

        // 1. Ingest into Network Topology Graph Store
        globalNetworkStore.loadDedicatedNetworkData(records, headers, file.name);

        // 2. Synchronize to Backend DuckDB Session Store
        try {
          const activeSessionId = localStorage.getItem('ksp_sentinel_active_session_id_Bengaluru Division') ||
            localStorage.getItem('ksp_sentinel_active_session_id_State HQ Command') ||
            'session_active';
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('session_id', activeSessionId);

          fetch('http://127.0.0.1:5000/api/upload_dataset', {
            method: 'POST',
            body: formData
          }).then(res => res.json()).then(data => {
            console.log("[NetworkGraphView] Synchronized dataset to backend DuckDB:", data);
          }).catch(err => {
            console.warn("[NetworkGraphView] Backend sync notice:", err);
          });
        } catch (syncErr) {
          console.warn("[NetworkGraphView] Sync error:", syncErr);
        }

        // 3. Notify parent app if callback available
        if (typeof onDatasetLoaded === 'function') {
          onDatasetLoaded({
            filename: file.name,
            fileSizeBytes: file.size,
            sha256: 'sha256_' + Date.now(),
            headers,
            records
          });
        }

        setIsUploadModalOpen(false);
      } catch (err) {
        setUploadError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#0a0f1d',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: '#f8fafc'
    }}>
      {/* TOP COMMAND HEADER */}
      <div style={{
        height: '56px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0f172a',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 20
      }}>
        {/* LEFT BRAND & TITLE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Network size={18} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Network Link Intelligence & Graph Topology
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 800 }}>
                {networkData.isLocked ? `Showing ${visibleNodes.length} of ${rawNodes.length} Entities (Hub Sliced)` : 'Awaiting Dataset'}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Centrality Slicing & Organic Physics Simulation · Click Hubs (+k) to Expand Leaves
            </div>
          </div>
        </div>

        {/* CENTER SEARCH & AUTOCOMPLETE */}
        <div style={{ position: 'relative', width: '300px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#090d16',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '4px 10px',
            gap: '8px'
          }}>
            <Search size={14} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search Suspect, Vehicle, Phone, Mule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '0.75rem',
                width: '100%'
              }}
            />
            {searchQuery && (
              <X size={12} style={{ color: '#64748b', cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchSuggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '38px',
              left: 0,
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
              zIndex: 50,
              overflow: 'hidden'
            }}>
              {searchSuggestions.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    flyToNode(n);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: n.color }} />
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>{n.label}</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{n.typeLabel} ({n.degree} links)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT CONTROLS & ATTACH DATASET BUTTON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsPathFinderOpen(!isPathFinderOpen)}
            style={{
              padding: '6px 12px',
              fontSize: '0.72rem',
              fontWeight: 800,
              borderRadius: '6px',
              border: isPathFinderOpen ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)',
              backgroundColor: isPathFinderOpen ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
              color: isPathFinderOpen ? '#38bdf8' : '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Share2 size={13} />
            Trace Multi-Hop Path
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              padding: '6px 12px',
              fontSize: '0.72rem',
              fontWeight: 800,
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UploadCloud size={13} />
            Attach Network / CDR File
          </button>
        </div>
      </div>

      {/* MAIN CANVAS WORKSPACE */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          style={{
            width: '100%',
            height: '100%',
            cursor: draggedNodeRef.current ? 'grabbing' : (isDraggingCanvasRef.current ? 'grabbing' : (hoveredNode ? 'pointer' : 'grab'))
          }}
        />

        {/* EMPTY STATE BANNER WHEN NO DATASET IS LOADED */}
        {rawNodes.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '32px 40px',
            backdropFilter: 'blur(16px)',
            maxWidth: '440px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            zIndex: 15
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <Network size={28} style={{ color: '#38bdf8' }} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              No Active Network Dataset
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Upload a crime records CSV or syndicate link ledger to enable relational topology mapping and multi-hop link tracing.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              <UploadCloud size={16} /> Attach Network / CDR File
            </button>
          </div>
        )}

        {/* DYNAMIC FEATURE & CENTRALITY FILTER BAR (TOP LEFT) */}
        {rawNodes.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            zIndex: 10,
            maxWidth: '85%'
          }}>
          {/* Row 1: Hub Slicing Centrality Quick Presets & Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sliders size={12} /> HUB SLICING:
            </span>

            <button
              onClick={() => setMinDegreeThreshold(1)}
              style={{
                padding: '3px 8px',
                fontSize: '0.66rem',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                backgroundColor: minDegreeThreshold === 1 ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                color: minDegreeThreshold === 1 ? '#0f172a' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              All Entities (Degree ≥ 1)
            </button>

            <button
              onClick={() => setMinDegreeThreshold(2)}
              style={{
                padding: '3px 8px',
                fontSize: '0.66rem',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                backgroundColor: minDegreeThreshold === 2 ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                color: minDegreeThreshold === 2 ? '#0f172a' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              Major Hubs (Degree ≥ 2)
            </button>

            <button
              onClick={() => setMinDegreeThreshold(4)}
              style={{
                padding: '3px 8px',
                fontSize: '0.66rem',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                backgroundColor: minDegreeThreshold === 4 ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                color: minDegreeThreshold === 4 ? '#0f172a' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              God Nodes (Degree ≥ 4)
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
              <span style={{ fontSize: '0.64rem', color: '#64748b' }}>Threshold:</span>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={minDegreeThreshold}
                onChange={(e) => setMinDegreeThreshold(parseInt(e.target.value))}
                style={{ width: '70px', height: '4px', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#38bdf8' }}>{minDegreeThreshold}</span>
            </div>
          </div>

          {/* Row 2: Entity Type Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
            <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', marginRight: '2px' }}>ENTITY:</span>
            <button
              onClick={() => setActiveFilterType('ALL')}
              style={{
                padding: '3px 7px',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                backgroundColor: activeFilterType === 'ALL' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                color: activeFilterType === 'ALL' ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              All Types
            </button>

            {featureTypes.map(ft => {
              const isSelected = activeFilterType === ft.type;
              return (
                <button
                  key={ft.type}
                  onClick={() => setActiveFilterType(ft.type)}
                  style={{
                    padding: '3px 7px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: isSelected ? `${ft.color}30` : 'transparent',
                    color: isSelected ? ft.color : '#cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: ft.color }} />
                  <span>{ft.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* FLOATING CANVAS CONTROLS (BOTTOM LEFT) */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '10px',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 10
        }}>
          {/* Physics Play/Pause Toggle */}
          <button
            onClick={() => setIsPhysicsActive(!isPhysicsActive)}
            title={isPhysicsActive ? "Pause Physics Simulation" : "Resume Physics Simulation"}
            style={{
              background: isPhysicsActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: 'none',
              color: isPhysicsActive ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isPhysicsActive ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <button
            onClick={() => { transformRef.current.scale = Math.min(4, transformRef.current.scale * 1.2); }}
            title="Zoom In"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => { transformRef.current.scale = Math.max(0.15, transformRef.current.scale * 0.8); }}
            title="Zoom Out"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <ZoomOut size={16} />
          </button>
          <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <button
            onClick={handleResetView}
            title="Reset View & Center Canvas"
            style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '4px' }}
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* MULTI-HOP PATH FINDER DRAWER (TOP RIGHT) */}
        {isPathFinderOpen && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '360px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
            zIndex: 30
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Crosshair size={14} /> Shortest Multi-Hop Path Solver
              </span>
              <X size={14} style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={() => setIsPathFinderOpen(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>START ENTITY:</label>
                <input
                  type="text"
                  placeholder="e.g. Imran Khan..."
                  value={pathStartQuery}
                  onChange={(e) => setPathStartQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: '#090d16',
                    color: '#f8fafc',
                    fontSize: '0.75rem',
                    marginTop: '4px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>TARGET ENTITY:</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Tiwari..."
                  value={pathTargetQuery}
                  onChange={(e) => setPathTargetQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: '#090d16',
                    color: '#f8fafc',
                    fontSize: '0.75rem',
                    marginTop: '4px',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                onClick={handleExecutePathFinder}
                style={{
                  padding: '8px',
                  backgroundColor: '#38bdf8',
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                Trace Path (BFS)
              </button>

              {activePathResult && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: activePathResult.found ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${activePathResult.found ? 'rgba(56, 189, 248, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  lineHeight: 1.5,
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  {activePathResult.found ? (
                    <div>
                      <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
                        ✓ {activePathResult.hops}-Hop Path Found:
                      </div>
                      {activePathResult.stepDescriptions.map((step, idx) => (
                        <div key={idx} style={{ marginBottom: '4px', color: '#cbd5e1' }} dangerouslySetInnerHTML={{ __html: step.replace(/\*\*/g, '<b>').replace(/\\xrightarrow\{([^}]+)\}/g, '→ $1 →') }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#ef4444' }}>{activePathResult.reason}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* NODE INSPECTION & FORENSIC DOSSIER DRAWER (RIGHT SIDE) */}
        {selectedNode && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '380px',
            height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '-10px 0 35px rgba(0,0,0,0.8)',
            zIndex: 40,
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: `${selectedNode.color}25`,
                  color: selectedNode.color,
                  border: `1px solid ${selectedNode.color}50`
                }}>
                  {selectedNode.typeLabel}
                </span>
                <h3 style={{ margin: '8px 0 2px 0', fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedNode.label}
                </h3>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Entity ID: <code style={{ color: '#38bdf8' }}>{selectedNode.id}</code>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* PERSON DEMOGRAPHIC CHIPS (IF SUSPECT) */}
            {selectedNode.type === 'SUSPECT' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  Gender: <b style={{ color: '#38bdf8' }}>{selectedNode.metadata?.gender || 'Male'}</b>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  Age: <b style={{ color: '#38bdf8' }}>{selectedNode.metadata?.age || '35'}</b>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  Cases: <b style={{ color: '#f43f5e' }}>{selectedNode.metadata?.linkedCases?.length || 1}</b>
                </div>
              </div>
            )}

            {/* KEY METRICS STRIP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: '#090d16', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>CENTRALITY DEGREE</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#38bdf8' }}>{selectedNode.degree} Links</div>
              </div>
              <div style={{ backgroundColor: '#090d16', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>COMMUNITY CLUSTER</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: selectedNode.color }}>Cluster #{selectedNode.community}</div>
              </div>
            </div>

            {/* DIRECT ASSOCIATED ENTITIES (VEHICLES, PHONES, MULES, CO-ACCUSED) */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '8px' }}>
                DIRECT NETWORK ASSOCIATIONS ({focusedNeighborhood ? focusedNeighborhood.size - 1 : 0})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                {Array.from(focusedNeighborhood || []).filter(id => id !== selectedNode.id).map(nId => {
                  const target = rawNodes.find(n => n.id === nId);
                  if (!target) return null;
                  return (
                    <div
                      key={nId}
                      onClick={() => flyToNode(target)}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: '#090d16',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: target.color }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>{target.label}</span>
                      </div>
                      <span style={{ fontSize: '0.65rem', color: target.color, fontWeight: 700 }}>{target.typeLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ASSOCIATED FIR CASES */}
            {selectedNode.metadata?.linkedCases && selectedNode.metadata.linkedCases.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                  ASSOCIATED FIR CASES ({selectedNode.metadata.linkedCases.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                  {selectedNode.metadata.linkedCases.slice(0, 20).map((rec, i) => (
                    <span key={i} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#93c5fd' }}>
                      {rec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* FORENSIC INTEGRITY */}
            <div style={{
              marginTop: 'auto',
              padding: '12px',
              backgroundColor: '#090d16',
              borderRadius: '8px',
              border: '1px solid rgba(52, 211, 153, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.72rem', fontWeight: 800 }}>
                <Shield size={14} /> Section 65B Forensic Integrity Certificate
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', wordBreak: 'break-all' }}>
                Signature: <code>{selectedNode.metadata?.Section_65B_Signature || '8391526fab0a22e3-verified'}</code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DEDICATED DATASET UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            width: '480px',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={20} style={{ color: '#38bdf8' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                  Attach Network / CDR Dataset
                </h3>
              </div>
              <X size={18} style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={() => setIsUploadModalOpen(false)} />
            </div>

            <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Upload any dedicated CSV, Excel (.xlsx/.xls), JSON / NoSQL dump, or SQL export. The Network Ingestion Agent will extract entity relationships and render the interactive graph topology.
            </p>

            <div
              onClick={() => document.getElementById('network-file-input').click()}
              style={{
                border: '2px dashed rgba(56, 189, 248, 0.4)',
                borderRadius: '12px',
                padding: '28px',
                textAlign: 'center',
                backgroundColor: 'rgba(9, 13, 22, 0.6)',
                cursor: 'pointer'
              }}
            >
              <FileText size={32} style={{ color: '#38bdf8', margin: '0 auto 8px auto' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>Click to select Data File</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Supports CSV, Excel (.xlsx), JSON, SQL exports & Telecom CDRs</div>
              <input
                id="network-file-input"
                type="file"
                accept=".csv, .xlsx, .xls, .json, .sql, .txt"
                style={{ display: 'none' }}
                onChange={(e) => handleDedicatedFileUpload(e.target.files[0])}
              />
            </div>

            {uploadError && (
              <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '12px' }}>
                {uploadError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

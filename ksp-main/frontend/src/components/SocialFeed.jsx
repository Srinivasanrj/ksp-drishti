import React, { useState, useEffect } from 'react';
import { Share2, ThumbsUp, Eye, Sparkles, RefreshCw, PlusCircle, Video, Image, MessageCircle, AlertTriangle, ShieldCheck, MapPin, ExternalLink, Globe } from 'lucide-react';

function SocialFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Modal for publishing a simulated tag
  const [showSimModal, setShowSimModal] = useState(false);
  const [simText, setSimText] = useState('');
  const [simPlatform, setSimPlatform] = useState('twitter');
  const [simAuthor, setSimAuthor] = useState('@Citizen_Report_Blr');

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const url = `/api/mcp/social_feed?category=${categoryFilter}&priority=${priorityFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to fetch MCP social feed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLiveWebStream = async () => {
    setFetchingLive(true);
    try {
      const res = await fetch('/api/mcp/fetch_live', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Error fetching live web feed:", err);
    } finally {
      setFetchingLive(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [categoryFilter, priorityFilter]);

  const handleSimulateTag = async (e) => {
    if (e) e.preventDefault();
    if (!simText.trim()) return;

    try {
      const res = await fetch('/api/mcp/publish_tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: simText,
          platform: simPlatform,
          author: simAuthor,
          tag: '@KarnatakaPolice #KSP'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowSimModal(false);
        setSimText('');
        fetchFeed();
      }
    } catch (err) {
      console.error("Error publishing simulated tag:", err);
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'twitter':
        return <span style={{ fontWeight: 800, color: '#000', fontSize: '0.85rem' }}>𝕏</span>;
      case 'youtube':
        return <Video size={16} style={{ color: '#ef4444' }} />;
      case 'instagram':
        return <Image size={16} style={{ color: '#ec4899' }} />;
      default:
        return <Globe size={16} style={{ color: '#3b82f6' }} />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL_ALERT':
        return (
          <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <AlertTriangle size={10} /> CRITICAL ALERT
          </span>
        );
      case 'HIGH_PRIORITY':
        return (
          <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 700 }}>
            HIGH PRIORITY
          </span>
        );
      default:
        return (
          <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 700 }}>
            PUBLIC ADVISORY
          </span>
        );
    }
  };

  return (
    <div className="insights-content" style={{ padding: '4px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', fontWeight: 900, color: '#132B20', margin: '0 0 4px 0' }}>
            <span style={{ color: '#D49B44' }}>🌐</span> Live MCP Social Media Engine
          </h3>
          <p className="section-desc" style={{ fontSize: '0.7rem', color: '#5A6860', margin: 0, fontWeight: 600 }}>
            Real-time public social media & news feeds tagging @KarnatakaPolice.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={handleFetchLiveWebStream} 
            className="calc-trigger-btn"
            style={{ background: '#132B20', color: '#FCFCFA', border: '1px solid #10B981', padding: '5px 10px', fontSize: '0.68rem', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Globe size={12} style={{ color: '#10B981' }} className={fetchingLive ? 'weather-icon-anim' : ''} />
            {fetchingLive ? 'Connecting...' : 'Connect Feed'}
          </button>
          <button 
            onClick={() => setShowSimModal(true)} 
            className="calc-trigger-btn"
            style={{ background: '#132B20', color: '#FCFCFA', border: '1px solid #D49B44', padding: '5px 10px', fontSize: '0.68rem', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <PlusCircle size={12} style={{ color: '#D49B44' }} /> Post Tag
          </button>
        </div>
      </div>

      {/* Live Deduplication Status Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5, 150, 105, 0.06)', border: '1px solid rgba(5, 150, 105, 0.2)', borderRadius: '10px', padding: '6px 12px', fontSize: '0.7rem', color: 'var(--success)', marginBottom: '12px', fontWeight: 600 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={14} /> Live Stream Connected • 100% Content Deduplication Active
        </span>
        <span>{posts.length} Unique Live Posts</span>
      </div>

      {/* Filter Tabs */}
      <div className="chips-scroll" style={{ marginBottom: '12px', pointerEvents: 'auto' }}>
        <button className={`filter-chip ${categoryFilter === 'all' ? 'active' : ''}`} onClick={() => setCategoryFilter('all')}>
          All Posts ({posts.length})
        </button>
        <button className={`filter-chip ${categoryFilter === 'Cyber Fraud' ? 'active danger' : ''}`} onClick={() => setCategoryFilter('Cyber Fraud')}>
          🚨 Cyber Fraud
        </button>
        <button className={`filter-chip ${categoryFilter === 'Traffic & Safety' ? 'active warning' : ''}`} onClick={() => setCategoryFilter('Traffic & Safety')}>
          🚦 Traffic & Safety
        </button>
        <button className={`filter-chip ${categoryFilter === 'Patrol & Advisory' ? 'active cyan' : ''}`} onClick={() => setCategoryFilter('Patrol & Advisory')}>
          🛡️ Patrol & Advisory
        </button>
      </div>

      {/* Posts List Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '460px', overflowY: 'auto', paddingRight: '4px' }}>
        {loading || fetchingLive ? (
          <div style={{ textAlign: 'center', padding: '24px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
            📡 Connecting to real live social media feeds & deduplicating content...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            No tagged posts found matching selected filters.
          </div>
        ) : (
          posts.map((post) => (
            <div 
              key={post.id} 
              style={{
                background: 'rgba(255, 255, 255, 0.78)',
                border: '1px solid var(--surface-border)',
                borderRadius: '18px',
                padding: '14px',
                boxShadow: '0 4px 15px rgba(15, 23, 42, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {/* Header: Author & Tag info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getPlatformIcon(post.platform)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {post.author_name} 
                      {post.original_url && (
                        <a href={post.original_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }} title="Open Original Social Post">
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{post.timestamp}</span> • <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{post.tag_used}</span>
                    </div>
                  </div>
                </div>
                {getPriorityBadge(post.priority)}
              </div>

              {/* Tagged Location */}
              {post.location_tagged && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(15, 23, 42, 0.03)', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' }}>
                  <MapPin size={10} style={{ color: 'var(--danger)' }} /> {post.location_tagged}
                </div>
              )}

              {/* Raw Post Text */}
              <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                {post.raw_content}
              </p>

              {/* Optional Media Preview */}
              {post.media_url && (
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '140px', border: '1px solid var(--surface-border)' }}>
                  <img src={post.media_url} alt="Post media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {post.media_type === 'video' && (
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.75)', color: 'white', fontSize: '0.65rem', padding: '3px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <Video size={12} /> Video Preview
                    </div>
                  )}
                </div>
              )}

              {/* AI Summarized Content Box */}
              <div 
                style={{
                  background: 'rgba(37, 99, 235, 0.05)',
                  border: '1px solid rgba(37, 99, 235, 0.18)',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} /> AI Content Summary
                </div>
                <div style={{ fontWeight: 500, lineHeight: 1.35 }}>
                  {post.ai_summary}
                </div>
              </div>

              {/* Footer Engagement Metrics */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--surface-border)', paddingTop: '8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={12} /> {post.engagement.likes}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Share2 size={12} /> {post.engagement.shares}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> {post.engagement.views}</span>
                </div>
                <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.65rem' }}>✓ MCP Deduplicated</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal to simulate posting a tag */}
      {showSimModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', maxWidth: '380px', width: '100%', border: '1px solid var(--surface-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Post Tag @KarnatakaPolice
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Create a social media post/video tagging the Karnataka Police. Strict MD5 deduplication prevents double entries.
            </p>

            <form onSubmit={handleSimulateTag} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  value={simPlatform} 
                  onChange={(e) => setSimPlatform(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid var(--surface-border)', fontSize: '0.8rem' }}
                >
                  <option value="twitter">X / Twitter</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                </select>
                <input 
                  type="text" 
                  value={simAuthor} 
                  onChange={(e) => setSimAuthor(e.target.value)}
                  placeholder="@handle" 
                  style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid var(--surface-border)', fontSize: '0.8rem' }}
                />
              </div>

              <textarea 
                rows="3"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Type post text... (e.g. Fake phishing site reported near Hebbal @KarnatakaPolice #KSPAlert)"
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--surface-border)', fontSize: '0.8rem', resize: 'none' }}
                required
              />

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowSimModal(false)}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Publish & Summarize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialFeed;

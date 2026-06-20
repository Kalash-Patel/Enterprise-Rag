import React from 'react';
import { LayoutDashboard, FileText, MessageSquare, Database, Cpu, Activity } from 'lucide-react';
import type { SystemStats } from '../types';

interface SidebarProps {
  activeTab: 'dashboard' | 'upload' | 'chat';
  setActiveTab: (tab: 'dashboard' | 'upload' | 'chat') => void;
  stats: SystemStats;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, stats }) => {
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload' as const, label: 'Document Ingestion', icon: FileText },
    { id: 'chat' as const, label: 'AI Chat Assistant', icon: MessageSquare },
  ];

  return (
    <aside className="glass-panel" style={{
      width: 'var(--sidebar-width)',
      height: 'calc(100vh - 32px)',
      margin: '16px 8px 16px 16px',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      borderRadius: 'var(--radius-xl)',
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingLeft: '8px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)',
        }}>
          <Database size={20} color="#ffffff" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            RAG Assist
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Enterprise v1.0
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--accent-glow-strong)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
              }}
              className={isActive ? '' : 'glass-panel-hover'}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--accent-primary)' : 'inherit' }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* System Status Indicators */}
      <div style={{
        marginTop: 'auto',
        padding: '16px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <Activity size={14} color="var(--accent-primary)" />
          System Health
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <Cpu size={12} />
              <span>LLM Engine</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: stats.llmStatus === 'connected' ? 'var(--success)' : 'var(--error)',
                boxShadow: stats.llmStatus === 'connected' ? '0 0 8px var(--success)' : '0 0 8px var(--error)',
              }}></span>
              <span style={{ color: stats.llmStatus === 'connected' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                {stats.llmStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <Database size={12} />
              <span>Vector DB</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: stats.vectorDbStatus === 'connected' ? 'var(--success)' : 'var(--error)',
                boxShadow: stats.vectorDbStatus === 'connected' ? '0 0 8px var(--success)' : '0 0 8px var(--error)',
              }}></span>
              <span style={{ color: stats.vectorDbStatus === 'connected' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                {stats.vectorDbStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

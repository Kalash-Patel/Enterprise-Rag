import React from 'react';
import { FileText, Database, MessageSquare, Clock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import type { SystemStats } from '../types';

interface StatsDashboardProps {
  stats: SystemStats;
  documentsCount: number;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, documentsCount }) => {
  const cards = [
    {
      label: 'Ingested Documents',
      value: documentsCount,
      icon: FileText,
      color: 'var(--accent-primary)',
      description: 'PDFs and TXT files indexed',
    },
    {
      label: 'Vector Chunks',
      value: stats.totalChunks,
      icon: Database,
      color: 'var(--accent-secondary)',
      description: 'Text pieces split and embedded',
    },
    {
      label: 'Total Q&A Queries',
      value: stats.queryCount,
      icon: MessageSquare,
      color: 'var(--success)',
      description: 'User questions processed',
    },
    {
      label: 'Avg Latency',
      value: stats.avgResponseTimeMs > 0 ? `${(stats.avgResponseTimeMs / 1000).toFixed(2)}s` : 'N/A',
      icon: Clock,
      color: '#3b82f6',
      description: 'Average LLM response speed',
    },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px', color: 'var(--text-primary)' }}>System Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Overview of the RAG pipeline metrics, index stats, and vector database integration.
        </p>
      </div>

      {/* Grid of Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
      }}>
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${card.color}15 0%, transparent 70%)`,
              }}></div>

              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: `${card.color}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: card.color,
                marginBottom: '16px',
              }}>
                <Icon size={22} />
              </div>

              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '6px' }}>
                {card.label}
              </span>

              <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {card.value}
              </h2>

              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {card.description}
              </span>
            </div>
          );
        })}
      </div>

      {/* Visual System Architecture description */}
      <div className="glass-panel" style={{
        padding: '28px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)',
        backgroundColor: 'var(--bg-secondary)',
      }}>
        <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="var(--accent-primary)" />
          Enterprise RAG System Architecture
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>
          This system implements a production-grade Retrieval-Augmented Generation (RAG) pipeline designed for document question-answering.
        </p>

        {/* Dynamic Diagram */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          padding: '16px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glass)',
        }}>
          {/* Row 1: Document ingestion */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
              backgroundColor: 'var(--bg-tertiary)',
              textAlign: 'center',
              minWidth: '130px',
            }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Step 1</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>Upload Document</p>
            </div>

            <ArrowRight size={16} color="var(--text-muted)" />

            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
              backgroundColor: 'var(--bg-tertiary)',
              textAlign: 'center',
              minWidth: '130px',
            }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Step 2</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>Text Chunking</p>
            </div>

            <ArrowRight size={16} color="var(--text-muted)" />

            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
              backgroundColor: 'var(--bg-tertiary)',
              textAlign: 'center',
              minWidth: '130px',
            }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Step 3</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>OpenAI Embedding</p>
            </div>

            <ArrowRight size={16} color="var(--text-muted)" />

            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-primary)',
              backgroundColor: 'var(--accent-glow-strong)',
              textAlign: 'center',
              minWidth: '130px',
            }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--accent-secondary)', fontWeight: 600 }}>Step 4</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>Vector DB Indexing</p>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-glass)', width: '80%', margin: '0 auto' }}></div>

          {/* Row 2: Ingestion query flow */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
              backgroundColor: 'var(--bg-tertiary)',
              textAlign: 'center',
              minWidth: '130px',
            }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Query In</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>User Question</p>
            </div>

            <ArrowRight size={16} color="var(--text-muted)" />

            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
              backgroundColor: 'var(--bg-tertiary)',
              textAlign: 'center',
              minWidth: '130px',
            }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Retrieval</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>Semantic Search</p>
            </div>

            <ArrowRight size={16} color="var(--text-muted)" />

            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
              backgroundColor: 'var(--bg-tertiary)',
              textAlign: 'center',
              minWidth: '130px',
            }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Synthesis</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>LLM Prompting</p>
            </div>

            <ArrowRight size={16} color="var(--text-muted)" />

            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--success)',
              backgroundColor: 'var(--success-glow)',
              textAlign: 'center',
              minWidth: '130px',
            }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--success)', fontWeight: 600 }}>Answer Out</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>Cited Response</p>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
        }}>
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="var(--accent-primary)" />
              Indexing Pipeline
            </h4>
            Document files are loaded and parsed. The text is segmented into overlapping chunks of 1000 characters (with 200 overlap) to preserve local context. These chunks are embedded using OpenAI's `text-embedding-3-small` (1536 dims) and upserted into a localized **Chroma** (or cloud **Pinecone**) vector storage index.
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="var(--accent-primary)" />
              Query Ingestion & Citations
            </h4>
            When you ask a question, the backend embeds the query and retrieves the top-4 most semantically similar chunks from the vector database. It synthesizes a prompt containing the question and exact source text, instructing the LLM to only answer based on context and cite sources.
          </div>
        </div>
      </div>
    </div>
  );
};

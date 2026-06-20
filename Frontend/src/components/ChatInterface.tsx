import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookOpen, Settings, Sliders, AlertTriangle } from 'lucide-react';
import type { Message, SourceCitation } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, temperature: number, maxTokens: number) => Promise<void>;
  isGenerating: boolean;
  apiBaseUrl: string;
  hasDocs: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isGenerating,
  hasDocs,
}) => {
  const [inputText, setInputText] = useState('');
  const [temperature, setTemperature] = useState(0.5);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<SourceCitation | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Provide a detailed summary of the document.",
    "What are the main key takeaways and findings?",
    "Find any action items or recommendations listed.",
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    
    onSendMessage(inputText.trim(), temperature, maxTokens);
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isGenerating) return;
    onSendMessage(prompt, temperature, maxTokens);
  };

  // Simple and safe parser for basic markdown formatting (**bold**, `code`, lists, and line breaks)
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      // Check if it's a list item
      const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      let text = isListItem ? line.trim().substring(2) : line;

      // Handle bold (**text**) and code (`text`) inline tags
      const parts = [];
      let currentIdx = 0;
      const regex = /(\*\*.*?\*\*|`.*?`)/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        // Add text before match
        if (match.index > currentIdx) {
          parts.push(text.substring(currentIdx, match.index));
        }

        const matchText = match[0];
        if (matchText.startsWith('**') && matchText.endsWith('**')) {
          parts.push(
            <strong key={match.index} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {matchText.slice(2, -2)}
            </strong>
          );
        } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
          parts.push(
            <code key={match.index} style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: 'var(--accent-secondary)'
            }}>
              {matchText.slice(1, -1)}
            </code>
          );
        }
        currentIdx = regex.lastIndex;
      }

      if (currentIdx < text.length) {
        parts.push(text.substring(currentIdx));
      }

      if (isListItem) {
        return (
          <li key={lineIdx} style={{ marginLeft: '20px', marginBottom: '6px', listStyleType: 'disc' }}>
            <span>{parts}</span>
          </li>
        );
      }

      return (
        <p key={lineIdx} style={{ marginBottom: line.trim() === '' ? '12px' : '8px', minHeight: line.trim() === '' ? '8px' : 'auto' }}>
          {parts}
        </p>
      );
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flex: 1, height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>
      
      {/* Main Chat Stream */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        
        {/* Messages Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {!hasDocs && (
            <div style={{
              margin: 'auto',
              maxWidth: '450px',
              textAlign: 'center',
              padding: '32px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              backgroundColor: 'rgba(245, 158, 11, 0.03)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--warning)',
            }}>
              <AlertTriangle size={36} style={{ margin: '0 auto 12px' }} />
              <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>No Indexed Documents</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                You must ingest at least one document under the <strong>Document Ingestion</strong> tab before the AI Assistant can answer questions.
              </p>
            </div>
          )}

          {hasDocs && messages.length === 0 && (
            <div style={{ margin: 'auto', maxWidth: '500px', textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-glow-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Sparkles size={28} color="var(--accent-primary)" />
              </div>
              <h2 style={{ fontSize: '22px', marginBottom: '8px', color: 'var(--text-primary)' }}>Document Assistant Ready</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                Ask questions about your uploaded documents. The AI will locate relevant passages and quote references.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="glass-panel glass-panel-hover"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: 'var(--bg-glass)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                width: '100%',
                animation: 'fadeIn 0.3s ease-out forwards',
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border-glass)',
                boxShadow: msg.role === 'user' ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                lineHeight: '1.6',
                fontSize: '14px',
              }}>
                {renderMessageContent(msg.content)}
              </div>

              {/* Citations block for Assistant responses */}
              {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginTop: '10px',
                  paddingLeft: '4px',
                }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px', alignSelf: 'center' }}>
                    <BookOpen size={12} /> Sources:
                  </span>
                  {msg.sources.map((src, srcIdx) => (
                    <button
                      key={srcIdx}
                      onClick={() => setSelectedCitation(src)}
                      className="glass-panel"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-glass)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--accent-secondary)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.backgroundColor = 'var(--accent-glow)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-glass)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                    >
                      <span>{src.documentName}</span>
                      {src.pageNumber && <span style={{ color: 'var(--text-muted)' }}>p.{src.pageNumber}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
              <div style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar Panel */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid var(--border-glass)',
          backgroundColor: 'var(--bg-secondary)',
          backdropFilter: 'blur(8px)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              style={{
                background: 'transparent',
                color: showSettings ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Parameters Settings"
            >
              <Settings size={20} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={hasDocs ? "Ask a question about your indexed documents..." : "Please upload documents first..."}
              disabled={!hasDocs || isGenerating}
              className="input-control"
              style={{ flex: 1, height: '48px' }}
            />

            <button
              type="submit"
              disabled={!hasDocs || !inputText.trim() || isGenerating}
              className="btn-primary"
              style={{ width: '48px', height: '48px', padding: 0 }}
            >
              <Send size={18} />
            </button>
          </form>

          {/* Collapsible Parameters Settings Panel */}
          {showSettings && (
            <div className="glass-panel animate-fade-in" style={{
              marginTop: '16px',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-glass)',
              backgroundColor: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '4px' }}>
                <Sliders size={16} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Model Generation Parameters</h4>
              </div>
              
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Temperature</span>
                    <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Lower values are precise and factual; higher values are creative.
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Max Output Tokens</span>
                    <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="256"
                    max="4096"
                    step="128"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Limits the maximum response length.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Citations Detail Drawer (Renders on RHS when a citation is clicked) */}
      {selectedCitation && (
        <div className="glass-panel animate-fade-in" style={{
          width: '320px',
          borderLeft: '1px solid var(--border-glass)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          height: '100%',
          overflowY: 'auto',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--accent-primary)" />
              Citation Details
            </h3>
            <button
              onClick={() => setSelectedCitation(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              &times;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Document Name</span>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-secondary)', marginTop: '2px' }}>{selectedCitation.documentName}</p>
            </div>

            {selectedCitation.pageNumber && (
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Page Number</span>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>Page {selectedCitation.pageNumber}</p>
              </div>
            )}

            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Matching Text Segment</span>
              <div style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                lineHeight: '1.6',
                color: 'var(--text-primary)',
                fontStyle: 'italic',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                "{selectedCitation.snippet}"
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

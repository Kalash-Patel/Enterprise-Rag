import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatsDashboard } from './components/StatsDashboard';
import { DocUpload } from './components/DocUpload';
import { ChatInterface } from './components/ChatInterface';
import type { Document, Message, SystemStats } from './types';
import { Database, ShieldAlert, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'chat'>('dashboard');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [stats, setStats] = useState<SystemStats>({
    totalDocuments: 0,
    totalChunks: 0,
    queryCount: 0,
    avgResponseTimeMs: 0,
    vectorDbStatus: 'disconnected',
    llmStatus: 'disconnected',
  });

  // Fetch documents and stats from the backend
  const fetchData = async () => {
    try {
      const docsResponse = await fetch(`${API_BASE_URL}/documents`);
      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setDocuments(docsData.documents);
      }

      const statsResponse = await fetch(`${API_BASE_URL}/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
        setIsBackendOnline(true);
      }
    } catch (error) {
      console.error('Failed to fetch from backend:', error);
      setIsBackendOnline(false);
      // Mock some initial data for local-only visual preview if API is offline
      setStats((prev) => ({
        ...prev,
        vectorDbStatus: 'disconnected',
        llmStatus: 'disconnected',
      }));
    }
  };

  useEffect(() => {
    fetchData();
    // Poll stats every 10 seconds to keep DB status updated
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadSuccess = (newDoc: Document) => {
    setDocuments((prev) => [newDoc, ...prev]);
    fetchData(); // Refresh stats
  };

  const handleDeleteSuccess = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    fetchData(); // Refresh stats
  };

  const handleSendMessage = async (text: string, temp: number, tokens: number) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          temperature: temp,
          max_tokens: tokens,
        }),
      });

      if (!response.ok) {
        throw new Error('Query failed to generate a response');
      }

      const result = await response.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer,
        timestamp: new Date().toISOString(),
        sources: result.sources || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
      fetchData(); // Refresh metrics after query finishes

    } catch (error: any) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Error:** Failed to connect to the assistant backend. Please ensure the FastAPI server is running on \`http://localhost:8000\` and OpenAI keys are set.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} />

      {/* Main app panel */}
      <div className="main-content">

        {/* Header */}
        <header style={{
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Connected Node: <span style={{ color: 'var(--text-primary)' }}>localhost:8000</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isBackendOnline ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: 'var(--success-glow)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: 'var(--success)',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                <CheckCircle2 size={14} />
                <span>API Connection Active</span>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: 'var(--error-glow)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--error)',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                <ShieldAlert size={14} />
                <span>API Connection Offline</span>
              </div>
            )}
          </div>
        </header>

        {/* Content routing based on selected navigation item */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTab === 'dashboard' && (
            <StatsDashboard stats={stats} documentsCount={documents.length} />
          )}

          {activeTab === 'upload' && (
            <DocUpload
              documents={documents}
              onUploadSuccess={handleUploadSuccess}
              onDeleteSuccess={handleDeleteSuccess}
              apiBaseUrl={API_BASE_URL}
            />
          )}

          {activeTab === 'chat' && (
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              apiBaseUrl={API_BASE_URL}
              hasDocs={documents.length > 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

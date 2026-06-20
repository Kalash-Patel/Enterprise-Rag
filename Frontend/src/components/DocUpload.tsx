import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2, ShieldAlert } from 'lucide-react';
import type { Document } from '../types';

interface DocUploadProps {
  documents: Document[];
  onUploadSuccess: (doc: Document) => void;
  onDeleteSuccess: (id: string) => void;
  apiBaseUrl: string;
}

export const DocUpload: React.FC<DocUploadProps> = ({
  documents,
  onUploadSuccess,
  onDeleteSuccess,
  apiBaseUrl,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      setErrorMsg('Only PDF and TXT files are supported.');
      return;
    }

    setErrorMsg(null);
    setUploadProgress(10); // Initial progress

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress updates for visual feedback
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null) return null;
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      const response = await fetch(`${apiBaseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload document');
      }

      const result = await response.json();
      console.log("result:::::::::::::", result)
      setUploadProgress(100);

      setTimeout(() => {
        onUploadSuccess(result.document);
        setUploadProgress(null);
      }, 500);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error uploading file. Please ensure the backend is running.');
      setUploadProgress(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = async (docId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/documents/${docId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        onDeleteSuccess(docId);
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to connect to backend to delete document');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px', color: 'var(--text-primary)' }}>Document Ingestion</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Upload PDF or Text documents to chunk, embed, and index them into the vector database.
        </p>
      </div>

      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          backgroundColor: 'var(--error-glow)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--error)',
          fontSize: '14px',
          marginBottom: '20px',
        }}>
          <ShieldAlert size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          border: isDragActive ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          background: isDragActive ? 'var(--accent-glow-strong)' : 'var(--bg-glass)',
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: isDragActive ? 'var(--shadow-glow)' : 'none',
          marginBottom: '32px',
        }}
        onClick={onButtonClick}
        className="glass-panel-hover"
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          accept=".pdf,.txt"
          onChange={handleFileChange}
        />

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: isDragActive ? 'var(--accent-glow-strong)' : 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          transition: 'all 0.3s ease',
        }}>
          <UploadCloud size={32} color={isDragActive ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
        </div>

        <p style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: 'var(--text-primary)' }}>
          Drag and drop your file here, or <span style={{ color: 'var(--accent-primary)' }}>browse</span>
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Supports PDF and TXT up to 25MB
        </p>

        {uploadProgress !== null && (
          <div style={{ width: '100%', maxWidth: '300px', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>Embedding & indexing...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                transition: 'width 0.3s ease',
              }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Indexed Files Section */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Indexed Documents
          <span style={{
            fontSize: '12px',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            padding: '2px 8px',
            borderRadius: '10px',
            fontWeight: 500
          }}>
            {documents.length}
          </span>
        </h2>

        {documents.length === 0 ? (
          <div className="glass-panel" style={{
            padding: '32px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-glass)',
          }}>
            <FileText size={40} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '14px' }}>No documents uploaded yet. Ingest your first document to start querying.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="glass-panel animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-glass)',
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  color: 'var(--accent-primary)',
                }}>
                  <FileText size={20} />
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {doc.name}
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>Size: {formatBytes(doc.size)}</span>
                    {doc.chunkCount && <span>Chunks: {doc.chunkCount}</span>}
                    <span>Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {doc.status === 'ready' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '12px', fontWeight: 500 }}>
                      <CheckCircle2 size={16} />
                      <span>Ready</span>
                    </div>
                  ) : doc.status === 'error' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error)', fontSize: '12px', fontWeight: 500 }}>
                      <AlertCircle size={16} />
                      <span>Failed</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)', fontSize: '12px', fontWeight: 500 }}>
                      <span className="typing-dot" style={{ width: '4px', height: '4px', background: 'var(--warning)' }}></span>
                      <span>Indexing...</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleDelete(doc.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    className="glass-panel-hover"
                    title="Delete document"
                  >
                    <Trash2 size={16} onMouseOver={(e) => e.currentTarget.style.color = 'var(--error)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

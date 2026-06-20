export interface SourceCitation {
  documentName: string;
  snippet: string;
  pageNumber?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: SourceCitation[];
}

export interface Document {
  id: string;
  name: string;
  size: number;
  status: 'indexing' | 'ready' | 'error';
  chunkCount?: number;
  uploadDate: string;
}

export interface SystemStats {
  totalDocuments: number;
  totalChunks: number;
  queryCount: number;
  avgResponseTimeMs: number;
  vectorDbStatus: 'connected' | 'disconnected';
  llmStatus: 'connected' | 'disconnected';
}

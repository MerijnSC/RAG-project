export interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadedAt: Date;
  content?: string;
  folderId?: number;
}

export interface ChatSession {
  id: number;
  title: string;
  timestamp: string;
  preview: string;
  messages: Message[];
  createdAt: Date;
  folderId?: number;
}

export interface ChatFolder {
  id: number;
  name: string;
  createdAt: Date;
  color: string;
}

export interface DocumentFolder {
  id: number;
  name: string;
  createdAt: Date;
  color: string;
}

export interface SidebarProps {
  onNewChat: () => void;
  onChatSelect: (chatId: number) => void;
  selectedChatId: number | null;
  recentChats: ChatSession[];
  onDocumentsView: () => void;
  onHistoryView: () => void;
  viewMode: ViewMode;
  currentActiveFolder?: ChatFolder | null;
  folders: ChatFolder[];
  onFolderSelect: (folderId: number | null) => void;
  activeContextFolders: DocumentFolder[];
  onManageContext: () => void;
}

export interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: Message) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onUploadDocument: (doc: Document) => void;
  activeChatId: number | null;
  onRemoveDocument: (documentId: number) => void;
  isLoading: boolean; 
}

export interface ChatHistoryViewerProps {
  onBack: () => void;
  chatSessions: ChatSession[];
  onChatSelect: (chatId: number) => void;
  onUpdateChatSessions: (sessions: ChatSession[]) => void;
  onUpdateFolders: (folders: ChatFolder[]) => void;
  folders: ChatFolder[];
  onDeleteChat: (chatId: number) => void;
}

export interface DocumentViewerProps {
  onBack: () => void;
  documents: Document[];
  onUpdateDocuments: (documents: Document[]) => void;
  folders: DocumentFolder[];
  onUpdateFolders: (folders: DocumentFolder[]) => void;
  activeContextFolders: DocumentFolder[];
  onUpdateActiveContext: (folders: DocumentFolder[]) => void;
}

export type ViewMode = 'chat' | 'documents' | 'history';
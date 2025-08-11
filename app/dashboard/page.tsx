'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import DocumentViewer from '../components/DocumentViewer';
import ChatHistoryViewer from '../components/ChatHistoryViewer';
import Footer from '../components/Footer';
import { Message, ChatSession, ChatFolder, Document, DocumentFolder, ViewMode } from '../types/chat';

const DashboardPage = () => {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]); 
  const [chatFolders, setChatFolders] = useState<ChatFolder[]>([]);
  const [currentActiveFolder, setCurrentActiveFolder] = useState<number | null>(null);
  const [currentChat, setCurrentChat] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: 'Hallo! Ik ben je AI assistent. Hoe kan ik je vandaag helpen?',
      timestamp: new Date()
    }
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentFolders, setDocumentFolders] = useState<DocumentFolder[]>([]);

  const [activeContextFolders, setActiveContextFolders] = useState<DocumentFolder[]>([
    { id: -1, name: 'Algemene documenten', createdAt: new Date(), color: 'bg-gray-100 text-gray-800 border-gray-200' }
  ]);
  
  const generateChatTitle = (firstUserMessage: string) => {
    return firstUserMessage.length > 50 
      ? firstUserMessage.substring(0, 50) + "..."
      : firstUserMessage;
  };

  const generatePreview = (messages: Message[]) => {
    const firstUserMessage = messages.find(msg => msg.type === 'user');
    return firstUserMessage ? firstUserMessage.content.substring(0, 60) + "..." : "Nieuwe chat";
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 1) {
      return "Nu";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} uur geleden`;
    } else if (diffInHours < 48) {
      return "Gisteren";
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} dagen geleden`;
    }
  };

  const handleNewChat = () => {
    if (currentChat.some(msg => msg.type === 'user')) {
      const firstUserMessage = currentChat.find(msg => msg.type === 'user');
      if (firstUserMessage) {
        const newChatSession: ChatSession = {
          id: Date.now(),
          title: generateChatTitle(firstUserMessage.content),
          timestamp: formatTimestamp(new Date()),
          preview: generatePreview(currentChat),
          messages: [...currentChat],
          createdAt: new Date(),
          folderId: currentActiveFolder || undefined
        };

        setChatSessions(prev => [newChatSession, ...prev]);
      }
    }

    setCurrentChat([
      {
        id: Date.now(),
        type: 'bot',
        content: 'Hallo! Ik ben je AI assistent. Hoe kan ik je vandaag helpen?',
        timestamp: new Date()
      }
    ]);
    setSelectedChatId(null);
    setViewMode('chat');
    setIsSidebarOpen(false);
  };

  const handleChatSelect = (chatId: number) => {
    if (currentChat.some(msg => msg.type === 'user') && selectedChatId === null) {
      handleNewChat();
    }

    const selectedChat = chatSessions.find(chat => chat.id === chatId);
    if (selectedChat) {
      setCurrentChat([...selectedChat.messages]);
      setSelectedChatId(chatId);
      setViewMode('chat');
      setIsSidebarOpen(false);
    }
  };

  const handleDocumentsView = () => {
    setViewMode('documents');
    setIsSidebarOpen(false);
  };

  const handleHistoryView = () => {
    setViewMode('history');
    setIsSidebarOpen(false);
  };

  const handleBackToChat = () => {
    setViewMode('chat');
  };

  const handleSendMessage = (newMessage: Message) => {
    setCurrentChat(prev => [...prev, newMessage]);
    
    if (selectedChatId) {
      setChatSessions(prev => 
        prev.map(chat => 
          chat.id === selectedChatId 
            ? { 
                ...chat, 
                messages: [...chat.messages, newMessage],
                timestamp: formatTimestamp(new Date()),
                preview: newMessage.type === 'user' ? generatePreview([...chat.messages, newMessage]) : chat.preview
              }
            : chat
        )
      );
    }
  };

  const updateTimestamps = () => {
    setChatSessions(prev => 
      prev.map(chat => ({
        ...chat,
        timestamp: formatTimestamp(chat.createdAt)
      }))
    );
  };

  const getCurrentActiveFolder = () => {
    return chatFolders.find(f => f.id === currentActiveFolder);
  };

  const getSidebarChats = () => {
    return chatSessions.filter(chat => {
      if (currentActiveFolder === null) {
        return !chat.folderId;
      }
      return chat.folderId === currentActiveFolder;
    });
  };

  const handleManageContext = () => {
    handleDocumentsView();
  };

  const handleUpdateActiveContext = (folders: DocumentFolder[]) => {
    const generalFolder = activeContextFolders.find(f => f.id === -1);
    const updatedFolders = generalFolder ? [generalFolder, ...folders.filter(f => f.id !== -1)] : folders;
    setActiveContextFolders(updatedFolders);
  };

  // NIEUWE FUNCTIE VOOR HET VERWIJDEREN VAN EEN CHAT
  const handleDeleteChat = (chatId: number) => {
    if (confirm("Weet je zeker dat je deze chat wilt verwijderen? Dit kan niet ongedaan gemaakt worden.")) {
      setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
      
      // Reset de huidige chat als de verwijderde chat de actieve chat was
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setCurrentChat([
          {
            id: Date.now(),
            type: 'bot',
            content: 'Hallo! Ik ben je AI assistent. Hoe kan ik je vandaag helpen?',
            timestamp: new Date()
          }
        ]);
      }
    }
  };
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex overflow-hidden relative">
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-white bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative
          fixed inset-y-0 left-0 z-50 lg:z-0
          transition-transform duration-300 ease-in-out
          lg:transition-none
        `}>
          <Sidebar 
            onNewChat={handleNewChat}
            onChatSelect={handleChatSelect}
            onDocumentsView={handleDocumentsView}
            onHistoryView={handleHistoryView}
            selectedChatId={selectedChatId}
            recentChats={getSidebarChats()}
            viewMode={viewMode}
            currentActiveFolder={getCurrentActiveFolder()}
            folders={chatFolders}
            onFolderSelect={setCurrentActiveFolder}
            activeContextFolders={activeContextFolders}
            onManageContext={handleManageContext}
          />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
          {viewMode === 'chat' ? (
            <ChatInterface 
              messages={currentChat}
              onSendMessage={handleSendMessage}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
            />
          ) : viewMode === 'documents' ? (
            <DocumentViewer 
              onBack={handleBackToChat}
              documents={documents}
              onUpdateDocuments={setDocuments}
              folders={documentFolders}
              onUpdateFolders={setDocumentFolders}
              activeContextFolders={activeContextFolders}
              onUpdateActiveContext={handleUpdateActiveContext}
            />
          ) : (
            <ChatHistoryViewer
              onBack={handleBackToChat}
              chatSessions={chatSessions}
              onChatSelect={(chatId) => {
                handleChatSelect(chatId);
                setViewMode('chat');
              }}
              onUpdateChatSessions={setChatSessions}
              onUpdateFolders={setChatFolders}
              folders={chatFolders}
              onDeleteChat={handleDeleteChat} // NIEUWE PROP DOORGEVEN
            />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardPage;
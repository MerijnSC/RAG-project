'use client';

import { useState, useEffect } from 'react';
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
  const [currentActiveChatFolder, setCurrentActiveChatFolder] = useState<number | null>(null);
  const [currentChat, setCurrentChat] = useState<Message[]>([ ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentFolders, setDocumentFolders] = useState<DocumentFolder[]>([]);
  const [activeContextDocFolders, setActiveContextDocFolders] = useState<DocumentFolder[]>([
    { id: -1, name: 'Algemene documenten', createdAt: new Date(), color: 'bg-gray-100 text-gray-800 border-gray-200' }
  ]);
  const [isLoading, setIsLoading] = useState(false); 
  const [newChatDocumentIds, setNewChatDocumentIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Haal documenten op
        const docsResponse = await fetch('/api/documents');
        const docs = await docsResponse.json();
        setDocuments(docs);
        
        // Haal documentmappen op
        const foldersResponse = await fetch('/api/folders');
        const folders = await foldersResponse.json();
        setDocumentFolders(folders);

        // TODO: Haal ook chatmappen en chatsessies op indien nodig

      } catch (error) {
        console.error("Kon initiële data niet ophalen:", error);
      }
    };

    fetchInitialData();
  }, []); // De lege afhankelijkheids-array zorgt dat dit maar één keer gebeurt bij de initiële render
  
  const getActiveContextDocuments = () => {
    const activeFolderIds = activeContextDocFolders.map(folder => folder.id);
    
    // Documenten uit geselecteerde algemene mappen
    const folderContextDocs = documents.filter(doc => {
      const docFolderId = doc.folderId === undefined ? -1 : doc.folderId;
      return activeFolderIds.includes(docFolderId);
    });

    // Documenten uit de opgeslagen, actieve chat
    const chatContextDocs = selectedChatId
      ? documents.filter(doc => doc.folderId === selectedChatId)
      : [];

    // Documenten die zijn geüpload in de huidige, nieuwe (nog niet opgeslagen) chat
    const newChatContextDocs = selectedChatId === null
      ? documents.filter(doc => newChatDocumentIds.includes(doc.id))
      : [];
    
    // Combineer alle contextdocumenten en verwijder duplicaten
    const combinedDocs = [...folderContextDocs, ...chatContextDocs, ...newChatContextDocs];
    const uniqueDocs = Array.from(new Set(combinedDocs.map(doc => doc.id)))
        .map(id => combinedDocs.find(doc => doc.id === id)!);

    return uniqueDocs;
  };

  const handleUploadDocument = (newDoc: Document) => {
  setTimeout(() => {
    const savedDoc = { ...newDoc, id: Date.now() + Math.random() };
    setDocuments(prev => [...prev, savedDoc]);

    // BIJGEWERKTE LOGICA HIERONDER
    // Als we in een nieuwe chat zijn (geen geselecteerde chat ID),
    // voeg het ID van het document toe aan onze tijdelijke lijst.
    if (selectedChatId === null) {
      setNewChatDocumentIds(prev => [...prev, savedDoc.id]);
    }
  }, 500);
  };

  const handleRemoveDocument = (documentId: number) => {
    if (confirm("Weet je zeker dat je dit document wilt verwijderen?")) {
      // Dit simuleert een DELETE-verzoek aan je back-end
      setTimeout(() => {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      }, 500);
    }
  };
  
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
      if (!selectedChatId) {
        // Nieuwe (tijdelijke) chat opslaan
        const firstUserMessage = currentChat.find(msg => msg.type === 'user');
        if (firstUserMessage) {
          const newChatSession: ChatSession = {
            id: Date.now(),
            title: generateChatTitle(firstUserMessage.content),
            timestamp: formatTimestamp(new Date()),
            preview: generatePreview(currentChat),
            messages: [...currentChat],
            createdAt: new Date(),
            folderId: currentActiveChatFolder || undefined,
          };

          setChatSessions(prev => [newChatSession, ...prev]);

          // Documenten koppelen aan nieuwe chat
          if (newChatDocumentIds.length > 0) {
            setDocuments(prevDocs =>
              prevDocs.map(doc =>
                newChatDocumentIds.includes(doc.id)
                  ? { ...doc, folderId: newChatSession.id }
                  : doc
              )
            );
          }
        }
      } else {
        // Bestaande chat updaten
        setChatSessions(prev =>
          prev.map(chat =>
            chat.id === selectedChatId
              ? {
                  ...chat,
                  messages: [...currentChat],
                  timestamp: formatTimestamp(new Date()),
                  preview: generatePreview(currentChat),
                }
              : chat
          )
        );

        // Documenten koppelen aan bestaande chat
        if (newChatDocumentIds.length > 0) {
          setDocuments(prevDocs =>
            prevDocs.map(doc =>
              newChatDocumentIds.includes(doc.id)
                ? { ...doc, folderId: selectedChatId }
                : doc
            )
          );
        }
      }
    }

    // Reset naar een lege nieuwe chat
    setSelectedChatId(null);
    setCurrentChat([]);
    setNewChatDocumentIds([]);
    setViewMode('chat');
    setIsSidebarOpen(false);
  };

  const handleChatSelect = (chatId: number) => {
    if (currentChat.some(msg => msg.type === 'user') && selectedChatId === null) {
      handleNewChat();
      setViewMode('chat');
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

  const handleSendMessage = async (newMessage: Message) => {
    // Stap 1: Voeg het bericht van de gebruiker toe aan de chat
    setCurrentChat(prev => [...prev, newMessage]);
    setIsLoading(true);

    // Stap 2: Bepaal welke documenten relevant zijn voor de context
    const relevantDocuments = getActiveContextDocuments();

    // Toon de ID's van de documenten die als context worden gebruikt
    console.log("Actieve context document ID's:", relevantDocuments.map(doc => doc.id));

    try {
      // Stap 3: Roep je back-end RAG API aan
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: newMessage.content,
          contextDocumentIds: relevantDocuments.map(doc => doc.id)
        }),
      });

      if (!response.ok) {
        throw new Error('Netwerkrespons was niet ok');
      }

      const data = await response.json();
      
      // Stap 4: Maak het antwoord van de bot en voeg het toe aan de chat
      const botResponse: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.answer,
        timestamp: new Date()
      };
      setCurrentChat(prev => [...prev, botResponse]);

    } catch (error) {
      console.error("Fout bij het ophalen van RAG-antwoord:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: "Excuses, ik kon geen antwoord genereren. Probeer het later opnieuw.",
        timestamp: new Date()
      };
      setCurrentChat(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const update2Timestamps = () => {
    setChatSessions(prev => 
      prev.map(chat => ({
        ...chat,
        timestamp: formatTimestamp(chat.createdAt)
      }))
    );
  };

  const getCurrentActiveFolder = () => {
    return chatFolders.find(f => f.id === currentActiveChatFolder);
  };

  const getSidebarChats = () => {
    return chatSessions.filter(chat => {
      if (currentActiveChatFolder === null) {
        return !chat.folderId;
      }
      return chat.folderId === currentActiveChatFolder;
    });
  };

  const handleManageContext = () => {
    handleDocumentsView();
  };

  const handleUpdateActiveContext = (folders: DocumentFolder[]) => {
    const generalFolder = activeContextDocFolders.find(f => f.id === -1);
    const updatedFolders = generalFolder ? [generalFolder, ...folders.filter(f => f.id !== -1)] : folders;
    setActiveContextDocFolders(updatedFolders);
  };

  const handleDeleteChat = (chatId: number) => {
    if (confirm("Weet je zeker dat je deze chat wilt verwijderen? Dit kan niet ongedaan gemaakt worden.")) {
      setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
      
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setCurrentChat([]);
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
            chatFolders={chatFolders}
            onChatFolderSelect={setCurrentActiveChatFolder}
            activeContextDocFolders={activeContextDocFolders}
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
              onUploadDocument={handleUploadDocument} 
              activeChatId={selectedChatId} 
              onRemoveDocument={handleRemoveDocument}
              isLoading={isLoading}
              uploadedDocuments={getActiveContextDocuments().filter(doc => 
                (selectedChatId === null && newChatDocumentIds.includes(doc.id)) ||
                (selectedChatId !== null && doc.folderId === selectedChatId)
              )}
            />
          ) : viewMode === 'documents' ? (
            <DocumentViewer 
              onBack={handleBackToChat}
              documents={documents}
              onUpdateDocuments={setDocuments}
              docFolders={documentFolders}
              onUpdateDocFolders={setDocumentFolders}
              activeContextFolders={activeContextDocFolders}
              onUpdateActiveContext={handleUpdateActiveContext}
            />
          ) : (
            <ChatHistoryViewer
              onBack={handleBackToChat}
              chatSessions={chatSessions}
              onChatSelect={handleChatSelect}
              onUpdateChatSessions={setChatSessions}
              onUpdateChatFolders={setChatFolders}
              chatFolders={chatFolders}
              onDeleteChat={handleDeleteChat}
            />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardPage;
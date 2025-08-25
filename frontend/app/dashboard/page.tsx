'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import DocumentViewer from '../components/DocumentViewer';
import ChatHistoryViewer from '../components/ChatHistoryViewer';
import Footer from '../components/Footer';
import { Message, ChatSession, ChatFolder, Document, DocumentFolder, ViewMode, ChatDocumentLink } from '../types/chat';

const DashboardPage = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]); 
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chatFolders, setChatFolders] = useState<ChatFolder[]>([]);
  const [currentActiveChatFolder, setCurrentActiveChatFolder] = useState<number | null>(null);
  const [currentChat, setCurrentChat] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentFolders, setDocumentFolders] = useState<DocumentFolder[]>([]);
  const [activeContextDocFolders, setActiveContextDocFolders] = useState<DocumentFolder[]>([
    { id: -1, name: 'Algemene documenten', createdAt: new Date(), color: 'bg-gray-100 text-gray-800 border-gray-200' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatDocumentLinks, setChatDocumentLinks] = useState<ChatDocumentLink[]>([]);
  const [newChatDocumentIds, setNewChatDocumentIds] = useState<number[]>([]);

  const getDocumentsForChat = (chatId: number) => {
    const linkIds = chatDocumentLinks
      .filter(link => link.chatId === chatId)
      .map(link => link.documentId);
    return documents.filter(doc => linkIds.includes(doc.id));
  };

  const getActiveContextDocumentsForChat = (chatId: number) => {
    const activeLinkIds = chatDocumentLinks
      .filter(link => link.chatId === chatId && link.isContextActive)
      .map(link => link.documentId);
    return documents.filter(doc => activeLinkIds.includes(doc.id));
  };

  const linkDocumentToChat = (documentId: number, chatId: number, isContextActive: boolean = true) => {
    // Check of link al bestaat
    const existingLink = chatDocumentLinks.find(
      link => link.documentId === documentId && link.chatId === chatId
    );
    
    if (existingLink) {
      // Update bestaande link
      setChatDocumentLinks(prev =>
        prev.map(link =>
          link.id === existingLink.id
            ? { ...link, isContextActive }
            : link
        )
      );
    } else {
      // Maak nieuwe link
      const newLink: ChatDocumentLink = {
        id: Date.now() + Math.random(),
        chatId,
        documentId,
        linkedAt: new Date(),
        isContextActive
      };
      setChatDocumentLinks(prev => [...prev, newLink]);
    }
  };

  const unlinkDocumentFromChat = (documentId: number, chatId: number) => {
    setChatDocumentLinks(prev =>
      prev.filter(link => !(link.documentId === documentId && link.chatId === chatId))
    );
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Haal documenten op
        const docsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`);
        const docs = await docsResponse.json();
        setDocuments(docs);
        
        // Haal documentmappen op
        const foldersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/folders`);
        const folders = await foldersResponse.json();
        setDocumentFolders(folders);

        // Haal chat-document koppelingen op
        const linksResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat-document-links`);
        const links = await linksResponse.json();
        setChatDocumentLinks(links);

        // TODO: Haal ook chatmappen en chatsessies op indien nodig

      } catch (error) {
        console.error("Kon initiële data niet ophalen:", error);
      }
    };

    fetchInitialData();
  }, []);
  
  const getActiveContextDocuments = () => {
    const activeFolderIds = activeContextDocFolders.map(folder => folder.id);
    
    // Documenten uit geselecteerde algemene mappen
    const folderContextDocs = documents.filter(doc => {
      const docFolderId = doc.documentFolderId === undefined ? -1 : doc.documentFolderId;
      return activeFolderIds.includes(docFolderId);
    });

    // Documenten uit de actieve chat (via koppelingen)
    const chatContextDocs = selectedChatId
      ? getActiveContextDocumentsForChat(selectedChatId)
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

      // Als we in een nieuwe chat zijn (geen geselecteerde chat ID),
      // voeg het ID van het document toe aan onze tijdelijke lijst.
      if (selectedChatId === null) {
        setNewChatDocumentIds(prev => [...prev, savedDoc.id]);
      } else {
        // Als we in een bestaande chat zijn, koppel direct
        linkDocumentToChat(savedDoc.id, selectedChatId, true);
      }
    }, 500);
  };

  const handleRemoveDocument = (documentId: number) => {
    if (confirm("Weet je zeker dat je dit document wilt verwijderen?")) {
      setTimeout(() => {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        // Verwijder ook alle koppelingen van dit document
        setChatDocumentLinks(prev => 
          prev.filter(link => link.documentId !== documentId)
        );
        setNewChatDocumentIds(prev => prev.filter(id => id !== documentId));
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
    // Alleen opslaan als er nog geen selectedChatId is (dus tijdelijke chat)
    // EN er zijn berichten van gebruiker
    if (currentChat.some(msg => msg.type === 'user') && !selectedChatId) {
      const firstUserMessage = currentChat.find(msg => msg.type === 'user');
      if (firstUserMessage) {
        const newChatSession: ChatSession = {
          id: Date.now(),
          title: generateChatTitle(firstUserMessage.content),
          timestamp: formatTimestamp(new Date()),
          preview: generatePreview(currentChat),
          messages: [...currentChat],
          createdAt: new Date(),
          chatFolderId: currentActiveChatFolder || undefined,
        };

        setChatSessions(prev => [newChatSession, ...prev]);

        // Koppel documenten aan nieuwe chat via ChatDocumentLink
        if (newChatDocumentIds.length > 0) {
          newChatDocumentIds.forEach(docId => {
            linkDocumentToChat(docId, newChatSession.id, true);
          });
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
    const updatedChat = [...currentChat, newMessage];
    setCurrentChat(updatedChat);
    setIsLoading(true);

    // Create bot message with empty content that will be updated as stream comes in
    const botMessageId = Date.now() + 1;
    const botResponse: Message = {
      id: botMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date()
    };
    
    // Add empty bot message to chat immediately
    const chatWithEmptyBot = [...updatedChat, botResponse];
    setCurrentChat(chatWithEmptyBot);

    // AUTO-SAVE: nieuwe chat bij eerste bericht
    let currentChatId = selectedChatId;
    if (!selectedChatId && updatedChat.length === 1) {
      const newChatSession: ChatSession = {
        id: Date.now(),
        title: generateChatTitle(newMessage.content),
        timestamp: formatTimestamp(new Date()),
        preview: generatePreview(updatedChat),
        messages: [...updatedChat],
        createdAt: new Date(),
        chatFolderId: currentActiveChatFolder || undefined,
      };

      setChatSessions(prev => [newChatSession, ...prev]);
      setSelectedChatId(newChatSession.id);
      currentChatId = newChatSession.id;

      // Koppel documenten aan nieuwe chat via ChatDocumentLink
      if (newChatDocumentIds.length > 0) {
        newChatDocumentIds.forEach(docId => {
          linkDocumentToChat(docId, newChatSession.id, true);
        });
        setNewChatDocumentIds([]); // Reset na koppeling
      }
    }

    // Stap 2: Bepaal welke documenten relevant zijn voor de context
    const relevantDocuments = getActiveContextDocuments();
    console.log("Actieve context document ID's:", relevantDocuments.map(doc => doc.id));

    try {
      // Stap 3: Roep je back-end RAG API aan met streaming
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/send_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.content,
          contextDocumentIds: relevantDocuments.map(doc => doc.id)
        }),
      });

      if (!response.ok) {
        throw new Error('Netwerkrespons was niet ok');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          // Decode the chunk and add to accumulated content
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          // Update the bot message content in real-time
          setCurrentChat(prevChat => 
            prevChat.map(msg => 
              msg.id === botMessageId 
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );

          // Update the chat session in real-time if we have a selected chat
          if (currentChatId) {
            setChatSessions(prev =>
              prev.map(chat =>
                chat.id === currentChatId
                  ? {
                      ...chat,
                      messages: chat.messages.map(msg => 
                        msg.id === botMessageId 
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      ).length === chat.messages.length 
                        ? [...chat.messages, { ...botResponse, content: accumulatedContent }]
                        : chat.messages.map(msg => 
                            msg.id === botMessageId 
                              ? { ...msg, content: accumulatedContent }
                              : msg
                          ),
                      timestamp: formatTimestamp(new Date()),
                      preview: generatePreview([...updatedChat, { ...botResponse, content: accumulatedContent }]),
                    }
                  : chat
              )
            );
          }
        }
      }

      // Final update with complete message
      const finalBotResponse: Message = {
        ...botResponse,
        content: accumulatedContent
      };

      const finalChat = [...updatedChat, finalBotResponse];
      setCurrentChat(finalChat);

      // Final update to chat sessions
      if (currentChatId) {
        setChatSessions(prev =>
          prev.map(chat =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: finalChat,
                  timestamp: formatTimestamp(new Date()),
                  preview: generatePreview(finalChat),
                }
              : chat
          )
        );
      }

    } catch (error) {
      console.error("Fout bij het ophalen van RAG-antwoord:", error);
      const errorMessage: Message = {
        id: botMessageId,
        type: 'bot',
        content: "Excuses, ik kon geen antwoord genereren. Probeer het later opnieuw.",
        timestamp: new Date()
      };
      
      const finalChat = [...updatedChat, errorMessage];
      setCurrentChat(finalChat);

      // Update bestaande chat in chatSessions bij fout
      if (currentChatId) {
        setChatSessions(prev =>
          prev.map(chat =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: finalChat,
                  timestamp: formatTimestamp(new Date()),
                  preview: generatePreview(finalChat),
                }
              : chat
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentActiveFolder = () => {
    return chatFolders.find(f => f.id === currentActiveChatFolder);
  };

  const getSidebarChats = () => {
    return chatSessions.filter(chat => {
      if (currentActiveChatFolder === null) {
        return !chat.chatFolderId;
      }
      return chat.chatFolderId === currentActiveChatFolder;
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
      
      // Verwijder ook alle document koppelingen van deze chat
      setChatDocumentLinks(prev => prev.filter(link => link.chatId !== chatId));
      
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setCurrentChat([]);
      }
    }
  };

  // Helper functie voor ChatInterface om gekoppelde documenten te tonen
  const getUploadedDocumentsForCurrentChat = () => {
    if (selectedChatId === null) {
      // Nieuwe chat: toon tijdelijk geüploade documenten
      return documents.filter(doc => newChatDocumentIds.includes(doc.id));
    } else {
      // Bestaande chat: toon gekoppelde documenten
      return getDocumentsForChat(selectedChatId);
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
              uploadedDocuments={getUploadedDocumentsForCurrentChat()}
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
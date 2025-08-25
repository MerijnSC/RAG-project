'use client';

import { useState } from 'react';
import { ArrowLeft, FolderPlus, Folder, MessageSquare, Trash2, Move } from 'lucide-react';
import { ChatFolder, ChatHistoryViewerProps} from '../types/chat';

const ChatHistoryViewer = ({ 
  onBack, 
  chatSessions, 
  onChatSelect, 
  onUpdateChatSessions, 
  onUpdateChatFolders, 
  chatFolders,
  onDeleteChat
}: ChatHistoryViewerProps) => {
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedChats, setSelectedChats] = useState<number[]>([]);
  const [isMovingChats, setIsMovingChats] = useState(false);
  const [draggedChatId, setDraggedChatId] = useState<number | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);

  const folderColors = [
    'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700',
    'bg-orange-200 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-600',
    'bg-orange-300 dark:bg-orange-800/30 text-orange-900 dark:text-orange-50 border-orange-400 dark:border-orange-500',
    'bg-orange-400 dark:bg-orange-700/30 text-orange-950 dark:text-orange-50 border-orange-500 dark:border-orange-400',
    'bg-orange-500 dark:bg-orange-600/30 text-white dark:text-orange-50 border-orange-600 dark:border-orange-300',
    'bg-orange-50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-100 border-orange-100 dark:border-orange-800'
  ];
  
  const createFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: ChatFolder = {
        id: Date.now(),
        name: newFolderName.trim(),
        createdAt: new Date(),
        color: folderColors[chatFolders.length % folderColors.length]
      };
      onUpdateChatFolders([...chatFolders, newFolder]);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const deleteFolder = (folderId: number) => {
    if (confirm(`Map "${chatFolders.find(f => f.id === folderId)?.name}" verwijderen? Chats worden teruggezet naar "Algemene Chats".`)) {
      const updatedSessions = chatSessions.map(chat => 
        chat.chatFolderId === folderId ? { ...chat, chatFolderId: undefined } : chat
      );
      onUpdateChatSessions(updatedSessions);
      
      onUpdateChatFolders(chatFolders.filter(f => f.id !== folderId));
      
      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
    }
  };

  const moveChatsToFolder = (folderId: number | null) => {
    const updatedSessions = chatSessions.map(chat => 
      selectedChats.includes(chat.id) 
        ? { ...chat, chatFolderId: folderId || undefined }
        : chat
    );
    onUpdateChatSessions(updatedSessions);
    setSelectedChats([]);
    setIsMovingChats(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, chatId: number) => {
    setDraggedChatId(chatId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedChatId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: number | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverFolderId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: number | null) => {
    e.preventDefault();
    
    if (draggedChatId !== null) {
      const updatedSessions = chatSessions.map(chat => 
        chat.id === draggedChatId 
          ? { ...chat, chatFolderId: targetFolderId || undefined }
          : chat
      );
      onUpdateChatSessions(updatedSessions);
    }
    
    setDraggedChatId(null);
    setDragOverFolderId(null);
  };

  const getFilteredChats = () => {
    if (selectedFolder === null) {
      return chatSessions.filter(chat => !chat.chatFolderId);
    }
    return chatSessions.filter(chat => chat.chatFolderId === selectedFolder);
  };

  const toggleChatSelection = (chatId: number) => {
    setSelectedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const selectedFolderData = chatFolders.find(f => f.id === selectedFolder);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Chat Geschiedenis
              </h1>
              {selectedFolderData && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Map: {selectedFolderData.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedChats.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedChats.length} geselecteerd
                </span>
                <button
                  onClick={() => setIsMovingChats(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  <Move className="w-4 h-4" />
                  <span>Verplaats</span>
                </button>
                <button
                  onClick={() => setSelectedChats([])}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Annuleer
                </button>
              </div>
            )}
            
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Nieuwe Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folders Sidebar */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto hide-scrollbar bg-white dark:bg-gray-900">
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">
              Mappen
            </h2>
            
            {/* Root folder */}
            <div
              onClick={() => setSelectedFolder(null)}
              onDragOver={(e) => handleDragOver(e, null)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors mb-2 border ${
                selectedFolder === null
                  ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                  : dragOverFolderId === null && draggedChatId !== null
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600 border-dashed'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'
              }`}
            >
              <Folder className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">Algemene chats</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {chatSessions.filter(chat => !chat.chatFolderId).length} chats
                </p>
              </div>
            </div>

            {/* Custom folders */}
            {chatFolders.map(folder => (
              <div
                key={folder.id}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors mb-2 border ${
                  selectedFolder === folder.id
                    ? folder.color
                    : dragOverFolderId === folder.id && draggedChatId !== null
                    ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600 border-dashed'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'
                }`}
                onClick={() => setSelectedFolder(folder.id)}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                <Folder className="w-5 h-5" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate">{folder.name}</span>
                  <p className="text-xs opacity-75">
                    {chatSessions.filter(chat => chat.chatFolderId === folder.id).length} chats
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Map "${folder.name}" verwijderen? Chats worden teruggezet naar "Algemene chats".`)) {
                      deleteFolder(folder.id);
                    }
                  }}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                </button>
              </div>
            ))}

            {/* Create folder form */}
            {isCreatingFolder && (
              <div className="p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg shadow">
                <input
                  type="text"
                  placeholder="Map naam..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createFolder();
                    if (e.key === 'Escape') {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-2"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={createFolder}
                    className="flex-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    Maak aan
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Annuleer
                  </button>
                </div>
              </div>
            )}
            
            {/* Drag instruction */}
            {draggedChatId !== null && (
              <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Sleep naar een map om de chat te verplaatsen
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar bg-white dark:bg-gray-900">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="md:text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedFolderData ? selectedFolderData.name : 'Algemene Chats'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getFilteredChats().length} chats
              </p>
            </div>
            
            {getFilteredChats().length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  {selectedFolderData ? 'Geen chats in deze map' : 'Geen chats gevonden'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Start een nieuwe chat om te beginnen
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {getFilteredChats().map(chat => (
                  <div
                    key={chat.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, chat.id)}
                    onDragEnd={handleDragEnd}
                    className={`p-4 border rounded-lg transition-all cursor-move select-none ${
                      draggedChatId === chat.id
                        ? 'opacity-50 transform scale-95'
                        : selectedChats.includes(chat.id)
                        ? 'border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Checkbox for selection */}
                      <input
                        type="checkbox"
                        checked={selectedChats.includes(chat.id)}
                        onChange={() => toggleChatSelection(chat.id)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      {/* Chat content */}
                      <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                              <h3 
                                  className="font-medium text-gray-900 dark:text-gray-100 truncate pr-2 cursor-pointer hover:underline"
                                  onClick={() => onChatSelect(chat.id)}
                              >
                                  {chat.title}
                              </h3>
                              {/* Tijdstempel en prullenbakknop in een flex-container */}
                              <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                      {chat.timestamp}
                                  </span>
                                  <button
                                      onClick={(e) => {
                                          e.stopPropagation(); // Voorkom dat de selectie of chatselectie wordt getriggerd
                                          onDeleteChat(chat.id);
                                      }}
                                      className="p-1 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                              {chat.preview}
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                              <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {chat.messages.length} berichten
                              </span>
                          </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Move chats modal */}
      {isMovingChats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-y-auto hide-scrollbar shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Verplaats naar map</h3>
            
            <div className="space-y-2 mb-4">
              <div
                onClick={() => moveChatsToFolder(null)}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Folder className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100">Algemene Chats</span>
                </div>
              </div>
              
              {chatFolders.map(folder => (
                <div
                  key={folder.id}
                  onClick={() => moveChatsToFolder(folder.id)}
                  className={`p-3 border rounded-lg cursor-pointer hover:opacity-80 ${folder.color}`}
                >
                  <div className="flex items-center space-x-2">
                    <Folder className="w-5 h-5" />
                    <span>{folder.name}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setIsMovingChats(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistoryViewer;
'use client';

import { 
  MessageSquarePlus, History, File, FileText, Clock, 
  User, Settings, LogOut, Folder, FolderOpen, Snail 
} from 'lucide-react';
import { SidebarProps } from '../types/chat';
import { useRouter } from 'next/navigation'; 

const Sidebar: React.FC<SidebarProps> = ({ 
  onNewChat, 
  onChatSelect, 
  selectedChatId, 
  recentChats, 
  onDocumentsView, 
  onHistoryView,
  viewMode,
  currentActiveFolder,
  chatFolders,
  onChatFolderSelect,
  activeContextDocFolders,
  onManageContext,      
}) => {
  const router = useRouter(); 

  const handleLogout = () => {
    router.push('/'); 
  };

  const menuItems = [
    { 
      icon: MessageSquarePlus, 
      label: "Nieuw gesprek", 
      action: onNewChat, 
      active: viewMode === 'chat' && !selectedChatId,
      id: 'new-chat'
    },
    { 
      icon: History, 
      label: "Sorteer gesprekken", 
      action: onHistoryView,
      active: viewMode === 'history',
      id: 'chat-history'
    },
    { 
      icon: FileText, 
      label: "Achtergrond informatie", 
      action: onDocumentsView,
      active: viewMode === 'documents',
      id: 'documents'
    }
  ];

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Snail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h1>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                item.active 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-700' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actieve contextmappen */}
      {viewMode === 'chat' && (
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <File className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actieve context</h2>
            </div>
            <button 
              onClick={onManageContext} 
              className="text-xs text-blue-600 hover:underline"
            >
              Beheer
            </button>
          </div>
          
          {activeContextDocFolders?.length > 0 ? (
            <div className="space-y-1">
              {activeContextDocFolders.map((folder) => (
                <div 
                  key={folder.id} 
                  className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <h3 className="text-sm">{folder.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2">
              Geen actieve mappen. Selecteer documenten om de chatbot context te geven.
            </p>
          )}
        </div>
      )}

      {/* Folders */}
      {viewMode === 'chat' && (
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Mappen</h2>
            </div>
            <button 
              onClick={onHistoryView} 
              className="text-xs text-blue-600 hover:underline"
            >
              Beheer
            </button>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onChatFolderSelect(null)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${
                !currentActiveFolder
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Folder className="w-5 h-5" />
                <h2 className="text-sm">Algemene chats</h2>
              </div>
            </button>

            {chatFolders.length > 0 ? (
              chatFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => onChatFolderSelect(folder.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${
                    currentActiveFolder?.id === folder.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Folder className="w-5 h-5" />
                    <h2 className="text-sm">{folder.name}</h2>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2">Geen andere mappen beschikbaar</p>
            )}
          </div>
        </div>
      )}

      {/* Recent Chats */}
      {viewMode === 'chat' && (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center space-x-2 mb-4 mt-4">
            <Clock className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              {currentActiveFolder ? `${currentActiveFolder.name} Chats` : 'Algemene chats'}
            </h2>
          </div>
          
          {recentChats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentActiveFolder ? 'Geen chats in deze map' : 'Geen algemene chats'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start een nieuwe chat om te beginnen</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                    selectedChatId === chat.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate pr-2">
                      {chat.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {chat.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                    {chat.preview}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents info */}
      {viewMode === 'documents' && (
        <div className="flex-1 p-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300">Context Documenten</h3>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              Upload en beheer documenten die kunnen worden gebruikt als context in je AI chats.
            </p>
          </div>
        </div>
      )}

      {/* History info */}
      {viewMode === 'history' && (
        <div className="flex-1 p-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <History className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300">Chat Geschiedenis</h3>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              Bekijk al je chats, organiseer ze in mappen en beheer je chat geschiedenis.
            </p>
          </div>
        </div>
      )}

      {/* User Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Demo Gebruiker</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">demo@example.com</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            <span>Instellingen</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Uitloggen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

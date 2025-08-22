'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Menu, FilePlus, FileText, X, Forward, CheckCircle, Upload, Snail } from 'lucide-react';
import { Message, ChatInterfaceProps, Document } from '../types/chat';

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onToggleSidebar,
  isSidebarOpen,
  onUploadDocument,
  activeChatId,
  onRemoveDocument,
  isLoading,
  uploadedDocuments
}) => {
  const [input, setInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['.pdf', '.docx', '.txt', '.md', '.csv'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, uploadedDocuments]); 
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    onSendMessage(userMessage);
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    const maxHeight = 120;
    e.target.style.height = Math.min(e.target.scrollHeight, maxHeight) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `Alleen ${allowedTypes.join(', ')} bestanden zijn toegestaan`;
    }
    
    if (file.size > maxFileSize) {
      return `Bestand is te groot. Maximum grootte is ${maxFileSize / (1024 * 1024)}MB`;
    }
    
    return null;
  };

  const handleFileUpload = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setUploadStatus('uploading');
    
    const newDocument: Document = {
      id: Date.now(),
      name: file.name,
      type: file.type || file.name.split('.').pop() || 'BESTAND',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date(),
      documentFolderId: activeChatId ? activeChatId : undefined, 
    };

    setTimeout(() => {
      onUploadDocument(newDocument); 
      
      setUploadStatus('success');
      
      setTimeout(() => setUploadStatus('idle'), 2000);
    }, 1000);
  };

  const handleDocumentButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    handleFileUpload(file);
    e.target.value = ''; // reset file input
  };

  const removeDocument = (documentId: number) => {
    onRemoveDocument(documentId);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <button onClick={onToggleSidebar} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Snail className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h1>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
              <div className={`rounded-2xl px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white text-lg rounded-br-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700'
              }`}>
                <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Snail className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md border border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">AI denkt na...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload Status/Files Section */}
      {(uploadedDocuments.length > 0 || uploadStatus !== 'idle') && (
        <div className="px-6">
          <div className="max-w-3xl mx-auto py-3">
            {uploadStatus === 'uploading' && (
              <div className="flex items-center space-x-2 text-blue-600 mb-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Bestand uploaden...</span>
              </div>
            )}

            {uploadedDocuments.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {uploadedDocuments.map(document => (
                    <div key={document.id} className="bg-gray-100 dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 flex items-center space-x-2 group shadow-sm hover:shadow-md transition-shadow">
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[150px]" title={document.name}>
                          {document.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{document.size}</span>
                      </div>
                      <button
                        onClick={() => removeDocument(document.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all ml-1 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        title="Document verwijderen"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="px-6 mb-6 flex justify-center">
        <div className="flex items-start space-x-3 w-full max-w-3xl">
          <div 
            className="flex-1 relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isDragOver ? "Sleep je bestand hier..." : "Typ je vraag hier..."}
              disabled={isLoading}
              rows={1}
              className={`w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto min-h-[48px] max-h-[120px] hide-scrollbar leading-normal transition-all ${
                isDragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            />
            
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 bg-opacity-80 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center space-y-2 text-blue-600 dark:text-blue-400">
                  <Upload className="w-6 h-6" />
                  <span className="text-sm font-medium">Sleep bestand hier</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-3 md:flex-row md:space-x-3 md:space-y-0">
            <button
              onClick={handleDocumentButtonClick}
              disabled={isLoading || uploadStatus === 'uploading'}
              className="bg-white dark:bg-gray-800 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full p-3 transition-colors duration-200 flex items-center justify-center flex-shrink-0 h-12 w-12 self-start disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Document uploaden (${allowedTypes.join(', ')} - max ${maxFileSize / (1024 * 1024)}MB)`}
            >
              {uploadStatus === 'uploading' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept={allowedTypes.join(',')}
              onChange={handleFileChange}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 transition-colors duration-200 flex items-center justify-center flex-shrink-0 h-12 w-12 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Bericht versturen"
            >
              <Forward className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

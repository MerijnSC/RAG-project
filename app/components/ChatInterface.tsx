"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Menu, Plus } from 'lucide-react';
import { Message, ChatInterfaceProps} from '../types/chat';

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, onToggleSidebar, isSidebarOpen }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = async (e: React.FormEvent) => {
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
    setIsLoading(true);

    // Simulate API call - replace with actual backend call
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Bedankt voor je vraag: "${userMessage.content}". Ik begrijp je probleem en ga je helpen met een oplossing. Dit is een mock response - hier komt straks de echte AI response.`,
        timestamp: new Date()
      };
      onSendMessage(botResponse);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleDocumentUpload = () => {
    // Placeholder functie voor document upload
    console.log('Document upload functionaliteit - wordt later geïmplementeerd');
    // Hier komt later de document upload logic
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto'; // reset height
    const maxHeight = 120;
    if (e.target.scrollHeight > maxHeight) {
      e.target.style.height = maxHeight + 'px';
    } else {
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">AI Assistant</h1>
        </div>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' ? 'bg-blue-600 ml-2' : 'bg-gray-300 mr-2'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-gray-700" />
                )}
              </div>
              <div className={`rounded-2xl px-4 py-2 ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white text-lg rounded-br-md' 
                  : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
              }`}>
                <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-gray-700" />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-md border border-gray-200 px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">AI denkt na...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-6 flex justify-center">
        <div className="flex items-start space-x-3 w-full max-w-3xl"> 
          {/* Textarea Container */}
          <div className="flex-1 relative">
            <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); 
                handleSend(e); 
              }
            }}
            placeholder="Typ je vraag hier..."
            disabled={isLoading}
            rows={1}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto min-h-[48px] max-h-[120px] hide-scrollbar leading-normal"
          />

          </div>

          {/* Buttons container */}
          <div className="flex flex-col space-y-3 md:flex-row md:space-x-3 md:space-y-0">
            
            {/* Document Upload Button */}
            <button
              onClick={handleDocumentUpload}
              disabled={isLoading}
              className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full p-3 transition-colors duration-200 flex items-center justify-center flex-shrink-0 h-12 w-12 self-start" 
              title="Document toevoegen"
            >
              <Plus className="w-6 h-6" />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 transition-colors duration-200 flex items-center justify-center flex-shrink-0 h-12 w-12"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
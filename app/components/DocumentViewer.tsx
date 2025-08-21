'use client';

import { useState } from 'react';
import { ArrowLeft, FileText, Upload, Trash2, Eye, Download, Folder, FolderPlus, Move, CheckCircle } from 'lucide-react';
import { Document, DocumentViewerProps, DocumentFolder } from '../types/chat';
import DocumentPreview from './DocumentPreview';

const DocumentViewer = ({ 
  onBack, 
  documents, 
  onUpdateDocuments, 
  docFolders, 
  onUpdateDocFolders,
  activeContextFolders,
  onUpdateActiveContext
}: DocumentViewerProps) => {

  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [isMovingDocuments, setIsMovingDocuments] = useState(false);
  const [draggedDocumentId, setDraggedDocumentId] = useState<number | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const folderColors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-sky-100 text-sky-800 border-sky-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-blue-200 text-blue-900 border-blue-300',
    'bg-sky-200 text-sky-900 border-sky-300'
  ];

  const formatDate = (date: Date) => {
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

  const createFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: DocumentFolder = {
        id: Date.now(),
        name: newFolderName.trim(),
        createdAt: new Date(),
        color: folderColors[docFolders.length % folderColors.length]
      };
      onUpdateDocFolders([...docFolders, newFolder]);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const deleteFolder = (folderId: number) => {
    // 1. Verwijder de map uit de lijst van alle mappen
    onUpdateDocFolders(docFolders.filter(f => f.id !== folderId));
    
    // 2. Verwijder de map ook uit de lijst van actieve contextmappen
    onUpdateActiveContext(activeContextFolders.filter(f => f.id !== folderId));

    // 3. Verplaats de documenten terug naar de algemene map
    const updatedDocuments = documents.map(doc => 
      doc.documentFolderId === folderId ? { ...doc, documentFolderId: undefined } : doc
    );
    onUpdateDocuments(updatedDocuments);
    
    // 4. Reset de geselecteerde map als dat de verwijderde map was
    if (selectedFolder === folderId) {
      setSelectedFolder(null);
    }
  };

  const moveDocumentsToFolder = (folderId: number | null) => {
    const updatedDocuments = documents.map(doc => 
      selectedDocuments.includes(doc.id) 
        ? { ...doc, documentFolderId: folderId || undefined }
        : doc
    );
    onUpdateDocuments(updatedDocuments);
    setSelectedDocuments([]);
    setIsMovingDocuments(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    
    setTimeout(() => {
      const newDocs: Document[] = Array.from(files).map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'BESTAND',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: new Date(),
        documentFolderId: selectedFolder || undefined,
      }));
      
      onUpdateDocuments([...documents, ...newDocs]);
      setIsUploading(false);
    }, 1000);
  };

  const handleDeleteDocument = (id: number) => {
    onUpdateDocuments(documents.filter(doc => doc.id !== id));
    setSelectedDocuments(prev => prev.filter(docId => docId !== id));
    if (selectedDocument?.id === id) {
      setSelectedDocument(null);
    }
  };
  
  const handleDragStart = (e: React.DragEvent, documentId: number) => {
    setDraggedDocumentId(documentId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedDocumentId(null);
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
    
    if (draggedDocumentId !== null) {
      const updatedDocuments = documents.map(doc => 
        doc.id === draggedDocumentId 
          ? { ...doc, documentFolderId: targetFolderId || undefined }
          : doc
      );
      onUpdateDocuments(updatedDocuments);
    }
    
    setDraggedDocumentId(null);
    setDragOverFolderId(null);
  };
  
  const toggleDocumentSelection = (documentId: number) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };
  
  const toggleActiveContext = (folder: DocumentFolder | null) => {
    if (folder === null) {
      // Algemene documenten zijn altijd actief en kunnen niet worden uitgeschakeld.
      return;
    }
    
    const isActive = activeContextFolders.some(f => f.id === folder.id);
    
    if (isActive) {
      // Deactiveer de map
      onUpdateActiveContext(activeContextFolders.filter(f => f.id !== folder.id));
    } else {
      // Activeer de map
      onUpdateActiveContext([...activeContextFolders, folder]);
    }
  };

  const getFilteredDocuments = () => {
    if (selectedFolder === null) {
      return documents.filter(doc => !doc.documentFolderId);
    } else {
      return documents.filter(doc => doc.documentFolderId === selectedFolder);
    }
  };
  
  const selectedFolderData = docFolders.find(f => f.id === selectedFolder);
  const filteredDocuments = getFilteredDocuments();

  // Controleer of de Algemene Documenten map actief is
  const isGeneralActive = activeContextFolders.some(f => f.id === -1); // -1 is de ID voor de algemene map
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Achtergrond informatie
              </h1>
              {selectedFolderData && (
                <p className="text-sm text-gray-500">
                  Map: {selectedFolderData.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedDocuments.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {selectedDocuments.length} geselecteerd
                </span>
                <button
                  onClick={() => setIsMovingDocuments(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Move className="w-4 h-4" />
                  <span>Verplaats</span>
                </button>
                <button
                  onClick={() => setSelectedDocuments([])}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuleer
                </button>
              </div>
            )}
            
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Nieuwe Map</span>
            </button>
            
            <div className="relative">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`
                  flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                  hover:bg-blue-700 transition-colors cursor-pointer
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Uploaden...' : 'Upload Bestanden'}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folders Sidebar */}
        <div className="w-80 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
              Mappen
            </h2>
            
            {/* Algemene documenten */}
            <div
              onClick={() => {
                setSelectedFolder(null);
                setSelectedDocuments([]);
              }}
              onDragOver={(e) => handleDragOver(e, null)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
              className={`flex items-center justify-between space-x-3 p-3 rounded-lg cursor-pointer transition-colors mb-2 border ${
                selectedFolder === null
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : dragOverFolderId === null && draggedDocumentId !== null
                  ? 'bg-green-50 border-green-300 border-dashed'
                  : 'hover:bg-gray-50 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5" />
                <div className="flex-1">
                  <span className="font-medium">Algemene documenten</span>
                  <p className="text-xs text-gray-500">
                    {documents.filter(doc => !doc.documentFolderId).length} documenten
                  </p>
                </div>
              </div>
              <div className="p-1 text-green-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <hr className="my-4" />
            
            {/* Custom folders */}
            {docFolders.map(folder => {
              const isActive = activeContextFolders.some(f => f.id === folder.id);
              return (
                <div
                  key={folder.id}
                  className={`flex items-center justify-between space-x-3 p-3 rounded-lg cursor-pointer transition-colors mb-2 border ${
                    selectedFolder === folder.id
                      ? folder.color
                      : dragOverFolderId === folder.id && draggedDocumentId !== null
                      ? 'bg-green-50 border-green-300 border-dashed'
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder.id)}
                >
                  <div 
                    onClick={() => {
                      setSelectedFolder(folder.id);
                      setSelectedDocuments([]);
                    }}
                    className="flex-1 flex items-center space-x-3 min-w-0"
                  >
                    <Folder className="w-5 h-5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate">{folder.name}</span>
                      <p className="text-xs opacity-75">
                        {documents.filter(doc => doc.documentFolderId === folder.id).length} documenten
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActiveContext(folder);
                      }}
                      className={`p-1 rounded-full transition-colors ${isActive ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-200'}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Map "${folder.name}" verwijderen? Documenten worden teruggezet naar "Alle Documenten".`)) {
                          deleteFolder(folder.id);
                        }
                      }}
                      className="p-1 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Create folder form */}
            {isCreatingFolder && (
              <div className="p-3 border border-gray-300 rounded-lg shadow">
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
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={createFolder}
                    className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Maak aan
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Annuleer
                  </button>
                </div>
              </div>
            )}
            
            {/* Drag instruction */}
            {draggedDocumentId !== null && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-700">
                  Sleep naar een map om het document te verplaatsen
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedFolderData ? selectedFolderData.name : 'Algemene documenten'}
              </h2>
            </div>
            
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">
                  {selectedFolderData ? 'Geen documenten in deze map' : 'Geen documenten geüpload'}
                </p>
                <p className="text-sm text-gray-400">
                  Upload bestanden of verplaats ze naar deze map
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocuments.map(doc => (
                  <div
                    key={doc.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, doc.id)}
                    onDragEnd={handleDragEnd}
                    className={`
                      p-3 border rounded-lg cursor-move transition-all
                      ${selectedDocuments.includes(doc.id)
                        ? 'border-blue-500 bg-blue-50'
                        : draggedDocumentId === doc.id
                        ? 'opacity-50 transform scale-95'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleDocumentSelection(doc.id)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div
                        className="flex items-start space-x-3 flex-1 min-w-0"
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {doc.name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">{doc.type}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{doc.size}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Document "${doc.name}" verwijderen?`)) {
                            handleDeleteDocument(doc.id);
                          }
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Document Preview */}
        <div className="hidden lg:block w-1/2">
          <DocumentPreview document={selectedDocument} />
        </div>
      </div>

      {/* Move documents modal */}
      {isMovingDocuments && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-indigo-100 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Verplaats naar map</h3>
            
            <div className="space-y-2 mb-4">
              <div
                onClick={() => moveDocumentsToFolder(null)}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Algemene documenten</span>
                </div>
              </div>
              
              {docFolders.map(folder => (
                <div
                  key={folder.id}
                  onClick={() => moveDocumentsToFolder(folder.id)}
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
                onClick={() => setIsMovingDocuments(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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

export default DocumentViewer;
// app/components/DocumentPreview.tsx
'use client';

import { useState, useEffect } from 'react';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import mammoth from 'mammoth';
import { Document,  DocumentPreviewProps} from '../types/chat';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2, FileWarning, FileText } from 'lucide-react';

// Nodig voor react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;


// Simuleer het ophalen van de bestandsinhoud (in een echte app zou dit een API-call zijn)
const fetchDocumentContent = async (doc: Document): Promise<string | ArrayBuffer> => {
  console.log(`Fetching content for ${doc.name}...`);
  // Simuleer een netwerkvertraging
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (doc.type === 'PDF') {
    const response = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    return response.arrayBuffer();
  }
  if (doc.type === 'DOCX') {
    // In een echte app zou je het bestand ophalen: const response = await fetch(doc.url); return response.arrayBuffer();
    return '<p>Dit is de gesimuleerde HTML-inhoud van een .docx bestand.</p>';
  }
  return `Dit is de tekstinhoud voor het document: ${doc.name}. Type: ${doc.type}.`;
};


const DocumentPreview = ({ document }: DocumentPreviewProps) => {
  const [content, setContent] = useState<string | ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);

  useEffect(() => {
    if (!document) {
      setContent(null);
      setError(null);
      return;
    }

    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      setContent(null);
      
      try {
        const docContent = await fetchDocumentContent(document);
        
        if (document.type === 'DOCX' && typeof docContent === 'object') {
          const result = await mammoth.convertToHtml({ arrayBuffer: docContent as ArrayBuffer });
          setContent(result.value);
        } else {
          setContent(docContent);
        }

      } catch (e) {
        console.error("Error loading document:", e);
        setError("Kon het document niet laden.");
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [document]);
  
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p>Document laden...</p>
        </div>
      );
    }
    
    if (error) {
       return (
        <div className="flex flex-col items-center justify-center h-full text-red-500 dark:text-red-400">
          <FileWarning className="w-12 h-12 mb-4" />
          <p className="font-semibold">Fout</p>
          <p>{error}</p>
        </div>
      );
    }

    if (!document || !content) return null;

    switch (document.type) {
      case 'PDF':
        return (
          <div className="overflow-y-auto h-full p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <PdfDocument file={content} onLoadSuccess={onDocumentLoadSuccess}>
                {Array.from(new Array(numPages || 0), (el, index) => (
                  <div key={`page_${index + 1}`} className="mb-4 border border-gray-200 dark:border-gray-700 rounded">
                    <Page pageNumber={index + 1} />
                  </div>
                ))}
              </PdfDocument>
            </div>
          </div>
        );
      
      case 'DOCX':
        return (
          <div className="p-4">
            <div 
              className="prose dark:prose-invert prose-gray max-w-none bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700" 
              dangerouslySetInnerHTML={{ __html: content as string }} 
            />
          </div>
        );

      case 'TXT':
        return (
          <div className="p-4">
            <pre className="whitespace-pre-wrap p-6 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 font-mono">
              {content as string}
            </pre>
          </div>
        );
        
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <FileWarning className="w-12 h-12 mb-4" />
            <p>Preview niet beschikbaar voor bestandstype '{document.type}'</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {document ? (
        <>
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{document.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {document.type} • {document.size}
            </p>
          </div>
          <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            {renderContent()}
          </div>
        </>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Selecteer een document</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Klik op een document om een preview te zien</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;
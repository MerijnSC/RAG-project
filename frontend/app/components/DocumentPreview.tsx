// app/components/DocumentPreview.tsx
'use client';

import { DocumentPreviewProps } from '../types/chat';
import { FileText } from 'lucide-react';

/**
 * Temporary placeholder component for DocumentPreview.
 * Avoids errors for now and can be extended later.
 */
const DocumentPreview = ({ document }: DocumentPreviewProps) => {
  if (!document) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Selecteer een document
          </p>
          <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
            Klik op een document om een preview te zien
          </p>
        </div>
      </div>
    );
  }

  // Placeholder content for a selected document
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
      <p className="text-lg">Document preview for "{document.name}" coming soon...</p>
    </div>
  );
};

export default DocumentPreview;

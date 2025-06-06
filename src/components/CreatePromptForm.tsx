'use client';

import React, { useState, useRef } from 'react';
// Removed Supabase and getCurrentUser imports
// import { useSession } from 'next-auth/react'; // Not strictly needed if API handles user context
import { DocumentIcon } from '@heroicons/react/24/outline';

interface CreatePromptFormProps {
  onCancel: () => void;
  onSubmitSuccess: () => void; // Renamed for clarity, and to avoid confusion with form onSubmit
  subgroupId?: string; // Make optional or clarify its use if not directly saved on Prompt model
}

export default function CreatePromptForm({ onCancel, onSubmitSuccess, subgroupId }: CreatePromptFormProps) {
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const { data: session } = useSession(); // Get session if needed for UI, API will enforce auth

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Basic client-side validation (optional, as API should also validate)
    if (!title.trim() || !promptText.trim()) {
        setError('Title and Prompt text are required.');
        setIsSubmitting(false);
        return;
    }

    try {
      // Create FormData to handle file uploads
      const formData = new FormData();
      formData.append('title', title);
      formData.append('prompt_text', promptText);
      formData.append('notes', notes);
      if (subgroupId) {
        formData.append('subgroup_id', subgroupId);
      }
      
      // Append any uploaded files
      uploadedFiles.forEach(file => {
        formData.append('documents', file);
      });

      console.log('Submitting form with files:', uploadedFiles.length > 0 ? uploadedFiles.map(f => f.name) : 'No files');

      const response = await fetch('/api/prompts', {
        method: 'POST',
        body: formData, // FormData automatically sets the correct content-type
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create prompt');
      }

      onSubmitSuccess(); // Call the success callback
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the prompt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn bg-white p-6 rounded-lg shadow-md">
      {error && (
        <div className="rounded-md bg-red-50 p-4 animate-fadeIn">
          <div className="flex">
            <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Error creating prompt</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="promptText" className="block text-sm font-medium text-gray-700 mb-1">
          Prompt Text
        </label>
        <textarea
          id="promptText"
          rows={6}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
          placeholder="Enter your prompt text here..."
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Add any additional notes or instructions..."
        />
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={handleUploadClick}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors py-2 px-4 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200"
          style={{ minWidth: 'fit-content' }}
        >
          <DocumentIcon className="h-5 w-5" />
          <span>Upload Documents</span>
        </button>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary py-2 px-4 text-sm rounded-md"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary py-2 px-4 text-sm rounded-md"
          >
            {isSubmitting ? 'Creating...' : 'Create Prompt'}
          </button>
        </div>
      </div>
      {uploadedFiles.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents:</p>
          <ul className="space-y-1">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 rounded-md p-2 text-sm">
                <span className="truncate max-w-xs">{file.name}</span>
                <button 
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800 ml-2"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
} 
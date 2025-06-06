'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShareIcon, DocumentIcon } from '@heroicons/react/24/outline';
import type { SessionUser } from '@/lib/auth';

interface Prompt {
  id: string;
  title: string;
  prompt_text: string;
  notes: string | null;
  created_at: string;
  favorites_count: number;
  createdById: string;
}

interface PromptDetailsProps {
  prompt: Prompt;
  onUsePrompt: (id: string) => void;
  subgroupId?: string;
}

export default function PromptDetails({ prompt, onUsePrompt, subgroupId }: PromptDetailsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [isCreator, setIsCreator] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const [title, setTitle] = useState(prompt.title);
  const [promptText, setPromptText] = useState(prompt.prompt_text);
  const [notes, setNotes] = useState(prompt.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && prompt) {
      setIsCreator(user.id === prompt.createdById);
    } else {
      setIsCreator(false);
    }
  }, [user, prompt]);

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setPromptText(prompt.prompt_text);
      setNotes(prompt.notes || '');
    }
    if (!isEditing) {
      setError(null);
    }
  }, [prompt, isEditing]);

  const handleDelete = async () => {
    if (!user) {
      setError('You must be logged in to delete a prompt.');
      return;
    }
    if (user.id !== prompt.createdById) {
      setError('You are not authorized to delete this prompt.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete prompt');
      }
      router.push('/prompts');
    } catch (err: any) {
      setError(err.message || 'Failed to delete prompt');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setError('You must be logged in to save changes.');
      return;
    }
    if (user.id !== prompt.createdById) {
      setError('You are not authorized to edit this prompt.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('prompt_text', promptText);
      formData.append('notes', notes);
      
      uploadedFiles.forEach(file => {
        formData.append('documents', file);
      });
      
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PUT',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update prompt');
      }
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    let shareUrl = `${window.location.origin}/prompts/run?id=${prompt.id}`;
    if (subgroupId) {
      shareUrl += `&subgroupId=${subgroupId}`;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
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

  if (!prompt) return <div className="text-center p-4">Prompt data not available.</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      {error && (
        <div className="rounded-md bg-red-50 p-4 animate-fadeIn">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Error</p>
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

      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        {isEditing ? (
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
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
              <label htmlFor="promptText" className="block text-sm font-medium text-gray-700">
                Prompt
              </label>
              <textarea
                id="promptText"
                rows={8}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <input 
                type="file"
                id="document-upload-edit"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <button
                type="button"
                onClick={handleUploadClick}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors py-2 px-4 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200"
              >
                <DocumentIcon className="h-5 w-5" />
                <span>Upload Documents</span>
              </button>

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
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 break-words">{prompt.title}</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Created on {new Date(prompt.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="relative ml-4 flex-shrink-0">
                <button
                  onClick={handleShare}
                  className="text-gray-500 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Copy shareable link"
                >
                  <ShareIcon className="h-5 w-5" />
                </button>
                {showCopied && (
                  <div className="absolute right-0 top-full mt-2 z-10 bg-gray-800 text-white text-xs py-1 px-3 rounded-md shadow-lg animate-fadeIn">
                    Link copied!
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Prompt:</h3>
              <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {prompt.prompt_text ? prompt.prompt_text : "[Prompt text is missing or empty]"}
                </pre>
              </div>
            </div>

            {prompt.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Notes:</h3>
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700 prose prose-sm max-w-none">
                  <p>{prompt.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="flex space-x-3">
            {isCreator && (
              <>
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="btn-secondary py-2 px-4 text-sm rounded-md">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary py-2 px-4 text-sm rounded-md">
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(true)} className="btn-secondary py-2 px-4 text-sm rounded-md">
                      Edit Prompt
                    </button>
                    <button onClick={handleDelete} disabled={isDeleting} className="btn-danger py-2 px-4 text-sm rounded-md">
                      {isDeleting ? 'Deleting...' : 'Delete Prompt'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          {!isEditing && (
            <button onClick={() => onUsePrompt(prompt.id)} className="btn-success py-2 px-4 text-sm rounded-md w-full sm:w-auto">
              Use This Prompt
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 
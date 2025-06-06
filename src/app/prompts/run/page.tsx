'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { extractVariables, replaceVariables } from '@/lib/promptUtils';
import Link from 'next/link';
import { ArrowLeftIcon, HomeIcon, ClockIcon, DocumentIcon } from '@heroicons/react/24/outline';
// import { StarIcon } from '@heroicons/react/24/outline'; // For Likes - commented out
// import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'; // For Likes - commented out
import type { SessionUser } from '@/lib/auth';

interface Prompt {
  id: string;
  title: string;
  prompt_text: string;
  notes?: string | null;
  favorites_count: number;
  createdById: string;
}

function RunPromptPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const promptId = searchParams.get('id');
  const subgroupId = searchParams.get('subgroupId');
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string>('');
  const [isLoadingLLM, setIsLoadingLLM] = useState(false);
  const [isFetchingPrompt, setIsFetchingPrompt] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  // File upload related state
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // const [isLiked, setIsLiked] = useState(false); // Likes functionality commented out

  useEffect(() => {
    if (promptId) {
      fetchPromptDetails();
      // checkIfLiked(); // Likes functionality commented out
    } else {
      setError('No prompt ID provided in the URL.');
      setIsFetchingPrompt(false);
    }
  }, [promptId]);

  const fetchPromptDetails = async () => {
    if (!promptId) return;
    setIsFetchingPrompt(true);
    setError(null);
    try {
      const response = await fetch(`/api/prompts/${promptId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch prompt and parse error response." }));
        throw new Error(errorData.error || 'Failed to fetch prompt details');
      }
      const data: Prompt = await response.json();
      setPrompt(data);
      const vars = extractVariables(data.prompt_text);
      const initialVars = Object.fromEntries(vars.map(v => [v, '']));
      setVariables(initialVars);
    } catch (err: any) {
      setError(err.message);
      setPrompt(null);
    } finally {
      setIsFetchingPrompt(false);
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => ({ ...prev, [variable]: value }));
  };

  const handleFileUpload = (variable: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Read the first file as text
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          // Set the file content as the variable value
          handleVariableChange(variable, event.target.result as string);
        }
      };
      reader.readAsText(files[0]);
    }
  };

  const handleUploadClick = (variable: string) => () => {
    if (fileInputRefs.current[variable]) {
      fileInputRefs.current[variable]?.click();
    }
  };

  const isFormComplete = () => {
    if (Object.keys(variables).length === 0) return true;
    return Object.values(variables).every(value => value.trim() !== '');
  };

  const handleRunPromptClick = async () => {
    if (!prompt) {
        setError("Prompt data is not loaded.");
        return;
    }
    if (!isFormComplete()) {
        setError("Please fill in all required variables to run the prompt.");
        return;
    }
    setShowWarning(true);
  };

  const handleConfirmRun = async () => {
    if (!prompt || !isFormComplete()) return;

    setIsLoadingLLM(true); setError(null); setShowWarning(false);

    const startTime = new Date();
    let endTime: Date;
    let durationMs: number;
    
    const logPayload: any = {
      promptName: prompt.title,
      promptId: prompt.id, 
      inputData: { variables }, 
      userId: user?.id || null, 
    };

    try {
      const finalPrompt = replaceVariables(prompt.prompt_text, variables);
      logPayload.inputData.finalPrompt = finalPrompt;

      const llmResponse = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      endTime = new Date();
      durationMs = endTime.getTime() - startTime.getTime();

      if (!llmResponse.ok) {
        const errorBody = await llmResponse.text().catch(() => "Unknown LLM API error");
        throw new Error(`LLM API Error: ${llmResponse.status} ${errorBody}`);
      }
      const data = await llmResponse.json();
      setResult(data.response);

      logPayload.startTime = startTime.toISOString();
      logPayload.endTime = endTime.toISOString(); 
      logPayload.durationMs = durationMs;       
      logPayload.outputData = { response: data.response }; 
      logPayload.status = 'success';

    } catch (err: any) {
      endTime = new Date(); 
      durationMs = endTime.getTime() - startTime.getTime(); 
      setError(err.message || 'An error occurred while running the prompt.');
      console.error("Error running prompt:", err);

      logPayload.startTime = startTime.toISOString();
      logPayload.endTime = endTime.toISOString();
      logPayload.durationMs = durationMs;
      logPayload.outputData = { error: err.message };
      logPayload.status = 'failure';
    } finally {
      setIsLoadingLLM(false);
      try {
        await fetch('/api/logs/prompt-usage', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logPayload),
        });
      } catch (logError: any) {
        console.error('Failed to log prompt usage:', logError.message);
      }
    }
  };

  if (isFetchingPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading prompt...</p>
      </div>
    );
  }

  if (error && !prompt) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <p className="text-2xl text-red-600 mb-4">Error</p>
            <p className="text-md text-gray-700 mb-6">{error}</p>
            <Link href="/prompts" className="btn-primary py-2 px-4 rounded-md">
                Back to Prompts
            </Link>
        </div>
    );
  }

  if (!prompt) { 
    return (
        <div className="min-h-screen flex items-center justify-center">
             <p className="text-xl text-gray-500">Prompt not found or not accessible.</p>
        </div>
    );
  }
  
  // Determine the correct href for the back button
  const backHref = subgroupId ? `/prompts?subgroup=${subgroupId}` : '/prompts';

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <Link 
                href={backHref}
                className="flex items-center text-blue-100 hover:text-white transition-colors p-2 rounded-md -ml-2"
                title="Back to Prompts"
                >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                <span className="text-sm">Back</span>
                </Link>
                <h1 className="text-lg sm:text-xl font-semibold truncate text-center px-2">
                    Run: {prompt.title}
                </h1>
                <div className="flex items-center space-x-1 sm:space-x-2">
                    <Link href="/prompts/history" className="text-blue-100 hover:text-white transition-colors p-2 rounded-md" title="Prompt History">
                        <ClockIcon className="h-5 w-5" />
                    </Link>
                    <Link href="/" className="text-blue-100 hover:text-white transition-colors p-2 rounded-md" title="Home">
                        <HomeIcon className="h-5 w-5" />
                    </Link>
                </div>
            </div>
        </div>
      </header>

      <div className="container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-xl">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{prompt.title}</h2>
                {/* 
                <button 
                    onClick={handleLike} 
                    disabled={!user} 
                    className="flex items-center text-gray-500 hover:text-yellow-500 transition-colors mb-4 p-1 -ml-1 rounded disabled:opacity-50"
                    title={!user ? "Login to like" : (isLiked ? "Unlike" : "Like")}
                >
                    {isLiked ? <StarIconSolid className="h-5 w-5 text-yellow-400" /> : <StarIcon className="h-5 w-5" />}
                    <span className="ml-1.5 text-sm">{prompt.favorites_count}</span>
                </button>
                */}
                <p className="text-sm text-gray-700 mb-5 break-words whitespace-pre-wrap font-mono bg-gray-50 p-3.5 rounded-lg border border-gray-200">{prompt.prompt_text}</p>
                
                {Object.keys(variables).length > 0 && (
                    <>
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Fill Variables:</h3>
                        {Object.keys(variables).map(variable => (
                            <div key={variable} className="mb-4">
                                <label htmlFor={variable} className="block text-sm font-medium text-gray-700 capitalize mb-1">{variable.replace(/_/g, ' ')}</label>
                                <div className="flex">
                                  <textarea 
                                      id={variable} 
                                      rows={2}
                                      value={variables[variable]} 
                                      onChange={e => handleVariableChange(variable, e.target.value)} 
                                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  />
                                  <div className="mt-1 flex items-center">
                                    <input
                                      type="file"
                                      id={`file-${variable}`}
                                      onChange={handleFileUpload(variable)}
                                      className="hidden"
                                      ref={el => {
                                        fileInputRefs.current[variable] = el;
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={handleUploadClick(variable)}
                                      className="h-full flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-l-0 border-gray-300 rounded-r-md transition-colors"
                                      title="Upload document"
                                    >
                                      <DocumentIcon className="h-5 w-5 text-gray-600" />
                                    </button>
                                  </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
                <button 
                    onClick={handleRunPromptClick} 
                    disabled={isLoadingLLM || (Object.keys(variables).length > 0 && !isFormComplete())}
                    className="btn-primary w-full py-2.5 text-base mt-3 rounded-md shadow-md hover:shadow-lg transition-shadow"
                >
                    {Object.keys(variables).length === 0 ? 'Run Prompt' : 'Run with Variables'}
                </button>
                 {error && Object.keys(variables).length > 0 && !isFormComplete() && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
             {prompt.notes && (
                <div className="bg-white p-6 rounded-xl shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Notes:</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{prompt.notes}</p>
                </div>
            )}
        </div>

        <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-xl min-h-[calc(100vh-200px)]">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Result</h2>
                {isLoadingLLM && 
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-600 animate-pulse">Running prompt, please wait...</p>
                    </div>
                }
                {error && !isLoadingLLM && <p className="text-red-600 bg-red-50 p-3 rounded-md">Error: {error}</p>}
                {result && !isLoadingLLM && (
                    <pre className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-sm leading-relaxed">{result}</pre>
                )}
                {!isLoadingLLM && !error && !result && <p className="text-gray-500">Output will appear here once the prompt is run.</p>}
            </div>
        </div>
      </div>

      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900">Confirm Run</h3>
            <p className="text-sm text-gray-600 mt-3 mb-6">
              You are about to run the prompt with the provided variables. This will interact with an external LLM service.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowWarning(false)} className="btn-secondary py-2 px-4 rounded-md text-sm" disabled={isLoadingLLM}>Cancel</button>
              <button onClick={handleConfirmRun} className="btn-primary py-2 px-4 rounded-md text-sm" disabled={isLoadingLLM}>
                {isLoadingLLM ? (
                    <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Running...
                    </div>
                ) : 'Confirm & Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function RunPromptPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-gray-700">Loading prompt runner...</p>
            </div>
        }>
            <RunPromptPageContent />
        </Suspense>
    );
} 
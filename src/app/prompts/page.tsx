'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeftIcon, HomeIcon, ClockIcon, PlusIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/outline'; // For Favorites tab
import { StarIcon as StarIconSolid, StarIcon as StarIconOutline } from '@heroicons/react/24/solid'; // For likes - using Solid for filled, Outline for empty
import CreatePromptForm from '@/components/CreatePromptForm';
import PromptDetails from '@/components/PromptDetails';
import AuthForm from '@/components/AuthForm';
import type { SessionUser } from '@/lib/auth';

interface Prompt {
  id: string;
  title: string;
  prompt_text: string;
  notes: string | null;
  created_at: string; 
  favorites_count: number;
  createdById: string;
  isFavorited?: boolean; // Added for client-side tracking of user's favorites
}

interface SubgroupInfo {
  id: string;
  name: string;
}

function PromptsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const user = session?.user as SessionUser | undefined;

  const subgroupId = searchParams.get('subgroup');
  const initialPromptId = searchParams.get('id');
  
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subgroupName, setSubgroupName] = useState<string>(subgroupId ? 'Subgroup Prompts' : 'All Prompts');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  const fetchSubgroupDetails = useCallback(async () => {
    if (!subgroupId) {
      setSubgroupName('All Prompts');
      return;
    }
    try {
      // TODO: Ensure this API endpoint exists: GET /api/subgroups/${subgroupId}/details (or just name)
      const response = await fetch(`/api/subgroups/${subgroupId}/details`); 
      if (!response.ok) throw new Error('Failed to fetch subgroup details');
      const data: SubgroupInfo = await response.json();
      setSubgroupName(data.name || 'Subgroup Prompts');
    } catch (err) {
      console.error('Error fetching subgroup details:', err);
      setSubgroupName(subgroupId ? 'Subgroup Prompts' : 'All Prompts'); // Fallback name
      // setError("Could not load subgroup information."); // Optionally set an error
    }
  }, [subgroupId]);

  const fetchPromptsForSubgroup = useCallback(async () => {
    if (status !== 'authenticated') return; // Don't fetch if not authenticated

    setIsLoadingPrompts(true);
    setError(null);
    let url = '/api/prompts';
    const queryParams = new URLSearchParams();
    if (subgroupId) {
      queryParams.append('subgroupId', subgroupId);
    }
    if (activeTab === 'favorites' && user) { 
      queryParams.append('favoritesOfUserId', user.id);
    } else if (user) {
      // If not specifically fetching favorites, still include user ID 
      // so the backend can populate 'isFavorited' for all prompts.
      // This is an assumption on API behavior.
      queryParams.append('userId', user.id);
    }
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error from server"}));
        throw new Error(errorData.error || 'Failed to fetch prompts');
      }
      const data: Prompt[] = await response.json();
      setPrompts(data);

      if (initialPromptId && data.length > 0) {
        const foundPrompt = data.find(p => p.id === initialPromptId);
        if (foundPrompt) {
          setSelectedPrompt(foundPrompt);
          setIsCreating(false);
        } else if (data.length > 0 && !isCreating) {
            // If linked prompt not found, select first available
            setSelectedPrompt(data[0]); 
        }
      } else if (data.length > 0 && !selectedPrompt && !isCreating) {
        setSelectedPrompt(data[0]);
      } else if (data.length === 0 && !isCreating) {
        setSelectedPrompt(null);
        // Consider automatically switching to create mode if subgroupId is present and list is empty
        // if (subgroupId) setIsCreating(true);
      }

    } catch (err: any) {
      setError(err.message);
      setPrompts([]);
    } finally {
      setIsLoadingPrompts(false);
    }
  }, [subgroupId, status, user, initialPromptId, activeTab]); // Removed selectedPrompt, isCreating from deps as they might cause loops or stale closures here

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubgroupDetails();
      fetchPromptsForSubgroup();
    }
  }, [status, fetchSubgroupDetails, fetchPromptsForSubgroup]); // Initial fetch
  
  const handleSelectPrompt = (promptToSelect: Prompt) => {
    setSelectedPrompt(promptToSelect);
    setIsCreating(false);
    // Optional: Update URL if you want to reflect selection without full reload
    // const newSearchParams = new URLSearchParams(searchParams.toString());
    // newSearchParams.set('id', promptToSelect.id);
    // router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  };

  const handleCreateNew = () => {
    setSelectedPrompt(null);
    setIsCreating(true);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    if (prompts.length > 0 && !selectedPrompt) {
        setSelectedPrompt(prompts[0]); // Select first prompt if available after cancelling create
    }
  };

  const handlePromptCreated = () => {
    setIsCreating(false);
    fetchPromptsForSubgroup(); // Refresh the list. API should return new prompt first or handle selection.
  };

  const handleUsePrompt = (promptIdToUse: string) => {
    router.push(`/prompts/run?id=${promptIdToUse}${subgroupId ? `&subgroupId=${subgroupId}`: ''}`);
  };

  // Filter prompts based on search term
  const filteredPrompts = prompts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Placeholder for API call, should be moved to an API service
  const apiToggleFavorite = async (promptId: string, shouldFavorite: boolean): Promise<boolean> => {
    console.log(`API CALL (mock): ${shouldFavorite ? 'Favoriting' : 'Unfavoriting'} prompt ${promptId}`);
    // Simulate API call
    // const response = await fetch(`/api/prompts/${promptId}/favorite`, {
    //   method: shouldFavorite ? 'POST' : 'DELETE',
    //   headers: { 'Content-Type': 'application/json' },
    // });
    // if (!response.ok) {
    //   console.error('Failed to toggle favorite status');
    //   return false;
    // }
    // const result = await response.json();
    // return result.success; // Assuming API returns { success: true }
    return new Promise(resolve => setTimeout(() => resolve(true), 500)); // Simulate network delay
  };

  const handleFavoriteToggle = async (promptId: string, currentlyFavorited?: boolean) => {
    if (!user) {
      setError("You must be logged in to favorite prompts.");
      return;
    }

    const shouldFavorite = !currentlyFavorited;
    let originalPromptState: Prompt | undefined;

    // Optimistic UI update
    setPrompts(prevPrompts => {
      originalPromptState = prevPrompts.find(p => p.id === promptId);
      if (!originalPromptState) return prevPrompts; // Should not happen if called from a valid prompt

      return prevPrompts.map(p => 
        p.id === promptId 
          ? { 
              ...p, 
              isFavorited: shouldFavorite, 
              favorites_count: shouldFavorite 
                ? originalPromptState!.favorites_count + 1 
                : Math.max(0, originalPromptState!.favorites_count - 1) 
            } 
          : p
      );
    });

    if (selectedPrompt?.id === promptId && originalPromptState) {
        const originalSelectedPromptState = originalPromptState; // Use the same original state
        setSelectedPrompt(prev => prev ? { 
            ...prev, 
            isFavorited: shouldFavorite, 
            favorites_count: shouldFavorite 
                ? originalSelectedPromptState.favorites_count + 1 
                : Math.max(0, originalSelectedPromptState.favorites_count - 1)
        } : null);
    }

    const success = await apiToggleFavorite(promptId, shouldFavorite);

    if (!success) {
      setError("Failed to update favorite status. Please try again.");
      if (originalPromptState) {
        const revertState = originalPromptState; // Capture for closure
        setPrompts(prevPrompts =>
          prevPrompts.map(p =>
            p.id === promptId
              ? { ...revertState } // Revert to the original state (isFavorited and favorites_count)
              : p
          )
        );
        if (selectedPrompt?.id === promptId) {
          setSelectedPrompt(revertState); // Revert selected prompt to its original state
        }
      }
    } else {
        if (activeTab === 'favorites' && !shouldFavorite) {
            setPrompts(prevPrompts => prevPrompts.filter(p => p.id !== promptId));
            if (selectedPrompt?.id === promptId) {
                // If the currently selected prompt was unfavorited from the favorites tab,
                // select the first available prompt in the filtered list, or null if empty.
                const remainingPrompts = prompts.filter(p => p.id !== promptId);
                setSelectedPrompt(remainingPrompts.length > 0 ? remainingPrompts[0] : null);
            }
        }
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading user session...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <AuthForm onSuccess={() => router.refresh()} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <Link 
                href={subgroupId ? `/` : '/'} 
                className="flex items-center text-blue-100 hover:text-white transition-colors p-2 rounded-md -ml-2"
                title={subgroupId ? "Back to Groups" : "Home"}
                >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                <span className="text-sm">{subgroupId ? "Groups" : "Home"}</span>
                </Link>
                <h1 className="text-lg sm:text-xl font-semibold truncate text-center px-2">
                    {subgroupName}
                </h1>
                <div className="flex items-center space-x-1 sm:space-x-2">
                    <Link href="/prompts/history" className="text-blue-100 hover:text-white transition-colors p-2 rounded-md" title="Prompt History">
                        <ClockIcon className="h-5 w-5" />
                    </Link>
                </div>
            </div>
        </div>
      </header>

      <div className="container mx-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3 lg:max-w-md w-full flex-shrink-0 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-xl">
                {/* Search Bar Added Here */}
                <div className="mb-4">
                    <input 
                        type="text"
                        placeholder="Search prompts..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Tabs for All Prompts and Favorites */}
                <div className="mb-4 flex border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('all')}
                        className={`py-2 px-4 text-sm font-medium transition-colors 
                                    ${activeTab === 'all' 
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        All Prompts
                    </button>
                    <button 
                        onClick={() => setActiveTab('favorites')}
                        className={`py-2 px-4 text-sm font-medium transition-colors 
                                    ${activeTab === 'favorites' 
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <HeartIcon className="h-5 w-5 inline-block mr-1 align-text-bottom" />
                        Favorites
                    </button>
                </div>

                {isLoadingPrompts ? (
                    <div className="text-center py-6">
                        <p className="text-gray-500 animate-pulse">Loading prompts...</p>
                    </div>
                ) : filteredPrompts.length === 0 && !isCreating ? (
                    <div className="text-center py-6 px-3">
                        <ListBulletIcon className="h-10 w-10 text-gray-300 mx-auto mb-3"/>
                        <p className="text-gray-700 font-semibold mb-1">
                            {searchTerm ? 'No Prompts Match Your Search' : 'No Prompts Yet'}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            {searchTerm 
                                ? `Try a different search term or clear the search.` 
                                : `Add a prompt to this ${subgroupName !== 'All Prompts' && subgroupId ? "subgroup" : "collection"}.`
                            }
                        </p>
                        {!searchTerm && (
                            <button onClick={handleCreateNew} className="btn-primary text-sm py-2 px-3">Add New Prompt</button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1custom-scrollbar">
                        {filteredPrompts.map(p => (
                            <button 
                                key={p.id} 
                                onClick={() => handleSelectPrompt(p)}
                                className={`w-full text-left p-3.5 rounded-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 group ${selectedPrompt?.id === p.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 hover:bg-blue-100 hover:shadow-md'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className={`font-semibold text-sm truncate ${selectedPrompt?.id === p.id ? 'text-white' : 'text-gray-800 group-hover:text-blue-700'}`}>{p.title}</h3>
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            handleFavoriteToggle(p.id, p.isFavorited);
                                        }}
                                        className="p-1 rounded-full hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors"
                                        title={p.isFavorited ? 'Unfavorite' : 'Favorite'}
                                    >
                                        {p.isFavorited ? (
                                            <StarIconSolid className={`h-5 w-5 ${selectedPrompt?.id === p.id ? 'text-yellow-300' : 'text-yellow-400'}`} />
                                        ) : (
                                            <StarIconOutline className={`h-5 w-5 ${selectedPrompt?.id === p.id ? 'text-yellow-300 hover:text-yellow-400' : 'text-gray-400 group-hover:text-yellow-500'}`} />
                                        )}
                                    </button>
                                </div>
                                <p className={`text-xs mt-1 ${selectedPrompt?.id === p.id ? 'text-blue-200' : 'text-gray-500 group-hover:text-blue-500'}`}>
                                    Created: {new Date(p.created_at).toLocaleDateString()}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {/* Create New Prompt Button MOVED here, below the card */}
            <button 
                onClick={handleCreateNew}
                className="w-full btn-secondary flex items-center justify-center py-2.5 px-4 rounded-md text-sm shadow-sm hover:shadow-md transition-shadow"
            >
                <PlusIcon className="h-5 w-5 mr-2" /> Create New Prompt
            </button>
        </div>

        <div className="lg:w-2/3 flex-grow">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl min-h-[calc(100vh-160px)] flex flex-col">
                {isCreating ? (
                    <CreatePromptForm 
                        subgroupId={subgroupId || undefined} 
                        onCancel={handleCancelCreate} 
                        onSubmitSuccess={handlePromptCreated} // Corrected prop name
                    />
                ) : selectedPrompt ? (
                    <PromptDetails 
                        prompt={selectedPrompt} 
                        onUsePrompt={handleUsePrompt}
                        subgroupId={subgroupId || undefined}
                    />
                ) : !isLoadingPrompts && prompts.length > 0 ? (
                     <div className="text-center flex flex-col items-center justify-center h-full flex-grow">
                        <ListBulletIcon className="h-16 w-16 text-gray-300 mb-4"/>
                        <p className="text-lg text-gray-500">Select a prompt</p>
                        <p className="text-sm text-gray-400">Choose a prompt from the list to see its details or run it.</p>
                    </div>
                ) : !isLoadingPrompts && prompts.length === 0 && !isCreating ? (
                    <div className="text-center flex flex-col items-center justify-center h-full flex-grow">
                        <PlusIcon className="h-16 w-16 text-gray-300 mb-4"/>
                        <p className="text-lg text-gray-500">No prompts found</p>
                        <p className="text-sm text-gray-400">Create a new prompt to get started.</p>
                        <button onClick={handleCreateNew} className="btn-primary mt-6 text-sm py-2 px-4">Create a Prompt</button>
                    </div>
                ) : isLoadingPrompts ? (
                     <div className="text-center flex flex-col items-center justify-center h-full flex-grow">
                        <p className="text-gray-500 animate-pulse">Loading details...</p>
                    </div>
                ) : null } 
                 {error && <div className="mt-4 p-3 text-red-700 bg-red-100 rounded-md text-sm">Error loading content: {error}</div>}
            </div>
        </div>
      </div>
    </main>
  );
}

export default function PromptsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-xl text-gray-600">Loading prompts page...</p>
            </div>
        }>
            <PromptsPageContent />
        </Suspense>
    );
} 
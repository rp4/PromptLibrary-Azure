'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { PlusCircleIcon, PencilIcon, TrashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Represents the structure from the API/database
interface LLMConfigFromAPI {
  id: string;
  config_name: string;
  api_type: string;
  api_base_url?: string | null;
  api_key_env_var: string;
  model_name: string;
  default_parameters?: string | null; // Stored as JSON string
  is_active: boolean;
  createdAt: string; // Prisma uses createdAt
  updatedAt: string; // Prisma uses updatedAt
}

// Represents the form state, where default_parameters is a string for the textarea
interface LLMConfigFormData {
  config_name: string;
  api_type: string;
  api_base_url: string | null;
  api_key_env_var: string;
  model_name: string;
  default_parameters: string; // Kept as string for textarea
  is_active: boolean;
}

const API_TYPES = ["openai", "anthropic", "ollama", "custom_rest"];

const initialFormState: LLMConfigFormData = {
  config_name: '',
  api_type: API_TYPES[0],
  api_base_url: '',
  api_key_env_var: '',
  model_name: '',
  default_parameters: '', // Initialize as empty string for textarea
  is_active: false,
};

export default function ManageLLMConfigsPage() {
  const [configs, setConfigs] = useState<LLMConfigFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<LLMConfigFromAPI | null>(null);
  const [formData, setFormData] = useState<LLMConfigFormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const response = await fetch('/api/admin/llm-configs');
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch configurations');
      const data: LLMConfigFromAPI[] = await response.json();
      setConfigs(data);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  useEffect(() => {
    if (isEditing) {
      setFormData({
        config_name: isEditing.config_name,
        api_type: isEditing.api_type,
        api_base_url: isEditing.api_base_url || '',
        api_key_env_var: isEditing.api_key_env_var,
        model_name: isEditing.model_name,
        // If default_parameters is null/undefined, use empty string for textarea
        // If it's a string (JSON), use it directly. Pretty print if needed for readability on edit.
        default_parameters: isEditing.default_parameters ? JSON.stringify(JSON.parse(isEditing.default_parameters), null, 2) : '',
        is_active: isEditing.is_active,
      });
      setShowForm(true);
    } else {
      setFormData(initialFormState);
    }
  }, [isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setError(null); // Clear error on input change
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setError(null);

    let paramsStringOrNull: string | null = null;
    if (formData.default_parameters.trim() !== '') {
        try {
            JSON.parse(formData.default_parameters); // Validate JSON structure
            paramsStringOrNull = formData.default_parameters;
        } catch (jsonError) {
            setError("Default parameters must be a valid JSON string or empty.");
            setIsSubmitting(false);
            return;
        }
    }

    const payload: Omit<LLMConfigFromAPI, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
      ...formData,
      api_base_url: formData.api_base_url || null, // Ensure empty string becomes null if API expects null
      default_parameters: paramsStringOrNull, // This is now a string or null
    };

    try {
      const url = isEditing ? `/api/admin/llm-configs/${isEditing!.id}` : '/api/admin/llm-configs';
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to save configuration');
      await fetchConfigs();
      setShowForm(false);
      setIsEditing(null);
      setFormData(initialFormState);
    } catch (err: any) { setError(err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (configId: string) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/llm-configs/${configId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete configuration');
      await fetchConfigs();
    } catch (err: any) { setError(err.message); }
  };

  const handleActivate = async (configId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/admin/llm-configs/activate/${configId}`, { method: 'PUT' });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to activate configuration');
      await fetchConfigs();
    } catch (err: any) { setError(err.message); }
  };

  const openFormForNew = () => { setIsEditing(null); setFormData(initialFormState); setShowForm(true); setError(null); }; 
  const openFormForEdit = (config: LLMConfigFromAPI) => { setIsEditing(config); setError(null); };

  // Helper to parse and display default_parameters from API string
  const getDisplayableDefaultParams = (paramsString?: string | null): string => {
    if (!paramsString) return '';
    try {
      return JSON.stringify(JSON.parse(paramsString), null, 2);
    } catch {
      return "Invalid JSON data"; // Should not happen if API sends valid JSON string
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage LLM Configurations</h1>
        <button onClick={openFormForNew} className="btn-primary flex items-center">
          <PlusCircleIcon className="h-5 w-5 mr-2" /> Add New Configuration
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 animate-fadeIn" role="alert">
          <strong className="font-bold">Error: </strong> <span className="block sm:inline">{error}</span>
          <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8 space-y-4 animate-fadeIn">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">{isEditing ? 'Edit' : 'Create'} LLM Configuration</h2>
          <div>
            <label htmlFor="config_name" className="block text-sm font-medium text-gray-700">Configuration Name</label>
            <input type="text" name="config_name" id="config_name" value={formData.config_name} onChange={handleInputChange} className="input" required />
          </div>
          <div>
            <label htmlFor="api_type" className="block text-sm font-medium text-gray-700">API Type</label>
            <select name="api_type" id="api_type" value={formData.api_type} onChange={handleInputChange} className="input" required>
              {API_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="api_base_url" className="block text-sm font-medium text-gray-700">API Base URL (Optional)</label>
            <input type="url" name="api_base_url" id="api_base_url" value={formData.api_base_url || ''} onChange={handleInputChange} className="input" placeholder="e.g., http://localhost:11434/api for Ollama"/>
          </div>
          <div>
            <label htmlFor="api_key_env_var" className="block text-sm font-medium text-gray-700">API Key Environment Variable Name</label>
            <input type="text" name="api_key_env_var" id="api_key_env_var" value={formData.api_key_env_var} onChange={handleInputChange} className="input" required placeholder="e.g., OPENAI_API_KEY"/>
            <p className="text-xs text-gray-500 mt-1">The server will read the API key from this environment variable.</p>
          </div>
          <div>
            <label htmlFor="model_name" className="block text-sm font-medium text-gray-700">Model Name</label>
            <input type="text" name="model_name" id="model_name" value={formData.model_name} onChange={handleInputChange} className="input" required placeholder="e.g., gpt-3.5-turbo or llama2:7b"/>
          </div>
          <div>
            <label htmlFor="default_parameters" className="block text-sm font-medium text-gray-700">Default Parameters (JSON String)</label>
            <textarea name="default_parameters" id="default_parameters" rows={3} value={formData.default_parameters} onChange={handleInputChange} className="input font-mono text-sm" placeholder='e.g., { "temperature": 0.7, "max_tokens": 500 }'></textarea>
          </div>
          <div className="flex items-center">
            <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Set as Active Configuration</label>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => { setShowForm(false); setIsEditing(null); setError(null); }} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Configuration')}</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center p-8"><p className="text-gray-600">Loading configurations...</p></div>
      ) : configs.length === 0 && !showForm ? (
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4"/>
            <h3 className="text-lg font-medium text-gray-700">No LLM Configurations Found</h3>
            <p className="text-sm text-gray-500 mt-1">Get started by adding a new configuration.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {configs.map(config => (
            <div key={config.id} className={`bg-white shadow-md rounded-lg p-5 border-l-4 ${config.is_active ? 'border-green-500' : 'border-gray-300'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`text-lg font-semibold ${config.is_active ? 'text-green-700' : 'text-gray-800'}`}>{config.config_name} {config.is_active && "(Active)"}</h3>
                  <p className="text-sm text-gray-500">Type: {config.api_type} | Model: {config.model_name}</p>
                  <p className="text-xs text-gray-400 mt-1">Last updated: {new Date(config.updatedAt).toLocaleString()}</p> {/* Changed to updatedAt */}
                </div>
                <div className="flex space-x-2 items-center">
                  {!config.is_active && (
                    <button onClick={() => handleActivate(config.id)} className="btn-success text-xs py-1 px-2 flex items-center" title="Activate">
                      <CheckCircleIcon className="h-4 w-4 mr-1"/> Activate
                    </button>
                  )}
                  <button onClick={() => openFormForEdit(config)} className="btn-secondary text-xs py-1 px-2 flex items-center" title="Edit">
                     <PencilIcon className="h-4 w-4 mr-1"/> Edit
                  </button>
                  <button onClick={() => handleDelete(config.id)} className={`btn-danger text-xs py-1 px-2 flex items-center ${config.is_active ? 'opacity-50 cursor-not-allowed' : ''}`} title={config.is_active ? "Cannot delete active config" : "Delete"} disabled={config.is_active}>
                    <TrashIcon className="h-4 w-4 mr-1"/> Delete
                  </button>
                </div>
              </div>
              {config.api_base_url && <p className="text-sm text-gray-600 mt-2">Base URL: {config.api_base_url}</p>}
              <p className="text-sm text-gray-600 mt-1">Key Variable: <span className="font-mono text-xs bg-gray-100 p-1 rounded">{config.api_key_env_var}</span></p>
              {config.default_parameters && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Default Parameters:</p>
                  <pre className="text-xs bg-gray-50 p-2 rounded-md mt-1 overflow-x-auto">
                    {getDisplayableDefaultParams(config.default_parameters)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
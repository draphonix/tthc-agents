'use client';

import { useState, useEffect } from 'react';
import { createADKClient, createSessionHook, type ADKSession } from '@/lib/adk';

export default function TestADKPage() {
  const [client, setClient] = useState<ReturnType<typeof createADKClient> | null>(null);
  const [session, setSession] = useState<ADKSession | null>(null);
  const [sessionHook, setSessionHook] = useState<ReturnType<typeof createSessionHook> | null>(null);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeADK = async () => {
      try {
        // Create ADK client with a test user ID
        const userId = `test-user-${Date.now()}`;
        const adkClient = createADKClient(userId);
        setClient(adkClient);

        // Create session hook
        const hook = createSessionHook(adkClient);
        setSessionHook(hook);

        // Create or restore session
        const session = await hook.getOrCreateSession();
        setSession(session);
      } catch (err) {
        console.error('Failed to initialize ADK:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize ADK');
      }
    };

    initializeADK();
  }, []);

  const sendMessage = async () => {
    if (!client || !session || !message.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const stream = client.sendMessage(session.id, { message });
      
      for await (const chunk of stream) {
        setResponse(prev => prev + chunk.chunk);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const testHealthCheck = async () => {
    if (!client) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const health = await client.healthCheck();
      setResponse(`Health check: ${JSON.stringify(health, null, 2)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testListApps = async () => {
    if (!client) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const apps = await client.listApps();
      setResponse(`Available apps: ${JSON.stringify(apps, null, 2)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list apps');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">ADK Integration Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Info */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Session Info</h2>
          {session ? (
            <div className="text-sm space-y-1">
              <p><strong>ID:</strong> {session.id}</p>
              <p><strong>App:</strong> {session.appName}</p>
              <p><strong>User:</strong> {session.userId}</p>
              <p><strong>Events:</strong> {session.events.length}</p>
            </div>
          ) : (
            <p className="text-gray-500">Loading session...</p>
          )}
        </div>

        {/* Quick Tests */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Quick Tests</h2>
          <div className="space-y-2">
            <button
              onClick={testHealthCheck}
              disabled={isLoading || !client}
              className="w-full px-3 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              Test Health Check
            </button>
            <button
              onClick={testListApps}
              disabled={isLoading || !client}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Test List Apps
            </button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Chat Test</h2>
        <div className="border rounded p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Message:
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about Vietnamese birth certificate registration..."
              className="w-full p-2 border rounded"
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={isLoading || !client || !session || !message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </button>
          
          {response && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Response:
              </label>
              <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap border">
                {response}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="mt-6 text-center">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          session ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {session ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Connected to ADK
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              Connecting...
            </>
          )}
        </div>
      </div>
    </div>
  );
}

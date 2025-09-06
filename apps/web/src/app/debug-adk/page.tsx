'use client';

import { useEffect, useState } from 'react';

export default function DebugADKPage() {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const debugImports = async () => {
      try {
        setStatus('Step 1: Checking environment variables...');
        const envUrl = process.env.NEXT_PUBLIC_ADK_SERVICE_URL;
        console.log('Environment URL:', envUrl);
        
        if (!envUrl) {
          throw new Error('NEXT_PUBLIC_ADK_SERVICE_URL is not defined');
        }

        setStatus('Step 2: Importing ADK modules...');
        const adkModule = await import('@/lib/adk');
        console.log('ADK Module imported:', Object.keys(adkModule));

        setStatus('Step 3: Accessing ADKClient...');
        const { ADKClient } = adkModule;
        console.log('ADKClient class:', ADKClient);

        if (!ADKClient) {
          throw new Error('ADKClient is not exported from @/lib/adk');
        }

        setStatus('Step 4: Creating ADK client...');
        const userId = `debug-user-${Date.now()}`;
        const client = new ADKClient(userId);
        console.log('ADK Client created:', client);

        setStatus('Step 5: Testing helper functions...');
        const { createADKClient } = adkModule;
        const clientViaHelper = createADKClient(userId);
        console.log('ADK Client via helper:', clientViaHelper);

        setStatus('✅ All imports and creation successful!');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Debug error:', err);
      }
    };

    debugImports();
  }, []);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">ADK Import Debug</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <strong>Status:</strong> {status}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
          <div className="text-sm">
            <p><strong>NEXT_PUBLIC_ADK_SERVICE_URL:</strong> {process.env.NEXT_PUBLIC_ADK_SERVICE_URL || 'Not defined'}</p>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Browser Console</h2>
          <p className="text-sm text-gray-600">Check the browser console for detailed logs.</p>
        </div>
      </div>
    </div>
  );
}

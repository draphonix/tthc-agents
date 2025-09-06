"use client";

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NetworkStatusProps {
  onRetry?: () => void;
  className?: string;
}

type NetworkStatus = 'online' | 'offline' | 'poor' | 'checking';

export function NetworkStatus({ onRetry, className }: NetworkStatusProps) {
  const [status, setStatus] = useState<NetworkStatus>('online');
  const [isRetrying, setIsRetrying] = useState(false);

  // Check network status
  useEffect(() => {
    const checkNetworkStatus = async () => {
      if (!navigator.onLine) {
        setStatus('offline');
        return;
      }

      setStatus('checking');

      try {
        // Try to reach the ADK service
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('/api/adk/health', {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          setStatus('online');
        } else {
          setStatus('poor');
        }
      } catch (error) {
        console.error('Network check failed:', error);
        setStatus('poor');
      }
    };

    // Initial check
    checkNetworkStatus();

    // Set up periodic checks
    const interval = setInterval(checkNetworkStatus, 30000); // Check every 30 seconds

    // Listen for network status changes
    const handleOnline = () => checkNetworkStatus();
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry?.();
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'online':
        return {
          icon: Wifi,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          text: 'Connected',
          description: 'Service is available',
          showRetry: false,
        };
      case 'offline':
        return {
          icon: WifiOff,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          text: 'Offline',
          description: 'No internet connection',
          showRetry: true,
        };
      case 'poor':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
          text: 'Poor Connection',
          description: 'Service may be unavailable',
          showRetry: true,
        };
      case 'checking':
        return {
          icon: RefreshCw,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          text: 'Checking...',
          description: 'Testing connection',
          showRetry: false,
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  // Don't show the component if status is online
  if (status === 'online') {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      statusInfo.bgColor,
      className
    )}>
      <Icon 
        size={18} 
        className={cn(
          statusInfo.color,
          status === 'checking' && 'animate-spin'
        )} 
      />
      
      <div className="flex-1">
        <div className={cn("text-sm font-medium", statusInfo.color)}>
          {statusInfo.text}
        </div>
        <div className="text-xs text-muted-foreground">
          {statusInfo.description}
        </div>
      </div>

      {statusInfo.showRetry && onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-1"
        >
          <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
          Retry
        </Button>
      )}
    </div>
  );
}

// Hook for using network status in components
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    lastOnline,
    wasOffline: lastOnline !== null,
  };
}

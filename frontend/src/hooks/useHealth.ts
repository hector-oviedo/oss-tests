import { useState, useEffect } from 'react';

export const useHealth = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [modelName, setModelName] = useState<string>('');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:8000/health');
        if (res.ok) {
          const data = await res.json();
          setIsOnline(true);
          setModelName(data.model || 'Unknown Model');
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        setIsOnline(false);
      }
    };

    // Initial check
    checkHealth();

    // Poll every 10 seconds
    const interval = setInterval(checkHealth, 10000);

    return () => clearInterval(interval);
  }, []);

  return { isOnline, modelName };
};

import { useEffect, useState } from 'react';

import { initializeDatabase } from '../services/database';

interface UseDatabaseResult {
  isReady: boolean;
  error: Error | null;
}

export const useDatabase = (): UseDatabaseResult => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      try {
        await initializeDatabase();
        setIsReady(true);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError : new Error('Failed to initialize database.'));
      }
    };

    void initialize();
  }, []);

  return { isReady, error };
};

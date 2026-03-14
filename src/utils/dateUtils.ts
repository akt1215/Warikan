import { format } from 'date-fns';

export const formatTimestamp = (timestamp: number, pattern = 'PPP p'): string => {
  return format(new Date(timestamp), pattern);
};

export const now = (): number => Date.now();

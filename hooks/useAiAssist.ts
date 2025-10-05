import { useState, useCallback } from 'react';
import { suggestReminderFields } from '../services/aiService';

export const useAiAssist = () => {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const getSuggestions = useCallback(async (text: string, currentTitle?: string) => {
    if (!process.env.API_KEY) {
      console.log("AI Assist disabled. API_KEY not provided.");
      return null;
    }
    
    setIsSuggesting(true);
    setSuggestionError(null);
    try {
      const suggestions = await suggestReminderFields(text, currentTitle);
      return suggestions;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setSuggestionError(message);
      return null;
    } finally {
      setIsSuggesting(false);
    }
  }, []);

  return { isSuggesting, suggestionError, getSuggestions };
};

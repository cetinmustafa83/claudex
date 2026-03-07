import type { KeyboardEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSuggestionBaseOptions<T> {
  suggestions: T[];
  hasSuggestions: boolean;
  onSelect: (item: T) => void;
}

export const useSuggestionBase = <T>({
  suggestions,
  hasSuggestions,
  onSelect,
}: UseSuggestionBaseOptions<T>) => {
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const suggestionsRef = useRef(suggestions);
  suggestionsRef.current = suggestions;
  const hasSuggestionsRef = useRef(hasSuggestions);
  hasSuggestionsRef.current = hasSuggestions;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const highlightedIndexRef = useRef(highlightedIndex);
  highlightedIndexRef.current = highlightedIndex;

  useEffect(() => {
    if (!hasSuggestions) {
      setHighlightedIndex(0);
      return;
    }
    setHighlightedIndex((prev) => (prev < suggestions.length ? prev : 0));
  }, [suggestions, hasSuggestions]);

  const handleKeyDown = useCallback((event: KeyboardEvent<Element>) => {
    if (!hasSuggestionsRef.current) return false;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestionsRef.current.length);
      return true;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + suggestionsRef.current.length) % suggestionsRef.current.length,
      );
      return true;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const item = suggestionsRef.current[highlightedIndexRef.current];
      if (item) onSelectRef.current(item);
      return true;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setHighlightedIndex(0);
      return true;
    }

    return false;
  }, []);

  return {
    highlightedIndex,
    selectItem: onSelect,
    handleKeyDown,
  } as const;
};

import { memo } from 'react';
import { X } from 'lucide-react';
import { MentionIcon } from './MentionIcon';
import type { MentionItem } from '@/types/ui.types';

interface MentionChipsProps {
  mentions: MentionItem[];
  onRemove: (path: string) => void;
}

export const MentionChips = memo(function MentionChips({ mentions, onRemove }: MentionChipsProps) {
  if (mentions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-3 pt-2">
      {mentions.map((item) => (
        <span
          key={item.path}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-surface-tertiary px-2 py-0.5 dark:border-border-dark/50 dark:bg-surface-dark-tertiary"
        >
          <MentionIcon type={item.type} name={item.name} />
          <span className="max-w-[200px] truncate font-mono text-2xs text-text-primary dark:text-text-dark-primary">
            {item.name}
          </span>
          <button
            type="button"
            className="ml-0.5 rounded-sm text-text-quaternary transition-colors hover:text-text-primary dark:text-text-dark-quaternary dark:hover:text-text-dark-primary"
            onMouseDown={(e) => {
              e.preventDefault();
              onRemove(item.path);
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
});

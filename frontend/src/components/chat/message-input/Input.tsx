import { memo } from 'react';
import { FileUploadDialog } from '@/components/ui/FileUploadDialog';
import { DrawingModal } from '@/components/ui/DrawingModal';
import { DropIndicator } from './DropIndicator';
import { SendButton } from './SendButton';
import { AttachButton } from './AttachButton';
import { Textarea } from './Textarea';
import { InputControls } from './InputControls';
import { InputAttachments } from './InputAttachments';
import { InputSuggestionsPanel } from './InputSuggestionsPanel';
import { ContextUsageIndicator } from './ContextUsageIndicator';
import { InputProvider } from './InputProvider';
import { useInputContext } from '@/hooks/useInputContext';
import type { ContextUsageInfo } from './ContextUsageIndicator';

export interface InputProps {
  message: string;
  setMessage: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAttach?: (files: File[]) => void;
  attachedFiles?: File[] | null;
  isLoading: boolean;
  isStreaming?: boolean;
  onStopStream?: () => void;
  placeholder?: string;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  dropdownPosition?: 'top' | 'bottom';
  showAttachedFilesPreview?: boolean;
  contextUsage?: ContextUsageInfo;
  showTip?: boolean;
  compact?: boolean;
  chatId?: string;
  showLoadingSpinner?: boolean;
}

export const Input = memo(function Input(props: InputProps) {
  return (
    <InputProvider {...props}>
      <InputLayout />
    </InputProvider>
  );
});

function InputLayout() {
  const ctx = useInputContext();

  const shouldShowAttachedPreview =
    ctx.hasAttachments && ctx.showPreview && ctx.attachedFiles && ctx.attachedFiles.length > 0;

  return (
    <form ref={ctx.formRef} onSubmit={ctx.handleSubmit} className="relative px-4 sm:px-6">
      <div
        {...ctx.dragHandlers}
        className={`relative rounded-2xl border bg-surface-secondary shadow-soft transition-all duration-300 dark:bg-surface-dark-secondary ${
          ctx.isDragging
            ? 'scale-[1.01] border-border-hover dark:border-border-dark-hover'
            : 'border-border dark:border-border-dark'
        }`}
      >
        <DropIndicator visible={ctx.isDragging} fileType="any" message="Drop your files here" />

        {shouldShowAttachedPreview && (
          <InputAttachments
            files={ctx.attachedFiles!}
            previewUrls={ctx.previewUrls}
            onRemoveFile={ctx.handleRemoveFile}
            onEditImage={ctx.handleDrawClick}
          />
        )}

        {ctx.contextUsage && (
          <div className="absolute right-3 top-3 z-10">
            <ContextUsageIndicator usage={ctx.contextUsage} />
          </div>
        )}

        <div className="relative px-3 pb-12 pt-1.5 sm:pb-9">
          <Textarea
            ref={ctx.textareaRef}
            message={ctx.message}
            setMessage={ctx.setMessage}
            placeholder={ctx.placeholder}
            isLoading={ctx.isLoading}
            onKeyDown={ctx.handleKeyDown}
            onCursorPositionChange={ctx.setCursorPosition}
            compact={ctx.compact}
          />
          <InputSuggestionsPanel
            isMentionActive={ctx.isMentionActive}
            slashCommands={ctx.slashCommandSuggestions}
            highlightedSlashIndex={ctx.highlightedSlashCommandIndex}
            onSlashSelect={ctx.selectSlashCommand}
            mentionFiles={ctx.filteredFiles}
            mentionAgents={ctx.filteredAgents}
            mentionPrompts={ctx.filteredPrompts}
            highlightedMentionIndex={ctx.highlightedMentionIndex}
            onMentionSelect={ctx.selectMention}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 pb-safe">
          <div className="relative flex items-center justify-between">
            <InputControls
              selectedModelId={ctx.selectedModelId}
              onModelChange={ctx.onModelChange}
              onEnhance={ctx.handleEnhancePrompt}
              dropdownPosition={ctx.dropdownPosition}
              isLoading={ctx.isLoading}
              isEnhancing={ctx.isEnhancing}
              hasMessage={ctx.hasMessage}
            />

            <div className="absolute bottom-2.5 right-3 flex items-center gap-1">
              <AttachButton
                onAttach={() => {
                  ctx.resetDragState();
                  ctx.setShowFileUpload(true);
                }}
              />
              <SendButton
                isLoading={ctx.isLoading}
                isStreaming={ctx.isStreaming}
                disabled={
                  (!ctx.isLoading && !ctx.isStreaming && !ctx.hasMessage) || ctx.isEnhancing
                }
                onClick={ctx.handleSendClick}
                type="button"
                hasMessage={ctx.hasMessage}
                showLoadingSpinner={ctx.showLoadingSpinner}
              />
            </div>
          </div>
        </div>
      </div>

      <FileUploadDialog
        isOpen={ctx.showFileUpload}
        onClose={() => ctx.setShowFileUpload(false)}
        onFileSelect={ctx.handleFileSelect}
      />

      {ctx.editingImageIndex !== null &&
        ctx.editingImageIndex < ctx.previewUrls.length &&
        ctx.previewUrls[ctx.editingImageIndex] && (
          <DrawingModal
            imageUrl={ctx.previewUrls[ctx.editingImageIndex]}
            isOpen={ctx.showDrawingModal}
            onClose={ctx.closeDrawingModal}
            onSave={ctx.handleDrawingSave}
          />
        )}

      {ctx.showTip && !ctx.hasAttachments && (
        <div className="mt-1 animate-fade-in text-center text-2xs text-text-quaternary dark:text-text-dark-tertiary">
          <span className="font-medium">Tip:</span> Drag and drop images, pdfs and xlsx files into
          the input area, type `/` for slash commands, or `@` to mention files, agents, and prompts
        </div>
      )}
    </form>
  );
}

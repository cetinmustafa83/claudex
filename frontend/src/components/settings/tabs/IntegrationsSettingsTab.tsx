import { useGmailIntegration } from '@/hooks/useGmailIntegration';
import { GmailIntegrationCard } from '@/components/settings/integrations/GmailIntegrationCard';

export const IntegrationsSettingsTab: React.FC = () => {
  const gmail = useGmailIntegration();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
          Integrations
        </h2>
        <p className="mt-1 text-xs text-text-tertiary dark:text-text-dark-tertiary">
          Connect external services to extend Claude's capabilities with MCP tools.
        </p>
      </div>

      <GmailIntegrationCard
        status={gmail.status}
        isLoading={gmail.isLoading}
        onUploadOAuthClient={gmail.uploadOAuthClient}
        isUploading={gmail.isUploading}
        onDeleteOAuthClient={gmail.deleteOAuthClient}
        isDeleting={gmail.isDeleting}
        onConnect={gmail.connectGmail}
        onDisconnect={gmail.disconnectGmail}
        isDisconnecting={gmail.isDisconnecting}
      />
    </div>
  );
};

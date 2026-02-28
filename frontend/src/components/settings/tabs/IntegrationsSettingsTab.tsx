import { useGmailIntegration } from '@/hooks/useGmailIntegration';
import { useSupabaseIntegration } from '@/hooks/useSupabaseIntegration';
import { useAppwriteIntegration } from '@/hooks/useAppwriteIntegration';
import { GmailIntegrationCard } from '@/components/settings/integrations/GmailIntegrationCard';
import { SupabaseIntegrationCard } from '@/components/settings/integrations/SupabaseIntegrationCard';
import { AppwriteIntegrationCard } from '@/components/settings/integrations/AppwriteIntegrationCard';
import { SmtpIntegrationCard } from '@/components/settings/integrations/SmtpIntegrationCard';

export const IntegrationsSettingsTab: React.FC = () => {
  const gmail = useGmailIntegration();
  const supabase = useSupabaseIntegration();
  const appwrite = useAppwriteIntegration();

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

      <SmtpIntegrationCard />

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

      <SupabaseIntegrationCard
        status={supabase.status}
        isLoading={supabase.isLoading}
        onConfigure={supabase.configure}
        isConfiguring={supabase.isConfiguring}
        onDisconnect={supabase.disconnect}
        isDisconnecting={supabase.isDisconnecting}
        onValidate={supabase.validate}
        isValidating={supabase.isValidating}
      />

      <AppwriteIntegrationCard
        status={appwrite.status}
        isLoading={appwrite.isLoading}
        onConfigure={appwrite.configure}
        isConfiguring={appwrite.isConfiguring}
        onDisconnect={appwrite.disconnect}
        isDisconnecting={appwrite.isDisconnecting}
        onValidate={appwrite.validate}
        isValidating={appwrite.isValidating}
      />
    </div>
  );
};

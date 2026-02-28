import { apiClient } from '@/lib/api';
import { ensureResponse, withAuth } from '@/services/base/BaseService';

export interface GmailStatus {
  connected: boolean;
  email: string | null;
  connected_at: string | null;
  has_oauth_client: boolean;
}

interface OAuthClientResponse {
  success: boolean;
  message: string;
}

interface OAuthUrlResponse {
  url: string;
}

async function uploadGmailOAuthClient(clientConfig: object): Promise<OAuthClientResponse> {
  return withAuth(async () => {
    const response = await apiClient.post<OAuthClientResponse>('/integrations/gmail/oauth-client', {
      client_config: clientConfig,
    });
    return ensureResponse(response, 'Failed to upload OAuth client');
  });
}

async function deleteGmailOAuthClient(): Promise<OAuthClientResponse> {
  return withAuth(async () => {
    const response = await apiClient.delete<OAuthClientResponse>(
      '/integrations/gmail/oauth-client',
    );
    return ensureResponse(response, 'Failed to delete OAuth client');
  });
}

async function getGmailOAuthUrl(): Promise<string> {
  return withAuth(async () => {
    const response = await apiClient.get<OAuthUrlResponse>('/integrations/gmail/oauth-url');
    const data = ensureResponse(response, 'Failed to get OAuth URL');
    return data.url;
  });
}

async function getGmailStatus(): Promise<GmailStatus> {
  return withAuth(async () => {
    const response = await apiClient.get<GmailStatus>('/integrations/gmail/status');
    return ensureResponse(response, 'Failed to get Gmail status');
  });
}

async function disconnectGmail(): Promise<OAuthClientResponse> {
  return withAuth(async () => {
    const response = await apiClient.post<OAuthClientResponse>('/integrations/gmail/disconnect');
    return ensureResponse(response, 'Failed to disconnect Gmail');
  });
}

// Supabase types and functions
export interface SupabaseStatus {
  connected: boolean;
  url: string | null;
  project_name: string | null;
  connected_at: string | null;
}

export interface SupabaseConfig {
  url: string;
  anon_key: string;
  service_role_key?: string;
}

async function configureSupabase(config: SupabaseConfig): Promise<OAuthClientResponse> {
  return withAuth(async () => {
    const response = await apiClient.post<OAuthClientResponse>('/integrations/supabase/config', config);
    return ensureResponse(response, 'Failed to configure Supabase');
  });
}

async function getSupabaseStatus(): Promise<SupabaseStatus> {
  return withAuth(async () => {
    const response = await apiClient.get<SupabaseStatus>('/integrations/supabase/status');
    return ensureResponse(response, 'Failed to get Supabase status');
  });
}

async function disconnectSupabase(): Promise<OAuthClientResponse> {
  return withAuth(async () => {
    const response = await apiClient.delete<OAuthClientResponse>('/integrations/supabase/config');
    return ensureResponse(response, 'Failed to disconnect Supabase');
  });
}

async function validateSupabaseConnection(): Promise<OAuthClientResponse> {
  return withAuth(async () => {
    const response = await apiClient.post<OAuthClientResponse>('/integrations/supabase/validate');
    return ensureResponse(response, 'Failed to validate Supabase connection');
  });
}

// Appwrite types and functions
export interface AppwriteStatus {
  connected: boolean;
  endpoint: string | null;
  project_id: string | null;
  project_name: string | null;
  connected_at: string | null;
}

export interface AppwriteConfig {
  endpoint: string;
  project_id: string;
  api_key: string;
}

async function configureAppwrite(config: AppwriteConfig): Promise<OAuthClientResponse> {
  return withAuth(async () => {
    const response = await apiClient.post<OAuthClientResponse>('/integrations/appwrite/config', config);
    return ensureResponse(response, 'Failed to configure Appwrite');
  });
}

async function getAppwriteStatus(): Promise<AppwriteStatus> {
  return withAuth(async () => {
    const response = await apiClient.get<AppwriteStatus>('/integrations/appwrite/status');
    return ensureResponse(response, 'Failed to get Appwrite status');
  });
}

async function disconnectAppwrite(): Promise<OAuthClientResponse> {
  return withAuth(async () => {
    const response = await apiClient.delete<OAuthClientResponse>('/integrations/appwrite/config');
    return ensureResponse(response, 'Failed to disconnect Appwrite');
  });
}

async function validateAppwriteConnection(): Promise<OAuthClientResponse> {
  return withAuth(async () => {
    const response = await apiClient.post<OAuthClientResponse>('/integrations/appwrite/validate');
    return ensureResponse(response, 'Failed to validate Appwrite connection');
  });
}

export const integrationsService = {
  uploadGmailOAuthClient,
  deleteGmailOAuthClient,
  getGmailOAuthUrl,
  getGmailStatus,
  disconnectGmail,
  configureSupabase,
  getSupabaseStatus,
  disconnectSupabase,
  validateSupabaseConnection,
  configureAppwrite,
  getAppwriteStatus,
  disconnectAppwrite,
  validateAppwriteConnection,
};

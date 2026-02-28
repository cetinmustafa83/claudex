import { apiClient } from '@/lib/api';
import { ensureResponse, withAuth } from '@/services/base/BaseService';
import { ValidationError } from '@/services/base/ServiceError';
import type { UserSettings, UserSettingsUpdate } from '@/types/user.types';
import type { EnterpriseModeResponse, SmtpStatusResponse, SmtpConfigRequest } from '@/types/system.types';

async function getSettings(): Promise<UserSettings> {
  return withAuth(async () => {
    const response = await apiClient.get<UserSettings>('/settings/');
    return ensureResponse(response, 'Failed to fetch user settings');
  });
}

async function updateSettings(data: UserSettingsUpdate): Promise<UserSettings> {
  if (!data || Object.keys(data).length === 0) {
    throw new ValidationError('Settings update data is required');
  }

  return withAuth(async () => {
    const response = await apiClient.patch<UserSettings>('/settings/', data);
    return ensureResponse(response, 'Failed to update user settings');
  });
}

async function getEnterpriseMode(): Promise<EnterpriseModeResponse> {
  return withAuth(async () => {
    const response = await apiClient.get<EnterpriseModeResponse>('/system/enterprise-mode');
    return ensureResponse(response, 'Failed to fetch enterprise mode');
  });
}

async function setEnterpriseMode(enabled: boolean): Promise<EnterpriseModeResponse> {
  return withAuth(async () => {
    const response = await apiClient.post<EnterpriseModeResponse>('/system/enterprise-mode', { enabled });
    return ensureResponse(response, 'Failed to set enterprise mode');
  });
}

async function getSmtpSettings(): Promise<SmtpStatusResponse> {
  return withAuth(async () => {
    const response = await apiClient.get<SmtpStatusResponse>('/system/smtp');
    return ensureResponse(response, 'Failed to fetch SMTP settings');
  });
}

async function configureSmtp(data: SmtpConfigRequest): Promise<{ success: boolean; message: string }> {
  return withAuth(async () => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/system/smtp', data);
    return ensureResponse(response, 'Failed to configure SMTP');
  });
}

async function disableSmtp(): Promise<{ success: boolean; message: string }> {
  return withAuth(async () => {
    const response = await apiClient.delete<{ success: boolean; message: string }>('/system/smtp');
    return ensureResponse(response, 'Failed to disable SMTP');
  });
}

async function testSmtp(testEmail: string): Promise<{ success: boolean; message: string }> {
  return withAuth(async () => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/system/smtp/test', { test_email: testEmail });
    return ensureResponse(response, 'Failed to test SMTP');
  });
}

interface A4FModel {
  model_id: string;
  name: string;
  enabled: boolean;
}

interface A4FModelsResponse {
  success: boolean;
  error: string | null;
  models: A4FModel[];
}

async function fetchA4FModels(apiKey: string): Promise<A4FModelsResponse> {
  return withAuth(async () => {
    const response = await apiClient.post<A4FModelsResponse>('/settings/a4f/models', { api_key: apiKey });
    return ensureResponse(response, 'Failed to fetch A4F models');
  });
}

export const settingsService = {
  getSettings,
  updateSettings,
  getEnterpriseMode,
  setEnterpriseMode,
  getSmtpSettings,
  configureSmtp,
  disableSmtp,
  testSmtp,
  fetchA4FModels,
};

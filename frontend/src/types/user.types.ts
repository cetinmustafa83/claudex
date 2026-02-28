export interface User {
  id: string;
  email: string;
  username: string;
  is_verified: boolean;
  is_superuser: boolean;
  email_verification_required: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  company_name: string | null;
  job_title: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  locale: string;
  is_verified: boolean;
  is_superuser: boolean;
}

export interface UserProfileUpdate {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  company_name?: string | null;
  job_title?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  locale?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
}

export interface AdminUserCreate {
  email: string;
  username: string;
  password: string;
  is_superuser?: boolean;
}

export interface AdminUserUpdate {
  email?: string;
  username?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface CustomAgent {
  name: string;
  description: string;
  content: string;
  enabled: boolean;
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit' | null;
  allowed_tools?: string[] | null;
  [key: string]: unknown;
}

export interface CustomMcp {
  name: string;
  description: string;
  command_type: 'npx' | 'bunx' | 'uvx' | 'http';
  package?: string;
  url?: string;
  env_vars?: Record<string, string>;
  args?: string[];
  enabled: boolean;
  [key: string]: unknown;
}

export interface CustomEnvVar {
  key: string;
  value: string;
  [key: string]: unknown;
}

export interface CustomSkill {
  name: string;
  description: string;
  enabled: boolean;
  size_bytes: number;
  file_count: number;
}

export interface CustomCommand {
  name: string;
  description: string;
  content: string;
  enabled: boolean;
  argument_hint?: string | null;
  allowed_tools?: string[] | null;
  model?:
    | 'claude-sonnet-4-5-20250929'
    | 'claude-opus-4-5-20251101'
    | 'claude-haiku-4-5-20251001'
    | null;
}

export interface CustomPrompt {
  name: string;
  content: string;
}

export type SandboxProviderType = 'docker' | 'host';

export type ProviderType = 'anthropic' | 'openrouter' | 'openai' | 'copilot' | 'glm' | 'a4f' | 'custom';

export interface CustomProviderModel {
  model_id: string;
  name: string;
  enabled: boolean;
}

export interface CustomProvider {
  id: string;
  name: string;
  provider_type: ProviderType;
  base_url: string | null;
  auth_token: string | null;
  enabled: boolean;
  models: CustomProviderModel[];
}

export interface UserSettings {
  id: string;
  user_id: string;
  github_personal_access_token: string | null;
  sandbox_provider: SandboxProviderType | null;
  timezone: string;
  custom_instructions: string | null;
  custom_providers: CustomProvider[] | null;
  custom_agents: CustomAgent[] | null;
  custom_mcps: CustomMcp[] | null;
  custom_env_vars: CustomEnvVar[] | null;
  custom_skills: CustomSkill[] | null;
  custom_slash_commands: CustomCommand[] | null;
  custom_prompts: CustomPrompt[] | null;
  notifications_enabled?: boolean;
  auto_compact_disabled?: boolean;
  attribution_disabled?: boolean;
  enterprise_mode?: boolean;
  created_at: string;
  updated_at: string;
}

export type UserSettingsUpdate = Partial<
  Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export interface AuthSettings {
  pin_enabled: boolean;
  passwordless_enabled: boolean;
}

export interface PINSetupRequest {
  pin: string;
}

export interface PINLoginRequest {
  email: string;
  pin: string;
}

export interface PasswordlessLoginRequest {
  email: string;
}

export interface PasswordlessVerifyRequest {
  email: string;
  code: string;
}

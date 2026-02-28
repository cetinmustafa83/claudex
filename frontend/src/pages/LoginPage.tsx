import { memo, type ReactNode, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, Key, Smartphone, Mail } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/primitives/Button';
import { FieldMessage } from '@/components/ui/primitives/FieldMessage';
import { Input } from '@/components/ui/primitives/Input';
import { Label } from '@/components/ui/primitives/Label';
import { useAuthStore } from '@/store/authStore';
import { useLoginMutation } from '@/hooks/queries/useAuthQueries';
import { isValidEmail } from '@/utils/validation';
import { apiClient } from '@/lib/api';
import { authStorage } from '@/utils/storage';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

type LoginMethod = 'password' | 'pin' | 'passwordless';

interface LoginFormData {
  email: string;
  password: string;
  pin: string;
  code: string;
}

type LoginFormErrors = Partial<Record<keyof LoginFormData, string>>;

interface LoginPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const LoginPageLayout = memo(function LoginPageLayout({
  title,
  subtitle,
  children,
}: LoginPageLayoutProps) {
  return (
    <Layout isAuthPage={true}>
      <div className="flex h-full flex-col bg-surface-secondary dark:bg-surface-dark-secondary">
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="relative z-10 w-full max-w-sm space-y-5">
            <div className="space-y-1.5 text-center">
              <h2 className="animate-fadeIn text-xl font-semibold text-text-primary dark:text-text-dark-primary">
                {title}
              </h2>
              <p className="text-sm text-text-tertiary dark:text-text-dark-tertiary">{subtitle}</p>
            </div>

            <div className="rounded-xl border border-border/50 bg-surface-tertiary p-6 shadow-medium dark:border-border-dark/50 dark:bg-surface-dark-tertiary">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

const validateForm = (values: LoginFormData, method: LoginMethod): LoginFormErrors | null => {
  const errors: LoginFormErrors = {};

  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Invalid email address';
  }

  if (method === 'password' && !values.password) {
    errors.password = 'Password is required';
  }

  if (method === 'pin' && !values.pin) {
    errors.pin = 'PIN is required';
  } else if (method === 'pin' && !/^\d{4,6}$/.test(values.pin)) {
    errors.pin = 'PIN must be 4-6 digits';
  }

  if (method === 'passwordless' && !values.code) {
    errors.code = 'Code is required';
  } else if (method === 'passwordless' && !/^\d{6}$/.test(values.code)) {
    errors.code = 'Code must be 6 digits';
  }

  return Object.keys(errors).length ? errors : null;
};

const getFieldConfigs = (
  onForgotPassword: () => void,
  method: LoginMethod,
  codeSent: boolean,
  onRequestCode: () => void,
): Array<{
  name: keyof LoginFormData;
  label: string;
  placeholder: string;
  type: 'email' | 'password' | 'text' | 'tel';
  action?: ReactNode;
  inputMode?: 'email' | 'numeric' | 'text';
}> => {
  const fields: Array<{
    name: keyof LoginFormData;
    label: string;
    placeholder: string;
    type: 'email' | 'password' | 'text' | 'tel';
    action?: ReactNode;
    inputMode?: 'email' | 'numeric' | 'text';
  }> = [
    {
      name: 'email',
      label: 'Email address',
      placeholder: 'name@example.com',
      type: 'email',
      inputMode: 'email',
    },
  ];

  if (method === 'password') {
    fields.push({
      name: 'password',
      label: 'Password',
      placeholder: 'Enter your password',
      type: 'password',
      action: (
        <Button type="button" variant="link" className="text-xs" onClick={onForgotPassword}>
          Forgot password?
        </Button>
      ),
    });
  }

  if (method === 'pin') {
    fields.push({
      name: 'pin',
      label: 'PIN',
      placeholder: 'Enter 4-6 digit PIN',
      type: 'password',
      inputMode: 'numeric',
    });
  }

  if (method === 'passwordless') {
    fields.push({
      name: 'code',
      label: 'Verification Code',
      placeholder: 'Enter 6-digit code',
      type: 'text',
      inputMode: 'numeric',
      action: !codeSent ? (
        <Button type="button" variant="link" className="text-xs" onClick={onRequestCode}>
          Send Code
        </Button>
      ) : (
        <span className="text-2xs text-text-quaternary dark:text-text-dark-quaternary">
          Code sent!
        </span>
      ),
    });
  }

  return fields;
};

const LOGIN_METHODS: Array<{ id: LoginMethod; label: string; icon: ReactNode }> = [
  { id: 'password', label: 'Password', icon: <Key className="h-3 w-3" /> },
  { id: 'pin', label: 'PIN', icon: <Smartphone className="h-3 w-3" /> },
  { id: 'passwordless', label: 'Email Code', icon: <Mail className="h-3 w-3" /> },
];

export function LoginPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<LoginFormData>({ email: '', password: '', pin: '', code: '' });
  const [errors, setErrors] = useState<LoginFormErrors | null>(null);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [codeSent, setCodeSent] = useState(false);
  const [requestCodeLoading, setRequestCodeLoading] = useState(false);
  const [customLoading, setCustomLoading] = useState(false);

  const loginMutation = useLoginMutation({
    onSuccess: () => {
      useAuthStore.getState().setAuthenticated(true);
      navigate('/');
    },
  });

  const handleChange = (name: keyof LoginFormData, value: string) => {
    if (name === 'pin' || name === 'code') {
      value = value.replace(/\D/g, '').slice(0, name === 'pin' ? 6 : 6);
    }
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev?.[name]) {
        return prev;
      }

      const rest = { ...prev };
      delete rest[name];
      return Object.keys(rest).length ? rest : null;
    });
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleRequestCode = async () => {
    if (!values.email || !isValidEmail(values.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setRequestCodeLoading(true);
    try {
      await apiClient.post('/auth/passwordless/request', { data: { email: values.email } });
      setCodeSent(true);
      toast.success('Verification code sent to your email');
    } catch {
      toast.error('Failed to send code');
    } finally {
      setRequestCodeLoading(false);
    }
  };

  const handlePinLogin = async () => {
    setCustomLoading(true);
    try {
      const response = await apiClient.post<{ access_token: string; refresh_token: string }>('/auth/pin/login', {
        email: values.email,
        pin: values.pin,
      });
      if (response) {
        authStorage.setToken(response.access_token);
        authStorage.setRefreshToken(response.refresh_token);
        useAuthStore.getState().setAuthenticated(true);
        navigate('/');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid email or PIN';
      setErrors({ pin: message });
    } finally {
      setCustomLoading(false);
    }
  };

  const handlePasswordlessLogin = async () => {
    setCustomLoading(true);
    try {
      const response = await apiClient.post<{ access_token: string; refresh_token: string }>('/auth/passwordless/verify', {
        email: values.email,
        code: values.code,
      });
      if (response) {
        authStorage.setToken(response.access_token);
        authStorage.setRefreshToken(response.refresh_token);
        useAuthStore.getState().setAuthenticated(true);
        navigate('/');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid or expired code';
      setErrors({ code: message });
    } finally {
      setCustomLoading(false);
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors = validateForm(values, loginMethod);
      if (validationErrors) {
        setErrors(validationErrors);
        return;
      }

      setErrors(null);

      if (loginMethod === 'pin') {
        await handlePinLogin();
        return;
      }

      if (loginMethod === 'passwordless') {
        await handlePasswordlessLogin();
        return;
      }

      const attemptValues = { ...values };
      loginMutation.mutate(
        {
          username: attemptValues.email,
          password: attemptValues.password,
        },
        {
          onError: (error) => {
            if (error.message.includes('Email not verified')) {
              sessionStorage.setItem('pending_verification_email', attemptValues.email);
              navigate('/verify-email');
            }
          },
        },
      );
    },
    [loginMutation, navigate, values, loginMethod],
  );

  const handleMethodChange = (method: LoginMethod) => {
    setLoginMethod(method);
    setErrors(null);
    setCodeSent(false);
  };

  const title = 'Welcome to Claudex';
  const subtitle = 'Sign in to continue to your account';

  const isSubmitting = loginMutation.isPending || customLoading;
  const error = loginMutation.error?.message;
  const fieldConfigs = getFieldConfigs(handleForgotPassword, loginMethod, codeSent, handleRequestCode);

  return (
    <LoginPageLayout title={title} subtitle={subtitle}>
      {/* Login method tabs */}
      <div className="mb-4 flex rounded-lg border border-border p-1 dark:border-border-dark">
        {LOGIN_METHODS.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => handleMethodChange(method.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors',
              loginMethod === method.id
                ? 'bg-surface-hover text-text-primary dark:bg-surface-dark-hover dark:text-text-dark-primary'
                : 'text-text-tertiary hover:text-text-secondary dark:text-text-dark-tertiary dark:hover:text-text-dark-secondary'
            )}
          >
            {method.icon}
            <span className="hidden sm:inline">{method.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="animate-fadeIn rounded-lg border border-error-500/20 bg-error-500/10 p-3">
            <p className="text-xs font-medium text-error-600 dark:text-error-400">{error}</p>
          </div>
        )}

        <div className="space-y-3.5">
          {fieldConfigs.map(({ name, label, placeholder, type, action, inputMode }) => (
            <div key={name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={name}
                  className="text-xs text-text-secondary dark:text-text-dark-secondary"
                >
                  {label}
                </Label>
                {action}
              </div>
              <Input
                id={name}
                type={type}
                value={values[name]}
                onChange={(e) => handleChange(name, e.target.value)}
                placeholder={placeholder}
                autoComplete={type === 'password' ? 'current-password' : 'email'}
                inputMode={inputMode}
                hasError={Boolean(errors?.[name])}
                className={name === 'pin' || name === 'code' ? 'font-mono text-center tracking-widest' : ''}
              />
              <FieldMessage variant="error">{errors?.[name]}</FieldMessage>
            </div>
          ))}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-5 w-full"
          isLoading={isSubmitting || requestCodeLoading}
          loadingText={requestCodeLoading ? 'Sending code...' : 'Signing in...'}
          loadingIcon={<Loader2 className="h-3.5 w-3.5 animate-spin" />}
        >
          <span>Sign in</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </form>

      <div className="pt-4 text-center">
        <Button
          type="button"
          variant="link"
          className="text-xs"
          onClick={() => navigate('/signup')}
        >
          Don{'\u2019'}t have an account? Create one
        </Button>
      </div>
    </LoginPageLayout>
  );
}

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../Login';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const map: Record<string, string> = {
        'login.title': 'Welcome back',
        'login.subtitle': 'Sign in to track your body composition progress',
        'login.username': 'Email Address',
        'login.usernamePlaceholder': 'Enter your email',
        'login.password': 'Password',
        'login.signIn': 'Sign In',
        'login.signingIn': 'Signing in...',
        'login.noAccount': "Don't have an account?",
        'login.signUp': 'Sign up',
        'login.forgotPassword': 'Forgot password?',
        'login.errorDefault': 'Incorrect email or password',
        'login.emailNotConfirmed': 'Your email address has not been verified yet.',
        'login.verifyNow': 'Verify Now',
        'login.resendCode': 'Resend Code',
        'common.required': 'Please fill in all fields',
      };
      if (key === 'login.codeResent') {
        return `A verification code has been sent to ${options?.email}`;
      }
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../lib/api', () => ({
  api: {
    login: vi.fn(),
    resendVerification: vi.fn(),
  },
}));

describe('Login View', () => {
  const mockOnLoginSuccess = vi.fn();
  const mockOnGoToRegister = vi.fn();
  const mockOnGoToVerify = vi.fn();
  const mockOnGoToForgotPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with email and password inputs and forgot password link', () => {
    render(
      <Login
        onLoginSuccess={mockOnLoginSuccess}
        onGoToRegister={mockOnGoToRegister}
        onGoToVerify={mockOnGoToVerify}
        onGoToForgotPassword={mockOnGoToForgotPassword}
      />
    );

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forgot password?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('triggers onGoToForgotPassword with current email when forgot password button is clicked', () => {
    render(
      <Login
        onLoginSuccess={mockOnLoginSuccess}
        onGoToRegister={mockOnGoToRegister}
        onGoToVerify={mockOnGoToVerify}
        onGoToForgotPassword={mockOnGoToForgotPassword}
      />
    );

    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'forgotme@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));

    expect(mockOnGoToForgotPassword).toHaveBeenCalledWith('forgotme@example.com');
  });

  it('shows unconfirmed email banner with Verify Now and Resend buttons when email is not confirmed', async () => {
    const { api } = await import('../../lib/api');
    vi.mocked(api.login).mockRejectedValueOnce(new Error('EMAIL_NOT_CONFIRMED'));

    render(
      <Login
        onLoginSuccess={mockOnLoginSuccess}
        onGoToRegister={mockOnGoToRegister}
        onGoToVerify={mockOnGoToVerify}
        onGoToForgotPassword={mockOnGoToForgotPassword}
      />
    );

    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'unconfirmed@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Your email address has not been verified yet.')).toBeInTheDocument();
    });

    const verifyBtn = screen.getByRole('button', { name: 'Verify Now' });
    fireEvent.click(verifyBtn);
    expect(mockOnGoToVerify).toHaveBeenCalledWith('unconfirmed@example.com');
  });
});

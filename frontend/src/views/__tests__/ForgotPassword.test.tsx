import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPassword from '../ForgotPassword';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'forgotPassword.title': 'Reset Your Password',
        'forgotPassword.subtitle': 'Enter your registered email address to receive a reset link and 6-digit code.',
        'forgotPassword.emailLabel': 'Email Address',
        'forgotPassword.emailPlaceholder': 'Enter your email',
        'forgotPassword.sendButton': 'Send Reset Link',
        'forgotPassword.sending': 'Sending reset link...',
        'forgotPassword.successTitle': 'Check Your Email',
        'forgotPassword.successMessage': 'If an account exists with that email, a password reset link and 6-digit code have been sent.',
        'forgotPassword.haveCodePrompt': 'Already have a reset code?',
        'forgotPassword.enterCodeButton': 'Enter Code Manually',
        'forgotPassword.backToLogin': 'Back to Sign In',
        'common.validation.invalidEmail': 'Please enter a valid email address',
      };
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../lib/api', () => ({
  api: {
    forgotPassword: vi.fn(),
  },
}));

describe('ForgotPassword View', () => {
  const mockOnGoToLogin = vi.fn();
  const mockOnGoToReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial forgot password request form', () => {
    render(
      <ForgotPassword
        onGoToLogin={mockOnGoToLogin}
        onGoToReset={mockOnGoToReset}
        initialEmail="test@example.com"
      />
    );

    expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toHaveValue('test@example.com');
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Sign In' })).toBeInTheDocument();
  });

  it('submits forgot password request and shows check email success state', async () => {
    const { api } = await import('../../lib/api');
    vi.mocked(api.forgotPassword).mockResolvedValueOnce({
      message: 'Reset email sent',
    });

    render(
      <ForgotPassword
        onGoToLogin={mockOnGoToLogin}
        onGoToReset={mockOnGoToReset}
      />
    );

    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(api.forgotPassword).toHaveBeenCalledWith('user@example.com');
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });

    const enterCodeBtn = screen.getByRole('button', { name: 'Enter Code Manually' });
    fireEvent.click(enterCodeBtn);
    expect(mockOnGoToReset).toHaveBeenCalledWith('user@example.com');
  });

  it('allows jumping directly to code entry if user already has a code', () => {
    render(
      <ForgotPassword
        onGoToLogin={mockOnGoToLogin}
        onGoToReset={mockOnGoToReset}
        initialEmail="preset@example.com"
      />
    );

    const manualCodeBtn = screen.getByRole('button', { name: 'Enter Code Manually' });
    fireEvent.click(manualCodeBtn);
    expect(mockOnGoToReset).toHaveBeenCalledWith('preset@example.com');
  });
});

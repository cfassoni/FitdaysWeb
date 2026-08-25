import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResetPassword from '../ResetPassword';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'resetPassword.title': 'Set New Password',
        'resetPassword.subtitle': 'Create a strong new password for your account',
        'resetPassword.emailLabel': 'Email Address',
        'resetPassword.emailPlaceholder': 'Enter your email',
        'resetPassword.codeLabel': '6-Digit Reset Code',
        'resetPassword.newPasswordLabel': 'New Password',
        'resetPassword.newPasswordPlaceholder': 'Min. 6 characters',
        'resetPassword.confirmPasswordLabel': 'Confirm New Password',
        'resetPassword.confirmPasswordPlaceholder': 'Re-enter your new password',
        'resetPassword.resetButton': 'Reset & Sign In',
        'resetPassword.resetting': 'Resetting password...',
        'resetPassword.passwordMismatch': 'Passwords do not match',
        'resetPassword.passwordLength': 'Password must be at least 6 characters',
        'resetPassword.invalidToken': 'Invalid, expired, or locked reset token. Please request a new reset link.',
        'resetPassword.backToLogin': 'Back to Sign In',
        'resetPassword.requestNewLink': 'Request a new link',
        'common.loading': 'Loading...',
        'common.required': 'Please fill in all fields',
      };
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../lib/api', () => ({
  api: {
    validateResetToken: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

describe('ResetPassword View', () => {
  const mockOnResetSuccess = vi.fn();
  const mockOnGoToLogin = vi.fn();
  const mockOnGoToForgotPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates direct token from URL and presents new password fields directly', async () => {
    const { api } = await import('../../lib/api');
    vi.mocked(api.validateResetToken).mockResolvedValueOnce({
      valid: true,
      email: 'direct@example.com',
    });

    render(
      <ResetPassword
        onResetSuccess={mockOnResetSuccess}
        onGoToLogin={mockOnGoToLogin}
        onGoToForgotPassword={mockOnGoToForgotPassword}
        initialToken="secret-magic-token-xyz"
      />
    );

    await waitFor(() => {
      expect(api.validateResetToken).toHaveBeenCalledWith('secret-magic-token-xyz', undefined);
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
      // Email & 6-digit code inputs are skipped for direct 1-click magic link
      expect(screen.queryByLabelText('Email Address')).not.toBeInTheDocument();
    });
  });

  it('submits password reset with direct token and invokes onResetSuccess', async () => {
    const { api } = await import('../../lib/api');
    vi.mocked(api.validateResetToken).mockResolvedValueOnce({
      valid: true,
      email: 'user@example.com',
    });
    vi.mocked(api.resetPassword).mockResolvedValueOnce({
      access_token: 'fake-jwt-token',
      token_type: 'bearer',
      message: 'Password reset successfully',
    });

    render(
      <ResetPassword
        onResetSuccess={mockOnResetSuccess}
        onGoToLogin={mockOnGoToLogin}
        initialToken="valid-token-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'brandNewPassword123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'brandNewPassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset & Sign In' }));

    await waitFor(() => {
      expect(api.resetPassword).toHaveBeenCalledWith({
        tokenOrCode: 'valid-token-123',
        email: 'user@example.com',
        newPassword: 'brandNewPassword123',
      });
      expect(mockOnResetSuccess).toHaveBeenCalled();
    });
  });

  it('allows manual OTP code entry and resets password', async () => {
    const { api } = await import('../../lib/api');
    vi.mocked(api.resetPassword).mockResolvedValueOnce({
      access_token: 'fake-jwt-token-2',
      token_type: 'bearer',
      message: 'Password reset successfully',
    });

    render(
      <ResetPassword
        onResetSuccess={mockOnResetSuccess}
        onGoToLogin={mockOnGoToLogin}
        initialEmail="manual@example.com"
        initialCode="123456"
      />
    );

    expect(screen.getByLabelText('Email Address')).toHaveValue('manual@example.com');
    expect(screen.getByText('6-Digit Reset Code')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'manualPass999' },
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'manualPass999' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset & Sign In' }));

    await waitFor(() => {
      expect(api.resetPassword).toHaveBeenCalledWith({
        tokenOrCode: '123456',
        email: 'manual@example.com',
        newPassword: 'manualPass999',
      });
      expect(mockOnResetSuccess).toHaveBeenCalled();
    });
  });

  it('shows error state when direct token is invalid or expired', async () => {
    const { api } = await import('../../lib/api');
    vi.mocked(api.validateResetToken).mockResolvedValueOnce({
      valid: false,
    });

    render(
      <ResetPassword
        onResetSuccess={mockOnResetSuccess}
        onGoToLogin={mockOnGoToLogin}
        onGoToForgotPassword={mockOnGoToForgotPassword}
        initialToken="expired-or-bad-token"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Invalid, expired, or locked reset token. Please request a new reset link.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Request a new link' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Request a new link' }));
    expect(mockOnGoToForgotPassword).toHaveBeenCalled();
  });
});

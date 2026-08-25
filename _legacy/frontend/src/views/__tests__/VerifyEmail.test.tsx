import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VerifyEmail from '../VerifyEmail';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const map: Record<string, string> = {
        'verifyEmail.title': 'Email Verification',
        'verifyEmail.enterCodePrompt': 'Enter the 6-digit verification code sent to your email.',
        'verifyEmail.emailLabel': 'Email Address',
        'verifyEmail.emailPlaceholder': 'you@example.com',
        'verifyEmail.codeLabel': '6-Digit Code',
        'verifyEmail.verifyButton': 'Verify Code',
        'verifyEmail.proceedToLogin': 'Proceed to Sign In',
        'verifyEmail.successTitle': 'Email Verified Successfully!',
        'verifyEmail.successMessage': 'Your email has been verified.',
        'verifyEmail.resendCode': 'Resend Code',
        'verifyEmail.backToLogin': 'Back to Sign In',
        'register.verifying': 'Verifying...',
        'common.required': 'Please fill in all fields',
      };
      if (key === 'verifyEmail.codeResent') {
        return `Verification code sent to ${options?.email}`;
      }
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../lib/api', () => ({
  api: {
    verifyCode: vi.fn(),
    verifyEmailLink: vi.fn(),
    resendVerification: vi.fn(),
  },
}));

describe('VerifyEmail View', () => {
  const mockOnGoToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders verify email form elements', () => {
    render(<VerifyEmail onGoToLogin={mockOnGoToLogin} />);

    expect(screen.getByText('Email Verification')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('6-Digit Code')).toBeInTheDocument();
  });

  it('automatically verifies on completing 6-digit code and allows proceeding to login', async () => {
    const { api } = await import('../../lib/api');
    vi.mocked(api.verifyEmailLink).mockResolvedValueOnce({
      message: 'Email verified successfully',
      email: 'user@example.com',
      email_confirmed: true,
    });

    render(<VerifyEmail onGoToLogin={mockOnGoToLogin} initialEmail="user@example.com" />);

    // Paste 6 digits -> triggers auto-verify
    const firstDigit = screen.getByLabelText('Digit 1 of 6');
    fireEvent.paste(firstDigit, {
      clipboardData: {
        getData: () => '654321',
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully!')).toBeInTheDocument();
    });

    const proceedBtn = screen.getByRole('button', { name: 'Proceed to Sign In' });
    fireEvent.click(proceedBtn);
    expect(mockOnGoToLogin).toHaveBeenCalled();
  });

  it('triggers resend verification code and displays feedback', async () => {
    const { api } = await import('../../lib/api');
    vi.mocked(api.resendVerification).mockResolvedValueOnce({
      message: 'Verification code sent',
    });

    render(<VerifyEmail onGoToLogin={mockOnGoToLogin} initialEmail="user@example.com" />);

    const resendBtn = screen.getByRole('button', { name: /Resend Code/ });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(api.resendVerification).toHaveBeenCalledWith('user@example.com');
      expect(screen.getByText('Verification code sent to user@example.com')).toBeInTheDocument();
    });
  });
});

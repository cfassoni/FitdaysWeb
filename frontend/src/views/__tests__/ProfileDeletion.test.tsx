import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Profile from '../Profile';
import { api } from '../../lib/api';
import type { User } from '../../lib/api';
import enTranslations from '../../locales/en.json';

function getTranslation(obj: any, path: string): string {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return path;
    current = current[part];
  }
  return typeof current === 'string' ? current : path;
}

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: any) => {
        if (options?.email) {
          return key.replace('{{email}}', options.email);
        }
        return getTranslation(enTranslations, key) || key;
      },
      i18n: { language: 'en' },
    }),
  };
});

vi.mock('../../lib/api', () => ({
  api: {
    updateProfile: vi.fn(),
    uploadProfilePicture: vi.fn(),
    deleteUserData: vi.fn(),
    deleteAccount: vi.fn(),
    getMe: vi.fn(),
  },
}));

describe('Profile Data Deletion and Account Removal', () => {
  const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    display_name: 'Test User',
    gender: 'male',
    birthday: '1990-01-01',
    height_cm: 180,
    target_weight_kg: 75,
    profile_image_path: null,
    profile_image_url: null,
    preferred_language: 'en',
    email_confirmed: true,
    pending_email: null,
    created_at: '2026-01-01T00:00:00Z',
  };

  const mockOnProfileUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Data Management & Privacy section with both deletion options', () => {
    render(<Profile user={mockUser} onProfileUpdated={mockOnProfileUpdated} />);

    // Switch to Privacy tab
    const privacyTab = screen.getAllByRole('tab', { name: /Privacy/i })[0];
    fireEvent.click(privacyTab);

    expect(screen.getByText('Data Management & Privacy')).toBeInTheDocument();
    expect(screen.getByText('Delete Health & Workout Data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete My Data' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Account' })).toBeInTheDocument();
  });

  it('opens Option A modal and successfully calls deleteUserData', async () => {
    (api.deleteUserData as any).mockResolvedValueOnce({
      message: 'Deleted',
      deleted_records_count: 5,
      deleted_shared_links_count: 2,
    });

    render(<Profile user={mockUser} onProfileUpdated={mockOnProfileUpdated} />);

    // Switch to Privacy tab
    const privacyTab = screen.getAllByRole('tab', { name: /Privacy/i })[0];
    fireEvent.click(privacyTab);

    // Open Delete Data Modal
    fireEvent.click(screen.getByRole('button', { name: 'Delete My Data' }));

    expect(screen.getByRole('heading', { name: 'Delete All Health & Measurement Data' })).toBeInTheDocument();

    // Type password
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    fireEvent.change(passwordInput, { target: { value: 'mypassword123' } });

    // Submit deletion
    const confirmBtn = screen.getByRole('button', { name: 'Yes, Delete Data' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.deleteUserData).toHaveBeenCalledWith('mypassword123');
      expect(screen.getByText('All your health data and shared links have been permanently deleted.')).toBeInTheDocument();
    });
  });

  it('handles error in Option A modal when password is wrong', async () => {
    (api.deleteUserData as any).mockRejectedValueOnce(new Error('Incorrect password'));

    render(<Profile user={mockUser} onProfileUpdated={mockOnProfileUpdated} />);

    // Switch to Privacy tab
    const privacyTab = screen.getAllByRole('tab', { name: /Privacy/i })[0];
    fireEvent.click(privacyTab);

    // Open Delete Data Modal
    fireEvent.click(screen.getByRole('button', { name: 'Delete My Data' }));

    const passwordInput = screen.getByPlaceholderText('Enter your password');
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    const confirmBtn = screen.getByRole('button', { name: 'Yes, Delete Data' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Password is incorrect. Please try again.')).toBeInTheDocument();
    });
  });

  it('opens Option B modal and successfully deletes account and dispatches session expired event', async () => {
    (api.deleteAccount as any).mockResolvedValueOnce({ message: 'Account deleted' });
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<Profile user={mockUser} onProfileUpdated={mockOnProfileUpdated} />);

    // Switch to Privacy tab
    const privacyTab = screen.getAllByRole('tab', { name: /Privacy/i })[0];
    fireEvent.click(privacyTab);

    // Open Delete Account Modal
    fireEvent.click(screen.getByRole('button', { name: 'Delete Account' }));

    expect(screen.getByRole('heading', { name: 'Permanently Delete Account' })).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText('Enter your password');
    fireEvent.change(passwordInput, { target: { value: 'mypassword123' } });

    const confirmBtn = screen.getByRole('button', { name: 'Permanently Delete Account' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.deleteAccount).toHaveBeenCalledWith('mypassword123');
      expect(dispatchSpy).toHaveBeenCalled();
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SharedReports from '../SharedReports';
import type { SharedLink } from '../../lib/api';
import enTranslations from '../../locales/en.json';

// Flatten translations helper for mock
function getTranslation(obj: any, path: string): string {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return path;
    current = current[part];
  }
  return typeof current === 'string' ? current : path;
}

// Mock react-i18next
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: any) => {
        // Handle plural keys or interpolation if needed
        if (key === 'sharing.limitCounter') {
          return `Shared links ${options?.count || 0} of 10`;
        }
        if (key === 'sharing.recordCount') {
          return `${options?.count || 0} records`;
        }
        if (key === 'sharing.accessCount') {
          return `${options?.count || 0} accesses`;
        }
        if (key === 'sharing.lastAccessLabel') {
          return `Last: ${options?.date}`;
        }
        return getTranslation(enTranslations, key) || key;
      },
      i18n: {
        language: 'en',
        changeLanguage: vi.fn().mockResolvedValue(null),
      },
    }),
  };
});

// Mock API Client
const mockLinks: SharedLink[] = [
  {
    id: 'link-123',
    token: 'token-abc-456',
    description: 'Report for Dr. Gordon',
    has_password: true,
    include_attachments: true,
    created_at: '2026-08-01T10:00:00Z',
    expires_at: '2026-08-30T23:59:59Z',
    last_accessed_at: '2026-08-05T14:30:00Z',
    access_count: 3,
    entry_count: 5,
  },
  {
    id: 'link-789',
    token: 'token-xyz-999',
    description: 'Open Link for Coach',
    has_password: false,
    include_attachments: false,
    created_at: '2026-07-01T10:00:00Z',
    expires_at: '2026-07-10T23:59:59Z', // Expired
    last_accessed_at: null,
    access_count: 0,
    entry_count: 2,
  },
];

vi.mock('../../lib/api', () => ({
  api: {
    getSharedLinks: vi.fn(),
    updateSharedLink: vi.fn(),
    deleteSharedLink: vi.fn(),
  },
}));

import { api } from '../../lib/api';

describe('SharedReports View - i18n & Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    vi.mocked(api.getSharedLinks).mockImplementation(() => new Promise(() => {}));
    render(<SharedReports />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders empty state when there are no shared reports', async () => {
    vi.mocked(api.getSharedLinks).mockResolvedValue([]);
    render(<SharedReports />);

    await waitFor(() => {
      expect(screen.getByText('No reports shared yet')).toBeInTheDocument();
    });
    expect(screen.getByText(/Go to the Detailed History view/i)).toBeInTheDocument();
  });

  it('renders shared links table with localized tooltips and content', async () => {
    vi.mocked(api.getSharedLinks).mockResolvedValue(mockLinks);
    render(<SharedReports />);

    await waitFor(() => {
      expect(screen.getByText('Report for Dr. Gordon')).toBeInTheDocument();
    });

    expect(screen.getByText('Shared Reports')).toBeInTheDocument();
    expect(screen.getByText('Manage shared guest access links for doctors, nutritionists, or coaches')).toBeInTheDocument();

    // Verify Action button tooltips
    const copyButtons = screen.getAllByTitle('Copy Link');
    expect(copyButtons.length).toBe(2);

    const editButtons = screen.getAllByTitle('Edit share link details');
    expect(editButtons.length).toBe(2);

    const revokeButtons = screen.getAllByTitle('Revoke shared link immediately');
    expect(revokeButtons.length).toBe(2);

    // Verify localized column headers
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Shared Items')).toBeInTheDocument();
    expect(screen.getByText('Created At')).toBeInTheDocument();
    expect(screen.getByText('Expiry')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('opens the Edit modal and verifies localized Password Security group and controls', async () => {
    vi.mocked(api.getSharedLinks).mockResolvedValue(mockLinks);
    vi.mocked(api.updateSharedLink).mockResolvedValue({
      ...mockLinks[0],
      description: 'Updated Description',
    });

    render(<SharedReports />);

    await waitFor(() => {
      expect(screen.getByText('Report for Dr. Gordon')).toBeInTheDocument();
    });

    // Click Edit button for first link
    const editButtons = screen.getAllByTitle('Edit share link details');
    fireEvent.click(editButtons[0]);

    // Verify Edit Modal Title
    expect(screen.getByRole('heading', { name: 'Edit Shared Report' })).toBeInTheDocument();

    // Verify Password Security Group Header & Radio options
    expect(screen.getByText('Password Security')).toBeInTheDocument();
    expect(screen.getByText('Keep Current Password (if any)')).toBeInTheDocument();
    expect(screen.getByText('Remove Password')).toBeInTheDocument();
    expect(screen.getByText('Change/Set Password')).toBeInTheDocument();

    // Select "Change/Set Password"
    const changePwdRadio = screen.getByLabelText('Change/Set Password');
    fireEvent.click(changePwdRadio);

    // Verify translated placeholder on password input
    const pwdInput = screen.getByPlaceholderText('Enter new password');
    expect(pwdInput).toBeInTheDocument();
    fireEvent.change(pwdInput, { target: { value: 'Secret123!' } });

    // Verify Save Changes button
    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeInTheDocument();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.updateSharedLink).toHaveBeenCalledWith(
        'link-123',
        expect.objectContaining({
          description: 'Report for Dr. Gordon',
          password: 'Secret123!',
        })
      );
    });
  });

  it('opens the Revoke confirmation dialog and verifies localized headers and buttons', async () => {
    vi.mocked(api.getSharedLinks).mockResolvedValue(mockLinks);
    vi.mocked(api.deleteSharedLink).mockResolvedValue(undefined as any);

    render(<SharedReports />);

    await waitFor(() => {
      expect(screen.getByText('Report for Dr. Gordon')).toBeInTheDocument();
    });

    // Click Revoke button
    const revokeButtons = screen.getAllByTitle('Revoke shared link immediately');
    fireEvent.click(revokeButtons[0]);

    // Verify Revoke Dialog Header & confirmation message
    expect(screen.getByRole('heading', { name: 'Revoke Shared Link' })).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to revoke this shared link? It will become inaccessible immediately.')).toBeInTheDocument();

    // Verify Cancel & Revoke buttons
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    const confirmRevokeBtn = screen.getByRole('button', { name: 'Revoke' });
    expect(confirmRevokeBtn).toBeInTheDocument();

    fireEvent.click(confirmRevokeBtn);

    await waitFor(() => {
      expect(api.deleteSharedLink).toHaveBeenCalledWith('link-123');
    });
  });
});

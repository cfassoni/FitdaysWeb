import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TopToolbar from '../TopToolbar';
import type { User } from '../../lib/api';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'sidebar.dashboard': 'Dashboard',
        'sidebar.history': 'Detailed History',
        'sidebar.import': 'Import CSV Data',
        'common.logout': 'Logout',
        'toolbar.toggleMenu': 'Toggle navigation menu',
        'toolbar.supportUs': 'support us!',
        'toolbar.openGithub': 'Open GitHub project (opens in new tab)',
        'toolbar.reportBug': 'report bug',
        'toolbar.openIssues': 'Open issues (opens in new tab)',
        'toolbar.toggleLanguage': 'Change Language: English',
        'toolbar.userMenu': 'User profile menu',
        'toolbar.editProfile': 'Edit Profile',
        'toolbar.logout': 'Logout',
        'toolbar.switchToDark': 'Switch to Dark Mode',
        'toolbar.switchToLight': 'Switch to Light Mode',
      };
      if (key === 'toolbar.currentLanguage') {
        return `Language selector, current language: ${options?.lang || 'English'}`;
      }
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn().mockResolvedValue(null),
    },
  }),
}));

// Mock API Client
vi.mock('../../lib/api', () => ({
  api: {
    updateProfile: vi.fn().mockResolvedValue({
      id: 1,
      login: 'testuser',
      email: 'test@example.com',
      display_name: 'Test User',
      preferred_language: 'es',
    }),
  },
}));

describe('TopToolbar', () => {
  const mockUser: User = {
    id: 1,
    login: 'testuser',
    email: 'test@example.com',
    display_name: 'Test User',
    gender: 'M',
    birthday: '1990-01-01',
    height_cm: 180,
    target_weight_kg: 75,
    profile_image_path: null,
    profile_image_url: null,
    preferred_language: 'en',
    created_at: '2026-06-20T10:00:00Z',
  };

  const mockProps = {
    user: mockUser,
    onLogout: vi.fn(),
    onEditProfile: vi.fn(),
    onUserUpdate: vi.fn(),
    onMobileMenuToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders branding and controls', () => {
    render(<TopToolbar {...mockProps} />);

    // Branding / Logo text should be in document
    expect(screen.getByText('FitdaysWeb')).toBeInTheDocument();

    // External links
    const githubLink = screen.getByTitle('support us!');
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/cfassoni/FitdaysWeb');
    expect(githubLink).toHaveAttribute('target', '_blank');

    const bugLink = screen.getByTitle('report bug');
    expect(bugLink).toBeInTheDocument();
    expect(bugLink).toHaveAttribute('href', 'https://github.com/cfassoni/FitdaysWeb/issues');
    expect(bugLink).toHaveAttribute('target', '_blank');
  });

  it('triggers mobile menu toggle when hamburger icon is clicked', () => {
    render(<TopToolbar {...mockProps} />);

    const menuButton = screen.getByLabelText('Toggle navigation menu');
    fireEvent.click(menuButton);

    expect(mockProps.onMobileMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('opens and interacts with UserMenu options', () => {
    render(<TopToolbar {...mockProps} />);

    // Menu should be closed by default
    expect(screen.queryByRole('menu', { name: 'User options' })).not.toBeInTheDocument();

    // Open User Menu
    const avatarButton = screen.getByLabelText('User profile menu');
    fireEvent.click(avatarButton);

    expect(screen.getByRole('menu', { name: 'User options' })).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    // Edit Profile Click
    const editProfileBtn = screen.getByRole('menuitem', { name: 'Edit Profile' });
    fireEvent.click(editProfileBtn);
    expect(mockProps.onEditProfile).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu', { name: 'User options' })).not.toBeInTheDocument(); // Closes after action

    // Reopen menu for logout test
    fireEvent.click(avatarButton);
    const logoutBtn = screen.getByRole('menuitem', { name: 'Logout' });
    fireEvent.click(logoutBtn);
    expect(mockProps.onLogout).toHaveBeenCalledTimes(1);
  });

  it('closes UserMenu on Escape press and returns focus', () => {
    render(<TopToolbar {...mockProps} />);

    const avatarButton = screen.getByLabelText('User profile menu');
    fireEvent.click(avatarButton);

    const userMenu = screen.getByRole('menu', { name: 'User options' });
    expect(userMenu).toBeInTheDocument();

    // Press escape
    fireEvent.keyDown(userMenu, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: 'User options' })).not.toBeInTheDocument();
    expect(avatarButton).toHaveFocus();
  });

  it('opens LanguageMenu and updates selected language', async () => {
    render(<TopToolbar {...mockProps} />);

    const langButton = screen.getByLabelText(/Language selector/);
    fireEvent.click(langButton);

    // Language list should open
    const langMenu = screen.getByRole('menu', { name: 'Languages' });
    expect(langMenu).toBeInTheDocument();

    // Click Portuguese language
    const ptButton = screen.getByText('Português');
    fireEvent.click(ptButton);

    // Expect mock updateProfile to be called with pt
    const { api } = await import('../../lib/api');
    expect(api.updateProfile).toHaveBeenCalledWith({ preferred_language: 'pt' });
    expect(mockProps.onUserUpdate).toHaveBeenCalled();
  });
});

import type { Meta, StoryObj } from '@storybook/react-vite';
import TopToolbar from './TopToolbar';

const meta: Meta<typeof TopToolbar> = {
  title: 'Components/TopToolbar',
  component: TopToolbar,
  parameters: {
    layout: 'fullscreen',
  },
  // Provide basic mock callbacks
  args: {
    onLogout: () => console.log('logout'),
    onEditProfile: () => console.log('edit profile'),
    onMobileMenuToggle: () => console.log('toggle mobile menu'),
    onUserUpdate: (user) => console.log('user updated:', user),
  },
};

export default meta;
type Story = StoryObj<typeof TopToolbar>;

const mockUser = {
  id: 1,
  login: 'jane_doe',
  email: 'jane.doe@example.com',
  display_name: 'Jane Doe',
  gender: 'F',
  birthday: '1995-05-15',
  height_cm: 168,
  target_weight_kg: 60,
  profile_image_path: null,
  profile_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  preferred_language: 'en',
  created_at: '2026-06-20T10:00:00Z',
};

export const Desktop: Story = {
  args: {
    user: mockUser,
  },
};

export const Mobile: Story = {
  args: {
    user: mockUser,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const NoAvatar: Story = {
  args: {
    user: {
      ...mockUser,
      profile_image_url: null,
    },
  },
};

export const Guest: Story = {
  args: {
    user: null,
  },
};

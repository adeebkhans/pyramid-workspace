import type { Metadata } from 'next';

import { ProfileSettings } from '@/features/settings/profile-settings';

export const metadata: Metadata = { title: 'Profile settings' };

export default function SettingsPage() {
  return <ProfileSettings />;
}

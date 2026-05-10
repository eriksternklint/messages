import { BottomNav } from '@/components/BottomNav';
import { ProfileView } from '@/components/ProfileView';

export default function ProfilePage() {
  return (
    <main className="bg-zinc-950 min-h-screen">
      <ProfileView />
      <BottomNav active="profile" />
    </main>
  );
}

import { getStories } from '@/lib/store';
import { FeedScroll } from '@/components/FeedScroll';
import { BottomNav } from '@/components/BottomNav';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FeedPage() {
  const stories = await getStories();

  return (
    <main className="relative bg-zinc-950">
      <FeedScroll initialStories={stories} />
      <BottomNav active="feed" />
    </main>
  );
}

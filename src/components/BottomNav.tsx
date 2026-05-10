'use client';
import Link from 'next/link';

interface Props {
  active: 'feed' | 'profile';
}

export function BottomNav({ active }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-xl border-t border-white/10 h-16 flex items-center">
      <div className="flex w-full max-w-md mx-auto">
        <Link
          href="/feed"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            active === 'feed' ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <svg className="w-5 h-5" fill={active === 'feed' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <span className="text-[10px] font-medium">Feed</span>
        </Link>
        <Link
          href="/profile"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            active === 'profile' ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <svg className="w-5 h-5" fill={active === 'profile' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}

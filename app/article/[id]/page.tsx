import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStoryById } from '@/lib/store';
import { SourceBadge } from '@/components/SourceBadge';
import { BiasBar } from '@/components/BiasBar';
import { ArticleShareButton } from '@/components/ArticleShareButton';
import { CATEGORY_EMOJI } from '@/types/news';

export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const story = await getStoryById(params.id);
  if (!story) notFound();

  const uniqueSources = Array.from(
    new Map(story.sources.map((s) => [s.sourceId, s])).values()
  );

  const paragraphs = story.summary.split('\n').filter(Boolean);
  const timeAgo = formatTimeAgo(story.publishedAt);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-28">
      {/* Hero image */}
      <div className="relative w-full aspect-[16/9] max-h-[45vh] overflow-hidden">
        <img
          src={story.imageUrl}
          alt={story.headline}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />

        {/* Back button */}
        <Link
          href="/feed"
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </div>

      <div className="px-5 pt-5 max-w-2xl mx-auto">
        {/* Category + time */}
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
          <span>{CATEGORY_EMOJI[story.category]}</span>
          <span className="capitalize font-medium text-gray-300">{story.category}</span>
          <span>·</span>
          <span>{timeAgo}</span>
          <span>·</span>
          <span>{story.sources.length} source{story.sources.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-bold leading-tight mb-4">{story.headline}</h1>

        {/* Bias bar */}
        <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Coverage Spectrum</p>
          <BiasBar score={story.biasScore} size="md" />
        </div>

        {/* Voice of Reason */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <span className="text-amber-400 text-sm">⚖</span>
            </div>
            <h2 className="font-semibold text-lg">Voice of Reason</h2>
          </div>
          <div className="space-y-3">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-gray-200 leading-relaxed text-[15px]">
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* What This Means */}
        <section className="mb-6 p-4 rounded-xl bg-blue-950/30 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400 text-lg">💡</span>
            <h2 className="font-semibold">What This Means</h2>
          </div>
          <p className="text-gray-200 leading-relaxed text-[15px]">{story.whatItMeans}</p>
        </section>

        {/* Left vs Right (if applicable) */}
        {story.hasBiasContrast && story.leftPerspective && story.rightPerspective && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3 text-gray-300 uppercase text-xs tracking-wider">How It's Being Covered</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/25">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">The Left Says</span>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{story.leftPerspective}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/25">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="text-xs font-semibold text-red-300 uppercase tracking-wide">The Right Says</span>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{story.rightPerspective}</p>
              </div>
            </div>
          </section>
        )}

        {/* Tags */}
        {story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {story.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-white/8 text-gray-300 text-xs border border-white/10">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Long Reads */}
        <section className="mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <span>📚</span> Long Reads
            <span className="text-xs text-gray-400 font-normal ml-1">Read the original sources</span>
          </h2>
          <div className="space-y-2">
            {uniqueSources.map((src) => (
              <a
                key={src.sourceId}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <SourceBadge name={src.sourceName} lean={src.sourceLean} size="sm" />
                  </div>
                  <p className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors line-clamp-2">
                    {src.title}
                  </p>
                  {src.description && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{src.description}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1 group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </section>

        {/* Share */}
        <ArticleShareButton story={story} />
      </div>
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

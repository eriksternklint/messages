import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Linking,
  Share,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';

// Point this to your deployed web app or local dev server
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface Story {
  id: string;
  headline: string;
  summary: string;
  category: string;
  imageUrl: string;
  biasScore: number;
  hasBiasContrast: boolean;
  sources: Array<{ sourceName: string; sourceLean: string }>;
  publishedAt: string;
  tags: string[];
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CATEGORY_EMOJI: Record<string, string> = {
  politics: '🏛️', world: '🌍', business: '💼', technology: '💻',
  science: '🔬', health: '🏥', sports: '⚽', entertainment: '🎬',
  environment: '🌿', crime: '🔒', culture: '🎭', other: '📰',
};

const LEAN_COLOR: Record<string, string> = {
  'far-left': '#a855f7', left: '#3b82f6', center: '#22c55e',
  right: '#ef4444', 'far-right': '#7f1d1d',
};

function FeedCard({ story, isActive }: { story: Story; isActive: boolean }) {
  const uniqueSources = Array.from(new Map(story.sources.map((s) => [s.sourceLean, s])).values()).slice(0, 3);

  async function shareStory() {
    await Share.share({
      message: `📰 ${story.headline}\n\nRead the full balanced story on Prism:\n${API_BASE}/article/${story.id}`,
      url: `${API_BASE}/article/${story.id}`,
    });
  }

  return (
    <ImageBackground
      source={{ uri: story.imageUrl }}
      style={[styles.card, { height: SCREEN_HEIGHT }]}
      imageStyle={{ resizeMode: 'cover' }}
    >
      {/* Gradient overlay */}
      <View style={styles.overlay} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>PRISM</Text>
        <Text style={styles.category}>{CATEGORY_EMOJI[story.category] ?? '📰'} {story.category}</Text>
      </View>

      {/* Bottom content */}
      <View style={styles.bottomContent}>
        {/* Source chips */}
        <View style={styles.sourceRow}>
          {uniqueSources.map((s, i) => (
            <View key={i} style={[styles.sourceChip, { borderColor: LEAN_COLOR[s.sourceLean] + '80' }]}>
              <View style={[styles.sourceDot, { backgroundColor: LEAN_COLOR[s.sourceLean] }]} />
              <Text style={styles.sourceText}>{s.sourceName}</Text>
            </View>
          ))}
          {story.hasBiasContrast && (
            <View style={styles.biasChip}>
              <View style={[styles.sourceDot, { backgroundColor: '#3b82f6' }]} />
              <View style={[styles.sourceDot, { backgroundColor: '#ef4444', marginLeft: 2 }]} />
              <Text style={styles.sourceText}>L + R</Text>
            </View>
          )}
        </View>

        {/* Headline */}
        <TouchableOpacity onPress={() => router.push(`/article/${story.id}` as any)}>
          <Text style={styles.headline}>{story.headline}</Text>
        </TouchableOpacity>

        {/* Summary excerpt */}
        <Text style={styles.excerpt} numberOfLines={2}>
          {story.summary.split('\n')[0]}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={shareStory} style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/article/${story.id}` as any)} style={styles.readBtn}>
            <Text style={styles.readBtnText}>Read more →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

export default function FeedScreen() {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/feed`)
      .then((r) => r.json())
      .then((d) => setStories(d.stories ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading Prism…</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={stories}
      keyExtractor={(s) => s.id}
      renderItem={({ item, index }) => (
        <FeedCard story={item} isActive={index === activeIndex} />
      )}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={SCREEN_HEIGHT}
      decelerationRate="fast"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
      getItemLayout={(_, index) => ({ length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * index, index })}
    />
  );
}

const styles = StyleSheet.create({
  card: { width: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    background: undefined,
  },
  topBar: { position: 'absolute', top: 56, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  appName: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 17 },
  category: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  bottomContent: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
  },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  sourceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  biasChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sourceDot: { width: 7, height: 7, borderRadius: 4 },
  sourceText: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
  headline: {
    color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 30,
    marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4,
  },
  excerpt: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shareBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  shareBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  readBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#f59e0b',
  },
  readBtnText: { color: '#000', fontSize: 13, fontWeight: '700' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' },
  loadingText: { color: '#f59e0b', fontSize: 16, fontWeight: '600' },
});

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Linking, Share, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface Story {
  id: string;
  headline: string;
  summary: string;
  whatItMeans: string;
  leftPerspective?: string;
  rightPerspective?: string;
  hasBiasContrast: boolean;
  category: string;
  imageUrl: string;
  biasScore: number;
  tags: string[];
  publishedAt: string;
  sources: Array<{ sourceId: string; sourceName: string; sourceLean: string; title: string; description: string; url: string }>;
}

const LEAN_COLOR: Record<string, string> = {
  'far-left': '#a855f7', left: '#3b82f6', center: '#22c55e',
  right: '#ef4444', 'far-right': '#7f1d1d',
};

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/api/article/${id}`)
      .then((r) => r.json())
      .then(setStory)
      .catch(console.error);
  }, [id]);

  async function shareStory() {
    if (!story) return;
    await Share.share({
      message: `📰 ${story.headline}\n\nFull balanced coverage on Prism:\n${API_BASE}/article/${story.id}`,
    });
  }

  if (!story) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const paragraphs = story.summary.split('\n').filter(Boolean);
  const uniqueSources = Array.from(new Map(story.sources.map((s) => [s.sourceId, s])).values());

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero image */}
        <Image source={{ uri: story.imageUrl }} style={styles.heroImage} resizeMode="cover" />

        <View style={styles.content}>
          {/* Category + time */}
          <Text style={styles.meta}>{story.category.toUpperCase()} · {formatTimeAgo(story.publishedAt)}</Text>

          {/* Headline */}
          <Text style={styles.headline}>{story.headline}</Text>

          {/* Voice of Reason */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚖ Voice of Reason</Text>
            {paragraphs.map((p, i) => (
              <Text key={i} style={styles.body}>{p}</Text>
            ))}
          </View>

          {/* What This Means */}
          <View style={[styles.section, { backgroundColor: '#1e2a3a', borderColor: '#3b82f640' }]}>
            <Text style={styles.sectionTitle}>💡 What This Means</Text>
            <Text style={styles.body}>{story.whatItMeans}</Text>
          </View>

          {/* Left vs Right */}
          {story.hasBiasContrast && story.leftPerspective && story.rightPerspective && (
            <View style={styles.biasRow}>
              <View style={[styles.biasCard, { borderColor: '#3b82f640' }]}>
                <Text style={[styles.biasTitle, { color: '#3b82f6' }]}>⬤ The Left Says</Text>
                <Text style={styles.biasBody}>{story.leftPerspective}</Text>
              </View>
              <View style={[styles.biasCard, { borderColor: '#ef444440' }]}>
                <Text style={[styles.biasTitle, { color: '#ef4444' }]}>⬤ The Right Says</Text>
                <Text style={styles.biasBody}>{story.rightPerspective}</Text>
              </View>
            </View>
          )}

          {/* Long Reads */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Long Reads</Text>
            {uniqueSources.map((src) => (
              <TouchableOpacity
                key={src.sourceId}
                style={styles.sourceCard}
                onPress={() => Linking.openURL(src.url)}
              >
                <View style={[styles.sourceChip, { borderColor: LEAN_COLOR[src.sourceLean] + '80' }]}>
                  <View style={[styles.dot, { backgroundColor: LEAN_COLOR[src.sourceLean] }]} />
                  <Text style={styles.chipText}>{src.sourceName}</Text>
                </View>
                <Text style={styles.sourceTitle} numberOfLines={2}>{src.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Share button */}
      <TouchableOpacity style={styles.shareButton} onPress={shareStory}>
        <Text style={styles.shareButtonText}>Share this story</Text>
      </TouchableOpacity>
    </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' },
  loadingText: { color: '#f59e0b', fontSize: 16 },
  backBtn: { position: 'absolute', top: 56, left: 16, zIndex: 10, padding: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  heroImage: { width: '100%', height: 220 },
  content: { padding: 20 },
  meta: { color: '#6b7280', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  headline: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 30, marginBottom: 16 },
  section: {
    marginBottom: 16, padding: 14, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: { color: '#f59e0b', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  body: { color: '#d1d5db', fontSize: 14, lineHeight: 22, marginBottom: 8 },
  biasRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  biasCard: {
    flex: 1, padding: 12, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1,
  },
  biasTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  biasBody: { color: '#d1d5db', fontSize: 12, lineHeight: 18 },
  sourceCard: {
    padding: 12, marginBottom: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sourceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  sourceTitle: { color: '#d1d5db', fontSize: 13, fontWeight: '500' },
  shareButton: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    backgroundColor: '#f59e0b', padding: 14, borderRadius: 14, alignItems: 'center',
  },
  shareButtonText: { color: '#000', fontSize: 15, fontWeight: '700' },
});

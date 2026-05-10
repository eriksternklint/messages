import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface ProfileData {
  biasScore: number;
  biasLabel: string;
  upToDatePct: number;
  topCategories: Array<{ category: string; pct: number }>;
  storiesViewed: number;
  storiesRead: number;
  totalReadTime: number;
}

const CATEGORY_EMOJI: Record<string, string> = {
  politics: '🏛️', world: '🌍', business: '💼', technology: '💻',
  science: '🔬', health: '🏥', sports: '⚽', entertainment: '🎬',
  environment: '🌿', crime: '🔒', culture: '🎭', other: '📰',
};

export default function ProfileScreen() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    try {
      const raw = await AsyncStorage.getItem('prism_interactions');
      const interactions = raw ? JSON.parse(raw) : [];
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactions }),
      });
      setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, []);

  function clearHistory() {
    Alert.alert('Reset History', 'This will clear all your reading data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          await AsyncStorage.multiRemove(['prism_interactions', 'prism_liked']);
          loadProfile();
        },
      },
    ]);
  }

  function formatTime(s: number) {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>Your reading habits, visualized without judgment.</Text>
      </View>

      {loading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : (
        <>
          {/* Up to date */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>HOW UP TO DATE</Text>
            <Text style={[styles.bigNumber, { color: (data?.upToDatePct ?? 0) >= 70 ? '#22c55e' : '#f59e0b' }]}>
              {data?.upToDatePct ?? 0}%
            </Text>
            <Text style={styles.cardSub}>of today's stories</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { label: 'Viewed', value: data?.storiesViewed ?? 0 },
              { label: 'Read', value: data?.storiesRead ?? 0 },
              { label: 'Time', value: formatTime(data?.totalReadTime ?? 0) },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Coverage spectrum */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>COVERAGE SPECTRUM</Text>
            <Text style={styles.biasLabel}>{data?.biasLabel ?? 'Balanced'}</Text>
            <View style={styles.biasBar}>
              <View style={styles.biasTrack} />
              <View style={[styles.biasMarker, { left: `${((( data?.biasScore ?? 0) + 2) / 4) * 100}%` as any }]} />
            </View>
            <View style={styles.biasLabels}>
              <Text style={styles.biasEdge}>Far Left</Text>
              <Text style={styles.biasEdge}>Far Right</Text>
            </View>
          </View>

          {/* Top categories */}
          {data?.topCategories && data.topCategories.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>YOUR TOP CATEGORIES</Text>
              {data.topCategories.map(({ category, pct }) => (
                <View key={category} style={styles.catRow}>
                  <Text style={styles.catEmoji}>{CATEGORY_EMOJI[category] ?? '📰'}</Text>
                  <View style={styles.catBarContainer}>
                    <View style={styles.catMeta}>
                      <Text style={styles.catName}>{category}</Text>
                      <Text style={styles.catPct}>{pct}%</Text>
                    </View>
                    <View style={styles.catBg}>
                      <View style={[styles.catFill, { width: `${pct}%` as any }]} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Explanation */}
          <View style={[styles.card, { borderColor: '#f59e0b40' }]}>
            <Text style={[styles.cardLabel, { color: '#f59e0b' }]}>HOW YOUR FEED WORKS</Text>
            <Text style={styles.cardBody}>
              Your feed is personalized by <Text style={{ fontWeight: '700' }}>topic and category</Text>, never by political lean.
              We mix sources from across the spectrum so you always see the full picture.
            </Text>
          </View>

          <TouchableOpacity onPress={clearHistory} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset reading history</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#18181b' },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#9ca3af', fontSize: 13, marginTop: 4 },
  loading: { color: '#f59e0b', textAlign: 'center', paddingTop: 40, fontSize: 15 },
  card: {
    marginHorizontal: 16, marginTop: 12, padding: 16,
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cardLabel: { color: '#6b7280', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  cardSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  cardBody: { color: '#d1d5db', fontSize: 13, lineHeight: 20 },
  bigNumber: { fontSize: 48, fontWeight: '900' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 8 },
  statCard: {
    flex: 1, padding: 12, borderRadius: 16, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  biasLabel: { color: '#d1d5db', fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  biasBar: { height: 8, position: 'relative', marginVertical: 4 },
  biasTrack: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  biasMarker: {
    position: 'absolute', top: -3, width: 14, height: 14,
    borderRadius: 7, backgroundColor: '#f59e0b', borderWidth: 2, borderColor: '#fff',
    transform: [{ translateX: -7 }],
  },
  biasLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  biasEdge: { color: '#6b7280', fontSize: 10 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  catEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  catBarContainer: { flex: 1 },
  catMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName: { color: '#d1d5db', fontSize: 13, textTransform: 'capitalize' },
  catPct: { color: '#6b7280', fontSize: 12 },
  catBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  catFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 3 },
  resetBtn: {
    marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  resetText: { color: '#6b7280', fontSize: 13 },
});

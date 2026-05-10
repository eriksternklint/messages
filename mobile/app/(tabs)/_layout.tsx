import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000', borderTopColor: '#ffffff18' },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Feed', tabBarIcon: ({ color }) => <TabIcon name="feed" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} /> }} />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  // Simple text icons — replace with react-native-vector-icons if desired
  return null;
}

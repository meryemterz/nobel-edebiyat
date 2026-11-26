
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

const RENK = {
  arkaPlan: '#101C2B',
  altin: '#DAB978',
  gri: '#AAB7C6',
  kenar: '#35445A',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: RENK.arkaPlan,
          borderTopColor: RENK.kenar,
          borderTopWidth: 1,
          height: 65,
          paddingTop: 7,
          paddingBottom: 8,
        },

        tabBarActiveTintColor: RENK.altin,
        tabBarInactiveTintColor: RENK.gri,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="compass-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: 'Kaydedilenler',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="bookmark-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

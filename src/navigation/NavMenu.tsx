// src/components/NavMenu.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../AuthContext/AuthContext';
import { getUnreadSummary, markSectionSeen, UnreadSummary } from '../api/unreadApi';

type Props = { userId: number; };

const NavMenu: React.FC<Props> = ({ userId }) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const [open, setOpen] = useState(false);
  const slideX = useRef(new Animated.Value(300)).current;

  const [summary, setSummary] = useState<UnreadSummary>({
    buddies: 0, invites: 0, sessions: 0, reviews: 0, messages: 0,
  });

  const loadSummary = useCallback(async () => {
    try {
      const s = await getUnreadSummary(userId);
      setSummary(s);
    } catch { /* ignore */ }
  }, [userId]);

  // Refresh when drawer opens
  useEffect(() => {
    Animated.timing(slideX, {
      toValue: open ? 0 : 300,
      duration: 220,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
    if (open) loadSummary();
  }, [open, slideX, loadSummary]);

  // Also refresh whenever the screen regains focus
  useFocusEffect(useCallback(() => { loadSummary(); }, [loadSummary]));

  const go = async (screen: string, params?: any, sectionToMark?: keyof UnreadSummary) => {
    setOpen(false);
    // Clear dot server-side (best effort) and locally optimistic
    if (sectionToMark) {
      try { await markSectionSeen(userId, sectionToMark); } catch {}
      setSummary(s => ({ ...s, [sectionToMark]: 0 }));
    }
    requestAnimationFrame(() => navigation.navigate(screen as never, params as never));
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  const top = (insets.top ?? 0) + 8;
  const right = (insets.right ?? 0) + 12;

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Open navigation menu"
        onPress={() => setOpen(true)}
        activeOpacity={0.9}
        hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        style={[styles.fab, { top, right }]}
      >
        <Feather name="menu" size={22} color="#121212" />
      </TouchableOpacity>

      {open && <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />}

      <Animated.View
        style={[
          styles.panel,
          { transform: [{ translateX: slideX }], paddingTop: (insets.top ?? 0) + 14 },
        ]}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.brand}>Heka.Fit</Text>
          <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
            <Feather name="x" size={22} color="#ddd" />
          </TouchableOpacity>
        </View>

        <View style={styles.menu}>
          <MenuItem label="Home" onPress={() => go('UserProfile', { id: userId })} />
          <MenuItem label="Dashboard" onPress={() => go('Dashboard', { id: userId })} />

          <MenuItem
            label="Gym Buddies"
            showDot={summary.buddies > 0}
            onPress={() => go('GymBuddies', { id: userId }, 'buddies')}
          />

          <MenuItem
            label="Scheduled Sessions"
            showDot={summary.sessions > 0}
            onPress={() => go('ScheduledSessions', { id: userId }, 'sessions')}
          />

          <MenuItem
            label="Pending Invites"
            showDot={summary.invites > 0}
            onPress={() => go('PendingInvites', { id: userId }, 'invites')}
          />

          {/* If/when you add a Reviews screen */}
          {/* <MenuItem
            label="Reviews"
            showDot={summary.reviews > 0}
            onPress={() => go('Reviews', { id: userId }, 'reviews')}
          /> */}

          {/* If you have a Messages screen, show global unread here */}
          {/* <MenuItem
            label="Messages"
            showDot={summary.messages > 0}
            onPress={() => go('Messages', { id: userId }, 'messages')}
          /> */}

          <MenuItem label="Onboarding" onPress={() => go('Onboarding', { id: userId })} />
          <MenuItem
            label="Delete account"
            destructive
            onPress={() => go('DeleteAccount', { id: userId })}
          />
          <MenuItem label="Log out" destructive onPress={handleLogout} />
        </View>
      </Animated.View>
    </>
  );
};

const MenuItem = ({
  label,
  onPress,
  destructive = false,
  showDot = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  showDot?: boolean;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.item}>
    <Text style={[styles.itemText, destructive && styles.destructive]}>{label}</Text>
    {showDot && <View style={styles.dot} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    borderRadius: 999,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 50,
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 40 },
  panel: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: 260,
    backgroundColor: '#181818', borderLeftWidth: 1, borderLeftColor: '#2a2a2a', zIndex: 50,
  },
  panelHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    justifyContent: 'space-between', marginBottom: 8,
  },
  brand: { color: '#FFD700', fontWeight: '700', fontSize: 18 },
  closeBtn: { padding: 8, marginRight: -4 },
  menu: { paddingHorizontal: 8, paddingVertical: 4 },
  item: {
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, marginVertical: 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  itemText: { color: '#e5e5e5', fontSize: 16, fontWeight: '600' },
  destructive: { color: '#EF4444' },
  // ◽ White dot
  dot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff',
    marginLeft: 8,
  },
});

export default NavMenu;

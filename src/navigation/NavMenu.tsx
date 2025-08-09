// src/components/NavMenu.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../AuthContext/AuthContext'; // <— import useAuth

type Props = {
  userId: number;
};

const NavMenu: React.FC<Props> = ({ userId }) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth(); // <— get logout

  const [open, setOpen] = useState(false);
  const slideX = useRef(new Animated.Value(300)).current; // hidden to the right

  useEffect(() => {
    Animated.timing(slideX, {
      toValue: open ? 0 : 300,
      duration: 220,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [open, slideX]);

  const go = (screen: string, params?: any) => {
    setOpen(false);
    requestAnimationFrame(() => {
      navigation.navigate(screen as never, params as never);
    });
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout(); // clears user+token and AuthWrapper renders AuthStack -> Login
  };

  const top = (insets.top ?? 0) + 8;
  const right = (insets.right ?? 0) + 12;

  return (
    <>
      {/* Floating hamburger button — TOP RIGHT, safe-area aware */}
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

      {/* Backdrop */}
      {open && <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />}

      {/* Slide-in panel (pad for safe area at top) */}
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateX: slideX }],
            paddingTop: (insets.top ?? 0) + 14,
          },
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
          <MenuItem label="Gym Buddies" onPress={() => go('GymBuddies', { id: userId })} />
          <MenuItem label="Scheduled Sessions" onPress={() => go('ScheduledSessions', { id: userId })} />
          <MenuItem label="Pending Invites" onPress={() => go('PendingInvites', { id: userId })} />
          <MenuItem label="Onboarding" onPress={() => go('Onboarding', { id: userId })} />
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
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.item}>
    <Text style={[styles.itemText, destructive && styles.destructive]}>{label}</Text>
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 40,
  },
  panel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 260,
    backgroundColor: '#181818',
    borderLeftWidth: 1,
    borderLeftColor: '#2a2a2a',
    zIndex: 50,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brand: { color: '#FFD700', fontWeight: '700', fontSize: 18 },
  closeBtn: {
    padding: 8,
    marginRight: -4,
  },
  menu: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 2,
  },
  itemText: {
    color: '#e5e5e5',
    fontSize: 16,
    fontWeight: '600',
  },
  destructive: {
    color: '#EF4444',
  },
});

export default NavMenu;

// src/screens/User/DashboardScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getUserProgress } from '../../api/progressApi';

type DashboardRoute = RouteProp<RootStackParamList, 'Dashboard'>;

const Card = ({
  title,
  icon,
  onPress,
  children,
}: {
  title: string;
  icon: string;
  children?: React.ReactNode;
  onPress?: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={!onPress}>
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children ? <Text style={styles.cardText}>{children}</Text> : null}
    </View>
  </TouchableOpacity>
);

type RawProgress = {
  recorded_at: string;
  weight: number;
  body_fat_percentage: number;
};

const DashboardScreen = () => {
  const route = useRoute<DashboardRoute>();
  const { id } = route.params;
  const navigation = useNavigation<any>();

  // Inline progress preview
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RawProgress[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getUserProgress(Number(id));
        setRows(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error(e);
        setError('Failed to load progress.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const { labels, weightData, bodyFatData } = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    const labels = sorted.map(p =>
      new Date(p.recorded_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
    );
    const weightData = sorted.map(p => Number(p.weight));
    const bodyFatData = sorted.map(p => Number(p.body_fat_percentage));
    return { labels, weightData, bodyFatData };
  }, [rows]);

  const chartWidth = Dimensions.get('window').width - 24;
  const chartHeight = 220;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Dashboard</Text>
        <Text style={styles.headerSub}>Command Your Body. Direct Your Journey.</Text>
      </View>

      <View style={styles.grid}>
        <Card
          title="Find Gym Buddies"
          icon="🤝"
          onPress={() => navigation.navigate('Matches', { id })}
        >
          Discover partners at your home gym.
        </Card>

        <Card
          title="Log Progress"
          icon="📈"
          onPress={() => navigation.navigate('ProgressForm', { id })}
        >
          Weight & body fat updates.
        </Card>

        <Card
          title="Chat with Gym Buddies"
          icon="💬"
          onPress={() => navigation.navigate('GymBuddies', { id })}
        >
          Messages & scheduled sessions.
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Chart</Text>
        <View style={styles.chartWrap}>
          {loading ? (
            <View style={styles.center}><ActivityIndicator size="large" /></View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : !labels.length ? (
            <Text style={styles.empty}>No progress yet. Log some entries to see your chart.</Text>
          ) : (
            <LineChart
              data={{
                labels,
                datasets: [
                  { 
                    data: weightData,
                    strokeWidth: 2,
                    withDots: true,
                    color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`, // Weight: gold
                },
                  { 
                    data: bodyFatData,
                    strokeWidth: 2,
                    withDots: true,
                    color: (opacity = 1) => `rgba(0, 229, 168, ${opacity})`, // Body fat: teal
                },
                ],
                legend: ['Weight (lbs)', 'Body Fat (%)'],
              }}
              width={chartWidth}
              height={chartHeight}
              bezier
              chartConfig={{
                backgroundColor: '#1e1e1e',
                backgroundGradientFrom: '#1e1e1e',
                backgroundGradientTo: '#1e1e1e',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(220, 220, 220, ${opacity})`,
                propsForBackgroundLines: { stroke: '#333' },
                useShadowColorFromDataset: false,
                fillShadowGradient: '#00000000',
                fillShadowGradientOpacity: 0,
              }}
              style={styles.chart}
            />
          )}
        </View>

        <View style={{ padding: 16 }}>
            <TouchableOpacity
                style={styles.navButton}
                onPress={() => navigation.navigate('UserProfile', { id })}
            >
                <Text style={styles.navButtonText}>⬅ Back to Home</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121212' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#aaa', fontSize: 12, marginTop: 2 },
  grid: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardIcon: { fontSize: 22, marginRight: 8 },
  cardTitle: { color: '#FFD700', fontSize: 16, fontWeight: '600' },
  cardText: { color: '#d4d4d4' },
  section: { paddingHorizontal: 16, paddingBottom: 16 },
  sectionTitle: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
  },
  chartWrap: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  chart: { borderRadius: 12 },
  center: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#EF4444', textAlign: 'center', paddingVertical: 8 },
  empty: { color: '#ccc', textAlign: 'center', paddingVertical: 8 },
  navButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  navButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

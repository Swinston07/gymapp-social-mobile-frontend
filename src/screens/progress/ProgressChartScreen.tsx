// src/screens/User/ProgressChartScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { getUserProgress } from '../../api/progressApi';
import { View, Text, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

type ProgressChartRoute = RouteProp<RootStackParamList, 'ProgressChart'>;

type RawProgress = {
  recorded_at: string; // ISO
  weight: number;
  body_fat_percentage: number;
};

const ProgressChartScreen = () => {
  const route = useRoute<ProgressChartRoute>();
  const { id: userId } = route.params;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RawProgress[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getUserProgress(Number(userId));
        setRows(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error(e);
        setError('Failed to load progress.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!labels.length) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.empty}>No progress yet. Log some entries to see your chart.</Text>
      </SafeAreaView>
    );
  }

  const width = Dimensions.get('window').width - 24; // padding
  const height = 280;

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Progress</Text>
      <View style={styles.chartWrap}>
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
          width={width}
          height={height}
          bezier
          chartConfig={{
            backgroundColor: '#1e1e1e',
            backgroundGradientFrom: '#1e1e1e',
            backgroundGradientTo: '#1e1e1e',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // axes & legend
            labelColor: (opacity = 1) => `rgba(220, 220, 220, ${opacity})`,
            propsForBackgroundLines: { stroke: '#333' },
            useShadowColorFromDataset: true, // <- apply per-dataset colors
          }}
          style={styles.chart}
        />
      </View>
    </SafeAreaView>
  );
};

export default ProgressChartScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 12, paddingTop: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#FFD700', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 8 },
  chartWrap: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  error: { color: '#EF4444', textAlign: 'center', marginTop: 20 },
  empty: { color: '#ccc', textAlign: 'center', marginTop: 20 },
  chart: { borderRadius: 12, marginVertical: 8 },
});
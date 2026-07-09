import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';

// Mock showtimes - in production replace with theater API (e.g. Fandango, Google Movies)
function useShowtimes(lat, lon) {
  const [loading, setLoading] = useState(!!(lat && lon));
  const [showtimes, setShowtimes] = useState([]);
  useEffect(() => {
    if (!lat || !lon) {
      setShowtimes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setShowtimes([
        { theater: 'AMC Classic', movie: 'Dinner & a Movie', times: ['4:00 PM', '6:30 PM', '9:00 PM'], distance: '0.8 mi' },
        { theater: 'Regal', movie: 'Dinner & a Movie', times: ['3:45 PM', '7:00 PM', '10:15 PM'], distance: '1.2 mi' },
        { theater: 'Cinemark', movie: 'Dinner & a Movie', times: ['5:15 PM', '8:00 PM'], distance: '2.1 mi' },
      ]);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [lat, lon]);
  return { showtimes, loading };
}

export default function ShowtimesScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const { showtimes, loading } = useShowtimes(location?.latitude, location?.longitude);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission needed for nearby showtimes.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      } catch (e) {
        setLocationError('Could not get location.');
      }
    })();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>DINNER & A MOVIE</Text>
      <Text style={styles.subtitle}>Local theater showtimes near you</Text>

      {locationError && (
        <View style={styles.errorBox}>
          <Ionicons name="location-outline" size={24} color={Colors.tabActiveBg} />
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.tabActiveBg} />
          <Text style={styles.loadingText}>Finding theaters near you...</Text>
        </View>
      )}

      {!loading && showtimes.length > 0 && (
        <View style={styles.list}>
          {showtimes.map((s, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.theater}>{s.theater}</Text>
              <Text style={styles.distance}>{s.distance}</Text>
              <Text style={styles.movie}>{s.movie}</Text>
              <View style={styles.times}>
                {s.times.map((t, j) => (
                  <TouchableOpacity
                    key={j}
                    style={styles.timeChip}
                    onPress={() => Linking.openURL('https://www.fandango.com')}
                  >
                    <Text style={styles.timeText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {!loading && !locationError && location && showtimes.length === 0 && (
        <Text style={styles.empty}>No showtimes found. Try enabling location.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundGray },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  title: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.navCharcoal,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sliderDotInactive,
    padding: Spacing.md,
    borderRadius: 4,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: { flex: 1, fontSize: Typography.fontSize.body, color: Colors.navCharcoal },
  loading: { paddingVertical: Spacing.xxl, alignItems: 'center' },
  loadingText: { marginTop: Spacing.md, fontSize: Typography.fontSize.body, color: Colors.textSecondary },
  list: { gap: Spacing.md },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: Colors.tabActiveBg,
  },
  theater: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navCharcoal,
    textTransform: 'uppercase',
  },
  distance: { fontSize: Typography.fontSize.caption, color: Colors.textSecondary, marginTop: 2 },
  movie: { fontSize: Typography.fontSize.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  times: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.sm, gap: 8 },
  timeChip: {
    backgroundColor: Colors.tabActiveBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  timeText: { fontSize: Typography.fontSize.caption, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  empty: { fontSize: Typography.fontSize.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xl },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import * as Haptics from 'expo-haptics';
import { RestaurantPOSServiceFactory } from '../services/gameDayEats/restaurantPOSService';

export default function GameDayEatsPOSScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const [posService, setPosService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializePOS();
  }, []);

  const initializePOS = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create and initialize POS service
      const service = await RestaurantPOSServiceFactory.createAndInitialize(
        restaurant.id,
        restaurant,
        'placeholder' // Will be replaced with actual provider when ready
      );

      setPosService(service);

      // Health check
      const health = await service.healthCheck();
      if (!health.healthy) {
        throw new Error('POS service is not healthy');
      }

      // Fetch menu (placeholder for now)
      // const menuData = await service.fetchMenu();
      // setMenu(menuData.menu);

    } catch (err) {
      console.error('POS initialization error:', err);
      setError(err.message);
      Alert.alert(
        'POS Integration',
        'POS integration is not yet connected. This feature will be available when the restaurant\'s POS system is integrated.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>POS INTEGRATION</Text>
          <Text style={styles.headerSubtitle}>{restaurant.name}</Text>
        </View>
        <View style={styles.accentLine} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
          <Text style={styles.loadingText}>Connecting to POS system...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>POS INTEGRATION</Text>
          <Text style={styles.headerSubtitle}>{restaurant.name}</Text>
        </View>
        <View style={styles.accentLine} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.gray} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>POS INTEGRATION</Text>
        <Text style={styles.headerSubtitle}>{restaurant.name}</Text>
      </View>

      {/* Accent Line */}
      <View style={styles.accentLine} />

      {/* Info Section */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.teal} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>POS Integration Status</Text>
            <Text style={styles.infoText}>
              This restaurant's POS system is not yet connected. The integration
              framework is ready and will automatically connect when the restaurant
              completes POS setup.
            </Text>
            <Text style={styles.infoSubtext}>
              Once connected, you'll be able to browse the menu, place orders, and
              track your order status directly from this app.
            </Text>
          </View>
        </View>

        {/* Developer Info */}
        <View style={styles.devCard}>
          <Text style={styles.devTitle}>Developer Information</Text>
          <View style={styles.devRow}>
            <Text style={styles.devLabel}>Restaurant ID:</Text>
            <Text style={styles.devValue}>{restaurant.id}</Text>
          </View>
          <View style={styles.devRow}>
            <Text style={styles.devLabel}>POS Provider:</Text>
            <Text style={styles.devValue}>Placeholder (Ready for integration)</Text>
          </View>
          <View style={styles.devRow}>
            <Text style={styles.devLabel}>Service Status:</Text>
            <Text style={styles.devValue}>
              {posService?.isReady() ? 'Ready' : 'Not Ready'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Restaurant Details</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    alignItems: 'stretch',
  },
  header: {
    backgroundColor: Colors.navy,
    padding: 20,
    paddingTop: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    alignSelf: 'stretch',
  },
  headerTitle: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.white,
    opacity: 0.9,
  },
  accentLine: {
    height: 3,
    backgroundColor: Colors.teal,
    marginVertical: 12,
    width: '100%',
    alignSelf: 'stretch',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.body,
    color: Colors.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.body,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: Spacing.lg,
    width: '100%',
    alignSelf: 'stretch',
  },
  infoCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: 8,
  },
  infoText: {
    fontSize: Typography.fontSize.body,
    color: Colors.navy,
    lineHeight: 22,
    marginBottom: 8,
  },
  infoSubtext: {
    fontSize: Typography.fontSize.caption,
    color: Colors.gray,
    lineHeight: 20,
  },
  devCard: {
    backgroundColor: Colors.backgroundGray,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  devTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: 12,
  },
  devRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  devLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.gray,
    fontWeight: Typography.fontWeight.bold,
  },
  devValue: {
    fontSize: Typography.fontSize.caption,
    color: Colors.navy,
  },
  backButton: {
    backgroundColor: Colors.teal,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 4,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
  },
});

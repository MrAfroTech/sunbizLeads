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

// Kia Center coordinates (Orlando, FL)
const KIA_CENTER_LAT = 28.5392;
const KIA_CENTER_LNG = -81.3839;

export default function GameDayEatsListScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from API endpoint
      const response = await fetch('/api/game-day-eats/restaurants');
      
      if (!response.ok) {
        throw new Error('Failed to load restaurants');
      }
      
      const data = await response.json();
      
      // Sort by distance
      const sorted = data.sort((a, b) => a.distance_from_arena - b.distance_from_arena);
      setRestaurants(sorted);
    } catch (err) {
      console.error('Error loading restaurants:', err);
      setError(err.message);
      Alert.alert('Error', 'Could not load restaurants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantPress = (restaurant) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('GameDayEatsDetail', { restaurant });
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 5280)} ft`;
    }
    return `${distance.toFixed(1)} mi`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>GAME DAY EATS</Text>
          <Text style={styles.headerSubtitle}>Restaurants near Kia Center</Text>
        </View>
        <View style={styles.accentLine} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>GAME DAY EATS</Text>
          <Text style={styles.headerSubtitle}>Restaurants near Kia Center</Text>
        </View>
        <View style={styles.accentLine} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.gray} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadRestaurants}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
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
        <Text style={styles.headerTitle}>GAME DAY EATS</Text>
        <Text style={styles.headerSubtitle}>Restaurants near Kia Center</Text>
      </View>

      {/* Accent Line */}
      <View style={styles.accentLine} />

      {/* Restaurant List */}
      <View style={styles.section}>
        {restaurants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.gray} />
            <Text style={styles.emptyText}>No restaurants available</Text>
          </View>
        ) : (
          restaurants.map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              style={styles.restaurantCard}
              onPress={() => handleRestaurantPress(restaurant)}
              activeOpacity={0.7}
            >
              <View style={styles.restaurantContent}>
                <View style={styles.restaurantIconContainer}>
                  <Ionicons name="restaurant" size={28} color={Colors.teal} />
                </View>
                <View style={styles.restaurantTextContainer}>
                  <View style={styles.restaurantHeader}>
                    <Text style={styles.restaurantName}>{restaurant.name}</Text>
                    {restaurant.promo_badge && (
                      <View style={styles.promoBadge}>
                        <Text style={styles.promoBadgeText}>{restaurant.promo_badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.restaurantFoodType}>{restaurant.food_type}</Text>
                  <View style={styles.restaurantFooter}>
                    <Ionicons name="location" size={14} color={Colors.gray} />
                    <Text style={styles.restaurantDistance}>
                      {formatDistance(restaurant.distance_from_arena)} from Kia Center
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
              </View>
            </TouchableOpacity>
          ))
        )}
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
  section: {
    paddingHorizontal: 16,
    paddingVertical: Spacing.md,
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
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.body,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.teal,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 4,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.body,
    color: Colors.gray,
  },
  restaurantCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  restaurantContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  restaurantTextContainer: {
    flex: 1,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  restaurantName: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginRight: 8,
  },
  promoBadge: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  promoBadgeText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  restaurantFoodType: {
    fontSize: Typography.fontSize.caption,
    color: Colors.gray,
    marginBottom: 4,
  },
  restaurantFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantDistance: {
    fontSize: Typography.fontSize.caption,
    color: Colors.gray,
    marginLeft: 4,
  },
});

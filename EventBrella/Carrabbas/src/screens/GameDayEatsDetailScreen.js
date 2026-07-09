import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
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

export default function GameDayEatsDetailScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const [mapReady, setMapReady] = useState(false);

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 5280)} ft`;
    }
    return `${distance.toFixed(1)} mi`;
  };

  const handleGetDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `https://maps.apple.com/?daddr=${restaurant.latitude},${restaurant.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps app.');
    });
  };

  const handleOrderNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to POS integration flow
    navigation.navigate('GameDayEatsPOS', { restaurant });
  };

  // Generate Google Maps embed URL for web view
  const getMapEmbedUrl = () => {
    const center = `${KIA_CENTER_LAT},${KIA_CENTER_LNG}`;
    const restaurantLoc = `${restaurant.latitude},${restaurant.longitude}`;
    return `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6g4-hU1wHI&origin=${center}&destination=${restaurantLoc}&zoom=14`;
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{restaurant.name}</Text>
        <Text style={styles.headerSubtitle}>{restaurant.food_type}</Text>
      </View>

      {/* Accent Line */}
      <View style={styles.accentLine} />

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={48} color={Colors.gray} />
          <Text style={styles.mapPlaceholderText}>Map View</Text>
          <Text style={styles.mapPlaceholderSubtext}>
            Kia Center: {KIA_CENTER_LAT}, {KIA_CENTER_LNG}
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            {restaurant.name}: {restaurant.latitude}, {restaurant.longitude}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={handleGetDirections}
        >
          <Ionicons name="navigate" size={20} color={Colors.white} />
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </TouchableOpacity>
      </View>

      {/* Restaurant Details */}
      <View style={styles.section}>
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color={Colors.teal} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{restaurant.address}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="walk" size={20} color={Colors.teal} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Distance from Kia Center</Text>
              <Text style={styles.detailValue}>
                {formatDistance(restaurant.distance_from_arena)}
              </Text>
            </View>
          </View>

          {restaurant.promo_badge && (
            <View style={styles.detailRow}>
              <Ionicons name="gift" size={20} color={Colors.teal} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Special Offer</Text>
                <View style={styles.promoContainer}>
                  <View style={styles.promoBadge}>
                    <Text style={styles.promoBadgeText}>{restaurant.promo_badge}</Text>
                  </View>
                  {restaurant.promo_description && (
                    <Text style={styles.promoDescription}>
                      {restaurant.promo_description}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Order Button */}
        <TouchableOpacity
          style={styles.orderButton}
          onPress={handleOrderNow}
          activeOpacity={0.8}
        >
          <Ionicons name="restaurant" size={24} color={Colors.white} />
          <Text style={styles.orderButtonText}>Order Now</Text>
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
    textAlign: 'center',
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
  mapContainer: {
    height: 250,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  mapPlaceholderText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
  },
  mapPlaceholderSubtext: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.caption,
    color: Colors.gray,
  },
  directionsButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: Colors.teal,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  directionsButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: Spacing.xs,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: Spacing.lg,
    width: '100%',
    alignSelf: 'stretch',
  },
  detailCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.gray,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: Typography.fontSize.body,
    color: Colors.navy,
    lineHeight: 22,
  },
  promoContainer: {
    marginTop: 4,
  },
  promoBadge: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  promoBadgeText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  promoDescription: {
    fontSize: Typography.fontSize.body,
    color: Colors.navy,
    lineHeight: 22,
  },
  orderButton: {
    backgroundColor: Colors.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  orderButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: Spacing.sm,
  },
});

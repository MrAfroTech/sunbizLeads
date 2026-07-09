import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { PrimaryButton } from '../components/PrimaryButton';
import authService from '../services/rides/authService';
import uberAPI from '../services/rides/uberAPI';
import lyftAPI from '../services/rides/lyftAPI';

export default function RideBookingScreen({ navigation, route }) {
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState(null);
  // Get provider from route params, default to 'both' if not provided
  const selectedProvider = route?.params?.provider || null;
  const [serviceType, setServiceType] = useState(selectedProvider || 'both'); // 'uber', 'lyft', 'both'
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [rideOptions, setRideOptions] = useState([]);
  const [uberAuthenticated, setUberAuthenticated] = useState(false);
  const [lyftAuthenticated, setLyftAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    getCurrentLocation();
    // If provider was passed, set it
    if (selectedProvider) {
      setServiceType(selectedProvider);
    }
  }, [selectedProvider]);

  const checkAuthStatus = async () => {
    const uberAuth = await authService.isUberAuthenticated();
    const lyftAuth = await authService.isLyftAuthenticated();
    setUberAuthenticated(uberAuth);
    setLyftAuthenticated(lyftAuth);
  };

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use ride services.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setPickupCoords({ latitude, longitude });

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses.length > 0) {
        const addr = addresses[0];
        const address = `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''}`.trim();
        setPickupLocation(address || 'Current Location');
      } else {
        setPickupLocation('Current Location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const swapLocations = () => {
    const tempLocation = pickupLocation;
    const tempCoords = pickupCoords;
    setPickupLocation(dropoffLocation);
    setPickupCoords(dropoffCoords);
    setDropoffLocation(tempLocation);
    setDropoffCoords(tempCoords);
  };

  const getEstimates = async () => {
    if (!pickupCoords || !dropoffCoords) {
      Alert.alert('Error', 'Please set both pickup and dropoff locations.');
      return;
    }

    setLoading(true);
    setRideOptions([]);

    try {
      const options = [];

      // Get Uber estimates
      if ((serviceType === 'uber' || serviceType === 'both') && uberAuthenticated) {
        try {
          const uberToken = await authService.getUberAccessToken();
          const prices = await uberAPI.getPriceEstimates(
            pickupCoords.latitude,
            pickupCoords.longitude,
            dropoffCoords.latitude,
            dropoffCoords.longitude,
            uberToken
          );
          const times = await uberAPI.getTimeEstimates(
            pickupCoords.latitude,
            pickupCoords.longitude,
            uberToken
          );

          prices.forEach(price => {
            const timeEstimate = times.find(t => t.product_id === price.product_id);
            options.push({
              id: `uber_${price.product_id}`,
              service: 'Uber',
              name: price.display_name || price.product_id,
              price: price.estimate,
              priceLow: price.low_estimate,
              priceHigh: price.high_estimate,
              duration: price.duration,
              distance: price.distance,
              eta: timeEstimate?.estimate || null,
              productId: price.product_id,
              fareId: price.fare_id,
            });
          });
        } catch (error) {
          console.error('Uber estimates error:', error);
        }
      }

      // Get Lyft estimates
      if ((serviceType === 'lyft' || serviceType === 'both') && lyftAuthenticated) {
        try {
          const lyftToken = await authService.getLyftAccessToken();
          const costs = await lyftAPI.getCostEstimates(
            pickupCoords.latitude,
            pickupCoords.longitude,
            dropoffCoords.latitude,
            dropoffCoords.longitude,
            lyftToken
          );
          const etas = await lyftAPI.getETAEstimates(
            pickupCoords.latitude,
            pickupCoords.longitude,
            lyftToken
          );

          costs.forEach(cost => {
            const etaEstimate = etas.find(e => e.ride_type === cost.ride_type);
            options.push({
              id: `lyft_${cost.ride_type}`,
              service: 'Lyft',
              name: cost.display_name || cost.ride_type,
              price: cost.estimated_cost_cents_max ? `$${(cost.estimated_cost_cents_max / 100).toFixed(2)}` : 'N/A',
              priceLow: cost.estimated_cost_cents_min ? cost.estimated_cost_cents_min / 100 : null,
              priceHigh: cost.estimated_cost_cents_max ? cost.estimated_cost_cents_max / 100 : null,
              duration: cost.estimated_duration_seconds,
              distance: cost.estimated_distance_miles,
              eta: etaEstimate?.eta_seconds || null,
              rideType: cost.ride_type,
            });
          });
        } catch (error) {
          console.error('Lyft estimates error:', error);
        }
      }

      setRideOptions(options);
    } catch (error) {
      console.error('Error getting estimates:', error);
      Alert.alert('Error', 'Could not get ride estimates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestRide = async (option) => {
    try {
      setLoading(true);
      
      if (option.service === 'Uber') {
        const token = await authService.getUberAccessToken();
        const ride = await uberAPI.requestRide(
          option.productId,
          pickupCoords.latitude,
          pickupCoords.longitude,
          dropoffCoords.latitude,
          dropoffCoords.longitude,
          option.fareId,
          token
        );
        navigation.navigate('RideTracking', { rideId: ride.request_id, service: 'Uber' });
      } else if (option.service === 'Lyft') {
        const token = await authService.getLyftAccessToken();
        const ride = await lyftAPI.requestRide(
          option.rideType,
          { lat: pickupCoords.latitude, lng: pickupCoords.longitude },
          { lat: dropoffCoords.latitude, lng: dropoffCoords.longitude },
          token
        );
        navigation.navigate('RideTracking', { rideId: ride.ride_id, service: 'Lyft' });
      }
    } catch (error) {
      console.error('Error requesting ride:', error);
      Alert.alert('Error', error.message || 'Could not request ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>REQUEST A RIDE</Text>
      </View>

      <View style={styles.accentLine} />

      {/* Location Inputs */}
      <View style={styles.section}>
        <View style={styles.locationContainer}>
          <View style={styles.locationInputContainer}>
            <Ionicons name="location" size={20} color={Colors.teal} style={styles.locationIcon} />
            <TextInput
              style={styles.locationInput}
              placeholder="Pickup location"
              value={pickupLocation}
              onChangeText={setPickupLocation}
              placeholderTextColor={Colors.gray}
            />
            {loadingLocation ? (
              <ActivityIndicator size="small" color={Colors.teal} />
            ) : (
              <TouchableOpacity onPress={getCurrentLocation} style={styles.useCurrentButton}>
                <Text style={styles.useCurrentText}>Use Current</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={swapLocations} style={styles.swapButton}>
          <Ionicons name="swap-vertical" size={24} color={Colors.teal} />
        </TouchableOpacity>

        <View style={styles.locationContainer}>
          <View style={styles.locationInputContainer}>
            <Ionicons name="location-outline" size={20} color={Colors.navy} style={styles.locationIcon} />
            <TextInput
              style={styles.locationInput}
              placeholder="Dropoff location"
              value={dropoffLocation}
              onChangeText={setDropoffLocation}
              placeholderTextColor={Colors.gray}
            />
          </View>
        </View>
      </View>

      {/* Service Selection - Only show if provider wasn't pre-selected */}
      {!selectedProvider && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SELECT SERVICE</Text>
          <View style={styles.serviceButtons}>
            <TouchableOpacity
              style={[styles.serviceButton, serviceType === 'uber' && styles.serviceButtonActive]}
              onPress={() => setServiceType('uber')}
              disabled={!uberAuthenticated}
            >
              <Text style={[styles.serviceButtonText, serviceType === 'uber' && styles.serviceButtonTextActive]}>
                Uber
              </Text>
              {!uberAuthenticated && <Text style={styles.authRequired}>Connect Required</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.serviceButton, serviceType === 'lyft' && styles.serviceButtonActive]}
              onPress={() => setServiceType('lyft')}
              disabled={!lyftAuthenticated}
            >
              <Text style={[styles.serviceButtonText, serviceType === 'lyft' && styles.serviceButtonTextActive]}>
                Lyft
              </Text>
              {!lyftAuthenticated && <Text style={styles.authRequired}>Connect Required</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.serviceButton, serviceType === 'both' && styles.serviceButtonActive]}
              onPress={() => setServiceType('both')}
              disabled={!uberAuthenticated && !lyftAuthenticated}
            >
              <Text style={[styles.serviceButtonText, serviceType === 'both' && styles.serviceButtonTextActive]}>
                Both
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Show selected provider if one was pre-selected */}
      {selectedProvider && (
        <View style={styles.section}>
          <View style={styles.selectedProviderCard}>
            <Ionicons name="car" size={24} color={Colors.teal} />
            <Text style={styles.selectedProviderText}>
              {selectedProvider === 'uber' ? 'Uber' : 'Lyft'}
            </Text>
          </View>
        </View>
      )}

      {/* Get Estimates Button */}
      <View style={styles.section}>
        <PrimaryButton
          title={loading ? 'Loading...' : 'Get Ride Options'}
          onPress={getEstimates}
          loading={loading}
          disabled={!pickupCoords || !dropoffCoords || loading}
        />
      </View>

      {/* Ride Options */}
      {rideOptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AVAILABLE RIDES</Text>
          {rideOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.rideOptionCard}
              onPress={() => requestRide(option)}
            >
              <View style={styles.rideOptionHeader}>
                <Text style={styles.rideOptionService}>{option.service}</Text>
                <Text style={styles.rideOptionName}>{option.name}</Text>
              </View>
              <View style={styles.rideOptionDetails}>
                <View style={styles.rideOptionDetail}>
                  <Ionicons name="cash" size={16} color={Colors.teal} />
                  <Text style={styles.rideOptionDetailText}>{option.price}</Text>
                </View>
                {option.eta && (
                  <View style={styles.rideOptionDetail}>
                    <Ionicons name="time" size={16} color={Colors.teal} />
                    <Text style={styles.rideOptionDetailText}>{Math.round(option.eta / 60)} min</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    backgroundColor: Colors.navy,
    padding: 20,
    paddingTop: Spacing.xl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  accentLine: {
    height: 3,
    backgroundColor: Colors.teal,
    marginVertical: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  locationContainer: {
    marginBottom: Spacing.sm,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  locationIcon: {
    marginRight: 12,
  },
  locationInput: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    color: Colors.navy,
  },
  useCurrentButton: {
    paddingHorizontal: 8,
  },
  useCurrentText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.teal,
    fontWeight: Typography.fontWeight.medium,
  },
  swapButton: {
    alignSelf: 'center',
    padding: 8,
    marginVertical: Spacing.xs,
  },
  serviceButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceButton: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    alignItems: 'center',
  },
  serviceButtonActive: {
    borderColor: Colors.teal,
    backgroundColor: Colors.teal,
  },
  serviceButtonText: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    textTransform: 'uppercase',
  },
  serviceButtonTextActive: {
    color: Colors.white,
  },
  authRequired: {
    fontSize: 10,
    color: Colors.gray,
    marginTop: 4,
  },
  rideOptionCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  rideOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rideOptionService: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.teal,
    textTransform: 'uppercase',
  },
  rideOptionName: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
  },
  rideOptionDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  rideOptionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rideOptionDetailText: {
    fontSize: Typography.fontSize.body,
    color: Colors.navy,
  },
  selectedProviderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: Colors.teal,
    gap: 12,
  },
  selectedProviderText: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    textTransform: 'uppercase',
  },
});


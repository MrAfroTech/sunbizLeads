import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { PrimaryButton } from '../components/PrimaryButton';
import authService from '../services/rides/authService';
import uberAPI from '../services/rides/uberAPI';
import lyftAPI from '../services/rides/lyftAPI';

export default function RideTrackingScreen({ route, navigation }) {
  const { rideId, service } = route.params;
  const [rideStatus, setRideStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    fetchRideStatus();
    const interval = setInterval(() => {
      if (polling) {
        fetchRideStatus();
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [rideId, service, polling]);

  const fetchRideStatus = async () => {
    try {
      const token = service === 'Uber' 
        ? await authService.getUberAccessToken()
        : await authService.getLyftAccessToken();

      if (!token) {
        Alert.alert('Error', 'Authentication required. Please reconnect your account.');
        navigation.goBack();
        return;
      }

      const status = service === 'Uber'
        ? await uberAPI.getRideStatus(rideId, token)
        : await lyftAPI.getRideStatus(rideId, token);

      setRideStatus(status);
      
      // Stop polling if ride is completed or cancelled
      if (status.status === 'completed' || status.status === 'cancelled' || status.status === 'droppedOff') {
        setPolling(false);
      }
    } catch (error) {
      console.error('Error fetching ride status:', error);
      if (!loading) {
        Alert.alert('Error', 'Could not fetch ride status.');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = service === 'Uber'
                ? await authService.getUberAccessToken()
                : await authService.getLyftAccessToken();

              if (service === 'Uber') {
                await uberAPI.cancelRide(rideId, token);
              } else {
                await lyftAPI.cancelRide(rideId, token);
              }

              Alert.alert('Success', 'Ride cancelled successfully.');
              navigation.goBack();
            } catch (error) {
              console.error('Error cancelling ride:', error);
              Alert.alert('Error', error.message || 'Could not cancel ride.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusText = (status) => {
    const statusMap = {
      'processing': 'Processing...',
      'no_drivers_available': 'No drivers available',
      'accepted': 'Driver accepted',
      'arriving': 'Driver arriving',
      'in_progress': 'Trip in progress',
      'completed': 'Trip completed',
      'cancelled': 'Cancelled',
      'pending': 'Pending',
      'pickedUp': 'Picked up',
      'droppedOff': 'Dropped off',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    if (status === 'completed' || status === 'droppedOff') return Colors.teal;
    if (status === 'cancelled') return Colors.gray;
    if (status === 'in_progress' || status === 'pickedUp') return Colors.teal;
    return Colors.gold;
  };

  if (loading && !rideStatus) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.teal} />
        <Text style={styles.loadingText}>Loading ride status...</Text>
      </View>
    );
  }

  if (!rideStatus) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Could not load ride status.</Text>
        <PrimaryButton title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const driver = rideStatus.driver || rideStatus.driver_info;
  const vehicle = rideStatus.vehicle || rideStatus.vehicle_info;
  const location = rideStatus.location || rideStatus.driver_location;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Status Header */}
      <View style={[styles.statusHeader, { backgroundColor: getStatusColor(rideStatus.status) }]}>
        <Text style={styles.statusText}>{getStatusText(rideStatus.status)}</Text>
        {rideStatus.eta && (
          <Text style={styles.etaText}>ETA: {Math.round(rideStatus.eta / 60)} minutes</Text>
        )}
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <Ionicons name="map" size={64} color={Colors.lightGray} />
        <Text style={styles.mapPlaceholderText}>Map View</Text>
        <Text style={styles.mapPlaceholderSubtext}>Driver location and route will appear here</Text>
      </View>

      {/* Driver Information */}
      {driver && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DRIVER INFORMATION</Text>
          <View style={styles.driverCard}>
            {driver.picture_url && (
              <Image source={{ uri: driver.picture_url }} style={styles.driverPhoto} />
            )}
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver.name || 'Driver'}</Text>
              {driver.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color={Colors.gold} />
                  <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
            {driver.phone_number && (
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="call" size={20} color={Colors.teal} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Vehicle Information */}
      {vehicle && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VEHICLE</Text>
          <View style={styles.vehicleCard}>
            <Ionicons name="car" size={32} color={Colors.teal} />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleText}>
                {vehicle.make || ''} {vehicle.model || ''}
              </Text>
              {vehicle.color && <Text style={styles.vehicleText}>{vehicle.color}</Text>}
              {vehicle.license_plate && (
                <Text style={styles.licensePlate}>{vehicle.license_plate}</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Trip Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TRIP DETAILS</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color={Colors.teal} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Pickup</Text>
              <Text style={styles.detailValue}>
                {rideStatus.start_address || rideStatus.pickup?.address || 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={Colors.navy} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Dropoff</Text>
              <Text style={styles.detailValue}>
                {rideStatus.end_address || rideStatus.destination?.address || 'N/A'}
              </Text>
            </View>
          </View>
          {rideStatus.fare && (
            <View style={styles.detailRow}>
              <Ionicons name="cash" size={20} color={Colors.teal} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Fare</Text>
                <Text style={styles.detailValue}>
                  ${(rideStatus.fare / 100).toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Cancel Button */}
      {rideStatus.status !== 'completed' && 
       rideStatus.status !== 'cancelled' && 
       rideStatus.status !== 'droppedOff' && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelRide}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>CANCEL RIDE</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.body,
    color: Colors.gray,
  },
  errorText: {
    fontSize: Typography.fontSize.body,
    color: Colors.gray,
    textAlign: 'center',
    margin: Spacing.xl,
  },
  statusHeader: {
    padding: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.white,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  etaText: {
    fontSize: Typography.fontSize.body,
    color: Colors.white,
    opacity: 0.9,
  },
  mapContainer: {
    height: 300,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    borderRadius: 2,
  },
  mapPlaceholderText: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.gray,
    marginTop: Spacing.sm,
  },
  mapPlaceholderSubtext: {
    fontSize: Typography.fontSize.caption,
    color: Colors.gray,
    marginTop: Spacing.xs,
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
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  driverPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Typography.fontSize.body,
    color: Colors.navy,
    fontWeight: Typography.fontWeight.medium,
  },
  contactButton: {
    padding: 8,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 16,
  },
  vehicleText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.navy,
    marginBottom: 4,
  },
  licensePlate: {
    fontSize: Typography.fontSize.caption,
    color: Colors.gray,
    fontFamily: 'monospace',
  },
  detailsCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.gray,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: Typography.fontSize.body,
    color: Colors.navy,
    fontWeight: Typography.fontWeight.medium,
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.orange || '#FF6B6B',
    padding: 16,
    borderRadius: 2,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.button,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.orange || '#FF6B6B',
    textTransform: 'uppercase',
  },
});


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import * as Haptics from 'expo-haptics';
import authService from '../services/rides/authService';

export default function RideShareSelectionScreen({ navigation }) {
  const [uberAuthenticated, setUberAuthenticated] = useState(false);
  const [lyftAuthenticated, setLyftAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Re-check auth status when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      checkAuthStatus();
    });
    return unsubscribe;
  }, [navigation]);

  const checkAuthStatus = async () => {
    try {
      const uberAuth = await authService.isUberAuthenticated();
      const lyftAuth = await authService.isLyftAuthenticated();
      setUberAuthenticated(uberAuth);
      setLyftAuthenticated(lyftAuth);
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const handleConnectUber = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const redirectURI = 'carrabbas://uber-callback';
      const authURL = authService.getUberAuthURL(redirectURI);
      await Linking.openURL(authURL);
    } catch (error) {
      console.error('Error opening Uber auth:', error);
      Alert.alert('Error', 'Could not open Uber authentication.');
    }
  };

  const handleConnectLyft = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const redirectURI = 'carrabbas://lyft-callback';
      const authURL = authService.getLyftAuthURL(redirectURI);
      await Linking.openURL(authURL);
    } catch (error) {
      console.error('Error opening Lyft auth:', error);
      Alert.alert('Error', 'Could not open Lyft authentication.');
    }
  };

  const handleSelectUber = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!uberAuthenticated) {
      Alert.alert(
        'Connect Required',
        'Please connect to Uber to request rides.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: handleConnectUber },
        ]
      );
      return;
    }
    navigation.navigate('RideBooking', { provider: 'uber' });
  };

  const handleSelectLyft = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!lyftAuthenticated) {
      Alert.alert(
        'Connect Required',
        'Please connect to Lyft to request rides.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: handleConnectLyft },
        ]
      );
      return;
    }
    navigation.navigate('RideBooking', { provider: 'lyft' });
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RIDE SHARES</Text>
        <Text style={styles.headerSubtitle}>Choose your ride provider</Text>
      </View>

      {/* Accent Line */}
      <View style={styles.accentLine} />

      {/* Select Provider Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SELECT PROVIDER</Text>
        
        <TouchableOpacity
          style={[
            styles.providerCard,
            uberAuthenticated && styles.providerCardEnabled,
            !uberAuthenticated && styles.providerCardDisabled
          ]}
          onPress={handleSelectUber}
          activeOpacity={0.7}
          disabled={!uberAuthenticated}
        >
          <View style={styles.providerContent}>
            <View style={styles.providerIconContainer}>
              <Ionicons 
                name="car" 
                size={32} 
                color={uberAuthenticated ? Colors.teal : Colors.gray} 
              />
            </View>
            <View style={styles.providerTextContainer}>
              <Text style={[
                styles.providerTitle,
                !uberAuthenticated && styles.providerTitleDisabled
              ]}>
                Uber
              </Text>
              <Text style={styles.providerSubtitle}>
                {uberAuthenticated 
                  ? 'Tap to book a ride' 
                  : 'Connect to use Uber'}
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={uberAuthenticated ? Colors.teal : Colors.gray} 
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.providerCard,
            lyftAuthenticated && styles.providerCardEnabled,
            !lyftAuthenticated && styles.providerCardDisabled
          ]}
          onPress={handleSelectLyft}
          activeOpacity={0.7}
          disabled={!lyftAuthenticated}
        >
          <View style={styles.providerContent}>
            <View style={styles.providerIconContainer}>
              <Ionicons 
                name="car" 
                size={32} 
                color={lyftAuthenticated ? Colors.teal : Colors.gray} 
              />
            </View>
            <View style={styles.providerTextContainer}>
              <Text style={[
                styles.providerTitle,
                !lyftAuthenticated && styles.providerTitleDisabled
              ]}>
                Lyft
              </Text>
              <Text style={styles.providerSubtitle}>
                {lyftAuthenticated 
                  ? 'Tap to book a ride' 
                  : 'Connect to use Lyft'}
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={lyftAuthenticated ? Colors.teal : Colors.gray} 
            />
          </View>
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
  section: {
    paddingHorizontal: 16,
    paddingVertical: Spacing.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  providerCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 2,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  providerCardEnabled: {
    borderColor: Colors.teal,
  },
  providerCardDisabled: {
    opacity: 0.6,
    borderColor: Colors.lightGray,
  },
  providerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  providerTextContainer: {
    flex: 1,
  },
  providerTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: 4,
  },
  providerTitleDisabled: {
    color: Colors.gray,
  },
  providerSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.gray,
  },
});

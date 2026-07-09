import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { PrimaryButton } from './PrimaryButton';
import * as Haptics from 'expo-haptics';

/**
 * AddToWalletButtons Component
 * 
 * Shows "Add to Apple Wallet" and "Add to Google Wallet" buttons.
 * Only shows relevant button based on device platform.
 */
export default function AddToWalletButtons({ walletId, mode = 'qr', qrToken, onShowQR }) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(null); // 'apple' or 'google'

  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  const handleAddToAppleWallet = async () => {
    try {
      setGenerating('apple');
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await fetch(`/api/wallets/passes/apple?walletId=${walletId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user_123', // TODO: Get from auth context
        },
        body: JSON.stringify({ mode }),
      });

      const data = await response.json();

      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // In production, this would download the .pkpass file
        // For now, show success message
        Alert.alert(
          'Apple Wallet Pass Generated',
          'Your wallet pass has been created. In production, this would automatically add to your Apple Wallet.',
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
      } else {
        throw new Error(data.error || 'Failed to generate pass');
      }
    } catch (error) {
      console.error('Error generating Apple pass:', error);
      Alert.alert('Error', 'Failed to generate Apple Wallet pass. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
      setGenerating(null);
    }
  };

  const handleAddToGoogleWallet = async () => {
    try {
      setGenerating('google');
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await fetch(`/api/wallets/passes/google?walletId=${walletId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user_123', // TODO: Get from auth context
        },
        body: JSON.stringify({ mode }),
      });

      const data = await response.json();

      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // In production, this would open Google Wallet
        Alert.alert(
          'Google Wallet Pass Generated',
          'Your wallet pass has been created. In production, this would automatically add to your Google Wallet.',
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
      } else {
        throw new Error(data.error || 'Failed to generate pass');
      }
    } catch (error) {
      console.error('Error generating Google pass:', error);
      Alert.alert('Error', 'Failed to generate Google Wallet pass. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
      setGenerating(null);
    }
  };

  const handleShowQRCode = () => {
    if (onShowQR) {
      onShowQR();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ADD TO WALLET</Text>
      
      <View style={styles.buttonsContainer}>
        {/* QR Code Button - Always visible */}
        <TouchableOpacity
          style={[
            styles.walletButton,
            styles.qrButton,
            (!qrToken || !walletId) && styles.buttonDisabled,
          ]}
          onPress={handleShowQRCode}
          disabled={!qrToken || !walletId}
          activeOpacity={0.7}
        >
          <Ionicons name="qr-code" size={24} color={Colors.white} />
          <Text style={styles.buttonText}>QR</Text>
        </TouchableOpacity>

        {/* Apple Wallet Button (iOS only) */}
        {isIOS && (
          <TouchableOpacity
            style={[
              styles.walletButton,
              styles.appleButton,
              (loading || !walletId) && styles.buttonDisabled,
            ]}
            onPress={handleAddToAppleWallet}
            disabled={loading || !walletId}
            activeOpacity={0.7}
          >
            {generating === 'apple' ? (
              <Text style={styles.buttonText}>Generating...</Text>
            ) : (
              <>
                <Ionicons name="wallet" size={24} color={Colors.white} />
                <Text style={styles.buttonText}>Apple Pay</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Google Wallet Button (Android only) */}
        {isAndroid && (
          <TouchableOpacity
            style={[
              styles.walletButton,
              styles.googleButton,
              (loading || !walletId) && styles.buttonDisabled,
            ]}
            onPress={handleAddToGoogleWallet}
            disabled={loading || !walletId}
            activeOpacity={0.7}
          >
            {generating === 'google' ? (
              <Text style={styles.buttonText}>Generating...</Text>
            ) : (
              <>
                <Ionicons name="wallet" size={24} color={Colors.white} />
                <Text style={styles.buttonText}>Google Pay</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Show both on web/other platforms */}
        {!isIOS && !isAndroid && (
          <>
            <TouchableOpacity
              style={[
                styles.walletButton,
                styles.appleButton,
                (loading || !walletId) && styles.buttonDisabled,
              ]}
              onPress={handleAddToAppleWallet}
              disabled={loading || !walletId}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-apple" size={24} color={Colors.white} />
              <Text style={styles.buttonText}>Apple Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.walletButton,
                styles.googleButton,
                (loading || !walletId) && styles.buttonDisabled,
              ]}
              onPress={handleAddToGoogleWallet}
              disabled={loading || !walletId}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-google" size={24} color={Colors.white} />
              <Text style={styles.buttonText}>Google Pay</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {mode === 'nfc' && walletId && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color={Colors.orange} />
          <Text style={styles.infoText}>
            Add Digital Card to Wallet will be available after Marqeta integration (Phase 2)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  walletButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 2,
    gap: Spacing.xs,
    minHeight: 50,
    minWidth: 100,
  },
  appleButton: {
    backgroundColor: Colors.black,
  },
  googleButton: {
    backgroundColor: '#4285F4', // Google blue
  },
  qrButton: {
    backgroundColor: Colors.teal,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.normal,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.orange + '10',
    borderRadius: 2,
  },
  infoText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.navy,
    flex: 1,
  },
  loadingContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.lightGray + '50',
    borderRadius: 2,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});


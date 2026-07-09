import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import * as Haptics from 'expo-haptics';

/**
 * WalletModeToggle Component
 * 
 * Allows users to switch between QR and Digital Card wallet modes.
 * Digital Card mode is disabled with "Coming soon" tooltip until Phase 2.
 */
export default function WalletModeToggle({ walletId, currentMode = 'qr', onModeChange }) {
  const [mode, setMode] = useState(currentMode);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(currentMode);
  }, [currentMode]);

  const handleModeToggle = async (newMode) => {
    if (newMode === 'nfc') {
      // Digital Card mode not available yet
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Digital Card Coming Soon',
        'Add Digital Card to Wallet requires Marqeta integration and will be available in Phase 2. Please use QR mode for now.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (newMode === mode) {
      return; // Already in this mode
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Call API to update mode
      const response = await fetch(`/api/wallets/mode?walletId=${walletId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user_123', // TODO: Get from auth context
        },
        body: JSON.stringify({ mode: newMode }),
      });

      const data = await response.json();

      if (data.success) {
        setMode(newMode);
        if (onModeChange) {
          onModeChange(newMode);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error(data.error || 'Failed to update mode');
      }
    } catch (error) {
      console.error('Error updating wallet mode:', error);
      Alert.alert('Error', 'Failed to update wallet mode. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>WALLET MODE</Text>
      <View style={styles.toggleContainer}>
        {/* QR Mode Button */}
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === 'qr' && styles.modeButtonActive,
            loading && styles.modeButtonDisabled,
          ]}
          onPress={() => handleModeToggle('qr')}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Ionicons
            name="qr-code"
            size={24}
            color={mode === 'qr' ? Colors.white : Colors.textSecondary}
          />
          <Text
            style={[
              styles.modeButtonText,
              mode === 'qr' && styles.modeButtonTextActive,
            ]}
          >
            QR
          </Text>
          {mode === 'qr' && (
            <View style={styles.activeIndicator}>
              <Text style={styles.activeIndicatorText}>ACTIVE</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Digital Card Mode Button */}
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === 'nfc' && styles.modeButtonActive,
            styles.modeButtonDisabled, // Always disabled for now
          ]}
          onPress={() => handleModeToggle('nfc')}
          disabled={true} // Disabled until Phase 2
          activeOpacity={0.7}
        >
          <Ionicons
            name="flash"
            size={24}
            color={Colors.textSecondary}
          />
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>SOON</Text>
          </View>
        </TouchableOpacity>
      </View>

      {mode === 'nfc' && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color={Colors.teal} />
          <Text style={styles.infoText}>
            Add Digital Card to Wallet requires Marqeta integration (Phase 2)
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
  toggleContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 2,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 2,
    gap: Spacing.xs,
    backgroundColor: Colors.white,
  },
  modeButtonActive: {
    backgroundColor: Colors.navy,
  },
  modeButtonDisabled: {
    opacity: 0.6,
  },
  modeButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  modeButtonTextActive: {
    color: Colors.white,
  },
  modeButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  activeIndicator: {
    backgroundColor: Colors.teal,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: Spacing.xs,
  },
  activeIndicatorText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.wide,
  },
  comingSoonBadge: {
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: Spacing.xs,
  },
  comingSoonText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.wide,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.teal + '10',
    borderRadius: 2,
  },
  infoText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.navy,
    flex: 1,
  },
});


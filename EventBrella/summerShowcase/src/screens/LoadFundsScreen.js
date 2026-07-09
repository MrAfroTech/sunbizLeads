import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import AddToWalletButtons from '../components/AddToWalletButtons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// TODO: Get from auth context
const MOCK_USER_ID = 'user_123';

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function LoadFundsScreen({ navigation, route }) {
  const walletId = route?.params?.walletId;
  const [amount, setAmount] = useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [walletMode, setWalletMode] = useState('qr');

  const handleQuickAmountSelect = (quickAmount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedQuickAmount(quickAmount);
    setAmount(quickAmount.toString());
  };

  const handleAmountChange = (text) => {
    // Allow only numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    if (cleaned.split('.').length <= 2) {
      setAmount(cleaned);
      setSelectedQuickAmount(null);
    }
  };

  const handleLoadFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than $0.');
      return;
    }

    if (!walletId) {
      Alert.alert('Error', 'Wallet ID not found. Please try again.');
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const amountCents = Math.round(parseFloat(amount) * 100);

      // TODO: In production, integrate with payment processor
      // For now, simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Load funds to wallet
      const response = await fetch('/api/wallets/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': MOCK_USER_ID,
        },
        body: JSON.stringify({
          walletId,
          amountCents,
          paymentDetails: {
            method: 'mock', // TODO: Replace with actual payment method
            source: 'manual',
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Success!',
          `$${amount} has been added to your wallet.`,
          [
            {
              text: 'OK',
              style: 'default',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        throw new Error(data.error || 'Failed to load funds');
      }
    } catch (error) {
      console.error('Error loading funds:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'Failed to load funds. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.navy, Colors.teal]}
        style={styles.header}
      >
        <Ionicons name="add-circle" size={48} color={Colors.white} />
        <Text style={styles.headerTitle}>LOAD FUNDS</Text>
        <Text style={styles.headerSubtitle}>Add money to your wallet</Text>
      </LinearGradient>

      {/* Accent Line */}
      <View style={styles.accentLine} />

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.label}>AMOUNT</Text>
        <Card style={styles.amountCard}>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="decimal-pad"
              autoFocus={true}
            />
          </View>
        </Card>
      </View>

      {/* Quick Amount Buttons */}
      <View style={styles.section}>
        <Text style={styles.label}>QUICK AMOUNTS</Text>
        <View style={styles.quickAmountsGrid}>
          {QUICK_AMOUNTS.map((quickAmount) => (
            <TouchableOpacity
              key={quickAmount}
              style={[
                styles.quickAmountButton,
                selectedQuickAmount === quickAmount && styles.quickAmountButtonActive,
              ]}
              onPress={() => handleQuickAmountSelect(quickAmount)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.quickAmountText,
                  selectedQuickAmount === quickAmount && styles.quickAmountTextActive,
                ]}
              >
                ${quickAmount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment Method Info */}
      <View style={styles.section}>
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={Colors.teal} />
            <Text style={styles.infoTitle}>Payment Method</Text>
          </View>
          <Text style={styles.infoText}>
            Currently using mock payment processing. In production, you'll be able to pay with credit card, debit card, or other payment methods.
          </Text>
        </Card>
      </View>

      {/* Load Button */}
      <View style={styles.section}>
        <PrimaryButton
          title={loading ? 'Processing...' : 'Load Funds'}
          onPress={handleLoadFunds}
          loading={loading}
          disabled={!amount || parseFloat(amount) <= 0 || loading}
        />
      </View>

      {/* Security Note */}
      <View style={styles.section}>
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
          <Text style={styles.securityText}>
            Your payment information is secure and encrypted
          </Text>
        </View>
      </View>

      {/* Add to Wallet Buttons */}
      {walletId && (
        <View style={styles.section}>
          <AddToWalletButtons walletId={walletId} mode={walletMode} />
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
  header: {
    width: '100%',
    padding: 16,
    paddingTop: Spacing.xl,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.wider,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
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
  },
  section: {
    paddingHorizontal: 12,
    paddingVertical: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  amountCard: {
    padding: Spacing.lg,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.teal,
    paddingBottom: Spacing.sm,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginRight: Spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    padding: 0,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: (width - 48) / 3 - 8,
    backgroundColor: Colors.white,
    borderRadius: 2,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  quickAmountButtonActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.teal,
    borderWidth: 2,
  },
  quickAmountText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
  },
  quickAmountTextActive: {
    color: Colors.white,
  },
  infoCard: {
    padding: Spacing.md,
    backgroundColor: Colors.teal + '10',
    borderLeftWidth: 4,
    borderLeftColor: Colors.teal,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
  },
  infoText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.navy,
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.success + '10',
    borderRadius: 2,
  },
  securityText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.navy,
    flex: 1,
  },
});


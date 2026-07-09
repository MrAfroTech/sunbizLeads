import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import AddToWalletButtons from '../components/AddToWalletButtons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// TODO: Get from auth context
const MOCK_USER_ID = 'user_123';

export default function WalletScreen({ navigation }) {
  // Dummy walletId for testing - remove when real wallet loading is working
  const DUMMY_WALLET_ID = 'dummy-wallet-12345';
  
  const [balance, setBalance] = useState(0);
  const [balanceCents, setBalanceCents] = useState(0);
  const [walletId, setWalletId] = useState(DUMMY_WALLET_ID);
  const [walletMode, setWalletMode] = useState('qr');
  const [qrToken, setQrToken] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Get or create wallet
      const walletResponse = await fetch('/api/wallets', {
        method: 'GET',
        headers: {
          'x-user-id': MOCK_USER_ID,
        },
      });

      if (!walletResponse.ok) {
        console.error('Wallet API error:', walletResponse.status, walletResponse.statusText);
        // Try to create wallet if GET fails
        const createResponse = await fetch('/api/wallets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': MOCK_USER_ID,
          },
          body: JSON.stringify({}),
        });
        
        if (createResponse.ok) {
          const createData = await createResponse.json();
          if (createData.success && createData.wallet) {
            const wallet = createData.wallet;
            setWalletId(wallet.id);
            setBalanceCents(wallet.balance_cents || 0);
            setBalance((wallet.balance_cents || 0) / 100);
            setWalletMode(wallet.wallet_mode || 'qr');
            await generateQRToken(wallet.id);
            await loadTransactions(wallet.id);
            return;
          }
        }
        throw new Error('Failed to create wallet');
      }

      const walletData = await walletResponse.json();
      console.log('Wallet API response:', walletData);
      
      if (walletData.success && walletData.wallet) {
        const wallet = walletData.wallet;
        console.log('Wallet loaded successfully, ID:', wallet.id);
        setWalletId(wallet.id);
        setBalanceCents(wallet.balance_cents || 0);
        setBalance((wallet.balance_cents || 0) / 100);
        setWalletMode(wallet.wallet_mode || 'qr');

        // Generate QR token
        await generateQRToken(wallet.id);

        // Load recent transactions
        await loadTransactions(wallet.id);
      } else {
        console.error('Wallet response missing wallet object:', walletData);
        // The API should auto-create, but if it doesn't, try POST
        try {
          const createResponse = await fetch('/api/wallets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': MOCK_USER_ID,
            },
            body: JSON.stringify({}),
          });
          
          if (createResponse.ok) {
            const createData = await createResponse.json();
            console.log('Created new wallet:', createData);
            if (createData.success && createData.wallet) {
              const wallet = createData.wallet;
              setWalletId(wallet.id);
              setBalanceCents(wallet.balance_cents || 0);
              setBalance((wallet.balance_cents || 0) / 100);
              setWalletMode(wallet.wallet_mode || 'qr');
              await generateQRToken(wallet.id);
              await loadTransactions(wallet.id);
            }
          } else {
            console.error('Failed to create wallet:', createResponse.status);
          }
        } catch (createError) {
          console.error('Error creating wallet:', createError);
        }
      }

    } catch (error) {
      console.error('Error loading wallet:', error);
      // Show error but don't crash
      Alert.alert(
        'Wallet Error',
        'Unable to load wallet. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateQRToken = async (wId) => {
    try {
      const response = await fetch(`/api/wallets/tokens?walletId=${wId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': MOCK_USER_ID,
        },
        body: JSON.stringify({
          walletId: wId,
          amountCents: null, // No specific amount
          tokenType: 'qr_payment',
        }),
      });

      const data = await response.json();
      if (data.success && data.token) {
        setQrToken(data.token);
      }
    } catch (error) {
      console.error('Error generating QR token:', error);
    }
  };

  const loadTransactions = async (wId = walletId) => {
    try {
      if (!wId) return;

      const response = await fetch(
        `/api/wallets/transactions?walletId=${wId}&limit=5`,
        {
          headers: {
            'x-user-id': MOCK_USER_ID,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setRecentTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  const handleLoadFunds = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('LoadFunds', { walletId });
  };

  const handleViewAllTransactions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('TransactionHistory', { walletId });
  };

  const handleModeChange = (newMode) => {
    setWalletMode(newMode);
    // Regenerate QR token if switching to QR mode
    if (newMode === 'qr' && walletId) {
      generateQRToken(walletId);
    }
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.teal} />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.teal}
        />
      }
    >
      {/* Balance Header */}
      <LinearGradient
        colors={[Colors.navy, Colors.teal]}
        style={styles.header}
      >
        <Text style={styles.balanceLabel}>WALLET BALANCE</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(balanceCents)}</Text>
        <Text style={styles.balanceSubtext}>Available to spend</Text>
      </LinearGradient>

      {/* Accent Line */}
      <View style={styles.accentLine} />

      {/* Load Funds Button */}
      <View style={styles.section}>
        <PrimaryButton
          title="Load Funds"
          onPress={handleLoadFunds}
          style={styles.loadFundsButton}
        />
      </View>

      {/* Add to Wallet Buttons - Always visible */}
      <View style={styles.section}>
        <AddToWalletButtons 
          walletId={walletId} 
          mode={walletMode}
          qrToken={qrToken}
          onShowQR={() => {
            // Show QR code display
            if (qrToken && walletId) {
              // For now, show alert - can be replaced with modal/navigation
              Alert.alert(
                'QR Code',
                'QR Code will be displayed here. Full QR display coming soon.',
                [{ text: 'OK' }]
              );
            } else if (walletId) {
              generateQRToken(walletId);
            }
          }}
        />
      </View>

      {/* QR Code Display (when available) */}
      {qrToken && (
        <View style={styles.section}>
          <Card style={styles.qrCard}>
            <Text style={styles.qrTitle}>SCAN TO PAY</Text>
            <QRCodeDisplay
              value={qrToken}
              label=""
              instructions="Show this QR code at checkout to pay from your wallet"
              size={250}
            />
            <TouchableOpacity
              style={styles.refreshQrButton}
              onPress={() => walletId && generateQRToken(walletId)}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color={Colors.teal} />
              <Text style={styles.refreshQrText}>Refresh QR Code</Text>
            </TouchableOpacity>
          </Card>
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
          {recentTransactions.length > 0 && (
            <TouchableOpacity
              onPress={handleViewAllTransactions}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentTransactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Your transaction history will appear here
            </Text>
          </Card>
        ) : (
          recentTransactions.map((transaction) => (
            <Card key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {transaction.transaction_type?.toUpperCase() || 'TRANSACTION'}
                  </Text>
                  <Text style={styles.transactionDescription}>
                    {transaction.description || 'Wallet transaction'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.amount_cents > 0
                      ? styles.transactionAmountPositive
                      : styles.transactionAmountNegative,
                  ]}
                >
                  {transaction.amount_cents > 0 ? '+' : ''}
                  {formatCurrency(Math.abs(transaction.amount_cents))}
                </Text>
              </View>
              <View style={styles.transactionFooter}>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.created_at)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    transaction.status === 'completed' && styles.statusBadgeSuccess,
                    transaction.status === 'pending' && styles.statusBadgePending,
                    transaction.status === 'failed' && styles.statusBadgeFailed,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {transaction.status?.toUpperCase() || 'PENDING'}
                  </Text>
                </View>
              </View>
            </Card>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  loadingText: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  header: {
    width: width,
    padding: 16,
    paddingTop: Spacing.xl,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  balanceLabel: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    opacity: 0.9,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    fontSize: Typography.fontSize.display,
    fontWeight: Typography.fontWeight.black,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  balanceSubtext: {
    fontSize: Typography.fontSize.body,
    color: Colors.white,
    opacity: 0.8,
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
  loadFundsButton: {
    width: '100%',
  },
  qrCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.md,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  refreshQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  refreshQrText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.teal,
    fontWeight: Typography.fontWeight.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  viewAllText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.teal,
    fontWeight: Typography.fontWeight.bold,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  transactionCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  transactionInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  transactionType: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.xs / 2,
  },
  transactionDescription: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
  },
  transactionAmount: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
  },
  transactionAmountPositive: {
    color: Colors.success,
  },
  transactionAmountNegative: {
    color: Colors.navy,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  transactionDate: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 2,
    backgroundColor: Colors.lightGray,
  },
  statusBadgeSuccess: {
    backgroundColor: Colors.success + '20',
  },
  statusBadgePending: {
    backgroundColor: Colors.warning + '20',
  },
  statusBadgeFailed: {
    backgroundColor: Colors.error + '20',
  },
  statusText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    letterSpacing: Typography.letterSpacing.wide,
  },
  loadingCard: {
    padding: Spacing.md,
    backgroundColor: Colors.lightGray + '50',
    alignItems: 'center',
  },
  loadingCardText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});


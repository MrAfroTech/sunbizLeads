import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { Card } from '../components/Card';
import * as Haptics from 'expo-haptics';

// TODO: Get from auth context
const MOCK_USER_ID = 'user_123';

export default function TransactionHistoryScreen({ navigation, route }) {
  const walletId = route?.params?.walletId;
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, load, authorize, capture, refund

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);

      if (!walletId) {
        setLoading(false);
        return;
      }

      let url = `/api/wallets/transactions?walletId=${walletId}&limit=100`;
      if (filter !== 'all') {
        url += `&type=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          'x-user-id': MOCK_USER_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const formatCurrency = (cents) => {
    return `$${Math.abs(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'load':
        return 'add-circle';
      case 'authorize':
        return 'lock-closed';
      case 'capture':
        return 'checkmark-circle';
      case 'refund':
        return 'arrow-undo-circle';
      case 'payment':
        return 'card';
      default:
        return 'receipt';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'load':
        return Colors.success;
      case 'authorize':
        return Colors.warning;
      case 'capture':
        return Colors.success;
      case 'refund':
        return Colors.orange;
      case 'payment':
        return Colors.navy;
      default:
        return Colors.textSecondary;
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.teal} />
        <Text style={styles.loadingText}>Loading transactions...</Text>
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
      {/* Header */}
      <LinearGradient
        colors={[Colors.navy, Colors.teal]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>TRANSACTION HISTORY</Text>
        <Text style={styles.headerSubtitle}>
          {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
        </Text>
      </LinearGradient>

      {/* Accent Line */}
      <View style={styles.accentLine} />

      {/* Filter Buttons */}
      <View style={styles.section}>
        <Text style={styles.label}>FILTER BY TYPE</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {['all', 'load', 'payment', 'refund'].map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                filter === filterType && styles.filterButtonActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(filterType);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === filterType && styles.filterButtonTextActive,
                ]}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <View style={styles.section}>
        {transactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {filter !== 'all'
                ? `No ${filter} transactions yet`
                : 'Your transaction history will appear here'}
            </Text>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.transactionIconContainer}>
                  <Ionicons
                    name={getTransactionIcon(transaction.transaction_type)}
                    size={32}
                    color={getTransactionColor(transaction.transaction_type)}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {transaction.transaction_type?.toUpperCase() || 'TRANSACTION'}
                  </Text>
                  <Text style={styles.transactionDescription}>
                    {transaction.description || 'Wallet transaction'}
                  </Text>
                  {transaction.pos_system && (
                    <Text style={styles.transactionMerchant}>
                      {transaction.pos_system.toUpperCase()} • {transaction.pos_order_id || 'N/A'}
                    </Text>
                  )}
                </View>
                <View style={styles.transactionAmountContainer}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.amount_cents > 0
                        ? styles.transactionAmountPositive
                        : styles.transactionAmountNegative,
                    ]}
                  >
                    {transaction.amount_cents > 0 ? '+' : ''}
                    {formatCurrency(transaction.amount_cents)}
                  </Text>
                </View>
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
                    transaction.status === 'refunded' && styles.statusBadgeRefunded,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {transaction.status?.toUpperCase() || 'PENDING'}
                  </Text>
                </View>
              </View>

              {/* Transaction IDs (if available) */}
              {(transaction.authorization_id ||
                transaction.capture_id ||
                transaction.refund_id) && (
                <View style={styles.transactionIds}>
                  {transaction.authorization_id && (
                    <Text style={styles.transactionId}>
                      Auth: {transaction.authorization_id.substring(0, 12)}...
                    </Text>
                  )}
                  {transaction.capture_id && (
                    <Text style={styles.transactionId}>
                      Capture: {transaction.capture_id.substring(0, 12)}...
                    </Text>
                  )}
                  {transaction.refund_id && (
                    <Text style={styles.transactionId}>
                      Refund: {transaction.refund_id.substring(0, 12)}...
                    </Text>
                  )}
                </View>
              )}
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
    width: '100%',
    padding: 16,
    paddingTop: Spacing.xl,
    alignItems: 'center',
    minHeight: 150,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.wider,
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
  filterContainer: {
    marginVertical: Spacing.xs,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 2,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    marginRight: Spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.teal,
    borderWidth: 2,
  },
  filterButtonText: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  filterButtonTextActive: {
    color: Colors.white,
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
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 2,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
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
    marginBottom: Spacing.xs / 2,
  },
  transactionMerchant: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: Typography.fontSize.h3,
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
    marginTop: Spacing.xs,
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
  statusBadgeRefunded: {
    backgroundColor: Colors.orange + '20',
  },
  statusText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    letterSpacing: Typography.letterSpacing.wide,
  },
  transactionIds: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  transactionId: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: Spacing.xs / 2,
  },
});


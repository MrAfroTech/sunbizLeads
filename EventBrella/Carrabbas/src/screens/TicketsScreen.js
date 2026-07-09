import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { Card } from '../components/Card';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { PrimaryButton } from '../components/PrimaryButton';
import { mockTickets } from '../data/mockTickets';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function TicketsScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [tickets] = useState(mockTickets.filter(t => t.status === 'upcoming'));

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleAddToWallet = (ticket) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Add to wallet functionality
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />
      }
    >
      <LinearGradient
        colors={[Colors.navy, Colors.teal]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>MY TICKETS</Text>
        <Text style={styles.headerSubtitle}>Your digital tickets</Text>
      </LinearGradient>

      {/* Ticketmaster Notice */}
      <View style={styles.notice}>
        <Ionicons name="information-circle" size={20} color={Colors.gold} />
        <Text style={styles.noticeText}>
          <Text style={styles.noticeBold}>TICKETMASTER INTEGRATION:</Text> Pending approval. 
          Tickets will auto-load once integrated.
        </Text>
      </View>

      {tickets.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Tickets Yet</Text>
          <Text style={styles.emptySubtitle}>Purchase tickets to see them here</Text>
          <PrimaryButton
            title="Browse Games"
            onPress={() => {}}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        tickets.map((ticket) => (
          <Card key={ticket.id} style={styles.ticketCard}>
            <LinearGradient
              colors={[Colors.teal, Colors.navy]}
              style={styles.ticketHeader}
            >
              <Text style={styles.ticketMatch}>vs {ticket.opponent}</Text>
              <Text style={styles.ticketVenue}>{ticket.venue}</Text>
            </LinearGradient>

            <View style={styles.ticketBody}>
              <View style={styles.ticketInfo}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>DATE</Text>
                    <Text style={styles.infoValue}>{ticket.date}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>TIME</Text>
                    <Text style={styles.infoValue}>{ticket.time}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>SECTION</Text>
                    <Text style={styles.infoValue}>{ticket.section}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>SEAT</Text>
                    <Text style={styles.infoValue}>Row {ticket.row}, Seat {ticket.seat}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.qrSection}>
                <QRCodeDisplay
                  value={ticket.qrCode}
                  label="SCAN FOR ENTRY"
                  instructions="Present this QR code at the gate"
                  size={200}
                />
              </View>

              <PrimaryButton
                title="ADD TO WALLET"
                onPress={() => handleAddToWallet(ticket)}
                style={styles.walletButton}
              />
            </View>
          </Card>
        ))
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
    width: width,
    padding: 16,
    paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.black,
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
  notice: {
    flexDirection: 'row',
    backgroundColor: Colors.gold + '30',
    margin: Spacing.md,
    padding: 12,
    borderRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.navy,
    lineHeight: 20,
    marginLeft: Spacing.xs,
  },
  noticeBold: {
    fontWeight: Typography.fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xxl,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    marginTop: Spacing.sm,
  },
  ticketCard: {
    margin: Spacing.md,
    overflow: 'hidden',
  },
  ticketHeader: {
    padding: 12,
  },
  ticketMatch: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs / 2,
  },
  ticketVenue: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.white,
    opacity: 0.9,
  },
  ticketBody: {
    padding: 12,
  },
  ticketInfo: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.xs / 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
  },
  qrSection: {
    backgroundColor: Colors.navy,
    borderRadius: 2,
    padding: 12,
    marginVertical: Spacing.md,
    alignItems: 'center',
  },
  walletButton: {
    marginTop: Spacing.xs,
  },
});

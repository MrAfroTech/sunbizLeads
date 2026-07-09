import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { Card } from '../components/Card';
import { mockPurchases } from '../data/mockPurchases';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const totalSpent = mockPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const loyaltyPoints = Math.floor(totalSpent / 10);

  const savedOffers = [
    {
      id: '1',
      title: '20% OFF Parking',
      code: 'PARK20',
      expiry: 'Mar 31, 2026',
      category: 'parking',
    },
    {
      id: '2',
      title: '15% OFF Merch',
      code: 'MERCH15',
      expiry: 'Apr 15, 2026',
      category: 'merch',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.navy, Colors.teal]}
        style={styles.header}
      >
        <View style={styles.avatar}>
          <Image 
            source={{ uri: '/orlandopirateslogo.svg' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.userName}>Pirates Fan</Text>
        <Text style={styles.userEmail}>fan@orlandopirates.com</Text>
      </LinearGradient>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={[Colors.gold, Colors.orange]}
            style={styles.summaryGradient}
          >
            <Text style={styles.summaryLabel}>LOYALTY POINTS</Text>
            <Text style={styles.summaryValue}>{loyaltyPoints}</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Loyalty Rewards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LOYALTY REWARDS</Text>
        {savedOffers.map((offer) => (
          <Card key={offer.id} style={styles.offerCard}>
            <LinearGradient
              colors={[Colors.teal, Colors.navy]}
              style={styles.offerGradient}
            >
              <View style={styles.offerContent}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerCode}>Code: {offer.code}</Text>
                <Text style={styles.offerExpiry}>Expires: {offer.expiry}</Text>
              </View>
              <Ionicons name="pricetag" size={32} color={Colors.white} />
            </LinearGradient>
          </Card>
        ))}
      </View>

      {/* Receipts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RECEIPTS</Text>
        {mockPurchases.map((purchase) => (
          <Card key={purchase.id} style={styles.purchaseCard}>
            <View style={styles.purchaseHeader}>
              <View style={styles.purchaseInfo}>
                <Text style={styles.purchaseItem}>{purchase.item}</Text>
                <Text style={styles.purchaseType}>
                  {purchase.category.charAt(0).toUpperCase() + purchase.category.slice(1)}
                </Text>
              </View>
              <Text style={styles.purchaseAmount}>${purchase.amount.toFixed(2)}</Text>
            </View>
            <View style={styles.purchaseFooter}>
              <Text style={styles.purchaseDate}>{purchase.date}</Text>
              <Text style={styles.purchaseLocation}>{purchase.location}</Text>
            </View>
          </Card>
        ))}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.settingsItem} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsText}>Settings</Text>
          <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.settingsItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.settingsItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsText}>About</Text>
          <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 2, // Sharp, square avatar - athletic aesthetic
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  logo: {
    width: 70,
    height: 70,
  },
  userName: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs / 2,
  },
  userEmail: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.white,
    opacity: 0.9,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  summaryCard: {
    flex: 1,
    borderRadius: 2,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryGradient: {
    padding: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: Spacing.xs,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.black,
    color: Colors.white,
  },
  section: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.md,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  offerCard: {
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  offerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs / 2,
  },
  offerCode: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs / 2,
  },
  offerExpiry: {
    fontSize: Typography.fontSize.caption,
    color: Colors.white,
    opacity: 0.8,
  },
  purchaseCard: {
    marginBottom: Spacing.md,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    padding: 12,
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseItem: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.xs / 2,
  },
  purchaseType: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
  },
  purchaseAmount: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.orange,
  },
  purchaseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  purchaseDate: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
  },
  purchaseLocation: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
  },
  settingsItem: {
    backgroundColor: Colors.white,
    borderRadius: 2,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
  },
});

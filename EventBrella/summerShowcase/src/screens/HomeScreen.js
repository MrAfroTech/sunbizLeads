import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { PrimaryButton } from '../components/PrimaryButton';
import { GameCard } from '../components/GameCard';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const QUICK_ACTION_CARD_WIDTH = Math.floor((width - 32) / 2); // Responsive 2-column layout

export default function HomeScreen({ navigation }) {
  const quickActions = [
    { id: 1, title: 'Scan QR Code', icon: 'qr-code', screen: 'Tickets' },
    { id: 2, title: 'View Tickets', icon: 'ticket', screen: 'Tickets' },
  ];

  const handleQuickAction = (screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(screen);
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <LinearGradient
        colors={[Colors.navy, Colors.teal]}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>GAME DAY</Text>
        <Text style={styles.heroSubtitle}>Welcome Pirates Fans!</Text>
        <Text style={styles.heroNextGame}>Next: vs Quad City Steamwheelers • Apr 5</Text>
        <PrimaryButton
          title="View Tickets"
          onPress={() => navigation.navigate('Tickets')}
          style={styles.heroButton}
        />
      </LinearGradient>

      {/* Accent Line */}
      <View style={styles.accentLine} />

      {/* Quick Actions Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleWhite}>QUICK ACTIONS</Text>
        </View>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={() => handleQuickAction(action.screen)}
              activeOpacity={0.7}
            >
              <Ionicons name={action.icon} size={32} color={Colors.teal} />
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Accent Line */}
      <View style={styles.accentLine} />

      {/* Upcoming Games */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleWhite}>UPCOMING GAMES</Text>
        </View>
        <View style={styles.gamesStack}>
          <View style={styles.gameCardWrapper}>
            <GameCard
              opponent="Quad City Steamwheelers"
              date="Apr 5, 2026"
              time="7:00 PM"
              venue="KIA Center"
              isHome={true}
            />
          </View>
          <View style={styles.gameCardWrapper}>
            <GameCard
              opponent="Tulsa Oilers"
              date="Apr 12, 2026"
              time="7:30 PM"
              venue="KIA Center"
              isHome={true}
            />
          </View>
          <View style={styles.gameCardWrapper}>
            <GameCard
              opponent="Fishers Freight"
              date="May 9, 2026"
              time="7:00 PM"
              venue="KIA Center"
              isHome={true}
            />
          </View>
        </View>
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
  hero: {
    width: '100%',
    padding: 16, // Tight padding
    paddingTop: Spacing.xl,
    alignItems: 'center',
    minHeight: 250,
    justifyContent: 'center',
    borderRadius: 0, // Full-bleed, no rounding
    alignSelf: 'stretch',
  },
  heroTitle: {
    fontSize: Typography.fontSize.hero,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.normal,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.h3,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  heroNextGame: {
    fontSize: Typography.fontSize.body,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: Spacing.md,
  },
  heroButton: {
    marginTop: Spacing.sm,
  },
  section: {
    paddingHorizontal: 8, // Tight page margins (8-16px)
    paddingVertical: Spacing.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionHeader: {
    backgroundColor: Colors.navy,
    padding: 12, // Tight padding
    marginBottom: 12,
    marginHorizontal: -8, // Full-width (extends to page edges)
    borderRadius: 0, // Sharp edges
    alignSelf: 'stretch',
  },
  sectionTitleWhite: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  accentLine: {
    height: 3, // Thick accent line (2-3px)
    backgroundColor: Colors.teal,
    marginVertical: 12, // Tight spacing
    marginHorizontal: -8, // Full-width
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.navy,
    marginBottom: Spacing.md,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    width: QUICK_ACTION_CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 2, // 2-4px
    padding: 12, // Tight padding
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 100, // Reduced height
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, // Minimal shadow
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  gamesStack: {
    gap: Spacing.md,
  },
  gameCardWrapper: {
    width: '100%',
    marginHorizontal: 0,
  },
});

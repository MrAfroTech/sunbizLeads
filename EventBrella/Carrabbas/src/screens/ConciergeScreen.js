import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import * as Haptics from 'expo-haptics';

export default function ConciergeScreen({ navigation }) {

  const handleRideShares = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('RideShareSelection');
  };

  const handleGameDayEats = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('GameDayEatsList');
  };

  const handleFanZone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('FanZoneMenu');
  };

  const menuItems = [
    {
      id: 1,
      title: 'Ride Shares',
      subtitle: 'Book Uber or Lyft',
      icon: 'car',
      onPress: handleRideShares,
    },
    {
      id: 2,
      title: 'Around the Port',
      subtitle: 'Bars and restaurants near Kia Center',
      icon: 'restaurant',
      onPress: handleGameDayEats,
    },
    {
      id: 3,
      title: 'FanZone',
      subtitle: 'KIA Center Concessions',
      icon: 'people',
      onPress: handleFanZone,
    },
  ];

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CARRABBA'S CORNER</Text>
        <Text style={styles.headerSubtitle}>We're here to help</Text>
      </View>

      {/* Accent Line */}
      <View style={styles.accentLine} />

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SERVICES</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemIconContainer}>
              <Ionicons name={item.icon} size={28} color={Colors.teal} />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
          </TouchableOpacity>
        ))}
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.gray,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
});


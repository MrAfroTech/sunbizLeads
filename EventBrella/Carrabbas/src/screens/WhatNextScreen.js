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

const SUBMENU_STYLE = {
  backgroundColor: Colors.tabActiveBg,
  paddingVertical: Spacing.md,
  paddingHorizontal: Spacing.lg,
  marginBottom: 2,
};

export default function WhatNextScreen({ navigation }) {
  const handleItsShowtime = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Showtimes');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>What's Next</Text>
      <Text style={styles.subheader}>Experiences we think you'll love</Text>

      <TouchableOpacity
        style={[styles.submenuItem, SUBMENU_STYLE]}
        onPress={handleItsShowtime}
        activeOpacity={0.85}
      >
        <Text style={styles.submenuText}>It's Showtime</Text>
        <Ionicons name="chevron-forward" size={22} color={Colors.white} />
      </TouchableOpacity>

      <View style={styles.placeholder}>
        <Ionicons name="sparkles" size={48} color={Colors.tabActiveBg} />
        <Text style={styles.placeholderText}>More coming soon</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundGray },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.navCharcoal,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.xs,
  },
  subheader: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  submenuText: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
  placeholder: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  placeholderText: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});

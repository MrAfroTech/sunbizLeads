import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

/**
 * Minimal placeholder for tab screens (Order, Catering, Gift Cards, etc.).
 * Shows the tab title only. Do not change other app behavior.
 */
export default function PlaceholderTabScreen({ route }) {
  const title = route.params?.title ?? route.name ?? 'Tab';
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navCharcoal,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
});

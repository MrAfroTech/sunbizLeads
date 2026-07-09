import React from 'react';
import { View, StyleSheet } from 'react-native';
import CarrabbasSlider from './CarrabbasSlider';
import { TAB_BAR_HEIGHT } from './VerticalTabBar';

/**
 * Wraps any screen content with the full-width slider. Nav bar sits below
 * the slider; content area has paddingTop so it starts below the nav.
 */
export default function WithSlider({ children }) {
  return (
    <View style={styles.container}>
      <CarrabbasSlider />
      <View style={[styles.content, { paddingTop: TAB_BAR_HEIGHT }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
  },
});

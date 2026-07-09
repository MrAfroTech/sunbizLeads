import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

export const Card = ({ 
  children, 
  style, 
  header, 
  footer,
  padding = Spacing.md 
}) => {
  return (
    <View style={[styles.card, style]}>
      {header && <View style={styles.header}>{header}</View>}
      <View style={[styles.content, { padding }]}>
        {children}
      </View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 2, // 2-4px - almost sharp, ESPN/NFL style
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, // Minimal shadow - elevation 1-2 max
    shadowRadius: 2,
    elevation: 1, // Minimal elevation
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  content: {
    width: '100%',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
});


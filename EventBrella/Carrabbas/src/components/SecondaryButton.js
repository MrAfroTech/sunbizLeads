import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export const SecondaryButton = ({ 
  title, 
  onPress, 
  disabled = false,
  style 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.navy,
    paddingVertical: 16, // Generous for touch
    paddingHorizontal: 32,
    borderRadius: 2, // 2-4px - almost sharp
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.navy,
    fontSize: Typography.fontSize.button,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
});


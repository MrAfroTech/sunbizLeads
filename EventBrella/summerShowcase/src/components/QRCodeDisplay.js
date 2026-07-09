import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';

const { width } = Dimensions.get('window');

export const QRCodeDisplay = ({ 
  value, 
  label, 
  instructions,
  size = 200,
  onPress 
}) => {
  const qrSize = Math.min(size, width - Spacing.xl * 2);
  
  const content = (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.qrWrapper}>
        <View style={styles.qrContainer}>
          <QRCode
            value={value}
            size={qrSize}
            color={Colors.black}
            backgroundColor={Colors.white}
          />
        </View>
      </View>
      {instructions && (
        <Text style={styles.instructions}>{instructions}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textOnDark,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
  qrWrapper: {
    backgroundColor: Colors.navy,
    padding: 12, // Tight padding
    borderRadius: 2, // 2-4px - almost sharp
    borderWidth: 2,
    borderColor: Colors.teal,
    marginVertical: Spacing.sm,
  },
  qrContainer: {
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 0, // Images stay sharp
  },
  instructions: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
});


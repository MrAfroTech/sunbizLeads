import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import * as Haptics from 'expo-haptics';

export const PollOption = ({ 
  option, 
  selected = false, 
  disabled = false,
  percentage = 0,
  votes = 0,
  onPress 
}) => {
  const handlePress = () => {
    if (!disabled && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.containerSelected,
        disabled && styles.containerDisabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[
          styles.optionText,
          selected && styles.optionTextSelected,
        ]}>
          {option}
        </Text>
        {percentage > 0 && (
          <Text style={[
            styles.percentage,
            selected && styles.percentageSelected,
          ]}>
            {percentage}%
          </Text>
        )}
      </View>
      
      {percentage > 0 && (
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${percentage}%` },
              selected && styles.progressFillSelected,
            ]} 
          />
        </View>
      )}
      
      {votes > 0 && (
        <Text style={styles.votes}>{votes} votes</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 2, // 2-4px - almost sharp
    padding: 12, // Tight padding
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    minHeight: 60, // Larger touch target
  },
  containerSelected: {
    backgroundColor: Colors.teal + '20',
    borderColor: Colors.teal,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  optionText: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.navy,
  },
  optionTextSelected: {
    color: Colors.navy,
  },
  percentage: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.teal,
    marginLeft: Spacing.sm,
  },
  percentageSelected: {
    color: Colors.teal,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.teal,
    borderRadius: 4,
  },
  progressFillSelected: {
    backgroundColor: Colors.teal,
  },
  votes: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
  },
});


import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const GameCard = ({ 
  opponent, 
  date, 
  time, 
  venue, 
  score,
  isHome = true 
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.opponent}>
          {isHome ? 'vs' : '@'} {opponent}
        </Text>
      </View>
      
      <Text style={styles.venue}>{venue}</Text>
      
      <View style={styles.infoRow}>
        <Ionicons name="calendar" size={16} color={Colors.white} style={styles.icon} />
        <Text style={styles.infoText}>{date}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="time" size={16} color={Colors.teal} style={styles.icon} />
        <Text style={styles.timeText}>{time}</Text>
      </View>
      
      {score && (
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{score}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.navy,
    borderRadius: 2, // 2-4px - almost sharp
    borderWidth: 2,
    borderColor: Colors.teal,
    padding: 12, // Tight padding
    marginRight: 0, // No right margin in vertical stack
    width: '100%', // Full width when in vertical stack
    flex: 1, // Allow stretching
  },
  header: {
    marginBottom: Spacing.xs,
  },
  opponent: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  venue: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.white,
    opacity: 0.9,
  },
  timeText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.teal,
    fontWeight: Typography.fontWeight.semibold,
  },
  scoreContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.teal + '40',
  },
  score: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.teal,
    textAlign: 'center',
  },
});


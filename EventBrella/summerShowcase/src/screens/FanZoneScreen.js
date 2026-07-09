import React, { useState } from 'react';
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
import { Card } from '../components/Card';
import { PollOption } from '../components/PollOption';
import { PrimaryButton } from '../components/PrimaryButton';
import { mockPolls } from '../data/mockPolls';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function FanZoneScreen({ navigation }) {
  const [userPoints] = useState(450);
  const [polls, setPolls] = useState(mockPolls);
  const [userVotes, setUserVotes] = useState({});

  const handleVote = (pollId, optionId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setPolls(polls.map(poll => {
      if (poll.id === pollId && !userVotes[pollId]) {
        const updatedOptions = poll.options.map(opt => ({
          ...opt,
          votes: opt.id === optionId ? opt.votes + 1 : opt.votes,
        }));
        return {
          ...poll,
          options: updatedOptions,
          totalVotes: poll.totalVotes + 1,
        };
      }
      return poll;
    }));

    setUserVotes({ ...userVotes, [pollId]: optionId });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const calculatePercentage = (votes, total) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const activePolls = polls.filter(poll => poll.active);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[Colors.navy, Colors.teal]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>FAN ZONE</Text>
        <Text style={styles.headerSubtitle}>Your voice matters!</Text>
      </LinearGradient>

      {/* Points & Badges */}
      <View style={styles.section}>
        <Card>
          <LinearGradient
            colors={[Colors.teal, Colors.navy]}
            style={styles.pointsContent}
          >
            <View style={styles.pointsSection}>
              <Text style={styles.pointsLabel}>YOUR POINTS</Text>
              <Text style={styles.pointsValue}>{userPoints}</Text>
            </View>
            <View style={styles.badgesSection}>
              <Text style={styles.badgesLabel}>YOUR BADGES</Text>
              <View style={styles.badges}>
                <Ionicons name="trophy" size={32} color={Colors.gold} />
                <Ionicons name="star" size={32} color={Colors.gold} />
                <Ionicons name="flame" size={32} color={Colors.orange} />
              </View>
            </View>
          </LinearGradient>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsInfoText}>
              💡 Earn 10 points per vote. Unlock rewards at 500 points!
            </Text>
          </View>
        </Card>
      </View>

      {/* Active Polls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACTIVE POLLS</Text>
        {activePolls.map((poll) => {
          const hasVoted = userVotes[poll.id];
          return (
            <Card key={poll.id} style={styles.pollCard}>
              <View style={styles.pollHeader}>
                <Text style={styles.pollQuestion}>{poll.question}</Text>
                <View style={styles.pollStatus}>
                  <Text style={styles.pollStatusText}>
                    {poll.active ? 'ACTIVE' : 'CLOSED'}
                  </Text>
                </View>
              </View>

              <View style={styles.pollOptions}>
                {poll.options.map((option) => {
                  const percentage = calculatePercentage(option.votes, poll.totalVotes);
                  const isSelected = userVotes[poll.id] === option.id;
                  
                  return (
                    <PollOption
                      key={option.id}
                      option={option.text}
                      selected={isSelected}
                      disabled={hasVoted || !poll.active}
                      percentage={hasVoted ? percentage : 0}
                      votes={hasVoted ? option.votes : 0}
                      onPress={() => !hasVoted && poll.active && handleVote(poll.id, option.id)}
                    />
                  );
                })}
              </View>

              {hasVoted && (
                <Text style={styles.totalVotes}>Total votes: {poll.totalVotes}</Text>
              )}
            </Card>
          );
        })}
      </View>

      {/* Leaderboard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LEADERBOARD</Text>
        <Card>
          <View style={styles.leaderboardHeader}>
            <Text style={styles.leaderboardSubtitle}>Top Fans This Season</Text>
          </View>
          <View style={styles.leaderboardList}>
            {[
              { rank: 1, name: 'BuccaneerFan_91', points: 2450, badge: '🥇' },
              { rank: 2, name: 'Pirates4Life', points: 2180, badge: '🥈' },
              { rank: 3, name: 'OrlandoLegacy', points: 1950, badge: '🥉' },
              { rank: 4, name: 'You', points: 450, badge: '⭐', isYou: true },
            ].map((fan) => (
              <View
                key={fan.rank}
                style={[
                  styles.leaderboardItem,
                  fan.isYou && styles.leaderboardItemHighlight,
                ]}
              >
                <View style={styles.leaderboardRank}>
                  <Text style={styles.leaderboardBadge}>{fan.badge}</Text>
                  <Text style={styles.leaderboardRankNumber}>{fan.rank}</Text>
                </View>
                <View style={styles.leaderboardInfo}>
                  <Text style={styles.leaderboardName}>{fan.name}</Text>
                  <Text style={styles.leaderboardPoints}>{fan.points} points</Text>
                </View>
                {fan.rank <= 3 && (
                  <Ionicons name="trophy" size={24} color={Colors.gold} />
                )}
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* Community Feed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>COMMUNITY FEED</Text>
        <View style={styles.feedList}>
          {[
            {
              id: 1,
              name: 'BuccaneerFan_91',
              text: 'What a match! The energy at Orlando Stadium was incredible! 🏆',
              time: '2 hours ago',
            },
            {
              id: 2,
              name: 'Pirates4Life',
              text: "Can't wait for the next match! See you all there! ⚽",
              time: '5 hours ago',
            },
          ].map((post) => (
            <Card key={post.id} style={styles.feedItem}>
              <View style={styles.feedHeader}>
                <View style={styles.feedAvatar}>
                  <Text style={styles.feedAvatarText}>
                    {post.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.feedContent}>
                  <Text style={styles.feedName}>{post.name}</Text>
                  <Text style={styles.feedText}>{post.text}</Text>
                  <Text style={styles.feedTime}>{post.time}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  header: {
    width: width,
    padding: 16,
    paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.black,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.wider,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.white,
    opacity: 0.9,
  },
  section: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.md,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  pointsContent: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pointsSection: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: Spacing.xs,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  pointsValue: {
    fontSize: Typography.fontSize.display,
    fontWeight: Typography.fontWeight.black,
    color: Colors.white,
  },
  badgesSection: {
    alignItems: 'flex-end',
  },
  badgesLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: Spacing.xs,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  pointsInfo: {
    backgroundColor: Colors.white + '20',
    padding: 12,
  },
  pointsInfoText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.white,
  },
  pollCard: {
    marginBottom: Spacing.md,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    padding: 12,
  },
  pollQuestion: {
    flex: 1,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginRight: Spacing.sm,
  },
  pollStatus: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 2,
  },
  pollStatusText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  pollOptions: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  totalVotes: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingHorizontal: Spacing.md,
  },
  leaderboardHeader: {
    backgroundColor: Colors.navy,
    padding: 12,
  },
  leaderboardSubtitle: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.white,
    opacity: 0.9,
  },
  leaderboardList: {
    padding: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    gap: Spacing.md,
  },
  leaderboardItemHighlight: {
    backgroundColor: Colors.teal + '10',
    borderRadius: 2,
    paddingHorizontal: Spacing.xs,
  },
  leaderboardRank: {
    alignItems: 'center',
    width: 60,
  },
  leaderboardBadge: {
    fontSize: 24,
    marginBottom: Spacing.xs / 2,
  },
  leaderboardRankNumber: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.xs / 2,
  },
  leaderboardPoints: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.textSecondary,
  },
  feedList: {
    gap: Spacing.md,
  },
  feedItem: {
    padding: 12,
  },
  feedHeader: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  feedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 2,
    backgroundColor: Colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedAvatarText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  feedContent: {
    flex: 1,
  },
  feedName: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.xs / 2,
  },
  feedText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.navy,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  feedTime: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
  },
});

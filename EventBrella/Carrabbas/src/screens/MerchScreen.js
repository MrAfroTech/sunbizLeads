import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { Card } from '../components/Card';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { PrimaryButton } from '../components/PrimaryButton';
import { mockMerch, getMerchOfTheDay } from '../data/mockMerch';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function MerchScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 23, seconds: 45 });
  
  const merchOfTheDay = getMerchOfTheDay();
  
  const categories = ['all', 'jerseys', 'hats', 'accessories'];
  const categoryLabels = {
    all: 'All',
    jerseys: 'Jerseys',
    hats: 'Hats',
    accessories: 'Accessories',
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filteredMerch = selectedCategory === 'all' 
    ? mockMerch.filter(item => !item.featured)
    : mockMerch.filter(item => item.category === selectedCategory && !item.featured);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Banner - Merch of the Day */}
      <LinearGradient
        colors={[Colors.navy, Colors.teal]}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>TODAY ONLY</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>MERCH OF THE DAY</Text>
          <Text style={styles.heroSubtitle}>{merchOfTheDay.name}</Text>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>DEAL EXPIRES IN</Text>
            <View style={styles.timerDisplay}>
              <View style={styles.timerUnit}>
                <Text style={styles.timerNumber}>
                  {String(timeLeft.hours).padStart(2, '0')}
                </Text>
                <Text style={styles.timerLabelSmall}>HRS</Text>
              </View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerUnit}>
                <Text style={styles.timerNumber}>
                  {String(timeLeft.minutes).padStart(2, '0')}
                </Text>
                <Text style={styles.timerLabelSmall}>MIN</Text>
              </View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerUnit}>
                <Text style={styles.timerNumber}>
                  {String(timeLeft.seconds).padStart(2, '0')}
                </Text>
                <Text style={styles.timerLabelSmall}>SEC</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Merch of the Day Card */}
      <View style={styles.section}>
        <Card>
          <View style={styles.dealHeader}>
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.originalPrice}>${merchOfTheDay.originalPrice}</Text>
                <Text style={styles.salePrice}>${merchOfTheDay.price}</Text>
              </View>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {Math.round((1 - merchOfTheDay.price / merchOfTheDay.originalPrice) * 100)}% OFF
                </Text>
              </View>
            </View>
            
            <View style={styles.imageSection}>
              {merchOfTheDay.image && (
                <Image 
                  source={{ uri: merchOfTheDay.image }} 
                  style={styles.merchImage}
                  resizeMode="contain"
                />
              )}
            </View>
            
            <PrimaryButton
              title="CLAIM OFFER"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={styles.claimButton}
            />
          </View>
        </Card>
      </View>

      {/* Product Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SHOP BY CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.categoryTabActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(category);
              }}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {categoryLabels[category]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ALL MERCHANDISE</Text>
        <View style={styles.productGrid}>
          {filteredMerch.map((item) => (
            <Card key={item.id} style={styles.productCard}>
              {item.image ? (
                <View style={styles.productImageContainer}>
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="shirt" size={48} color={Colors.lightGray} />
                </View>
              )}
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.viewButtonText}>VIEW</Text>
              </TouchableOpacity>
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
  hero: {
    width: width,
    padding: 16,
    paddingTop: Spacing.xxl,
    minHeight: 300,
  },
  heroContent: {
    alignItems: 'center',
  },
  badgeContainer: {
    marginBottom: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 2,
  },
  badgeText: {
    color: Colors.navy,
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.black,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.wider,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  timerContainer: {
    backgroundColor: Colors.orange + '20',
    borderRadius: 2,
    padding: 12,
    marginTop: Spacing.sm,
    width: '100%',
  },
  timerLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  timerDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerUnit: {
    alignItems: 'center',
  },
  timerNumber: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.black,
    color: Colors.white,
    backgroundColor: Colors.navy + '50',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 2,
    minWidth: 60,
    textAlign: 'center',
  },
  timerLabelSmall: {
    fontSize: Typography.fontSize.caption,
    color: Colors.white,
    marginTop: Spacing.xs / 2,
  },
  timerSeparator: {
    fontSize: Typography.fontSize.h1,
    color: Colors.white,
    marginHorizontal: Spacing.xs,
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
  dealHeader: {
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  originalPrice: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
    marginBottom: Spacing.xs / 2,
  },
  salePrice: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.orange,
  },
  discountBadge: {
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 2,
  },
  discountText: {
    color: Colors.white,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
  },
  imageSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
    padding: 4,
    marginVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  merchImage: {
    width: 200,
    height: 200,
    maxWidth: 200,
    maxHeight: 200,
  },
  productImageContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
    marginBottom: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 3,
  },
  productImage: {
    width: 120,
    height: 120,
    maxWidth: 120,
    maxHeight: 120,
  },
  claimButton: {
    marginTop: Spacing.xs,
  },
  categoryScroll: {
    marginBottom: Spacing.md,
  },
  categoryTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  categoryTabActive: {
    borderBottomColor: Colors.teal,
  },
  categoryText: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.bold,
  },
  categoryTextActive: {
    color: Colors.teal,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  productCard: {
    width: (width - 12 * 2 - Spacing.sm) / 2, // Account for section padding (12*2) and gap between cards
    maxWidth: '100%',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
  },
  productImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    maxWidth: '100%',
  },
  productName: {
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.xs,
    minHeight: 40,
  },
  productPrice: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.sm,
  },
  viewButton: {
    backgroundColor: Colors.teal,
    paddingVertical: Spacing.xs,
    borderRadius: 2,
    alignItems: 'center',
  },
  viewButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
});

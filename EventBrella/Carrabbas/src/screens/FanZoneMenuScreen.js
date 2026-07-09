import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { Card } from '../components/Card';

// TODO: POS Integration - Activate when POS system confirmed
// import { POSServiceFactory, Menu } from '../services/pos';

const { width } = Dimensions.get('window');

export default function FanZoneMenuScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: POS Integration - Activate when POS system confirmed
    // loadMenu();
  }, []);

  // TODO: POS Integration - Activate when POS system confirmed
  // const loadMenu = async () => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //
  //     // Initialize POS service
  //     const posService = await POSServiceFactory.createAndInitialize('mock');
  //     
  //     // Fetch menu data
  //     const menuData = await posService.fetchMenu();
  //     const menuObj = new Menu(menuData.menu);
  //     
  //     setMenu(menuObj);
  //     console.log('Menu loaded:', menuObj.getTotalItemCount(), 'items');
  //   } catch (err) {
  //     console.error('Failed to load menu:', err);
  //     setError('Unable to load menu. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.navy, Colors.teal]}
        style={styles.header}
      >
        <Ionicons name="people" size={48} color={Colors.white} />
        <Text style={styles.headerTitle}>FAN ZONE</Text>
        <Text style={styles.headerSubtitle}>Official Game Day Partner Experience</Text>
      </LinearGradient>

      {/* Under Construction Content */}
      <View style={styles.section}>
        <Card style={styles.constructionCard}>
          <View style={styles.constructionContent}>
            <Ionicons name="construct" size={64} color={Colors.teal} />
            <Text style={styles.constructionTitle}>Coming Soon!</Text>
            <Text style={styles.constructionText}>
              We're integrating with KIA Center concessions to bring you the ultimate game day experience.
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.featureText}>Order from your seat</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.featureText}>Skip the concession lines</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.featureText}>Real-time order tracking</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.featureText}>Multiple payment options</Text>
              </View>
            </View>
            <Text style={styles.comingSoonNote}>
              🎉 This feature will be available soon. Stay tuned!
            </Text>
          </View>
        </Card>
      </View>

      {/* POS Integration Info (Development) */}
      {__DEV__ && (
        <View style={styles.section}>
          <Card style={styles.devCard}>
            <View style={styles.devHeader}>
              <Ionicons name="code-slash" size={24} color={Colors.navy} />
              <Text style={styles.devTitle}>Developer Info</Text>
            </View>
            <Text style={styles.devText}>
              <Text style={styles.devLabel}>POS Service Layer:</Text> Ready{'\n'}
              <Text style={styles.devLabel}>Integration Status:</Text> Awaiting POS system confirmation{'\n'}
              <Text style={styles.devLabel}>Mock Service:</Text> Available for testing{'\n'}
              <Text style={styles.devLabel}>Service Path:</Text> /src/services/pos/
            </Text>
            <Text style={styles.devNote}>
              💡 To activate: Uncomment the POS integration code in this file and HomeScreen.js
            </Text>
          </Card>
        </View>
      )}

      {/* TODO: When POS is activated, this section will show the actual menu */}
      {/* 
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {menu && (
        <View style={styles.section}>
          {menu.categories.map((category) => (
            <View key={category.id} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.name}</Text>
              {category.items.map((item) => (
                <Card key={item.id} style={styles.menuItemCard}>
                  <View style={styles.menuItemContent}>
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      {item.description && (
                        <Text style={styles.menuItemDescription}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.menuItemPricing}>
                      <Text style={styles.menuItemPrice}>
                        ${item.price.toFixed(2)}
                      </Text>
                      {item.available && (
                        <PrimaryButton
                          title="Add"
                          onPress={() => handleAddToCart(item)}
                          style={styles.addButton}
                        />
                      )}
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ))}
        </View>
      )}
      */}
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
    paddingTop: Spacing.xl,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.heavy,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.wider,
    marginTop: Spacing.md,
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
  constructionCard: {
    padding: Spacing.lg,
  },
  constructionContent: {
    alignItems: 'center',
  },
  constructionTitle: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  constructionText: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  featuresList: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: Typography.fontSize.body,
    color: Colors.navy,
    flex: 1,
  },
  comingSoonNote: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.md,
  },
  devCard: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderLeftWidth: 4,
    borderLeftColor: Colors.teal,
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  devTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
  },
  devText: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.navy,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  devLabel: {
    fontWeight: Typography.fontWeight.bold,
  },
  devNote: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.body,
    color: Colors.error,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
  menuItemCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  menuItemName: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.navy,
    marginBottom: Spacing.xs / 2,
  },
  menuItemDescription: {
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  menuItemPricing: {
    alignItems: 'flex-end',
  },
  menuItemPrice: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.teal,
    marginBottom: Spacing.xs,
  },
  addButton: {
    minWidth: 80,
    paddingVertical: Spacing.xs,
  },
});

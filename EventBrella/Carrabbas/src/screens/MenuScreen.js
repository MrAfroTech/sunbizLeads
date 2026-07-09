import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { Card } from '../components/Card';

// TODO: POS Integration - Activate when POS system confirmed
// import { POSServiceFactory, Menu } from '../services/pos';

export default function MenuScreen({ navigation, route }) {
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
  section: {
    padding: 12,
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



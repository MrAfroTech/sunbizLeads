import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { SLIDER_HEIGHT } from './CarrabbasSlider';

const HEADER_HEIGHT = 60;
// Position below header + slider so nav bar sits directly under carousel.
const TOP_OFFSET = HEADER_HEIGHT + SLIDER_HEIGHT;
const ROW_HEIGHT = 52;
const TAB_COUNT = 9;
const TAB_BAR_HEIGHT = TAB_COUNT * ROW_HEIGHT;

/**
 * Vertical tab bar below the image slider. Full-width rows stacked vertically,
 * one on top of the other, no gap. Same icons, labels, and colors as before.
 */
export default function VerticalTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const focused = state.index === index;
        const color = focused ? Colors.tabActiveText : Colors.navCharcoal;
        const bgColor = focused ? Colors.tabActiveBg : 'transparent';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tab, { backgroundColor: bgColor }]}
            activeOpacity={0.7}
          >
            {options.tabBarIcon?.({ focused, color, size: 22 })}
            <Text
              style={[styles.label, { color }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: TOP_OFFSET,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: Colors.navCream,
    borderTopWidth: 2,
    borderTopColor: Colors.tabBorderAccent,
    flexDirection: 'column',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    height: ROW_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  label: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
    marginLeft: 12,
  },
});

export { TAB_BAR_HEIGHT };

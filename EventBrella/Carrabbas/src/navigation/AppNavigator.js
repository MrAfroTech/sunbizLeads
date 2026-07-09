import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

// Import screens
import MenuScreen from '../screens/MenuScreen';
import PlaceholderTabScreen from '../screens/PlaceholderTabScreen';
import WhatNextScreen from '../screens/WhatNextScreen';
import ShowtimesScreen from '../screens/ShowtimesScreen';
import ConciergeScreen from '../screens/ConciergeScreen';
import RideShareSelectionScreen from '../screens/RideShareSelectionScreen';
import RideBookingScreen from '../screens/RideBookingScreen';
import RideTrackingScreen from '../screens/RideTrackingScreen';
import GameDayEatsListScreen from '../screens/GameDayEatsListScreen';
import GameDayEatsDetailScreen from '../screens/GameDayEatsDetailScreen';
import GameDayEatsPOSScreen from '../screens/GameDayEatsPOSScreen';
import FanZoneMenuScreen from '../screens/FanZoneMenuScreen';
import WithSlider from '../components/WithSlider';
import VerticalTabBar from '../components/VerticalTabBar';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// What's Next stack: main screen + It's Showtime (showtimes)
function WhatNextStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.navy,
          height: 60,
          borderBottomWidth: 2,
          borderBottomColor: Colors.teal,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: Typography.fontWeight.heavy,
          fontSize: Typography.fontSize.h4,
          letterSpacing: Typography.letterSpacing.wide,
          textTransform: 'uppercase',
        },
      }}
    >
      <Stack.Screen name="WhatNextHome" component={WhatNextScreen} options={{ headerTitle: "WHAT'S NEXT" }} />
      <Stack.Screen name="Showtimes" component={ShowtimesScreen} options={{ headerTitle: "IT'S SHOWTIME" }} />
    </Stack.Navigator>
  );
}

// Wrap any screen with full-width slider below tab bar
function withSlider(Component) {
  return function Wrapped(props) {
    return (
      <WithSlider>
        <Component {...props} />
      </WithSlider>
    );
  };
}

// Rideshare stack (used by Rideshare tab)
function ConciergeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.navy,
          height: 60,
          borderBottomWidth: 2,
          borderBottomColor: Colors.teal,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: Typography.fontWeight.heavy,
          fontSize: Typography.fontSize.h4,
          letterSpacing: Typography.letterSpacing.wide,
          textTransform: 'uppercase',
        },
      }}
    >
      <Stack.Screen
        name="ConciergeHome"
        component={ConciergeScreen}
        options={{ headerTitle: "CARRABBA'S CORNER" }}
      />
      <Stack.Screen
        name="RideShareSelection"
        component={RideShareSelectionScreen}
        options={{ headerTitle: 'RIDE SHARES' }}
      />
      <Stack.Screen
        name="RideBooking"
        component={RideBookingScreen}
        options={{ headerTitle: 'REQUEST A RIDE' }}
      />
      <Stack.Screen
        name="RideTracking"
        component={RideTrackingScreen}
        options={{ headerTitle: 'TRACK RIDE' }}
      />
      <Stack.Screen
        name="GameDayEatsList"
        component={GameDayEatsListScreen}
        options={{ headerTitle: 'AROUND THE PORT' }}
      />
      <Stack.Screen
        name="GameDayEatsDetail"
        component={GameDayEatsDetailScreen}
        options={{ headerTitle: 'RESTAURANT DETAILS' }}
      />
      <Stack.Screen
        name="GameDayEatsPOS"
        component={GameDayEatsPOSScreen}
        options={{ headerTitle: 'ORDER NOW' }}
      />
      <Stack.Screen
        name="FanZoneMenu"
        component={FanZoneMenuScreen}
        options={{ headerTitle: 'FAN ZONE' }}
      />
    </Stack.Navigator>
  );
}

// Logo Header Component
const LogoHeader = ({ navigation }) => (
  <TouchableOpacity 
    onPress={() => navigation.navigate('Menu')}
    activeOpacity={0.7}
    style={{ paddingLeft: 16 }}
  >
    <Image 
      source={{ uri: '/logo-carrabbas-colors.svg' }}
      style={{ width: 120, height: 40 }}
      resizeMode="contain"
    />
  </TouchableOpacity>
);

// Carrabba's tab bar: same colors/spec, used by VerticalTabBar
const tabBarOptions = {
  tabBarActiveTintColor: Colors.tabActiveText,
  tabBarInactiveTintColor: Colors.navCharcoal,
  tabBarActiveBackgroundColor: Colors.tabActiveBg,
  tabBarLabelStyle: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <VerticalTabBar {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: Colors.navy,
          height: 60,
          borderBottomWidth: 2,
          borderBottomColor: Colors.teal,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: Typography.fontWeight.heavy,
          fontSize: Typography.fontSize.h4,
          letterSpacing: Typography.letterSpacing.wide,
          textTransform: 'uppercase',
        },
        headerLeft: () => <LogoHeader navigation={navigation} />,
        ...tabBarOptions,
      })}
    >
      <Tab.Screen
        name="Menu"
        component={withSlider(MenuScreen)}
        options={{
          tabBarLabel: 'Menu',
          headerTitle: 'MENU',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Order"
        component={withSlider(PlaceholderTabScreen)}
        initialParams={{ title: 'Order' }}
        options={{
          tabBarLabel: 'Order',
          headerTitle: 'ORDER',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Catering"
        component={withSlider(PlaceholderTabScreen)}
        initialParams={{ title: 'Catering' }}
        options={{
          tabBarLabel: 'Catering',
          headerTitle: 'CATERING',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Gift Cards"
        component={withSlider(PlaceholderTabScreen)}
        initialParams={{ title: 'Gift Cards' }}
        options={{
          tabBarLabel: 'Gift Cards',
          headerTitle: 'GIFT CARDS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Offers"
        component={withSlider(PlaceholderTabScreen)}
        initialParams={{ title: 'Offers' }}
        options={{
          tabBarLabel: 'Offers',
          headerTitle: 'OFFERS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Specials"
        component={withSlider(PlaceholderTabScreen)}
        initialParams={{ title: 'Specials' }}
        options={{
          tabBarLabel: 'Specials',
          headerTitle: 'SPECIALS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={withSlider(PlaceholderTabScreen)}
        initialParams={{ title: 'Events' }}
        options={{
          tabBarLabel: 'Events',
          headerTitle: 'EVENTS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="What's Next"
        component={withSlider(WhatNextStack)}
        options={{
          tabBarLabel: "What's Next",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Rideshare"
        component={withSlider(ConciergeStack)}
        options={{
          tabBarLabel: 'Rideshare',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size || 22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}


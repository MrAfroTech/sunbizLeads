import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import TicketsScreen from '../screens/TicketsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MenuScreen from '../screens/MenuScreen';
import WalletScreen from '../screens/WalletScreen';
import LoadFundsScreen from '../screens/LoadFundsScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Wallet Stack Navigator (for nested screens)
function WalletStack() {
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
        name="WalletHome"
        component={WalletScreen}
        options={{ headerTitle: 'WALLET' }}
      />
      <Stack.Screen
        name="LoadFunds"
        component={LoadFundsScreen}
        options={{ headerTitle: 'LOAD FUNDS' }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{ headerTitle: 'TRANSACTION HISTORY' }}
      />
    </Stack.Navigator>
  );
}

// Logo Header Component
const LogoHeader = ({ navigation }) => (
  <TouchableOpacity 
    onPress={() => navigation.navigate('Home')}
    activeOpacity={0.7}
    style={{ paddingLeft: 16 }}
  >
    <Image 
      source={{ uri: '/orlandopirateslogo.svg' }}
      style={{ width: 120, height: 40 }}
      resizeMode="contain"
    />
  </TouchableOpacity>
);

export default function AppNavigator() {
  return (
    <Tab.Navigator
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
        tabBarStyle: {
          backgroundColor: Colors.navy,
          borderTopWidth: 2,
          borderTopColor: Colors.teal,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.teal,
        tabBarInactiveTintColor: Colors.white,
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.caption,
          fontWeight: Typography.fontWeight.bold,
          textTransform: 'uppercase',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size || 24} color={color} />
          ),
          headerTitle: '',
        }}
      />
      <Tab.Screen
        name="Tickets"
        component={TicketsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ticket" size={size || 24} color={color} />
          ),
          headerTitle: 'MY TICKETS',
          tabBarLabel: 'Tickets',
        }}
      />
      <Tab.Screen
        name="Food"
        component={MenuScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size || 24} color={color} />
          ),
          headerTitle: 'FOOD & BEVERAGES',
          tabBarLabel: 'F&B',
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size || 24} color={color} />
          ),
          headerShown: false, // Stack handles its own header
          tabBarLabel: 'Wallet',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size || 24} color={color} />
          ),
          headerTitle: 'PROFILE',
        }}
      />
    </Tab.Navigator>
  );
}


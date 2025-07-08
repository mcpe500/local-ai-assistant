// src/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainScreen from './screens/MainScreen';
import KnowledgeScreen from './screens/KnowledgeScreen';
import { Platform, UIManager } from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = '';

            if (route.name === 'Assistant') {
              iconName = focused ? 'robot-excited' : 'robot-outline';
            } else if (route.name === 'Knowledge') {
              iconName = focused ? 'book-open-page-variant' : 'book-outline';
            }

            // You can return any component that you like here!
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerShown: false, // Hiding default header, screens can have their own titles
          tabBarStyle: {
            backgroundColor: '#FFFFFF', // Optional: Style your tab bar
            // borderTopWidth: 0, // Optional: if you want to remove the top border
          }
        })}
      >
        <Tab.Screen
          name="Assistant"
          component={MainScreen}
          options={{ title: 'AI Assistant' }}
        />
        <Tab.Screen
          name="Knowledge"
          component={KnowledgeScreen}
          options={{ title: 'Knowledge Base' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;

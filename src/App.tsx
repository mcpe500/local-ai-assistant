// src/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Platform, UIManager } from 'react-native';

import MainScreen from './screens/MainScreen';
import KnowledgeScreen from './screens/KnowledgeScreen';
import SettingsScreen from './screens/SettingsScreen'; // Import SettingsScreen
import { VectorStoreProvider } from './contexts/VectorStoreContext';
import { OllamaLLM, OllamaEmbeddings } from './hooks/OllamaProvider';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const Tab = createBottomTabNavigator();

// Initialize LLM and Embeddings once
const ollamaLLM = new OllamaLLM('qwen2'); // Or your chosen model from OllamaProvider
const ollamaEmbeddings = new OllamaEmbeddings('nomic-embed-text'); // Or your chosen model

const App: React.FC = () => {
  return (
    <VectorStoreProvider llm={ollamaLLM} embeddings={ollamaEmbeddings}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName = 'information'; // Default icon

              if (route.name === 'Assistant') {
                iconName = focused ? 'robot-excited' : 'robot-outline';
              } else if (route.name === 'AddKnowledge') { // Updated name for clarity
                iconName = focused ? 'book-plus' : 'book-plus-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'cog' : 'cog-outline';
              }
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
            },
          })}
        >
          <Tab.Screen
            name="Assistant"
            component={MainScreen}
            options={{ title: 'AI Assistant' }}
          />
          <Tab.Screen
            name="AddKnowledge" // Changed from "Knowledge" to be more specific
            component={KnowledgeScreen}
            options={{ title: 'Add to KB' }} // Updated title
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </VectorStoreProvider>
  );
};

export default App;

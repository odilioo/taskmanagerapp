import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';

import TaskListScreen from './components/TaskListScreen';
import TaskFormScreen from './components/TaskFormScreen';
import TaskDetailModal from './components/TaskDetailModal';

const Stack = createNativeStackNavigator();

export default function App() {
  const colorScheme = useColorScheme();

  const theme = {
    dark: colorScheme === 'dark',
    colors: {
      background: colorScheme === 'dark' ? '#121212' : '#ffffff',
      text: colorScheme === 'dark' ? '#ffffff' : '#000000',
    },
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="TaskList">
          {props => <TaskListScreen {...props} theme={theme} />}
        </Stack.Screen>
        <Stack.Screen name="TaskForm">
          {props => <TaskFormScreen {...props} theme={theme} />}
        </Stack.Screen>
        <Stack.Screen name="TaskDetail">
          {props => <TaskDetailModal {...props} theme={theme} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

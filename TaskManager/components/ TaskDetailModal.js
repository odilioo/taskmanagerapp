import { loadTasks, saveTasks } from '../utils/Storage';

import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const TaskDetailModal = ({ theme }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const task = route.params?.task;

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentTasks = await loadTasks();
              const updatedTasks = currentTasks.filter(t => t.id !== task.id);
              await saveTasks(updatedTasks);
              navigation.goBack();
            } catch (e) {
              console.error('Failed to delete task:', e);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.label, { color: theme.colors.text }]}>Title:</Text>
      <Text style={[styles.text, { color: theme.colors.text }]}>{task.title}</Text>
      <View style={{ height: 1, backgroundColor: '#ccc', opacity: 0.2, marginVertical: 8 }} />

      <Text style={[styles.label, { color: theme.colors.text }]}>Description:</Text>
      <Text style={[styles.text, { color: theme.colors.text }]}>{task.description || 'No description'}</Text>
      <View style={{ height: 1, backgroundColor: '#ccc', opacity: 0.2, marginVertical: 8 }} />

      <Text style={[styles.label, { color: theme.colors.text }]}>Status:</Text>
      <Text style={[styles.text, { color: theme.colors.text }]}>{task.status}</Text>
      <View style={{ height: 1, backgroundColor: '#ccc', opacity: 0.2, marginVertical: 8 }} />

      <View style={styles.buttons}>
        <Button title="Edit" onPress={() => navigation.navigate('TaskForm', { task })} />
        <Button title="Delete" onPress={handleDelete} color="red" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 10,
  },
});

export default TaskDetailModal;
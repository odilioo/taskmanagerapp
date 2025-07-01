import React, { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
const scheduleNotification = async (taskTitle, date) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Reminder',
      body: `Don't forget: ${taskTitle}`,
    },
    trigger: {
      date,
    },
  });
};
import { loadTasks, saveTasks } from '../utils/Storage';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const TaskFormScreen = ({ theme }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const editingTask = route.params?.task;

  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [status, setStatus] = useState(editingTask?.status || 'pending');
  const [dueDate, setDueDate] = useState(editingTask?.dueDate ? new Date(editingTask.dueDate) : new Date());
  const [priority, setPriority] = useState(editingTask?.priority || 'medium');

  const handleSave = async () => {
    const newTask = {
      id: editingTask?.id || Date.now().toString(),
      title,
      description,
      status,
      dueDate: dueDate.toISOString(),
      priority,
    };

    try {
      const currentTasks = await loadTasks();
      const updatedTasks = editingTask
        ? currentTasks.map((task) => (task.id === newTask.id ? newTask : task))
        : [...currentTasks, newTask];

      await saveTasks(updatedTasks);
      await scheduleNotification(title, dueDate);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  useEffect(() => {
    Permissions.getAsync(Permissions.NOTIFICATIONS).then(statusObj => {
      if (statusObj.status !== 'granted') {
        return Permissions.askAsync(Permissions.NOTIFICATIONS);
      }
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.label, { color: theme.colors.text }]}>Title</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.dark ? '#1e1e1e' : '#f9f9f9', color: theme.colors.text }]}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter task title"
      />

      <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: theme.dark ? '#1e1e1e' : '#f9f9f9', color: theme.colors.text }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter task description"
        multiline
      />

      <Text style={[styles.label, { color: theme.colors.text }]}>Due Date</Text>
      <View style={{ marginTop: 8, marginBottom: 12 }}>
        <DateTimePicker
          value={dueDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (selectedDate) setDueDate(selectedDate);
          }}
        />
      </View>

      <Text style={[styles.label, { color: theme.colors.text }]}>Priority</Text>
      <Picker
        selectedValue={priority}
        onValueChange={(itemValue) => setPriority(itemValue)}
        style={[styles.input, { backgroundColor: theme.dark ? '#1e1e1e' : '#f9f9f9', color: theme.colors.text }]}
      >
        <Picker.Item label="Low" value="low" />
        <Picker.Item label="Medium" value="medium" />
        <Picker.Item label="High" value="high" />
      </Picker>

      <View style={{ marginTop: 20 }}>
        <Button title="Save Task" onPress={handleSave} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  textArea: {
    height: 100,
  },
});

export default TaskFormScreen;
import React, { useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { loadTasks } from '../utils/Storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const TaskListScreen = ({ theme }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [tasks, setTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOption, setSortOption] = useState('none');

  useEffect(() => {
    const fetchTasks = async () => {
      let storedTasks = await loadTasks();

      if (filterStatus !== 'all') {
        storedTasks = storedTasks.filter(task => task.status === filterStatus);
      }

      if (sortOption === 'title') {
        storedTasks.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortOption === 'dueDate') {
        storedTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      } else if (sortOption === 'priority') {
        const priorityMap = { low: 1, medium: 2, high: 3 };
        storedTasks.sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority]);
      }

      setTasks(storedTasks);
    };
    if (isFocused) {
      fetchTasks();
    }
  }, [isFocused, filterStatus, sortOption]);

  const handleExportTasks = async () => {
    try {
      const json = JSON.stringify(tasks, null, 2);
      const fileUri = FileSystem.documentDirectory + 'tasks.json';
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.taskItem,
        {
          borderLeftColor: item.status === 'completed' ? 'green' : 'orange',
          backgroundColor: theme.dark ? '#1e1e1e' : '#fff',
        }
      ]}
      onPress={() => navigation.navigate('TaskDetail', { task: item })}
    >
      <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{item.title}</Text>
      <Text style={[styles.taskStatus, { color: item.status === 'completed' ? 'green' : 'orange' }]}>
        {item.status.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.label, { color: theme.colors.text }]}>Filter by Status:</Text>
      <Picker
        selectedValue={filterStatus}
        onValueChange={setFilterStatus}
        style={[styles.picker, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
      >
        <Picker.Item label="All" value="all" />
        <Picker.Item label="Pending" value="pending" />
        <Picker.Item label="Completed" value="completed" />
      </Picker>

      <Text style={[styles.label, { color: theme.colors.text }]}>Sort by:</Text>
      <Picker
        selectedValue={sortOption}
        onValueChange={setSortOption}
        style={[styles.picker, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
      >
        <Picker.Item label="None" value="none" />
        <Picker.Item label="Title" value="title" />
        <Picker.Item label="Due Date" value="dueDate" />
        <Picker.Item label="Priority" value="priority" />
      </Picker>

      <TouchableOpacity onPress={handleExportTasks} style={styles.exportButton}>
        <Text style={styles.exportText}>Export Tasks</Text>
      </TouchableOpacity>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.colors.text }]}>No tasks available</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.dark ? '#03DAC6' : '#2196F3' }]}
        onPress={() => navigation.navigate('TaskForm')}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  picker: {
    marginVertical: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    color: '#888',
  },
  taskItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    backgroundColor: '#fff',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  exportButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    marginVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  exportText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TaskListScreen;
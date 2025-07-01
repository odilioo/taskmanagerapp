import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { saveTasks, loadTasks } from '../../utils/Storage'; // adjust import path as needed
import { format } from 'date-fns';

export default function AddScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Validation', 'Task title is required.');
      return;
    }
    setSaving(true);
    const tasks = await loadTasks();
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      dueDate: date,
      status: 'pending',
      priority,
    };
    const updatedTasks = [...tasks, newTask];
    await saveTasks(updatedTasks);
    setSaving(false);
    router.replace('/timeline'); // Go back to tasks tab
  }

  function handleCancel() {
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#222', padding: 28, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 18 }}>Add Task</Text>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor="#aaa"
        style={{
          borderBottomWidth: 1, borderBottomColor: '#555', fontSize: 18, color: '#fff', marginBottom: 18, paddingVertical: 8,
        }}
      />
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        placeholderTextColor="#888"
        style={{
          borderBottomWidth: 1, borderBottomColor: '#555', fontSize: 16, color: '#fff', marginBottom: 18, paddingVertical: 6,
        }}
      />
      <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 6 }}>Due Date:</Text>
      <TextInput
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
        placeholderTextColor="#888"
        style={{
          borderBottomWidth: 1, borderBottomColor: '#555', fontSize: 16, color: '#fff', marginBottom: 18, paddingVertical: 6,
        }}
      />
      <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 6 }}>Priority:</Text>
      <View style={{ borderWidth: 1, borderColor: '#444', borderRadius: 8, marginBottom: 18 }}>
        <Picker
          selectedValue={priority}
          onValueChange={setPriority}
          style={{ color: '#fff', width: '100%' }}
          dropdownIconColor="#fff"
        >
          <Picker.Item label="Low" value="low" />
          <Picker.Item label="Medium" value="medium" />
          <Picker.Item label="High" value="high" />
        </Picker>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 16 }}>
        <TouchableOpacity
          onPress={handleCancel}
          disabled={saving}
          style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 }}
        >
          <Text style={{ color: '#aaa', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: '#ff9696',
            paddingVertical: 10,
            paddingHorizontal: 22,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
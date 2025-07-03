import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
// Helper function to format date input as DD-MM-YYYY
function formatDateInput(text: string) {
  const numbers = text.replace(/\D/g, '');
  let day = numbers.slice(0, 2);
  let month = numbers.slice(2, 4);
  let year = numbers.slice(4, 8);

  let formatted = day;
  if (month) formatted += '-' + month;
  if (year) formatted += '-' + year;
  return formatted;
}
import { View, Text, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { saveTasks, loadTasks } from '../../utils/Storage'; // adjust import path as needed
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

export default function AddScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Changed date format to 'dd-MM-yyyy'
  const [date, setDate] = useState(format(new Date(), 'dd-MM-yyyy'));
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [saving, setSaving] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickedDate, setPickedDate] = useState(new Date());

  const [isDarkMode, setIsDarkMode] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    AsyncStorage.getItem('user_theme').then(val => {
      setIsDarkMode(val === 'dark');
    });
  }, [isFocused]);

  const containerBg = isDarkMode ? '#222' : '#fff';
  const cardBg = isDarkMode ? '#222' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#000';
  const borderColor = isDarkMode ? '#555' : '#ccc';
  const placeholderColor = isDarkMode ? '#aaa' : '#888';

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
      // Save dueDate in 'dd-MM-yyyy HH:mm' format
      dueDate: format(pickedDate, 'dd-MM-yyyy HH:mm'),
      status: 'pending',
      priority,
    };
    const updatedTasks = [...tasks, newTask];
    await saveTasks(updatedTasks);
    // If high priority and notifications enabled, schedule a reminder
    const notifPref = await AsyncStorage.getItem('notifications_enabled');
    if (priority === 'high' && notifPref === 'true') {
      const dt = pickedDate;
      const interval = Math.max(1, Math.floor((dt.getTime() - Date.now()) / 1000));
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Reminder',
          body: newTask.title,
          data: { taskId: newTask.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: interval,
          repeats: false,
        },
      });
    }
    setSaving(false);
    router.replace('/timeline'); // Go back to tasks tab
  }

  function handleCancel() {
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: containerBg, justifyContent: 'center' }}>
      <View style={{
        backgroundColor: cardBg,
        borderRadius: 18,
        margin: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
      }}>
        <Text style={{ fontSize: 32, fontWeight: '900', marginBottom: 24 }}>
          <Text style={{ color: textColor }}>New </Text>
          <Text style={{ color: '#ff9696' }}>Task</Text>
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: borderColor, marginBottom: 18 }}>
          <MaterialIcons name="alternate-email" size={24} color="#ff9696" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={placeholderColor}
            style={{
              flex: 1,
              fontSize: 18,
              color: textColor,
              paddingVertical: 8,
            }}
          />
        </View>
        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor={placeholderColor}
          style={{
            borderBottomWidth: 1, borderBottomColor: borderColor, fontSize: 16, color: textColor, marginBottom: 18, paddingVertical: 6,
          }}
        />
        {/* Due Date Row */}
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <MaterialIcons name="event" size={22} color="#ff9696" style={{ marginRight: 8 }} />
          <Text style={{ color: textColor, fontWeight: '600', fontSize: 16 }}>Due: {format(pickedDate, 'dd-MM-yyyy')}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={pickedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setPickedDate(date);
            }}
          />
        )}

        {/* Time Picker Row */}
        <TouchableOpacity onPress={() => setShowTimePicker(true)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <MaterialIcons name="access-time" size={22} color="#ff9696" style={{ marginRight: 8 }} />
          <Text style={{ color: textColor, fontWeight: '600', fontSize: 16 }}>Time: {format(pickedDate, 'HH:mm')}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={pickedDate}
            mode="time"
            display="default"
            onChange={(event, date) => {
              setShowTimePicker(false);
              if (date) setPickedDate(date);
            }}
          />
        )}
        <Text style={{ color: textColor, fontWeight: '600', marginBottom: 6 }}>Priority:</Text>
        <View style={{ borderWidth: 1, borderColor: borderColor, borderRadius: 8, marginBottom: 24, backgroundColor: cardBg }}>
          <Picker
            selectedValue={priority}
            onValueChange={setPriority}
            style={{ color: isDarkMode ? '#fff' : '#000', width: '100%' }}
            itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
            dropdownIconColor={isDarkMode ? '#fff' : '#000'}
          >
            <Picker.Item label="Low" value="low" color={isDarkMode ? '#fff' : '#000'} />
            <Picker.Item label="Medium" value="medium" color={isDarkMode ? '#fff' : '#000'} />
            <Picker.Item label="High" value="high" color={isDarkMode ? '#fff' : '#000'} />
          </Picker>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: '#ff9696',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 20 }}>{saving ? 'Saving...' : 'Continue'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCancel}
          disabled={saving}
          style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, marginTop: 12, alignItems: 'center' }}
        >
          <Text style={{ color: placeholderColor, fontWeight: '600', fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
// Note: Other screens should use 'dd-MM-yyyy' format for filtering/comparison of dates.
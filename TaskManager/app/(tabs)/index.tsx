import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView, Image, TextInput, Modal, Platform, Button, SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { loadTasks, saveTasks } from '../../utils/Storage';
import { format, parseISO } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;      // in 'dd-MM-yyyy' or 'dd-MM-yyyy HH:mm'
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export default function HomeScreen() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [highPriorityTasks, setHighPriorityTasks] = useState<Task[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const isFocused = useIsFocused();
  const [accentColor, setAccentColor] = useState('#ff9696');

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());
  const [pickMode, setPickMode] = useState<'date' | 'time'>('date');
  const [dueNotification, setDueNotification] = useState<Notifications.Notification | null>(null);

  useEffect(() => {
    if (!isFocused) return;
    async function fetch() {
      const tasksRaw = await loadTasks();
      const tasks: Task[] = tasksRaw as Task[];
      setAllTasks(tasks);

      const today = format(new Date(), 'dd-MM-yyyy');
      // tasks due today and pending
      const todayList = tasks.filter((t: Task) =>
        t.dueDate.slice(0, 10) === today && t.status === 'pending'
      );
      setTodayTasks(todayList);

      // high priority pending tasks
      const highList = tasks.filter((t: Task) => t.priority === 'high' && t.status === 'pending');
      setHighPriorityTasks(highList);

      const [savedAvatar, savedName, savedTheme] = await Promise.all([
        AsyncStorage.getItem('user_avatar'),
        AsyncStorage.getItem('user_name'),
        AsyncStorage.getItem('user_theme'),
      ]);
      if (savedAvatar) setAvatarUri(savedAvatar);
      if (savedName) setUsername(savedName);
      setIsDarkMode(savedTheme === 'dark');
    }
    fetch();
  }, [isFocused]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      setDueNotification(notification);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    AsyncStorage.getItem('user_accent').then(val => {
      if (val) setAccentColor(val);
    });
  }, [isFocused]);

  const openDetail = (task: Task) => {
    setSelectedTask(task);
    setPickerDate(parseISO(task.dueDate));
    setPickMode('date');
    setDetailVisible(true);
  };

  const saveDetail = async () => {
    if (!selectedTask) return;
    const updated = allTasks.map(t =>
      t.id === selectedTask.id
        ? { ...t, dueDate: format(pickerDate, 'dd-MM-yyyy HH:mm') }
        : t
    );
    await saveTasks(updated);
    setDetailVisible(false);
    // refresh lists
    setAllTasks(updated);
    // reapply filters
    const today = format(new Date(), 'dd-MM-yyyy');
    setTodayTasks(updated.filter(t => t.dueDate.slice(0,10) === today && t.status==='pending'));
    setHighPriorityTasks(updated.filter(t=>t.priority==='high'&&t.status==='pending'));
  };

  const textColor = isDarkMode ? '#fff' : '#000';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#232329' : '#fff3f3' }]}>
      {dueNotification && (
        <View style={[styles.alertBanner, isDarkMode ? styles.alertBannerDark : styles.alertBannerLight]}>
          <Text style={[styles.alertText, { color: isDarkMode ? '#fff' : '#000' }]}>
            🔔 {dueNotification.request.content.title}: {dueNotification.request.content.body}
          </Text>
          <TouchableOpacity onPress={() => setDueNotification(null)}>
            <Text style={[styles.dismissText, { color: isDarkMode ? '#aaa' : '#555' }]}>
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <LinearGradient
        colors={[accentColor, '#ffb7b7']}
        style={styles.topCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.hello, { color: isDarkMode ? '#fff' : '#fff' }]}>
              Hi, <Text style={[styles.helloBold, { color: isDarkMode ? '#fff' : '#fff' }]}>{username || 'User'}</Text>
            </Text>
            <Text style={[styles.targetCount, { color: isDarkMode ? '#ffecf3' : '#ffecf3' }]}>
              You have <Text style={{ fontWeight: 'bold' }}>{allTasks.length}</Text> targets
            </Text>
          </View>
          <View style={styles.avatarRow}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialIcons name="person" size={24} color={isDarkMode ? '#ccc' : '#888'} />
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Today's Tasks
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {todayTasks.map(task => (
            <TouchableOpacity
              key={task.id}
              onPress={() => openDetail(task)}
              style={[
                styles.targetCard,
                {
                  backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
                  borderColor: '#40DA5A',
                  shadowColor: accentColor,
                },
              ]}
            >
              <View style={styles.cardRow}>
                <View style={[styles.circle, { backgroundColor: '#40DA5A' }]}>
                  <Text style={styles.circleText}>{task.title.slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={[styles.targetTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {task.title}
                </Text>
              </View>
              <View style={styles.cardRow}>
                <MaterialIcons name="event" size={16} color="#888" />
                <Text style={[styles.targetDate, { color: isDarkMode ? '#ccc' : '#000' }]}>
                  {task.dueDate}
                </Text>
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor: isDarkMode ? '#3A3A3A' : '#ffebf0',
                    },
                  ]}
                >
                  <Text style={[styles.priorityText, { color: accentColor }]}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
        <Text style={[styles.sectionTitleDark, { color: isDarkMode ? '#fff' : '#232329' }]}>
          High Priority Tasks
        </Text>
        {highPriorityTasks.map(task => (
          <View
            key={task.id}
            style={[
              styles.taskCard,
              {
                backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
                shadowColor: accentColor,
              },
            ]}
          >
            <Text style={[styles.taskTitle, { color: isDarkMode ? '#fff' : '#000' }]}>{task.title}</Text>
            <Text style={[styles.taskTime, { color: isDarkMode ? '#ccc' : '#000' }]}>
              {task.dueDate.length > 10 ? task.dueDate.slice(11) : ''}
            </Text>
          </View>
        ))}
      </ScrollView>

      <Modal visible={detailVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#333' : '#fff' }]}>
            <Text style={{ color: textColor, fontSize: 18, marginBottom: 12 }}>
              Edit Due for {selectedTask?.title}
            </Text>
            <DateTimePicker
              value={pickerDate}
              mode={pickMode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                if (date) setPickerDate(date);
                if (Platform.OS !== 'ios') {
                  if (pickMode === 'date') setPickMode('time');
                  else saveDetail();
                }
              }}
            />
            {Platform.OS === 'ios' && (
              <Button title="Next" onPress={() => {
                if (pickMode === 'date') setPickMode('time');
                else saveDetail();
              }} />
            )}
            <Button title="Cancel" onPress={() => setDetailVisible(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topCard: {
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    paddingHorizontal: 22,
    paddingTop: 50,
    paddingBottom: 34,
    shadowColor: '#ffb7b7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 12,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  hello: {
    fontSize: 22,
    marginBottom: 2,
  },
  helloBold: {
    fontWeight: 'bold',
  },
  targetCount: {
    fontSize: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 40,
  },
  sectionTitleDark: {
    color: '#232329',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 20,
    marginBottom: 10,
  },
  targetCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginRight: 16,
    width: 210,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    borderWidth: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  circleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  targetTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#444',
  },
  targetDate: {
    fontSize: 13,
    color: '#888',
    marginLeft: 6,
    marginRight: 8,
  },
  priorityBadge: {
    backgroundColor: '#ffebf0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginLeft: 4,
  },
  priorityText: {
    color: '#ff9696',
    fontWeight: 'bold',
    fontSize: 12,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 22,
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  taskTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#444',
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 13,
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
    borderRadius: 8,
    elevation: 4,           // Android shadow
    shadowColor: '#000',    // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  alertBannerLight: {
    backgroundColor: '#FFF9C4',
  },
  alertBannerDark: {
    backgroundColor: '#4E342E',
  },
  alertText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  dismissText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});
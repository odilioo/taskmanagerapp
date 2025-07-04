import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ListRenderItemInfo,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { loadTasks, saveTasks } from '../../utils/Storage';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addDays, parse, parseISO } from 'date-fns';
import { startOfWeek, isSameDay } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface MarkedDates {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    marked?: boolean;
    dots?: { key: string; color: string }[];
  };
}

const priorityColors: Record<string, string> = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#F44336',
};

export default function TimelineTaskScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [tasksForDate, setTasksForDate] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [fadeAnim] = useState(new Animated.Value(1));

  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState(selectedDate || getTodayDate());
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    async function fetchTasks() {
      const loadedTasksRaw = await loadTasks();
      const loadedTasks: Task[] = loadedTasksRaw.map((task: any) => ({
        ...task,
        status: task.status === 'completed' ? 'completed' : 'pending',
      }));
      setTasks(loadedTasks);

      const marks: MarkedDates = {};
      loadedTasks.forEach((task: Task) => {
        // Expecting all dueDate to be in 'dd-MM-yyyy'
        const date = task.dueDate ?? null;
        if (date) {
          if (!marks[date]) {
            marks[date] = { marked: true, dots: [{ key: `task-${task.id}`, color: 'blue' }] };
          } else {
            marks[date].dots!.push({ key: `task-${task.id}`, color: 'blue' });
          }
        }
      });
      setMarkedDates(marks);
    }
    if (isFocused) {
      fetchTasks();
    }
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    AsyncStorage.getItem('user_theme').then(value => {
      setIsDarkMode(value === 'dark');
    });
  }, [isFocused]);

  useEffect(() => {
    animateListChange();
    const filtered = tasks.filter(task => {
      // Match if the date part (first 10 chars) of dueDate matches selectedDate
      const matchesDate =
        (typeof task.dueDate === 'string' && task.dueDate.slice(0, 10) === selectedDate);
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesDate && matchesStatus;
    });
    setTasksForDate(filtered);
  }, [selectedDate, statusFilter, tasks]);

  function animateListChange() {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  function getTodayDate() {
    return format(new Date(), 'dd-MM-yyyy');
  }

  function formatHeaderDate(dateStr: string) {
    // parse from 'dd-MM-yyyy'
    const d = parse(dateStr, 'dd-MM-yyyy', new Date());
    return format(d, 'EEEE, MMMM d');
  }

  function getWeekDates(current: string) {
    // current is 'dd-MM-yyyy'
    const currDate = parse(current, 'dd-MM-yyyy', new Date());
    const start = startOfWeek(currDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }

  const handlePrevDay = () => {
    const prev = addDays(parse(selectedDate, 'dd-MM-yyyy', new Date()), -1);
    setSelectedDate(format(prev, 'dd-MM-yyyy'));
  };

  const handleNextDay = () => {
    const next = addDays(parse(selectedDate, 'dd-MM-yyyy', new Date()), 1);
    setSelectedDate(format(next, 'dd-MM-yyyy'));
  };

  const handleDeleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    await saveTasks(updatedTasks);
    const sanitizedTasks: Task[] = updatedTasks.map((task: any) => ({
      ...task,
      status: task.status === 'completed' ? 'completed' : 'pending',
    }));
    setTasks(sanitizedTasks);

    const marks: MarkedDates = {};
    sanitizedTasks.forEach((task: Task) => {
      const date = task.dueDate ?? null;
      if (date) {
        if (!marks[date]) {
          marks[date] = { marked: true, dots: [{ key: `task-${task.id}`, color: 'blue' }] };
        } else {
          marks[date].dots!.push({ key: `task-${task.id}`, color: 'blue' });
        }
      }
    });
    setMarkedDates(marks);
  };

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    // Force newDate to be in 'dd-MM-yyyy'
    let formattedDate = newDate;
    // If input is not in dd-MM-yyyy, try to parse as ISO or yyyy-MM-dd and convert
    if (!/^\d{2}-\d{2}-\d{4}$/.test(newDate)) {
      let parsed;
      try {
        if (/^\d{4}-\d{2}-\d{2}/.test(newDate)) {
          parsed = parse(newDate, 'yyyy-MM-dd', new Date());
        } else {
          parsed = new Date(newDate);
        }
        formattedDate = format(parsed, 'dd-MM-yyyy');
      } catch {
        formattedDate = getTodayDate();
      }
    }
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc,
      dueDate: formattedDate,
      status: 'pending',
      priority: newPriority,
    };
    const updatedTasks = [...tasks, newTask];
    await saveTasks(updatedTasks);
    const sanitizedTasks: Task[] = updatedTasks.map((task: any) => ({
      ...task,
      status: task.status === 'completed' ? 'completed' : 'pending',
    }));
    setTasks(sanitizedTasks);
    setModalVisible(false);
    setNewTitle('');
    setNewDesc('');
    setNewDate(selectedDate || getTodayDate());
    setNewPriority('medium');
  };

  const handleToggleDone = async (taskId: string) => {
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
    );
    await saveTasks(updatedTasks);
    const sanitizedTasks: Task[] = updatedTasks.map((task: any) => ({
      ...task,
      status: task.status === 'completed' ? 'completed' : 'pending',
    }));
    setTasks(sanitizedTasks);
  };

  const renderTask = ({ item }: ListRenderItemInfo<Task>) => {
    // Try to get time from dueDate if present (assume 'dd-MM-yyyy' or 'dd-MM-yyyy HH:mm')
    let dueTime = '';
    if (item.dueDate) {
      // If dueDate has time, try to parse; else, blank
      try {
        // Try with time
        let d;
        if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/.test(item.dueDate)) {
          d = parse(item.dueDate, 'dd-MM-yyyy HH:mm', new Date());
        } else {
          d = parse(item.dueDate, 'dd-MM-yyyy', new Date());
        }
        dueTime = format(d, 'HH:mm');
      } catch {
        dueTime = '';
      }
    }
    const priorityColor = priorityColors[item.priority ?? ''] || '#888';
    return (
      <View style={styles.timelineRow}>
        {/* Timeline dot and vertical line */}
        <View style={{ width: 60, alignItems: 'center', position: 'relative' }}>
          <View
            style={[
              styles.timelineDot,
              {
                backgroundColor: item.status === 'completed' ? 'limegreen' : priorityColor,
                borderColor: isDarkMode ? '#222' : '#fff',
              },
            ]}
          />
        </View>
        {/* Time */}
        <Text style={styles.timelineTime}>
          {dueTime}
        </Text>
        {/* Task Card */}
        <LinearGradient
          colors={isDarkMode ? ['#2c3e50', '#4ca1af'] : ['#ffffff', '#f0f0f0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.taskItem, { borderLeftColor: priorityColor, flex: 1, marginBottom: 20 }]}
        >
          <View style={styles.taskHeader}>
            <Text style={[styles.taskTitle, { color: isDarkMode ? '#fff' : '#111', fontSize: 17 }]} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
            <TouchableOpacity onPress={() => handleDeleteTask(item.id)}>
              <MaterialIcons name="delete" size={22} color={isDarkMode ? '#ff6b6b' : 'red'} />
            </TouchableOpacity>
          </View>
          {item.description ? (
            <Text style={[styles.taskDescription, { color: isDarkMode ? '#ddd' : '#555', fontSize: 14 }]} numberOfLines={2} ellipsizeMode="tail">
              {item.description}
            </Text>
          ) : null}
          <View style={styles.taskMeta}>
            <TouchableOpacity onPress={() => handleToggleDone(item.id)} style={{ marginRight: 12 }}>
              <MaterialIcons
                name={item.status === 'completed' ? 'check-circle' : 'radio-button-unchecked'}
                size={22}
                color={item.status === 'completed' ? 'limegreen' : '#bbb'}
              />
            </TouchableOpacity>
            {item.status === 'completed' ? (
              <MaterialCommunityIcons name="check-circle" size={18} color="limegreen" />
            ) : (
              <MaterialCommunityIcons name="clock-outline" size={18} color="#FFA500" />
            )}
            <View style={[styles.priorityDot, { backgroundColor: priorityColor, marginLeft: 10 }]} />
          </View>
        </LinearGradient>
      </View>
    );
  };

  // Get the current month/year for header
  const monthYear = (() => {
    try {
      const d = parse(selectedDate, 'dd-MM-yyyy', new Date());
      const month = format(d, 'MMMM');
      const year = format(d, 'yyyy');
      return { month, year };
    } catch {
      return { month: '', year: '' };
    }
  })();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#121212' : '#fff' }
      ]}
    >
      {/* Header: Month/Year and week bar */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDarkMode ? '#121212' : '#fff'
          }
        ]}
      >
        <Text style={[styles.monthYearText, { color: isDarkMode ? '#fff' : '#000' }]}>
          <Text style={styles.monthAccent}>{monthYear.month}</Text> {monthYear.year}
        </Text>
        <View style={styles.weekBar}>
          <FlatList
            data={getWeekDates(selectedDate)}
            horizontal
            keyExtractor={item => item.toISOString()}
            renderItem={({ item }) => {
              // selectedDate is 'dd-MM-yyyy'
              const selected = isSameDay(item, parse(selectedDate, 'dd-MM-yyyy', new Date()));
              return (
                <TouchableOpacity
                  onPress={() => setSelectedDate(format(item, 'dd-MM-yyyy'))}
                  style={[
                    styles.dayItem,
                    selected && { backgroundColor: '#4577EA', borderRadius: 24 }
                  ]}
                >
                  <Text style={[
                    styles.dayName,
                    { color: selected ? '#fff' : '#888' }
                  ]}>
                    {format(item, 'EEE')}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    { color: selected ? '#fff' : '#222' }
                  ]}>
                    {format(item, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            }}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 18 }}
          />
        </View>
      </View>

      {/* Timeline Sheet */}
      <View
        style={[
          styles.timelineSheet,
          {
            backgroundColor: isDarkMode ? '#232329' : '#f8f8fa'
          }
        ]}
      >
        <View style={styles.timelineContainer}>
          <View style={styles.timelineLine} />
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            {tasksForDate.length > 0 ? (
              <FlatList
                data={tasksForDate}
                keyExtractor={item => item.id}
                renderItem={renderTask}
                contentContainerStyle={styles.timelineList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: isDarkMode ? '#888' : '#555' }]}>
                  No tasks for {selectedDate}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </View>

      {/* Modal stays outside for overlay */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#222' : '#fff' }]}>
            <Text style={styles.modalTitle}>Add Task</Text>
            <TextInput
              placeholder="Title"
              value={newTitle}
              onChangeText={setNewTitle}
              style={styles.input}
              placeholderTextColor="#aaa"
            />
            <TextInput
              placeholder="Description"
              value={newDesc}
              onChangeText={setNewDesc}
              style={styles.input}
              placeholderTextColor="#aaa"
            />
            <TextInput
              placeholder="DD-MM-YYYY"
              value={newDate}
              onChangeText={setNewDate}
              style={styles.input}
              placeholderTextColor="#aaa"
            />
            <View style={styles.priorityPickerRow}>
              <Text style={styles.filterLabel}>Priority:</Text>
              <Picker
                selectedValue={newPriority}
                onValueChange={setNewPriority}
                style={[styles.picker, { minWidth: 120 }]}
              >
                <Picker.Item label="Low" value="low" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="High" value="high" />
              </Picker>
            </View>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#007AFF', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={handleAddTask}>
                <Text style={{ color: '#007AFF', fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAB absolutely positioned */}
      {/*
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Removed justifyContent/alignItems for centering
  },
  header: {
    paddingTop: 72,
    paddingHorizontal: 20,
    backgroundColor: '#121212', // Will be overridden by inline style
    marginBottom: 18,
  },
  monthYearText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: -1,
  },
  monthAccent: {
    color: '#ff9696',
  },
  weekBar: {
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    width: 40,
    height: 48,
  },
  dayName: {
    fontSize: 14,
    marginBottom: 2,
    fontWeight: '600',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 10,
  },
  filterLabel: {
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  picker: {
    flex: 1,
    height: 44,
    maxWidth: 200,
  },
  taskListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  timelineSheet: {
    flex: 1,
    backgroundColor: '#232329',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -14,
    paddingTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  timelineContainer: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    paddingTop: 24,
  },
  timelineLine: {
    width: 2,
    backgroundColor: '#e0e4ed',
    position: 'absolute',
    top: 24,
    bottom: 0,
    left: 34,
    zIndex: 0,
    borderRadius: 1,
  },
  timelineList: {
    paddingLeft: 0,
    paddingRight: 20,
    paddingBottom: 120,
    width: '100%',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 64,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    position: 'absolute',
    left: 27,
    top: 14,
    zIndex: 2,
  },
  timelineTime: {
    width: 60,
    textAlign: 'right',
    fontSize: 13,
    color: '#789',
    marginRight: 18,
    marginTop: 8,
  },
  taskItem: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  taskDescription: {
    fontSize: 15,
    marginTop: 6,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },
  taskTime: {
    fontSize: 14,
    marginLeft: 12,
  },
  priorityDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginLeft: 72,
    marginTop: 48,
  },
  emptyText: {
    fontStyle: 'italic',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 28,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#bbb',
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 16,
    color: '#222',
  },
  priorityPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
});

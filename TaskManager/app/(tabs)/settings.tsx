import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SectionList,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  Button,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { loadTasks } from '../../utils/Storage';
import * as Notifications from 'expo-notifications';
import { parse } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldSetBadge: false,
  }),
});

const STORAGE_KEYS = {
  avatar: 'user_avatar',
  username: 'user_name',
  theme: 'user_theme',
  accent: 'user_accent',
};

interface SectionItem {
  key: string;
  icon: string;
  label: string;
  rightLabel?: string;
  badge?: boolean;
  action?: () => void;
}

const SECTIONS: { title: string; data: SectionItem[] }[] = [
  {
    title: 'GENERAL',
    data: [
      {
        key: 'Notifications',
        icon: 'notifications-outline',
        label: 'Notifications & Alerts',
        rightLabel: 'Set Up',
      },
      {
        key: 'Customization',
        icon: 'color-palette-outline',
        label: 'Customization',
        badge: true,
      },
    ],
  },
  {
    title: 'INTEGRATIONS',
    data: [
      {
        key: 'Calendars',
        icon: 'calendar-outline',
        label: 'Calendars',
      },
      {
        key: 'Reminders',
        icon: 'list-outline',
        label: 'Reminders',
      },
      {
        key: 'oneSec',
        icon: 'alarm-outline',
        label: 'one sec',
        rightLabel: 'Set Up',
      },
    ],
  },
  {
    title: 'SUPPORT',
    data: [
      {
        key: 'Help',
        icon: 'help-circle-outline',
        label: 'Help & Feedback',
      },
    ],
  },
];

export default function SettingsScreen() {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  // Handler for username input change and persistence
  const onUsernameChange = async (text: string) => {
    setUsername(text);
    await AsyncStorage.setItem(STORAGE_KEYS.username, text);
  };
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [accentColor, setAccentColor] = useState<string>('#ff9696');
  const [showCustomization, setShowCustomization] = useState(false);

  // Load saved preferences when screen appears
  useEffect(() => {
    AsyncStorage.getItem('notifications_enabled').then(val => {
      setNotificationsEnabled(val === 'true');
    });
  }, []);

  useEffect(() => {
    (async () => {
      const [savedAvatar, savedName, savedTheme] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.avatar),
        AsyncStorage.getItem(STORAGE_KEYS.username),
        AsyncStorage.getItem(STORAGE_KEYS.theme),
      ]);
      const savedAccent = await AsyncStorage.getItem(STORAGE_KEYS.accent);
      if (savedAvatar) setAvatarUri(savedAvatar);
      if (savedName) setUsername(savedName);
      if (savedTheme) setIsDarkMode(savedTheme === 'dark');
      if (savedAccent) setAccentColor(savedAccent);
    })();
  }, []);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access media library is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      await AsyncStorage.setItem(STORAGE_KEYS.avatar, uri);
    }
  };

  const toggleDarkMode = async (value: boolean) => {
    setIsDarkMode(value);
    await AsyncStorage.setItem(STORAGE_KEYS.theme, value ? 'dark' : 'light');
  };

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  priority: string;
}

const toggleNotificationsEnabled = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value ? 'true' : 'false');

    if (value) {
      // Request permission
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Enable notifications in Settings');
        return;
      }
      // Schedule existing pending tasks
      const tasks: Task[] = await loadTasks();
      tasks
        .filter((t: Task) => t.status === 'pending')
        .forEach(async (t: Task) => {
          const dt = parse(t.dueDate, 'dd-MM-yyyy HH:mm', new Date());
          const sec = Math.max(1, Math.floor((dt.getTime() - Date.now()) / 1000));
          await Notifications.scheduleNotificationAsync({
            content: { title: 'Task Due', body: t.title, data: { taskId: t.id } },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: sec, repeats: false },
          });
        });
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const colorOptions = ['#ff9696', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0'];
  const selectAccent = async (color: string) => {
    setAccentColor(color);
    await AsyncStorage.setItem(STORAGE_KEYS.accent, color);
    setShowCustomization(false);
  };

  const renderItem = ({ item }: { item: SectionItem }) => {
    switch (item.key) {
      case 'Notifications':
        return (
          <View style={[styles.notificationRow, { backgroundColor: isDarkMode ? '#333' : '#F5F5F5' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="notifications-outline" size={24} color={isDarkMode ? '#fff' : '#333'} style={{ marginRight: 12 }} />
              <Text style={[styles.notificationLabel, { color: isDarkMode ? '#fff' : '#333' }]}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotificationsEnabled}
              thumbColor={notificationsEnabled ? '#ff9696' : '#ccc'}
              trackColor={{ false: '#767577', true: '#ffb7b7' }}
            />
          </View>
        );
      case 'Customization':
        return (
          <TouchableOpacity
            style={[styles.notificationRow, { backgroundColor: isDarkMode ? '#333' : '#F5F5F5' }]}
            onPress={() => setShowCustomization(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name={item.icon as any} size={24} color={isDarkMode ? '#fff' : '#333'} style={{ marginRight: 12 }} />
              <Text style={[styles.notificationLabel, { color: isDarkMode ? '#fff' : '#333' }]}>
                {item.label}
              </Text>
            </View>
            <View style={[styles.colorSwatch, { backgroundColor: accentColor }]} />
          </TouchableOpacity>
        );
      default:
        return (
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              Alert.alert(item.label, 'This feature is coming soon.');
            }}
          >
            <Ionicons name={item.icon as any} size={24} color={isDarkMode ? '#fff' : '#333'} style={styles.rowIcon} />
            <Text style={[styles.rowLabel, isDarkMode && styles.textDark]}>{item.label}</Text>
            {item.badge && <View style={styles.badge} />}
            {item.rightLabel && <Text style={styles.rowRight}>{item.rightLabel}</Text>}
            <MaterialIcons name="chevron-right" size={20} color={isDarkMode ? '#888' : '#aaa'} />
          </TouchableOpacity>
        );
    }
  };

  return (
    <LinearGradient
      colors={isDarkMode ? ['#121212', '#232329'] : ['#fff', '#f5f5f5']}
      style={[styles.container, isDarkMode && styles.containerDark]}
    >
      <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>
      <TextInput
        style={[styles.usernameInput, isDarkMode && styles.textDark]}
        placeholder="Your Name"
        placeholderTextColor={isDarkMode ? '#888' : '#666'}
        value={username}
        onChangeText={onUsernameChange}
      />
      <View style={styles.modeRow}>
        <Text style={[styles.rowLabel, isDarkMode && styles.textDark]}>Dark Mode</Text>
        <Switch value={isDarkMode} onValueChange={toggleDarkMode} thumbColor={isDarkMode ? '#ff9696' : '#ccc'} trackColor={{ false: '#767577', true: '#ffb7b7' }} />
      </View>

      <SectionList
        sections={SECTIONS}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionHeader, isDarkMode && styles.textDark]}>{title}</Text>
        )}
        contentContainerStyle={styles.listContent}
      />

      {showCustomization && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#232329' : '#fff' }]}>
              <Text style={[styles.modalTitle, isDarkMode && styles.textDark]}>
                Select Accent Color
              </Text>
              <FlatList
                data={colorOptions}
                numColumns={5}
                keyExtractor={c => c}
                renderItem={({ item: color }) => (
                  <TouchableOpacity
                    style={[styles.colorSwatch, { backgroundColor: color, borderWidth: color === accentColor ? 2 : 0 }]}
                    onPress={() => selectAccent(color)}
                  />
                )}
              />
              <Button title="Cancel" onPress={() => setShowCustomization(false)} />
            </View>
          </View>
        </Modal>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  containerDark: {},
  avatarContainer: { alignSelf: 'center', marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: '#ff9696' },
  placeholder: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' },
  placeholderText: { color: '#888' },
  username: { fontSize: 20, fontWeight: '700', alignSelf: 'center', marginBottom: 20, color: '#333' },
  usernameInput: {
    width: '60%',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    alignSelf: 'center',
  },
  modeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#666', marginTop: 20, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  rowIcon: { marginRight: 16 },
  rowLabel: { fontSize: 16, flex: 1 },
  badge: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff9696', marginHorizontal: 8 },
  rowRight: { color: '#888', marginRight: 8 },
  listContent: { paddingBottom: 40 },
  textDark: { color: '#fff' },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 8,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 8,
  },
});

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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const STORAGE_KEYS = {
  avatar: 'user_avatar',
  username: 'user_name',
  theme: 'user_theme',
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
  const router = useRouter();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  // Handler for username input change and persistence
  const onUsernameChange = async (text: string) => {
    setUsername(text);
    await AsyncStorage.setItem(STORAGE_KEYS.username, text);
  };
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const [savedAvatar, savedName, savedTheme] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.avatar),
        AsyncStorage.getItem(STORAGE_KEYS.username),
        AsyncStorage.getItem(STORAGE_KEYS.theme),
      ]);
      if (savedAvatar) setAvatarUri(savedAvatar);
      if (savedName) setUsername(savedName);
      if (savedTheme) setIsDarkMode(savedTheme === 'dark');
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

  const renderItem = ({ item }: { item: SectionItem }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        switch (item.key) {
          case 'Notifications':
            router.push('/notifications');
            break;
          default:
            Alert.alert(item.label, 'This feature is coming soon.');
        }
      }}
    >
      <Ionicons name={item.icon as any} size={24} color={isDarkMode ? '#fff' : '#333'} style={styles.rowIcon} />
      <Text style={[styles.rowLabel, isDarkMode && styles.textDark]}>{item.label}</Text>
      {item.badge && <View style={styles.badge} />}
      {item.rightLabel && <Text style={styles.rowRight}>{item.rightLabel}</Text>}
      <MaterialIcons name="chevron-right" size={20} color={isDarkMode ? '#888' : '#aaa'} />
    </TouchableOpacity>
  );

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
});

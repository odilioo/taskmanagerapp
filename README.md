# TaskManagerApp

A cross-platform task management app built with Expo, React Native, and TypeScript.

## Prerequisites
- Node.js (>= 14.x)
- npm (>= 6.x) or Yarn
- Expo CLI (install globally):
  ```bash
  npm install -g expo-cli
  ```
- Android Studio (for Android emulator) or Xcode (for iOS simulator), or Expo Go on a physical device

## Getting Started
Follow these steps to run the project locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/odilioo/taskmanagerapp.git
   cd taskmanagerapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install native modules**
   This ensures all Expo and React Native modules are linked:
   ```bash
   npx expo install
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

5. **Run the app**
   - Press **i** to open iOS Simulator (macOS only)
   - Press **a** to open Android Emulator
   - Scan the QR code with **Expo Go** on your device

## Project Structure
```
app/
  (tabs)/
    index.tsx            # Home dashboard
    timeline.tsx         # Timeline & weekly bar view
    add.tsx              # Add/edit task screen
    settings.tsx         # Settings and preferences
    notifications.tsx    # Notification toggle screen
  components/
    TaskListScreen.js
    TaskFormScreen.js
    TaskDetailModal.js
  utils/
    Storage.js           # AsyncStorage helper functions
assets/
  // images, icons, fonts, etc.
README.md
package.json
tsconfig.json
```

## Available Scripts
- `npm start` / `expo start`: Start Metro bundler
- `npm run ios`: Open iOS simulator
- `npm run android`: Open Android emulator
- `npm run web`: Run web version

## Features
- Add, edit, and delete tasks with title, description, due date, time, and priority  
- Persistent storage using AsyncStorage  
- Dashboard home with **Today's Tasks**, **Overdue Tasks**, **Upcoming Tasks**, and **High-Priority Tasks**  
- Inline edit modal for adjusting task date and time  
- Dark/light mode toggle with persisted theme  
- Avatar and username customization in Settings  
- Local notifications for high-priority tasks  

## Dependencies
- expo
- react
- react-native
- expo-router
- @react-native-async-storage/async-storage
- @react-native-community/datetimepicker
- @react-native-picker/picker
- expo-image-picker
- expo-linear-gradient
- expo-notifications
- date-fns

## Dev Dependencies
- expo-module-scripts

## Troubleshooting
- **expo-module-scripts/tsconfig.base not found**  
  ```bash
  npm install --save-dev expo-module-scripts
  ```
- **Notifications not firing**  
  Grant notification permissions when prompted and enable notifications in Settings.
- **TypeScript errors in node_modules**  
  Add `"skipLibCheck": true` and `"exclude": ["node_modules"]` to `tsconfig.json`:

  ```json
  {
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
      "strict": true,
      "skipLibCheck": true,
      "paths": { "@/*": ["./*"] }
    },
    "include": ["**/*.ts", "**/*.tsx"],
    "exclude": ["node_modules"]
  }
  ```

## License
This project is licensed under the MIT License.

# 📅 TaskManager
### Made with ❤️ by [odilio (2024655)](https://github.com/odilioo)
```

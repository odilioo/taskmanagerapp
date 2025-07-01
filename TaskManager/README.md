## Getting Started

**1. Clone the repository:**
```sh
git clone https://github.com/odilioo/taskmanagerapp.git
cd taskmanagerapp
```

**2. Install dependencies:**
```sh
npm install
```

**3. Start the app:**
```sh
npx expo start
```

- Open on your device with the Expo Go app, or use an emulator/simulator.

---

## Project Structure

```
app/
  (tabs)/
    timeline.tsx       # Timeline & week bar UI
    add.tsx            # Add task form
    settings.tsx       # Settings screen
    _layout.tsx        # Tab bar navigation
  components/
    TaskListScreen.js
    TaskFormScreen.js
  utils/
    Storage.js         # AsyncStorage helper
assets/
```

---

## Dependencies

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [date-fns](https://date-fns.org/)
- [@react-native-picker/picker](https://github.com/react-native-picker/picker)
- [expo-router](https://docs.expo.dev/router/introduction/)
- [@expo/vector-icons](https://docs.expo.dev/guides/icons/)

---

## Customization

- Change timeline colors, icons, and date bar styles in `/app/(tabs)/timeline.tsx`
- Edit persistent storage logic in `/utils/Storage.js`

---

## License

MIT

---
# 📅 TaskManager
### Made with ❤️ by [odilio (2024655)](https://github.com/odilioo)
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

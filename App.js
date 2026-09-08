import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {DatabaseProvider} from './src/context/DatabaseContext';
import {SettingsProvider} from './src/context/SettingsContext';
import HomeScreen from './src/screens/HomeScreen';
import ContactDetailScreen from './src/screens/ContactDetailScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import AddContactScreen from './src/screens/AddContactScreen';
import BackupScreen from './src/screens/BackupScreen';
import HelpScreen from './src/screens/HelpScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <SettingsProvider>
          <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerStyle: {backgroundColor: '#1A1A2E'},
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {fontWeight: '700', fontSize: 17},
                animation: 'slide_from_right',
                contentStyle: {backgroundColor: '#0F0F1A'},
              }}>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{title: 'Digital Khatta 📒'}}
              />
              <Stack.Screen
                name="ContactDetail"
                component={ContactDetailScreen}
                options={({route}) => ({title: route.params.name})}
              />
              <Stack.Screen
                name="AddTransaction"
                component={AddTransactionScreen}
                options={({route}) => ({
                  title: route.params.editMode
                    ? '✏️ Edit Transaction'
                    : route.params.type === 'gave'
                    ? '↑ Gave (Diya)'
                    : '↓ Took (Liya)',
                })}
              />
              <Stack.Screen
                name="AddContact"
                component={AddContactScreen}
                options={{title: 'New Contact'}}
              />
              <Stack.Screen
                name="Backup"
                component={BackupScreen}
                options={{title: '💾 Backup & Restore'}}
              />
              <Stack.Screen
                name="Help"
                component={HelpScreen}
                options={{title: '❓ Help & Guide'}}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{title: '⚙️ Currency Settings'}}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SettingsProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
};

export default App;

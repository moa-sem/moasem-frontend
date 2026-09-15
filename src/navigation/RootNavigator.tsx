import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../screens/auth/Login';
import Home from '../screens/home/Home';
import GroupDetail from '../screens/home/GroupDetail';
import EventDetail from '../screens/home/EventDetail';
import Settings from '../screens/settings/Settings';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  GroupDetail: { groupId: number; groupName: string; isAdmin: boolean; inviteCode: string };
  EventDetail:
    | { mode: 'api'; groupId: number; eventId: number; isAdmin: boolean }
    | { mode: 'draft'; eventName: string; isAdmin: boolean; totalBudget: number; remainingBudget: number };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="GroupDetail" component={GroupDetail} />
        <Stack.Screen name="EventDetail" component={EventDetail} />
        <Stack.Screen name="Settings" component={Settings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

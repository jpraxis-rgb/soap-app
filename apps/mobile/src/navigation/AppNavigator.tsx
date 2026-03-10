import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

import { HomeScreen } from '../screens/HomeScreen';
import { ScheduleDetailScreen } from '../screens/ScheduleDetailScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { DisciplinaDetailScreen } from '../screens/DisciplinaDetailScreen';
import { StudyScreen } from '../screens/StudyScreen';
import { ContentScreen } from '../screens/ContentScreen';
import { FlashcardScreen } from '../screens/FlashcardScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { CurationScreen } from '../screens/CurationScreen';

const HomeStackNav = createNativeStackNavigator();
const ProgressStackNav = createNativeStackNavigator();
const StudyStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerShadowVisible: false,
};

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={screenOptions}>
      <HomeStackNav.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <HomeStackNav.Screen
        name="ScheduleDetail"
        component={ScheduleDetailScreen}
        options={{ title: 'Cronograma' }}
      />
    </HomeStackNav.Navigator>
  );
}

function ProgressStack() {
  return (
    <ProgressStackNav.Navigator screenOptions={screenOptions}>
      <ProgressStackNav.Screen
        name="ProgressMain"
        component={ProgressScreen}
        options={{ title: 'Progresso' }}
      />
      <ProgressStackNav.Screen
        name="DisciplinaDetail"
        component={DisciplinaDetailScreen}
        options={{ title: 'Disciplina' }}
      />
    </ProgressStackNav.Navigator>
  );
}

function StudyStack() {
  return (
    <StudyStackNav.Navigator screenOptions={screenOptions}>
      <StudyStackNav.Screen
        name="StudyMain"
        component={StudyScreen}
        options={{ title: 'Estudar' }}
      />
      <StudyStackNav.Screen
        name="Content"
        component={ContentScreen}
        options={{ title: 'Conteúdo' }}
      />
      <StudyStackNav.Screen
        name="Flashcard"
        component={FlashcardScreen}
        options={{ title: 'Flashcards' }}
      />
      <StudyStackNav.Screen
        name="Quiz"
        component={QuizScreen}
        options={{ title: 'Quiz' }}
      />
      <StudyStackNav.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ title: 'Planos' }}
      />
      <StudyStackNav.Screen
        name="Curation"
        component={CurationScreen}
        options={{ title: 'Curadoria' }}
      />
    </StudyStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={screenOptions}>
      <ProfileStackNav.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
      <ProfileStackNav.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Configurações' }}
      />
      <ProfileStackNav.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ title: 'Assinatura' }}
      />
      <ProfileStackNav.Screen
        name="PaywallProfile"
        component={PaywallScreen}
        options={{ title: 'Planos' }}
      />
    </ProfileStackNav.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Progresso') {
            iconName = 'stats-chart';
          } else if (route.name === 'Estudar') {
            iconName = 'book';
          } else if (route.name === 'Perfil') {
            iconName = 'person';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.surface,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Progresso" component={ProgressStack} />
      <Tab.Screen name="Estudar" component={StudyStack} />
      <Tab.Screen name="Perfil" component={ProfileStack} />
    </Tab.Navigator>
  );
}

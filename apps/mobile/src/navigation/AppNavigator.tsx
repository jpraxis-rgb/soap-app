import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useAuth } from '../contexts/AuthContext';

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
import { WelcomeScreen, SignUpScreen, SignInScreen } from '../screens/Onboarding';
import { PaywallScreen } from '../screens/PaywallScreen';
import { CurationScreen } from '../screens/CurationScreen';
import { EditalImportScreen } from '../screens/EditalImportScreen';
import { EditalReviewScreen } from '../screens/EditalReviewScreen';
import { ScheduleConfigScreen } from '../screens/ScheduleConfigScreen';
import { SchedulePreviewScreen } from '../screens/SchedulePreviewScreen';
import { CargoSelectScreen } from '../screens/CargoSelectScreen';
import { EditalPickerScreen } from '../screens/EditalPickerScreen';
import { StudySessionScreen } from '../screens/StudySessionScreen';

const AuthStackNav = createNativeStackNavigator();
const HomeStackNav = createNativeStackNavigator();
const ProgressStackNav = createNativeStackNavigator();
const StudyStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();
const RootStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerShadowVisible: false,
};

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStackNav.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{
          ...screenOptions,
          headerShown: true,
          title: 'Criar conta',
        }}
      />
      <AuthStackNav.Screen
        name="SignIn"
        component={SignInScreen}
        options={{
          ...screenOptions,
          headerShown: true,
          title: 'Entrar',
        }}
      />
    </AuthStackNav.Navigator>
  );
}

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
      <HomeStackNav.Screen
        name="EditalImport"
        component={EditalImportScreen}
        options={{ title: 'Importar Edital' }}
      />
      <HomeStackNav.Screen
        name="EditalPicker"
        component={EditalPickerScreen}
        options={{ title: 'Concursos Disponíveis' }}
      />
      <HomeStackNav.Screen
        name="CargoSelect"
        component={CargoSelectScreen as any}
        options={{ title: 'Selecionar Cargo' }}
      />
      <HomeStackNav.Screen
        name="EditalReview"
        component={EditalReviewScreen}
        options={{ title: 'Revisar Edital' }}
      />
      <HomeStackNav.Screen
        name="ScheduleConfig"
        component={ScheduleConfigScreen as any}
        options={{ title: 'Configurar Cronograma' }}
      />
      <HomeStackNav.Screen
        name="SchedulePreview"
        component={SchedulePreviewScreen as any}
        options={{ title: 'Pré-visualizar' }}
      />
      <HomeStackNav.Screen
        name="StudySession"
        component={StudySessionScreen as any}
        options={{ headerShown: false, gestureEnabled: false }}
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
      <ProfileStackNav.Screen
        name="EditalImport"
        component={EditalImportScreen}
        options={{ title: 'Importar Edital' }}
      />
      <ProfileStackNav.Screen
        name="EditalPicker"
        component={EditalPickerScreen}
        options={{ title: 'Concursos Disponíveis' }}
      />
      <ProfileStackNav.Screen
        name="CargoSelect"
        component={CargoSelectScreen as any}
        options={{ title: 'Selecionar Cargo' }}
      />
      <ProfileStackNav.Screen
        name="EditalReview"
        component={EditalReviewScreen}
        options={{ title: 'Revisar Edital' }}
      />
      <ProfileStackNav.Screen
        name="ScheduleConfig"
        component={ScheduleConfigScreen as any}
        options={{ title: 'Configurar Cronograma' }}
      />
      <ProfileStackNav.Screen
        name="SchedulePreview"
        component={SchedulePreviewScreen as any}
        options={{ title: 'Pré-visualizar' }}
      />
    </ProfileStackNav.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home' || route.name === 'Início') {
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
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Início' }} />
      <Tab.Screen name="Progresso" component={ProgressStack} />
      <Tab.Screen name="Estudar" component={StudyStack} />
      <Tab.Screen name="Perfil" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <RootStackNav.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStackNav.Screen name="Main" component={MainTabs} />
      ) : (
        <RootStackNav.Screen name="Auth" component={AuthStack} />
      )}
    </RootStackNav.Navigator>
  );
}

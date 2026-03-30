import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export function configureGoogleSignIn() {
  GoogleSignin.configure({
    iosClientId: '992045506382-ttk81obo6v4fk2i3cks6pjb5drfrbr34.apps.googleusercontent.com',
    webClientId: '992045506382-a0il8f01nut7b430m3i8soqk65g2oa3j.apps.googleusercontent.com',
    offlineAccess: false,
  });
}

export async function signInWithGoogle(): Promise<string> {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  if (!response.data?.idToken) {
    throw new Error('No ID token returned from Google Sign-In');
  }

  return response.data.idToken;
}

export { statusCodes };

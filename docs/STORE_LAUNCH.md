# App Store Launch Guide — Estuda Tudo

Status of the app-store prep work. Sections marked **✅ done in code** are complete on this
branch; **⏳ needs you** items require accounts, devices, or dashboards I can't reach.

Monetization decision for first release: **launch free** (subscriptions stay disabled;
`POST /subscriptions/create` returns 501). This removes Apple IAP / Google Play Billing from
the critical path. Add paid tiers as a fast-follow.

---

## 1. Hard store blockers

### Account deletion — ✅ done in code
Both stores require in-app account deletion for account-creating apps.
- Backend `DELETE /users/me` deletes the user and **cascades** to editais, disciplinas,
  schedules, sessions, quiz attempts, flashcard reviews, and subscriptions (verified against
  the live DB — shared content is intentionally kept).
- Mobile **Settings → Excluir conta** now really calls the endpoint, shows an "Excluindo..."
  state, then logs the user out. (`SettingsScreen.tsx`, `usersApi.deleteAccount`.)
- **⏳ needs you (Google Play only):** Play also wants a *web-accessible* deletion request URL.
  Add a short page (or reuse the support email in `privacy.html`) and enter it in the Play
  Console Data Safety section.

### Sign in with Apple — ✅ backend done · ⏳ native button needs a device
Apple requires Sign in with Apple whenever you offer another social login (you have Google).
- Backend now **really verifies** the Apple identity token: RS256 signature against Apple's
  JWKS, plus issuer/audience/expiry checks. Garbage tokens are rejected (verified); an
  unconfigured server returns 503. (`modules/auth/service.ts`, `routes/auth.ts`.)
- Set env `APPLE_CLIENT_ID` = your app bundle id `com.estudatudo.app` (comma-add your Services
  ID if you also do Apple sign-in on web). `app.json` already sets `ios.usesAppleSignIn: true`.
- The mobile API client method `authApi.appleAuth(token)` already exists.
- **⏳ needs you (requires an iOS device/simulator to test):** add the native button that
  produces the identity token:
  ```bash
  cd apps/mobile && npx expo install expo-apple-authentication
  ```
  Then, in `SignInScreen.tsx` / `SignUpScreen.tsx`, render on iOS only:
  ```tsx
  import * as AppleAuthentication from 'expo-apple-authentication';
  import { Platform } from 'react-native';
  import { authApi } from '../../services/api';
  // ...
  {Platform.OS === 'ios' && (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={12}
      style={{ height: 48, width: '100%' }}
      onPress={async () => {
        const cred = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (cred.identityToken) {
          const res = await authApi.appleAuth(cred.identityToken);
          // hand res to AuthContext the same way Google sign-in does
        }
      }}
    />
  )}
  ```
  Note: Apple only returns the email on the *first* sign-in; the backend keys the account by
  the token's verified `email` claim (same as Google).

---

## 2. Legal / privacy — ✅ pages written · ⏳ fill in + host
- `apps/mobile/public/privacy.html` and `terms.html` are LGPD-oriented drafts, served on the
  web app (same mechanism as `auth-callback.html`) at `/privacy.html` and `/terms.html`.
- The app's **Perfil → Termos / Privacidade / Ajuda** links now open these pages / the support
  email (`ProfileScreen.tsx`, `utils/links.ts`).
- **⏳ needs you:** replace the `[…]` placeholders (company name, CNPJ, contact email, dates),
  **have them reviewed by a lawyer**, and set `EXPO_PUBLIC_WEB_URL` (and `SUPPORT_EMAIL` in
  `utils/links.ts`) to your real domain/email. Provide the privacy URL in both store listings.

---

## 3. Build & submit (EAS) — ✅ eas.json scaffolded · ⏳ accounts + runs
`apps/mobile/eas.json` has `development` / `preview` / `production` build profiles and a
`submit` profile.

Prereqs (one-time):
- Apple Developer Program ($99/yr) and Google Play Console ($25 once).
- `npm i -g eas-cli && eas login` (Expo account).
- Fill the `submit.production.ios` fields (`appleId`, `ascAppId`, `appleTeamId`) and add the
  Play service-account JSON at `apps/mobile/play-service-account.json` (gitignored).

Flow:
```bash
cd apps/mobile
eas build:configure                 # links the project, sets credentials
eas build --profile preview --platform all      # internal test builds
eas build --profile production --platform all   # store builds
eas submit --profile production --platform ios      # -> TestFlight
eas submit --profile production --platform android  # -> Play internal testing
```
Test via **TestFlight** (iOS) and Play **internal testing** before promoting to production.

---

## 4. Store listing — ⏳ needs you
- Icons/splash already configured (`assets/`). You still need **marketing screenshots** at the
  required device sizes, app description + keywords (PT-BR), Play feature graphic, category,
  and the content-rating questionnaire.
- **App privacy disclosures:** Apple's privacy "nutrition label" + Google Data Safety form.
  Declare: email, name, and app-usage/study data; used for app functionality; not sold.
- Provide a **demo account** for Apple review (they must be able to log in).
- Confirm `com.estudatudo.app` and the name "Estuda Tudo" are free in both stores.

---

## 5. Production hardening (recommended before scale)
- Error monitoring (e.g. Sentry) — today errors only hit Railway logs.
- **Gemini spend cap / budget alert** on the AI key — real users importing editais cost money.
- DB backups on the Railway Postgres.
- Route AI-generated content through review rather than auto-publishing to the shared namespace
  (finding M8 in `BETA_READINESS.md`) — matters more for a paid, store-reviewed app.

---

## New environment variables introduced
| Var | Where | Purpose |
|---|---|---|
| `APPLE_CLIENT_ID` | API (Railway) | Apple identity-token audience (bundle id, comma-add Services ID for web) |
| `EXPO_PUBLIC_WEB_URL` | Mobile build (EAS/Vercel) | Absolute origin for legal pages on native |

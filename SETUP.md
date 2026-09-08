# Digital Khatta — Setup & Build Instructions

## Prerequisites (do this once)

- Node.js 18+ installed → https://nodejs.org
- Git installed → https://git-scm.com
- React Native CLI environment → https://reactnative.dev/docs/environment-setup
  - Android Studio + SDK (for local testing only — NOT needed for GitHub build)
- A free GitHub account → https://github.com

---

## Step 1 — Init the React Native project

Open a terminal and run:

```bash
npx react-native@0.73.6 init DigitalKhatta --version 0.73.6
cd DigitalKhatta
```

This creates the full `android/` folder and boilerplate files.

---

## Step 2 — Copy the source files

Copy the files from this project into the newly created folder.
**Replace** the files that already exist (App.js, index.js, package.json).
**Create** the folders and files that don't exist yet:

```
DigitalKhatta/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── ContactDetailScreen.js
│   │   ├── AddTransactionScreen.js
│   │   ├── AddContactScreen.js
│   │   ├── BackupScreen.js
│   │   └── HelpScreen.js
│   ├── context/
│   │   └── DatabaseContext.js
│   └── utils/
│       ├── colors.js
│       └── format.js
├── .github/
│   └── workflows/
│       └── build.yml
├── App.js          ← replace
├── index.js        ← replace
├── app.json        ← replace
└── package.json    ← replace
```

---

## Step 3 — Install dependencies

```bash
npm install
```

This installs all packages from package.json including navigation,
SQLite, file system, share, document picker, and print.

---

## Step 4 — Link native modules (React Native 0.73 auto-links most)

For react-native-sqlite-storage, add to `android/app/build.gradle`:

```gradle
dependencies {
    // ... existing deps ...
    implementation project(':react-native-sqlite-storage')
}
```

Then in `android/settings.gradle`, add:

```gradle
include ':react-native-sqlite-storage'
project(':react-native-sqlite-storage').projectDir =
    new File(rootProject.projectDir, '../node_modules/react-native-sqlite-storage/platforms/android-native')
```

In `android/app/src/main/java/com/digitalkhatta/app/MainApplication.java`,
ensure the package is included (autolinking handles this on 0.73).

For react-native-sqlite-storage specifically, also add to
`android/app/src/main/java/com/digitalkhatta/app/MainApplication.java`
inside the `getPackages()` list:

```java
packages.add(new SQLitePluginPackage());
```

And the import at the top:

```java
import org.pgsqlite.SQLitePluginPackage;
```

---

## Step 5 — Update android/app/build.gradle

Make sure the `defaultConfig` block has the right package name:

```gradle
defaultConfig {
    applicationId "com.digitalkhatta.app"
    minSdkVersion 24
    targetSdkVersion 34
    versionCode 12
    versionName "1.2.0"
}
```

---

## Step 6 — Create a GitHub repository

1. Go to https://github.com/new
2. Name it `digital-khatta` (or anything you like)
3. Set to **Public** (required for free GitHub Actions)
4. Do NOT add README/gitignore (project already has files)
5. Click "Create repository"

---

## Step 7 — Push to GitHub

In your terminal inside the project folder:

```bash
git init
git add .
git commit -m "Initial commit — Digital Khatta v1.2.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/digital-khatta.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 8 — Watch the build

1. Go to your repo on GitHub
2. Click the **Actions** tab
3. You'll see "Build APK" running (takes ~10-15 min first time, 2-3 min after cache warms)
4. Click on the run to watch logs

---

## Step 9 — Download the APK

1. Once the build shows a green ✅, click on it
2. Scroll down to the **Artifacts** section
3. Click **digital-khatta.apk** to download a ZIP
4. Unzip it — inside is the APK file
5. Transfer the APK to your Android phone (USB, WhatsApp, Google Drive, etc.)
6. On the phone: Settings → Install unknown apps → allow your file manager
7. Tap the APK → Install

---

## Subsequent builds

Every time you `git push` to `main`, a new APK builds automatically.
After the first build, node_modules and Gradle are cached — subsequent
builds take 2-3 minutes instead of 15.

---

## Troubleshooting

**Build fails with "SDK not found"**
The workflow installs Java but not Android SDK by default. Add this step
before "Build APK" in build.yml:

```yaml
- name: Set up Android SDK
  uses: android-actions/setup-android@v3
```

**SQLite linking errors**
Make sure the MainApplication.java import and getPackages() addition
from Step 4 are present. Double-check the settings.gradle path.

**"Unable to resolve module" errors**
Run `npm install` again and make sure package.json is the correct one
from this project (not the original boilerplate).

**APK installs but crashes on launch**
Enable USB debugging on your phone, connect to PC, and run:
```bash
adb logcat *:E
```
This shows the crash reason in real time.

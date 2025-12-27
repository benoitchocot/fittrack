                                                                                                                    # 📱 Build et Export de l'APK FitTrack

Ce guide explique comment construire et exporter l'application FitTrack en APK pour Android.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** version **≥ 18**
- **npm** (fourni avec Node.js)
- **Java JDK 17** ou supérieur (requis pour Gradle)
- **Android SDK** (via Android Studio ou en ligne de commande)
- **Gradle** (généralement inclus avec le projet via le wrapper)

> 💡 **Astuce** : Si vous utilisez Android Studio, l'installation de l'Android SDK est automatique.

---

## 🚀 Processus de Build

### Étape 1 : Build du Frontend

Depuis la **racine du projet**, construisez le frontend avec Vite :

```bash
npm run build
```

Cette commande génère les fichiers optimisés dans le dossier `dist/`, qui seront ensuite copiés dans l'application Android.

> ⚠️ **Important** : Le dossier `dist/` est configuré comme `webDir` dans `capacitor.config.ts`. Assurez-vous que le build s'est bien terminé avant de passer à l'étape suivante.

### Étape 2 : Synchronisation avec Capacitor

Synchronisez les fichiers du frontend avec le projet Android :

```bash
npm run cap:sync
```

Cette commande :
- Build le frontend (`npm run build`)
- Copie les fichiers du dossier `dist/` vers `android/app/src/main/assets/public/`
- Synchronise la configuration Capacitor

> 🔄 **Alternative** : Si vous avez déjà build le frontend, vous pouvez utiliser :
> ```bash
> npm run cap:copy
> ```

### Étape 3 : Génération de l'APK

#### Option A : APK Debug (pour tests)

Depuis la **racine du projet** :

```bash
npm run build:apk
```

Ou depuis le dossier `android/` :

```bash
cd android
./gradlew assembleDebug
```

L'APK debug sera généré dans :
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### Option B : APK Release (pour distribution)

Depuis le dossier `android/` :

```bash
cd android
./gradlew assembleRelease
```

L'APK release sera généré dans :
```
android/app/build/outputs/apk/release/app-release.apk
```

> ⚠️ **Note** : Pour signer l'APK release, vous devrez configurer un keystore. Voir la section [Signer l'APK Release](#-signer-lapk-release) ci-dessous.

---

## 📦 Emplacement des APK générés

Après le build, les APK se trouvent dans :

- **Debug** : `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release** : `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔐 Signer l'APK Release

Pour distribuer l'application, vous devez signer l'APK release avec un keystore.

### 1. Créer un keystore (si vous n'en avez pas)

```bash
keytool -genkey -v -keystore fittrack-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias fittrack
```

### 2. Configurer le keystore dans `android/app/build.gradle`

Ajoutez la configuration de signature dans la section `android` :

```gradle
android {
    // ... configuration existante ...
    
    signingConfigs {
        release {
            storeFile file('path/to/your/fittrack-release-key.jks')
            storePassword 'votre_mot_de_passe'
            keyAlias 'fittrack'
            keyPassword 'votre_mot_de_passe'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

> 🔒 **Sécurité** : Ne commitez **jamais** le keystore ou les mots de passe dans Git. Utilisez des variables d'environnement ou un fichier `keystore.properties` (ajouté au `.gitignore`).

### 3. Build l'APK signé

```bash
cd android
./gradlew assembleRelease
```

---

## 🧹 Nettoyage

Pour nettoyer les builds précédents :

```bash
cd android
./gradlew clean
```

---

## 🛠️ Commandes Utiles

### Ouvrir le projet dans Android Studio

```bash
npm run cap:open:android
```

### Vérifier la configuration Capacitor

Le fichier de configuration se trouve à la racine : `capacitor.config.ts`

### Synchroniser uniquement (sans rebuild)

```bash
npx cap sync android
```

### Copier uniquement les assets (sans sync complète)

```bash
npx cap copy android
```

---

## ⚙️ Configuration

### Variables de Build

Les versions SDK et autres variables sont définies dans :
- `android/variables.gradle`
- `android/app/build.gradle`

### Application ID

L'application ID est défini dans :
- `capacitor.config.ts` : `appId: 'com.fittrack.app'`
- `android/app/build.gradle` : `applicationId "com.fittrack.app"`

---

## 🐛 Dépannage

### Erreur : "SDK location not found"

Créez ou modifiez le fichier `android/local.properties` :

```properties
sdk.dir=/path/to/your/android/sdk
```

### Erreur : "Java version incompatible"

Assurez-vous d'utiliser Java 17 ou supérieur. Vérifiez avec :

```bash
java -version
```

### Erreur : "Gradle sync failed"

Nettoyez et resynchronisez :

```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

### L'application ne charge pas le frontend

Vérifiez que :
1. Le build du frontend s'est bien terminé (`npm run build`)
2. La synchronisation Capacitor a été effectuée (`npm run cap:sync`)
3. Les fichiers sont présents dans `android/app/src/main/assets/public/`

---

## 📚 Ressources

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Documentation Android Gradle Plugin](https://developer.android.com/studio/build)
- [Guide de signature d'APK](https://developer.android.com/studio/publish/app-signing)

---

## 🙏 Notes

- L'APK debug peut être installé directement sur un appareil Android pour les tests
- L'APK release doit être signé avant distribution
- Pour publier sur le Google Play Store, vous devrez créer un AAB (Android App Bundle) avec `./gradlew bundleRelease`


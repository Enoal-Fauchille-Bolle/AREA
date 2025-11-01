import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "com.example.area"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.area"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion // App Links require API 21+
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            // CI/CD configuration (GitHub Actions)
            if (System.getenv("CI") != null) {
                val keystoreFilePath = System.getenv("KEYSTORE_FILE")
                val keystorePassword = System.getenv("KEYSTORE_PASSWORD")
                val keyAlias = System.getenv("KEY_ALIAS")
                val keyPassword = System.getenv("KEY_PASSWORD")
                
                if (!keystoreFilePath.isNullOrEmpty() && 
                    !keystorePassword.isNullOrEmpty() && 
                    !keyAlias.isNullOrEmpty() && 
                    !keyPassword.isNullOrEmpty()) {
                    storeFile = file(keystoreFilePath)
                    storePassword = keystorePassword
                    this.keyAlias = keyAlias
                    this.keyPassword = keyPassword
                }
            }
            // Local development configuration
            else if (keystorePropertiesFile.exists()) {
                val keyAlias = keystoreProperties.getProperty("keyAlias")
                val keyPassword = keystoreProperties.getProperty("keyPassword")
                val storePassword = keystoreProperties.getProperty("storePassword")
                val storeFilePath = keystoreProperties.getProperty("storeFile")
                
                if (!keyAlias.isNullOrEmpty() && 
                    !keyPassword.isNullOrEmpty() && 
                    !storePassword.isNullOrEmpty() && 
                    !storeFilePath.isNullOrEmpty()) {
                    this.keyAlias = keyAlias
                    this.keyPassword = keyPassword
                    this.storePassword = storePassword
                    storeFile = file(storeFilePath)
                }
            }
        }
    }

    buildTypes {
        release {
            // Use release signing config if available, otherwise fall back to debug
            val releaseConfig = signingConfigs.getByName("release")
            signingConfig = if (releaseConfig.storeFile != null) {
                releaseConfig
            } else {
                signingConfigs.getByName("debug")
            }
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}

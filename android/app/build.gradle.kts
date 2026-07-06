plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val zingoApiBaseUrl: String = providers
    .gradleProperty("zingoApiBaseUrl")
    .orElse("http://10.0.2.2:5001/api/")
    .get()

val zingoWebUrl: String = providers
    .gradleProperty("zingoWebUrl")
    .orElse("http://10.0.2.2:3001/")
    .get()

android {
    namespace = "com.zingo.mobile"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.zingo.mobile"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        buildConfigField("String", "API_BASE_URL", "\"$zingoApiBaseUrl\"")
        buildConfigField("String", "START_URL", "\"$zingoWebUrl\"")
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

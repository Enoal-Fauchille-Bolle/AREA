# Start from a recent Ubuntu image
FROM ubuntu:24.04

# Install dependencies
RUN apt-get update && \
    apt-get install -y curl unzip git xz-utils zip libglu1-mesa openjdk-17-jdk && \
    rm -rf /var/lib/apt/lists/*

# Install Android SDK command line tools
ENV ANDROID_SDK_ROOT /android-sdk
RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools \
    && curl -o commandlinetools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip \
    && unzip commandlinetools.zip -d $ANDROID_SDK_ROOT/cmdline-tools \
    && mv $ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools $ANDROID_SDK_ROOT/cmdline-tools/latest \
    && rm commandlinetools.zip

# Put sdkmanager in PATH
ENV PATH=$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH

# Install build tools and platform tools
RUN yes | sdkmanager --sdk_root=$ANDROID_SDK_ROOT --licenses
RUN sdkmanager --sdk_root=$ANDROID_SDK_ROOT "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# Install Flutter
RUN git clone https://github.com/flutter/flutter.git /flutter --branch stable
ENV PATH="/flutter/bin:${PATH}"

WORKDIR /app

# Copy pubspec files first for caching
COPY mobile-client/pubspec.yaml ./

# Get dependencies
RUN flutter pub get

# Copy the rest of your mobile client code
COPY mobile-client .

# Ensure Flutter is set up for Android builds
RUN flutter create --platforms=android .

# Build the release APK
RUN flutter build apk --release

# Create a minimal image to export the built APK
FROM alpine:latest
RUN mkdir -p /app/build
COPY --from=0 /app/build/app/outputs/flutter-apk/app-release.apk /app/build/client.apk

VOLUME ["/app/build"]

CMD ["echo", "Flutter APK build complete. APK is available in /app/build/client.apk"]

#!/usr/bin/env bash
# Compila y firma el APK sin Gradle, con las herramientas del SDK de Android.
# Uso: ANDROID_SDK=/ruta/sdk KEYSTORE=apagon.jks KS_PASS=... android/build.sh  → android/out/apagon.apk
set -euo pipefail
cd "$(dirname "$0")"
SDK=${ANDROID_SDK:?define ANDROID_SDK}; BT=$SDK/build-tools/34.0.0; JAR=$SDK/platforms/android-34/android.jar
: "${KEYSTORE:?define KEYSTORE}" "${KS_PASS:?define KS_PASS}"
VERSION=${VERSION:-1.0}; CODE=${CODE:-1}
rm -rf out && mkdir -p out/classes out/assets
cp ../index.html ../game.js out/assets/ && mkdir -p out/assets/vendor && cp ../vendor/three.min.js out/assets/vendor/
"$BT/aapt2" compile --dir res -o out/res.zip
"$BT/aapt2" link -o out/base.apk -I "$JAR" --manifest AndroidManifest.xml -A out/assets out/res.zip \
  --min-sdk-version 24 --target-sdk-version 34 --version-code "$CODE" --version-name "$VERSION"
javac -source 8 -target 8 -bootclasspath "$JAR" -nowarn -Xlint:none -d out/classes src/com/apagon/game/MainActivity.java 2>/dev/null
"$BT/d8" --release --min-api 24 --lib "$JAR" --output out out/classes/com/apagon/game/*.class
(cd out && zip -q base.apk classes.dex)
"$BT/zipalign" -f -p 4 out/base.apk out/aligned.apk
"$BT/apksigner" sign --ks "$KEYSTORE" --ks-pass "pass:$KS_PASS" --out out/apagon.apk out/aligned.apk
"$BT/apksigner" verify --print-certs out/apagon.apk | head -3

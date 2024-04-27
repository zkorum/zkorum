#!/usr/bin/env bash
zipalign -v 4 dist/capacitor/android/apk/release/app-release-unsigned.apk dist/capacitor/android/apk/release/app-release.apk
apksigner sign --ks upload-zkorum.jks --ks-key-alias upload-zkorum dist/capacitor/android/apk/release/app-release.apk
jarsigner -keystore upload-zkorum.jks -signedjar dist/capacitor/android/bundle/release/app-release-signed.aab dist/capacitor/android/bundle/release/app-release.aab upload-zkorum

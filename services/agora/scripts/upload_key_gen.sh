#!/usr/bin/env bash
keytool -genkey -v -keystore upload-zkorum.jks -alias upload-zkorum -keyalg RSA -keysize 2048 -validity 40000

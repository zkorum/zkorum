#!/usr/bin/env bash
# bundleRelease is important to create .aab for release to play store
quasar build -m capacitor -T android -- bundleRelease

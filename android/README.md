# POINT FOCAL Android / TWA

The Android target is a Trusted Web Activity (TWA) for the existing PWA.

- Website origin: `https://www.pointfocalapp.com`
- Android application ID: `com.pointfocalapp.mobile`
- Bubblewrap: `@bubblewrap/cli 1.26.0`
- Generated project: `android/generated/` (created by the build; do not hand-edit generated files)

## Generate and compile an unsigned bundle

From this directory:

```sh
npm install --no-audit --no-fund
npm run generate
cd generated
../node_modules/.bin/bubblewrap build --skipPwaValidation --skipSigning --manifest=./twa-manifest.json
```

The workflow `.github/workflows/android-twa-build.yml` runs this build and stores the unsigned APK/AAB as a CI artifact for build verification. It is not a Play Store release and cannot be installed as a release build.

## Release prerequisites

1. Configure Play App Signing for the app ID `com.pointfocalapp.mobile`.
2. Provide a long-lived upload keystore through protected CI secrets; never commit the keystore or passwords.
3. Obtain the **app-signing certificate SHA-256 fingerprint** from Play Console. The upload-key fingerprint is not a substitute for the certificate Google uses to sign distributed APKs.
4. Publish the matching Digital Asset Links statement at `/.well-known/assetlinks.json` on `www.pointfocalapp.com`. Do this only with the confirmed production fingerprint.
5. Build a signed AAB, test the installed TWA on Android (including returning from external links), then complete Play Console internal testing and policy review.

The generated configuration deliberately contains no signing fingerprint and no Play Console service-account credential. Until the certificate and site association are in place, Android may open the site in a browser Custom Tab rather than a verified fullscreen TWA.

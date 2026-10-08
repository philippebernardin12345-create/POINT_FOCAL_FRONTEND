"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const Color = require("color");
const { ConsoleLog, TwaGenerator, TwaManifest } = require("@bubblewrap/core");

const root = __dirname;
const outputDirectory = path.join(root, "generated");
const config = require("./twa-config.json");

async function main() {
  const origin = new URL(config.origin);
  if (origin.protocol !== "https:") {
    throw new Error("The TWA origin must use HTTPS.");
  }

  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(config.packageId)) {
    throw new Error("Invalid Android package ID.");
  }

  const webManifestUrl = new URL("/manifest.webmanifest", origin).toString();
  const twa = await TwaManifest.fromWebManifest(webManifestUrl);

  twa.host = origin.host;
  twa.packageId = config.packageId;
  twa.name = config.name;
  twa.launcherName = config.launcherName;
  twa.startUrl = config.startUrl;
  twa.appVersionCode = config.versionCode;
  twa.appVersionName = config.versionName;
  twa.minSdkVersion = config.minSdkVersion;
  twa.display = config.display;
  twa.orientation = config.orientation;
  twa.themeColor = Color(config.themeColor);
  twa.themeColorDark = Color(config.themeColor);
  twa.navigationColor = Color(config.navigationColor);
  twa.navigationColorDark = Color(config.navigationColor);
  twa.backgroundColor = Color(config.backgroundColor);
  twa.webManifestUrl = new URL(webManifestUrl);
  twa.signingKey = {
    path: config.uploadKeyPath,
    alias: config.uploadKeyAlias
  };

  // Production certificate fingerprints are added only after Play App Signing
  // supplies the certificate used to sign distributed APKs.
  twa.fingerprints = [];
  twa.serviceAccountJsonFile = undefined;

  await fs.mkdir(outputDirectory, { recursive: true });
  const manifestPath = path.join(outputDirectory, "twa-manifest.json");
  await twa.saveToFile(manifestPath);

  const generator = new TwaGenerator();
  await generator.createTwaProject(
    outputDirectory,
    twa,
    new ConsoleLog("POINT FOCAL TWA")
  );

  console.log(`Generated TWA project at ${outputDirectory}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

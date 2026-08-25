import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function bumpVersion() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: npm run version:bump <new_version>");
    process.exit(1);
  }

  let rawVersion = args[0].trim();
  if (rawVersion.startsWith("v")) {
    rawVersion = rawVersion.slice(1);
  }

  const semverPattern = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?(?:\+[a-zA-Z0-9.]+)?$/;
  if (!semverPattern.test(rawVersion)) {
    console.error(`Error: "${args[0]}" is not a valid Semantic Version (e.g. 0.4.0, 1.0.0-beta.1)`);
    process.exit(1);
  }

  // 1. Update VERSION file
  const versionFilePath = path.join(rootDir, "VERSION");
  fs.writeFileSync(versionFilePath, `${rawVersion}\n`, "utf-8");
  console.log(`✓ Updated VERSION to ${rawVersion}`);

  // 2. Update package.json
  const packageJsonPath = path.join(rootDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    pkg.version = rawVersion;
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
    console.log(`✓ Updated package.json version to ${rawVersion}`);
  }

  // 3. Update src/components/Version.tsx
  const versionComponentPath = path.join(rootDir, "src", "components", "Version.tsx");
  if (fs.existsSync(versionComponentPath)) {
    let content = fs.readFileSync(versionComponentPath, "utf-8");
    content = content.replace(/(const VERSION = ")[^"]+(";)/, `$1${rawVersion}$2`);
    fs.writeFileSync(versionComponentPath, content, "utf-8");
    console.log(`✓ Updated src/components/Version.tsx to ${rawVersion}`);
  }

  // 4. Update src/components/__tests__/Version.test.tsx
  const versionTestPath = path.join(rootDir, "src", "components", "__tests__", "Version.test.tsx");
  if (fs.existsSync(versionTestPath)) {
    let testContent = fs.readFileSync(versionTestPath, "utf-8");
    testContent = testContent.replace(/(const VERSION = ")[^"]+(";)/, `$1${rawVersion}$2`);
    fs.writeFileSync(versionTestPath, testContent, "utf-8");
    console.log(`✓ Updated src/components/__tests__/Version.test.tsx to ${rawVersion}`);
  }

  console.log(`\nVersion successfully bumped to v${rawVersion}!`);
}

bumpVersion();

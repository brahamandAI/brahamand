# Safe deployment & how malware gets into node_modules

## How things like xmrig get in

1. **Lifecycle scripts**  
   Packages can declare `postinstall`, `preinstall`, `prepare`, etc. in their `package.json`. When you run `npm install`, npm executes these scripts. A malicious or compromised package can use them to:
   - Download and run binaries (e.g. xmrig)
   - Exfiltrate env vars or secrets
   - Modify files on disk

2. **Compromised or malicious packages**  
   - Typosquatting (e.g. `crossenv` instead of `cross-env`)
   - Maintainer account takeover
   - Deliberately malicious new packages

3. **Transitive dependencies**  
   You don’t have to install the bad package directly. It can be a dependency of a dependency, and its scripts still run during `npm install`.

So: **malware usually “enters” because a dependency (or sub-dependency) has a script that runs at install time and pulls or runs the malware.**

## What we do to stay safe

- **`ignore-scripts=true` in `.npmrc`**  
  Prevents all lifecycle scripts from running during `npm install`. That stops the most common way install-time malware runs (e.g. postinstall downloading xmrig).

- **Use a lockfile**  
  Commit `package-lock.json` and deploy with `npm ci` so you get exact, auditable dependency versions.

- **Audit dependencies**  
  Run `npm audit` (and fix or accept risks) and occasionally review `npm audit fix` or Snyk/Dependabot.

- **After install with ignore-scripts**  
  Some packages need a one-off step after install (e.g. Prisma). Run those explicitly and only the ones you trust, e.g.:
  - `npx prisma generate`
  - Any other “allowed” scripts you document here.

## Deployment checklist

1. `.npmrc` has `ignore-scripts=true` (already set).
2. Install with `npm ci` (uses lockfile, no script execution).
3. Run only allowed post-install steps (e.g. `npx prisma generate`).
4. Run the app (e.g. `node start.js` or your PM2 config).

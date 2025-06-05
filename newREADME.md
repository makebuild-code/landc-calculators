# LandC Calculators Repository

This repository contains the custom scripts and logic used across LandC’s websites and calculators. It follows a structured development process to ensure clean releases, safe testing environments, and consistent deployment.

## 🧱 Project Overview

This codebase powers custom JavaScript features for LandC’s websites, including calculator logic and Webflow enhancements. It is currently served via [jsDelivr](https://www.jsdelivr.com/) and is loaded on Webflow-hosted environments using a dynamic loader script.

## 🚀 Branch Strategy

We use a branching strategy to ensure clean development, testing, and production workflows:

| Branch        | Purpose                                  | Environment        |
| ------------- | ---------------------------------------- | ------------------ |
| `master`      | Live production code                     | `www.landc.co.uk`  |
| `testing`     | Final pre-release branch (client review) | `test.landc.co.uk` |
| `development` | Integration branch for new work          | `dev.landc.co.uk`  |
| `feature/*`   | Individual feature branches              | `localhost:3000`   |
| `bugfix/*`    | Individual bug fixes branches            | `localhost:3000`   |

## 🛠 Contributing Guide

Please follow this process when contributing code:

### 🔀 1. Create a Feature or Fix Branch

Start by branching off from `development`:

```Bash
git checkout development
git pull origin development
git checkout -b feature/your-feature-name
```

Work locally (served via `localhost`), committing changes in logical chunks:

```Bash
git add .
git commit -m "Short description of the change"
```

Push your feature branch to remote:

```Bash
git push origin feature/your-feature-name
```

### ✅ 2. Merge Into Development

Once your feature is complete and tested locally:

- Open a Pull Request (PR) into `development`
- After review and testing on `dev.landc.co.uk`, it will be merged

### 🧪 3. Merge Development into Testing

When the `development` branch is stable and ready for client-facing testing:

```Bash
git checkout testing
git pull origin testing
git merge development
git push origin testing
```

This will update the testing environment (manual deploy or CDN URL as required).

### 🚢 4. Final Release to Production (Merge into Master)

Once the client has approved:

```Bash
git checkout master
git pull origin master
git merge testing
git push origin master
```

Tag a new release for production deployment:

```Bash
git tag v1.2.0
git push origin v1.2.0
```

In order to serve the latest release to `www.landc.co.uk`, update the version called in the Webflow site settings.

## 📦 Serving Environments

| Environment       | Branch        | CDN Path / Source                                                                        |
| ----------------- | ------------- | ---------------------------------------------------------------------------------------- |
| Local Development | Any branch    | `http://localhost:3000/index.js`                                                         |
| Development       | `development` | `https://cdn.jsdelivr.net/gh/makebuild-code/landc-calculators@development/dist/index.js` |
| Testing           | `testing`     | `https://cdn.jsdelivr.net/gh/makebuild-code/landc-calculators@testing/dist/index.js`     |
| Production        | `master`      | `https://cdn.jsdelivr.net/gh/makebuild-code/landc-calculators@vX.Y.Z/dist/index.js`      |

---

## 🔁 Cache Busting & CDN Notes

jsDelivr caches assets aggressively. For `development` or `testing` environments:

- Use query strings to force fresh fetches:
  `index.js?t=20240605`

- Or use commit SHAs for precise control:
  `https://cdn.jsdelivr.net/gh/makebuild-code/landc-calculators@<commit-sha>/dist/index.js`

- You can manually purge the CDN (if needed):
  `curl -X GET "https://purge.jsdelivr.net/gh/makebuild-code/landc-calculators@development/dist/index.js"`

---

## 📄 License

This project is proprietary and maintained by the LandC development team. Not for public use.

# LandC Calculators Repository

This repository contains the custom scripts and logic used across LandC’s websites and calculators. It follows a structured development process to ensure clean releases, safe testing environments, and consistent deployment.

---

## 🧱 Project Overview

This codebase powers custom JavaScript features for LandC’s websites, including calculator logic and Webflow enhancements. It is currently served via [jsDelivr](https://www.jsdelivr.com/) and is loaded on Webflow-hosted environments using a dynamic loader script.

---

## 🚀 Branch Strategy

We use a branching strategy to ensure clean development, testing, and production workflows:

| Branch        | Purpose                                  | Environment             |
| ------------- | ---------------------------------------- | ----------------------- |
| `master`      | Live production code                     | `www.landc.co.uk`       |
| `testing`     | Final pre-release branch (client review) | _Shared privately_      |
| `development` | Integration branch for new work          | `dev.landc.co.uk`       |
| `feature/*`   | Individual developer branches            | Localhost (`localhost`) |

---

## 🛠 Contributing Guide

Please follow this process when contributing code:

### 🔀 1. Create a Feature or Fix Branch

Start by branching off from `development`:

```bash
git checkout development
git pull origin development
git checkout -b feature/your-feature-name
```

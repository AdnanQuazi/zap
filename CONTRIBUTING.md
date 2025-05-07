# Contributing to Zap

Thank you for considering contributing to Zap! 🚀  
Your time and effort are appreciated — they help make Zap better for everyone.

## ✨ What You Can Contribute

We welcome all kinds of contributions, including but not limited to:

-   Feature improvements and bug fixes
-   Improving documentation and examples
-   Enhancing slash command UX and bot behavior
-   Extending context and memory capabilities
-   Writing or improving test cases
-   Optimizing performance or refactoring code

Small contributions are just as valuable as large ones!

## 🌱 Getting Started

> **Follow installation steps in [README.md](https://claude.ai/chat/README.md)** to set up Zap locally.

## 📜 Manifest Management

Zap uses a templated Slack app manifest system to ensure a consistent structure across different environments (local development, staging, and production).

### Manifest Files

> **`manifest.template.json`**:  
> This is the **template** you need to maintain and commit. It contains placeholders like `${BASE_URL}` that will be replaced with environment-specific values (e.g., your ngrok domain).

> **`manifest.json`**:  
> This is the **auto-generated version** created when you run the `generate-manifest` command. It contains actual URLs, like your ngrok domain, and should never be edited or committed.

### When to Update `manifest.template.json`

You need to update `manifest.template.json` when you:

-   Add, rename, or remove slash commands
-   Change OAuth scopes
-   Modify event subscriptions (e.g., message events)
-   Change redirect or request URLs
-   Make any structural changes via the [Slack API Dashboard](https://api.slack.com/apps)

In short, if the structure of your app changes, update the template.

### How to Generate `manifest.json` for Local Setup

1.  Start your ngrok and copy your HTTPS URL (e.g., `https://abc123.ngrok-free.app`).
    
2.  Set your `BASE_URL` environment variable to your ngrok URL:
    
    **Windows (PowerShell):**
    
    ```powershell
    $env:BASE_URL="https://abc123.ngrok-free.app"
    
    ```
    
    **macOS/Linux (Bash):**
    
    ```bash
    export BASE_URL=https://abc123.ngrok-free.app
    
    ```
    
3.  Generate the development manifest:
    
    ```bash
    npm run generate-manifest
    
    ```
    

This creates `apps/server/slack/manifest.json` with your ngrok URL.

This will generate `apps/server/slack/manifest.json`, replacing `${BASE_URL}` with your actual ngrok URL. This file is used to **create or update** your Slack app.

### Syncing Changes from Slack Dashboard

1.  Go to your app on [Slack API Dashboard](https://api.slack.com/apps).
2.  Navigate to: `App Settings → App Manifest → View Manifest`
3.  Copy the updated manifest JSON.
4.  Open `manifest.template.json` and paste the new JSON into it.
5.  **Replace all hardcoded URLs** (e.g., ngrok links) with `${BASE_URL}`.

Now your `manifest.template.json` is in sync with Slack. Future developers can regenerate the manifest with just one command.

### 🛑 Important Notes

-   **Do not commit `manifest.json`** — it's auto-generated and specific to your local setup.
-   **Always commit changes to `manifest.template.json`.**
-   **Ensure URLs in `manifest.template.json` use `${BASE_URL}`**, not actual domain links.

## 🔀 Pull Request Guidelines

-   Branch off `main` and open PRs against `main`
-   Keep commits clean and descriptive
-   Include screenshots or logs if UI or Slack behavior changes
-   Update `manifest.template.json` if your PR touches the Slack app logic
-   Pass all CI checks and test locally before requesting review

Example commit messages:

```bash
feat(memory): add per-user memory store in Supabase
fix(commands): improve error handling for /zap-ask
docs(readme): add usage examples

```

## 🚢 Deployment Policy

Only maintainers may deploy updates to the **production** Slack app.  
Contributors should:

-   Use their **own Slack workspace** for testing
-   Never push changes to `manifest.json` or production URLs
-   Submit PRs for review and merge

## 📌 Feature Suggestions & Roadmap Alignment

If you'd like to suggest a feature:

1.  Check our [README.md](https://claude.ai/chat/README.md) for ongoing/planned work
2.  Open an Issue titled `[Feature Request] your title`
3.  Include:
    -   What problem it solves
    -   How it should work (if possible)
    -   Why it fits Zap's goals

We encourage small, scoped feature proposals to ensure fast feedback and iteration.

## 🛡️ Security Reporting

If you discover a security vulnerability:

-   **Do not** open a GitHub issue
-   Instead, email: `askzap.ai@gmail.com`
-   We'll respond quickly and confidentially

## 🔍 Code Review Process

-   PRs are reviewed within 1–3 working days
-   You may receive change requests — this is normal
-   A PR is eligible for merge once:
    -   All feedback is addressed
    -   Tests pass
    -   It aligns with the roadmap

## 🌍 Community

Join discussions in GitHub Issues and PRs.  
We encourage respectful communication and inclusion.

Everyone is welcome to contribute, regardless of background or experience. 💙




## 📬 Contact

If you have any questions about contributing or run into trouble, please reach out via one of the following:

- **GitHub Issues**: Open an issue in this repo  
- **Email**: askzap.ai@gmail.com
----------

Thanks again for helping make Zap smarter, safer, and more useful! ⚡

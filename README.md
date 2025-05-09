![GitHub contributors](https://img.shields.io/github/contributors/AdnanQuazi/zap)
[![GitHub stars](https://img.shields.io/github/stars/AdnanQuazi/zap)](https://github.com/AdnanQuazi/zap/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/AdnanQuazi/zap)](https://github.com/AdnanQuazi/zap/issues)
[![GitHub license](https://img.shields.io/github/license/AdnanQuazi/zap)](https://github.com/AdnanQuazi/zap/blob/main/LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/AdnanQuazi/zap/graphs/commit-activity)


<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="https://zwddqklqugyvwnnfpqpk.supabase.co/storage/v1/object/public/assets/slack/zap-logo.jpg" alt="Logo" width="80" height="80">
  </a>
  <h3 align="center">Zap</h3>
  <p align="center">
    Your Knowledge, Your Control, Our Intelligence 
    <br />
    <br />
    <a href="https://github.com/AdnanQuazi/zap/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/AdnanQuazi/zap/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>
<details>
  <summary><strong>📑 Table of Contents</strong></summary>
  <ul>
    <li>
      <a href="#overview">🚀 Overview</a>
      <ul>
        <li><a href="#key-highlights">Key Highlights</a></li>
      </ul>
    </li>
        <li><a href="#built-with">🏗️ Built With</a></li>
    <li>
      <a href="#installation">🏁 Installation</a>
      <ul>
        <li><a href="#user-installation-usage">User Installation &amp; Usage</a></li>
        <li>
          <a href="#developer-setup">Developer Setup</a>
          <ul>
            <li><a href="#prerequisites">Prerequisites</a></li>
            <li><a href="#fork-clone">1. Fork &amp; Clone the Repository</a></li>
            <li><a href="#configure-docker-desktop">2. Configure Docker Desktop</a></li>
            <li><a href="#setup-supabase-cli">3. Setup Supabase CLI</a></li>
            <li><a href="#setup-redis-account">4. Setup Redis Account</a></li>
            <li><a href="#generate-gemini-api-key">5. Generate Gemini API Key</a></li>
            <li><a href="#setup-ngrok-local-testing">6. Set Up ngrok for Local Testing</a></li>
            <li><a href="#generate-manifest-slack">7. Generate Manifest for Slack App Creation</a></li>
            <li><a href="#setup-slack-app">8. Set Up Slack App</a></li>
            <li><a href="#populate-env-variables">9. Populate Environment Variables</a></li>
            <li><a href="#install-dependencies-dev-servers">10. Install Dependencies &amp; Start Development Servers</a></li>
          </ul>
        </li>
      </ul>
    </li>
    <li>
      <a href="#usage-workflow">🛠️ Usage &amp; Workflow</a>
      <ul>
        <li><a href="#admin-setup">Admin Setup</a></li>
        <li><a href="#channel-invitation">Channel Invitation</a></li>
        <li><a href="#user-privacy-settings">User Privacy Settings</a></li>
        <li><a href="#asking-questions">Asking Questions</a></li>
        <li><a href="#document-context">Document Context</a></li>
        <li><a href="#privacy-controls">Privacy Controls</a></li>
        <li><a href="#command-reference">Command Reference</a></li>
      </ul>
    </li>
    <li>
      <a href="#testing">🧪 Testing</a>
      <ul>
        <li><a href="#planned-testing-improvements">Planned Testing Improvements</a></li>
      </ul>
    </li>
    <li><a href="#deployment">🚢 Deployment</a></li>
    <li><a href="#contributing">🤝 Contributing</a></li>
    <li><a href="#license">📄 License</a></li>
    <li><a href="#acknowledgements">❤️ Acknowledgements</a></li>
  </ul>
</details>



<h2 id="overview">🚀 Overview</h2>
<p align="center"> <img src="https://zwddqklqugyvwnnfpqpk.supabase.co/storage/v1/object/public/assets/slack/zap-banner-white.jpg" alt="Zap Logo" /> </p>

**Zap** is a privacy-first communication intelligence assistant, built to help teams access knowledge instantly. By understanding channel conversations and uploaded documents (PDF, TXT, DOCX), Zap delivers fast, contextual answers without compromising data control. Designed for modern teams, Zap turns everyday communication into a powerful source of insights — making collaboration sharper, faster, and more secure.

Built natively for Slack, Zap integrates seamlessly into your workspace without disrupting your existing workflows. It listens, learns, and responds within your channels — empowering your team to find the answers they need without ever leaving the conversation. With Zap, your knowledge stays protected, your communication stays productive, and your team stays ahead.**

### Key Highlights

-   **Smart Contextual Understanding**: Answers questions by analyzing real-time channel conversations and document content for maximum relevance.
-   **Broad Document Compatibility**: Supports PDF, TXT, and DOCX formats, making it easy to extract insights from shared files.
-   **Privacy-Centric Design**: Empowers users with full control over their data, including options to opt-out/in and purge their stored conversation.
-   **Seamless Slack Integration**: Quick setup and intuitive usage within your existing Slack workspace.
    
    
<h2 id="built-with">🏗️ Built With</h2>

[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white&style=for-the-badge)](https://nodejs.org/) [![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white&style=for-the-badge)](https://nextjs.org/) [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white&style=for-the-badge)](https://supabase.com/) [![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white&style=for-the-badge)](https://python.org/) [![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white&style=for-the-badge)](https://redis.io/) [![Modal](https://img.shields.io/badge/Modal-000000?logo=modal&logoColor=white&style=for-the-badge)](https://modal.com/)



<h2 id="installation">🏁 Installation</h2>

<h3 id="user-installation-usage">User Installation & Usage</h3>

These steps are for workspace administrators who want to add Zap to their Slack workspace:

1.  **Add to Slack**: Click the "Add to Slack" button and authorize Zap with the required scopes.
2.  **Enable Smart Context**: From your Slack Home under "App Integrations," enable the **Smart Context** feature for Zap.
3.  **Invite Bot to Channels**: In each channel where you want to use Zap, invite `@Zap` by typing `/invite @Zap`.
4.  **Start Using**: In any channel where Zap is present, ask questions with:

```
/zap-ask [your question]
```

----------

<h3 id="developer-setup">Developer Setup</h3>
These instructions guide developers through cloning the repo and running Zap locally for development or contribution.

### Prerequisites

-   [Docker Desktop](https://www.docker.com/products/docker-desktop): Required to run Supabase locally.
-   [Gemini API Key](https://aistudio.google.com/app/apikey): LLM API for Smart Context (preferred).
-   [ngrok](https://ngrok.com/): For local event subscription testing.
-   [Node.js](https://nodejs.org/): v20+ (latest stable version).
-  [pnpm](https://pnpm.io/): v8+
-   [Python](https://www.python.org/): v3.12+ (latest stable version).
-   [Redis](https://redis.io/): Latest version.
-   Slack Workspace with **admin privileges**.
-   [Supabase CLI](https://supabase.com/docs/guides/cli): Latest version for migrations.

We recommend using the latest stable versions for full compatibility and access to all features.

<h3 id="fork-clone">1. Fork & Clone the Repository</h3>


```bash
# Clone your fork
git clone https://github.com/your-username/zap.git
cd zap

# Add the upstream repository
git remote add upstream https://github.com/AdnanQuazi/zap.git
```

<h3 id="configure-docker-desktop">2. Configure Docker Desktop</h3>

1.  Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2.  After installation, open **Docker settings** → **General** tab → **Enable "Expose daemon on tcp://localhost:2375 without TLS"**
3.  Apply & Restart Docker Desktop

<h3 id="setup-supabase-cli">3. Setup Supabase CLI</h3>

#### Install Supabase CLI

**Windows (Scoop):**


```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**macOS/Linux (Homebrew):**


```bash
brew install supabase/tap/supabase
```

#### Start Supabase with the config provided


```bash
# Start Supabase
supabase start
```

After starting Supabase, note down the generated credentials from the terminal output:

```
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_JWT_SECRET=your-local-jwt-secret
```

> **Note**:
> 
> -   If migrations aren't applied, run: `supabase db reset`
> -   To generate a migration file after making database changes, run: `supabase db diff -f <file-name>`
> -   Always execute Supabase commands from the root directory

For detailed instructions, see the [Supabase CLI Getting Started Guide](https://supabase.com/docs/guides/local-development/cli/getting-started)


<h3 id="setup-redis-account">4. Setup Redis Account</h3>

1.  Create a [Redis Cloud](https://redis.com/try-free/) account and database instance
2.  Note your Redis credentials:

```
REDIS_HOST=redis-12345.c8.us-east-1-2.ec2.cloud.redislabs.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

<h3 id="generate-gemini-api-key">5. Generate Gemini API Key</h3>

1.  Visit the [Google AI Studio](https://makersuite.google.com/app/apikey)
2.  Create or sign in with your Google account
3.  Create a new API key for use in your environment variables

<h3 id="setup-ngrok-local-testing">6. Set Up ngrok for Local Testing</h3>

```bash
# Download and install ngrok from https://ngrok.com/download
# Start ngrok to expose your local server
ngrok http 3001
```

Copy the HTTPS URL provided by ngrok (e.g., `https://abc123.ngrok.io`) for the next step.

<h3 id="generate-manifest-slack">7. Generate Manifest for Slack App Creation</h3>

Set your `BASE_URL` environment variable to your ngrok URL:

**Windows (PowerShell):**

```powershell
# Base URL for your local development tunnel (e.g. Ngrok)
$env:BASE_URL = "https://abc123.ngrok-free.app"

# Slack App’s display name (used in the manifest)
$env:APP_NAME = "Zap"

# Slash-Command prefix (e.g. "zap" → command “/{zap}-ask)
$env:COMMAND_PREFIX = "zap"
```

**macOS/Linux (Bash):**

```bash
export BASE_URL="https://abc123.ngrok-free.app"
export APP_NAME="Zap"
export COMMAND_PREFIX="zap"
```

Generate the development manifest:

```bash
pnpm run generate-manifest
```

This creates `server/slack/manifest.json` with your ngrok URL.

<h3 id="setup-slack-app">8. Set Up Slack App</h3>

1.  Visit [Slack API Apps](https://api.slack.com/apps) and click **Create New App** → **From an app manifest**
2.  Select your workspace, then paste contents from `apps/server/slack/manifest.json`
3.  After creation, collect credentials from **Basic Information**:
    -   Client ID, Client Secret, Signing Secret
4.  Under **OAuth & Permissions**, install the app and copy your **Bot User OAuth Token** (`xoxb-...`)
5.  If needed, generate an **App Token** (`xapp-...`) under **Basic Information → App-Level Tokens** (optional)
6. For initial setup, manually verify the Event Subscriptions URL from **App Manifest** in the side menu.

## 📢 Important Manifest Management

> ⚡ **Note**:  
> Always edit `apps/server/slack/manifest.template.json` when modifying app structure, never the generated `manifest.json`.
> 
> **Why this matters:**
> 
> -   OAuth scope changes
> -   Adding/removing slash commands
> -   Modifying event subscriptions
> -   Updating app features
> 
> When committing changes, ensure your template is up-to-date first. The generated `manifest.json` contains environment-specific values (like ngrok URLs) and should not be committed to version control.
> 
> See `CONTRIBUTING.md` for detailed manifest management guidelines.

<h3 id="populate-env-variables">9. Populate Environment Variables</h3>

Create a `.env` file at `apps/server/.env` with these values:

```
# Slack App credentials
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
SLACK_CLIENT_ID=1234567890.1234567890
SLACK_REDIRECT_URI=https://yourserverdomain.com/slack/oauth/callback
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_APP_TOKEN=xapp-your-slack-app-token
SLACK_REDIRECT_TO_CLIENT_URL=https://yourclientdomain.com/slack/install

# Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Redis configuration
REDIS_HOST=redis-12345.c8.us-east-1-2.ec2.cloud.redislabs.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Embedding Service
EMBEDDING_SERVICE_URL=http://localhost:8000
EMBEDDING_API_KEY=your-embedding-api-key
```
Create a `.env` file at `apps/client/.env` with these values:
```
NEXT_PUBLIC_INSTALLATION_URL=https://yourserverdomain.com/slack/install
```

Create a `.env` file at `services/embedding-service/.env` with these values:
```
#Keep it true during development to bypass API AUTH
DISABLE_API_KEY_AUTH=true
```

<h3 id="install-dependencies-dev-servers">10. Install Dependencies and Start Development Servers</h3

```bash
# Install all dependencies
pnpm run bootstrap

# Start all development servers
pnpm run dev
```
>**Note**: If you don't have `pnpm` installed globally, you can install it using: 
> ```bash
> npm install -g pnpm 
> ```



<h2 id="usage-workflow">🛠️ Usage & Workflow</h2>


### Admin Setup

-   Workspace administrator enables **Smart Context** from the Zap Home tab
-   This activates Zap's ability to analyze conversations and provide contextual responses

### Channel Invitation

-   Add Zap to relevant channels using `/invite @Zap`
-   Zap will only monitor conversations in channels where it has been explicitly invited

### User Privacy Settings

-   **By default**, all users are opted in when Smart Context is enabled by the admin
-   Users can opt out at any time if they wish to exclude their data from being stored
-   Privacy controls are available to all users at any time (see below)

### Asking Questions

-   Use `/zap-ask [question]` in any channel where Zap is present
-   Zap will analyze available context to provide the most relevant answer

### Document Context

-   Zap analyzes both channel conversations and uploaded documents (PDF, TXT, DOCX)
-   Information from these sources helps Zap provide more accurate and helpful responses

### Privacy Controls

- **Exclude specific messages**: React with 🚫 to any message you don’t want Zap to store  
- **Opt out completely**: Use `/zap-optout` anytime to disable data storage for your account  
- **Delete your data**: Execute `/zap-purge` to permanently delete all your stored data  
- **Delete everyone’s data**: Admins can execute `/zap-purge-all` to permanently delete all stored data across the workspace  


### Command Reference

| Command               | Description                                           | User Type  |
|-----------------------|-------------------------------------------------------|------------|
| `/zap-ask [question]` | Ask Zap a question using available context            | All users  |
| `/zap-optout`         | Disable Zap’s data storage for your account           | All users  |
| `/zap-optin`          | Re-enable Zap’s data storage for your account         | All users  |
| `/zap-purge`          | Delete all your stored data                           | All users  |
| `/zap-info`           | View Zap’s status information                         | All users  |
| `/zap-purge-all`      | Delete all user data                                  | Admins     |
| `/zap-feedback`       | Submit feedback                                       | All users  |


<h2 id="testing">🧪 Testing</h2>

Currently, Zap is tested manually by our development team. We verify functionality across different workspace configurations to ensure reliability and performance.

If you encounter any issues while using Zap, please report them using the `/zap-feedback` command or by opening an issue in this repository.

### Planned Testing Improvements

-   Implementation of automated unit tests
-   Integration testing for command functionality
-   Performance testing for large workspaces


<h2 id="deployment">🚢 Deployment</h2>

For deployment instructions, please refer to the [Installation](#installation) section above. The repository is currently set up for development purposes only.

Production deployment is managed by the project maintainers. For questions about deploying Zap in your organization, please open an issue or contact the project team.

<h2 id="contributing">🤝 Contributing</h2>

We welcome contributions to improve Zap! Here's how you can help:

1.  Fork the repository
2.  Clone your fork (`git clone https://github.com/yourusername/zap.git`)
3.  Add the upstream repository (`git remote add upstream https://github.com/original-org/zap.git`)
4.  Create a feature branch (`git checkout -b feature/amazing-feature`)
5.  Commit your changes (`git commit -m 'Add some amazing feature'`)
6.  Pull latest changes from upstream (`git pull upstream main`) and resolve any conflicts
7.  Push to your fork (`git push origin feature/amazing-feature`)
8.  Open a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for more details.

<h2 id="license">📄 License</h2>

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<h2 id="acknowledgements">❤️ Acknowledgements </h2>

-   Thanks to all contributors who have helped shape Zap
-   Special thanks to the open-source libraries that made this project possible
-   Inspired by the need for better contextual information in team communications

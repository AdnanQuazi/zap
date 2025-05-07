const FILE_PROCESSING_CONCURRENCY = 5;
const DEFAULT_CHUNK_SIZE = 1000;
const ALLOWED_FILE_TYPES = ["pdf", "text", "binary", "docx", "txt"];
const MAX_FILES_TO_PROCESS = 2;
const DEFAULT_LIMIT = 30;
const DEFAULT_WINDOW_SIZE = 5;
const FIFTEEN_DAYS_IN_SECONDS = 15 * 24 * 60 * 60;
const CURRENT_BOT_VERSION = "1.0.0";
const COMMAND_LIST = [
  {
    command: "/zap-ask",
    shortDescription:
      "Ask Zap a question based on past conversations and documents",
    usageHint: "/zap-ask [question]",
  },
  {
    command: "/zap-feedback",
    shortDescription: "Submit feedback about Zap",
    usageHint: "/zap-feedback [feedback]",
  },
  {
    command: "/zap-optin",
    shortDescription: "Allow Zap to store your conversations and documents",
    usageHint: "/zap-optin",
  },
  {
    command: "/zap-optout",
    shortDescription: "Stop Zap from storing your conversations and documents",
    usageHint: "/zap-optout",
  },
  {
    command: "/zap-info",
    shortDescription: "View bot installation details",
    usageHint: "/zap-info",
  },
  {
    command: "/zap-purge",
    shortDescription: "Delete all your personal data stored by Zap",
    usageHint: "/zap-purge",
  },
  {
    command: "/zap-purge-all",
    shortDescription: "Admin only: Delete all user data stored by Zap",
    usageHint: "/zap-purge-all",
  },
  {
    command: "/zap-help",
    shortDescription:
      "Display all available Zap commands with usage instructions",
    usageHint: "/zap-help",
  },
];
const PROCESSING_MESSAGES = [
  "Thinking... 🤔",
  "Crunching data... ⚙️",
  "Consulting the AI oracle... 🔮",
  "Analyzing the matrix... 💻",
  "Summoning digital spirits... 👻",
  "Engaging hyperdrive... 🚀",
  "Decoding the universe... 🌌",
  "Brewing digital coffee... ☕",
  "Assembling the bits... 🧩",
  "Polishing the circuits... ✨",
  "Consulting the mainframe... 🤖",
  "Warping reality... 🌀",
  "Processing... ⏳",
];
const WELCOME_MESSAGE = {
  text: "Zap has entered! ⚡",
  blocks: [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Zap has entered! ⚡",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Zap* is your AI‑powered helper in this workspace. Ask questions about this channel’s history, attached files, or anything else—I’ve got you covered!",
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: "*Usage Commands*",
        },
        {
          type: "mrkdwn",
          text: "*Examples*",
        },
        {
          type: "mrkdwn",
          text: "`/ask [your question]`\nAsk anything using this channel’s history and attached files.",
        },
        {
          type: "mrkdwn",
          text: "`/help`\nShow the list of commands.",
        },
        {
          type: "mrkdwn",
          text: "`/feedback`\nSend feedback.",
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "📄 Privacy Policy",
            emoji: true,
          },
          url: "https://your-docs.example.com/zap",
          action_id: "view_docs",
        },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "🔒 *Privacy & Transparency:* Zap uses this channel’s conversation history and attached files to generate AI‑powered answers. No data leaves your workspace without your explicit permission.",
        },
      ],
    },
  ],
};
const SLACK_BOT_SCOPES = [
  "app_mentions:read",
  "channels:history",
  "channels:read",
  "chat:write",
  "commands",
  "files:read",
  "groups:history",
  "groups:read",
  "users:read",
];
const SLACK_USER_SCOPES = ["channels:read", "groups:read"];
const ERROR_MESSAGES = {
  PROCESSING_FAILURE: "Response generation failed",
  SMART_CONTEXT_DISABLED:
    "⚠️ Please ask an admin to enable *Smart Context* to use this command.",
  AI_FAILURE: "The AI service is currently unavailable",
  GENERIC_ERROR: "Something went wrong. Our team has been notified.",
};
const FUNCTION_LIST = {
  analyzeDocuments: {
    description:
      "Analyzes the provided documents within an optional time range.",
    parameters: {
      fileNames: "array", // Required: array of file names
      startTs: "string (optional)", // Optional: Unix timestamp in float
      endTs: "string (optional)", // Optional: Unix timestamp in float
    },
  },
  summarizeConversation: {
    description:
      "Summarizes a conversation within the given time range, with an option to include related documents.",
    parameters: {
      includeDocs: "boolean (default: false)", // Optional: whether to include related docs
      startTs: "string (optional)", // Optional: Unix timestamp in float
      endTs: "string (optional)", // Optional: Unix timestamp in float
    },
  },
  hybridSearch: {
    description:
      "Performs a broad search using the query across chats and documents within the specified time range.",
    parameters: {
      broadedQuery: "string", // Required: search query
      startTs: "string (optional)", // Optional: Unix timestamp in float
      endTs: "string (optional)", // Optional: Unix timestamp in float
    },
  },
};
const OPT_IN_MESSAGE = {
  text: "🔔 You’re now opted in to Smart Context",
  blocks: [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🔔 Smart Context Enabled",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Zap will now access your workspace data (including *messages*, *threads*, and *files*) to enhance its responses.",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "By continuing, you agree to our <https://your-privacy-policy-link.com|Privacy Policy>.\nYou can opt out at any time using the `/opt-out` command.",
      },
    },
  ],
};
const OPT_OUT_MESSAGE = {
  text: "🔒 You have successfully opted out of Smart Context",
  blocks: [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🔒 You’ve Opted Out",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Zap will no longer access your data in this workspace (including *messages*, *threads*, and *files*). Additionally, *all your previous history has been deleted*.",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "If you change your mind, you can re-enable Smart Context anytime with `/opt-in`.",
      },
    },
  ],
};
function INFO_BLOCKS({
  data,
  installedAt,
  updatedAt,
  showUpdateButton = true,
}) {
  const blocks = [
    {
      type: "section",
      text: { type: "mrkdwn", text: "*Installation Information*" },
    },
    { type: "divider" },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Installed By:*
<@${data.authed_user_id}>`,
        },
        {
          type: "mrkdwn",
          text: `*Installed At:*
${installedAt}`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Last Updated At:*
${updatedAt}`,
        },
        {
          type: "mrkdwn",
          text: `*Smart Context Status:*
${data.enable_smart_context ? "🔓 *Enabled*" : "🔐 *Disabled*"}`,
        },
      ],
    },
  ];

  // Prompt update if newer version exists
  if (showUpdateButton) {
    blocks.push(
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*📢 A new version of the app is available!*",
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: `🚀 Update App - v${CURRENT_BOT_VERSION}`,
              emoji: true,
            },
            style: "primary",
            url: "https://your-docs.example.com/zap",
            action_id: "update_app",
          },
        ],
      }
    );
  }

  return blocks;
}

function HELP_BLOCKS(commands = COMMAND_LIST) { 
  // Initialize blocks array with header and intro section
  const blocks = [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": `🧩 Zap Commands`,
        "emoji": true
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `Here are all the commands you can use with Zap:`
      }
    },
    {
      "type": "divider"
    }
  ];

  // Loop through each command and add a section block
  commands.forEach(cmd => {
    blocks.push({
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*\`${cmd.command}${cmd.usageHint.includes('[') ? ' ' + cmd.usageHint.split(' ').slice(1).join(' ') : ''}\`*\n${cmd.shortDescription}`
      }
    });
  });

  // Add footer elements
  blocks.push(
    {
      "type": "divider"
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": `✨ Type \`/zap-help\` anytime to see this menu again`
        }
      ]
    }
  );

  return { text : "🧩 Zap Commands" , blocks };
}

module.exports = {
  FILE_PROCESSING_CONCURRENCY,
  DEFAULT_CHUNK_SIZE,
  ALLOWED_FILE_TYPES,
  MAX_FILES_TO_PROCESS,
  DEFAULT_LIMIT,
  DEFAULT_WINDOW_SIZE,
  FIFTEEN_DAYS_IN_SECONDS,
  CURRENT_BOT_VERSION,
  COMMAND_LIST,
  PROCESSING_MESSAGES,
  WELCOME_MESSAGE,
  SLACK_BOT_SCOPES,
  SLACK_USER_SCOPES,
  ERROR_MESSAGES,
  FUNCTION_LIST,
  OPT_IN_MESSAGE,
  OPT_OUT_MESSAGE,
  INFO_BLOCKS,
  HELP_BLOCKS
};

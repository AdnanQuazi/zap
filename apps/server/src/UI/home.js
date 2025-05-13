function buildHome(enabled, options = {}) {
  const blocks = [
    // Banner Image
    {
      type: "image",
      image_url:
        "https://zwddqklqugyvwnnfpqpk.supabase.co/storage/v1/object/public/assets/slack/zap-banner-white.jpg",
      alt_text: "Zap Banner",
    },

    // Header & Tagline
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Zap ⚡️",
        emoji: true,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "*Your AI‑powered Slack Sidekick*",
        },
      ],
    },

    // Divider + top padding
    { type: "context", elements: [{ type: "mrkdwn", text: "\u200B" }] },
    { type: "divider" },
    { type: "context", elements: [{ type: "mrkdwn", text: "\u200B" }] },

    // Short Description
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "Zap brings AI‑powered answers right into Slack. Leverage channel history, shared files, and threads to get the insights you need—fast and securely.",
      },
    },

    // Divider + padding
    { type: "context", elements: [{ type: "mrkdwn", text: "\u200B" }] },
    { type: "divider" },
    { type: "context", elements: [{ type: "mrkdwn", text: "\u200B" }] },

    // Feature Highlights (two columns)
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text:
            ":mag: *Smart Context*\nStores recent messages (up to 20 days) for deep search and precise answers.",
        },
        { type: "mrkdwn", text: "\u200B" },
        {
          type: "mrkdwn",
          text:
            ":page_facing_up: *File‑Aware Support*\nUnderstands PDFs, DOCXs, and TXTs to answer accurately.",
        },
        { type: "mrkdwn", text: "\u200B" },
        {
          type: "mrkdwn",
          text:
            ":thread: *Thread Intelligence*\nTracks long threads to provide context‑aware summaries.",
        },
      ],
    },

    // Divider + padding
    { type: "context", elements: [{ type: "mrkdwn", text: "\u200B" }] },
    { type: "divider" },
    { type: "context", elements: [{ type: "mrkdwn", text: "\u200B" }] },

    // Smart Context Status
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: enabled
          ? ":white_check_mark: *Smart Context is enabled.*\nZap will use recent messages to improve accuracy."
          : ":lock: *Smart Context is disabled.*\nEnable it to let Zap leverage recent history for better insights.",
      },
    },

    { type: "context", elements: [{ type: "mrkdwn", text: "\u200B" }] },

    // Toggle button
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: enabled
              ? "🔐 Disable Smart Context"
              : "🔓 Enable Smart Context",
            emoji: true,
          },
          style: enabled ? "danger" : "primary",
          action_id: enabled ? "disable_context" : "enable_context",
        },
      ],
    },
  ];

    // Optional error message
    if (options.error) {
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `⚠️ *${options.error}*`,
          },
        ],
      });
    }
  

  // 🚨 Add this block only if Smart Context is disabled
  if (!enabled) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text:
            "🚨 By enabling this you agree to our *Privacy Policy* and *Terms of Service*. You can disable this at any time.",
        },
      ],
    });
  }



  // Continue rest of the layout
  blocks.push(
    { type: "context", elements: [{ type: "mrkdwn", text: "\u200B" }] },
    { type: "divider" },
    { type: "context", elements: [{ type: "mrkdwn", text: "\u200B" }] },

    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text:
            "🔒 *Privacy & Transparency:* Zap uses only this workspace’s conversation history and files to generate answers. Data is stored temporarily and never leaves your workspace without your permission.",
        },
      ],
    },

    // Divider + padding
    { type: "context", elements: [{ type: "mrkdwn", text: "\u200B" }] },
    { type: "divider" },
    { type: "context", elements: [{ type: "mrkdwn", text: "\u200B" }] },

    // Quick‑Access Buttons
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "🌐 Visit Website",
            emoji: true,
          },
          url: process.env.WEBSITE_BASE_URL,
          action_id: "visit_website",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "📄 Privacy Policy",
            emoji: true,
          },
          url: `${process.env.WEBSITE_BASE_URL}/privacy-policy`,
          action_id: "view_privacy_policy",
        },
      ],
    }
  );

  return {
    type: "home",
    callback_id: "home_view",
    blocks,
  };
}

module.exports = buildHome;

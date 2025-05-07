// src/routes/oauth.js
const express = require("express");
const axios = require("axios");
const { storeInstallation } = require("../services/installation-services");
const { SLACK_BOT_SCOPES, SLACK_USER_SCOPES } = require("../constants/config");

const router = express.Router();

// Slack OAuth scopes

// GET /slack/install → redirect user to Slack’s OAuth consent page
router.get("/install", (req, res) => {
  const installUrl = new URL("https://slack.com/oauth/v2/authorize");
  installUrl.searchParams.set("client_id", process.env.SLACK_CLIENT_ID);
  installUrl.searchParams.set("scope", SLACK_BOT_SCOPES.join(","));
  installUrl.searchParams.set("user_scope", SLACK_USER_SCOPES.join(","));
  installUrl.searchParams.set("redirect_uri", process.env.SLACK_REDIRECT_URI);

  res.redirect(installUrl.toString());
});

// GET /slack/oauth/callback → handle Slack’s OAuth redirect
router.get("/oauth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Missing `code` parameter");
  }

  try {
    const { data } = await axios.post(
      "https://slack.com/api/oauth.v2.access",
      null,
      {
        params: {
          client_id: process.env.SLACK_CLIENT_ID,
          client_secret: process.env.SLACK_CLIENT_SECRET,
          code,
          redirect_uri: process.env.SLACK_REDIRECT_URI,
        },
      }
    );

    if (!data.ok) {
      return res.status(400).send(`OAuth failed: ${data.error}`);
    }

    console.log(`✅ Bot installed on ${data.team.name} (ID: ${data.team.id})`);
    await storeInstallation(data);

    // Render success.ejs from your views folder
    res.render("success", {
      title: "Installation Complete",
      message: "Slack Bot Installed Successfully!",
    });
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;

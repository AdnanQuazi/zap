/**
 * Main application entry point
 * Sets up Express server, Slack bot event handlers and commands
 */
require("dotenv").config();

const path = require("path");
const express = require("express");

// Import routers
const oauthRouter = require("./src/routes/oauth");

// Import Slack app configuration
const { expressApp, slackApp } = require("./src/config/slack");

// Import event handlers
const memberJoinedChannelHandler = require("./src/handlers/events/member-joined-channel");
const memberLeftChannelHandler = require("./src/handlers/events/member-left-channel");
const appMentionHandler = require("./src/handlers/events/app-mention");
const appHomeOpenedHandler = require("./src/handlers/events/app-home-opened");
const appUninstalledHandler = require("./src/handlers/events/app-uninstalled");

// Import command handlers
const { AskCommandHandler } = require("./src/handlers/commands/zap-ask");
const feedbackZapHandler = require("./src/handlers/commands/zap-feedback");
const infoHandler = require("./src/handlers/commands/zap-info");
const optInHandler = require("./src/handlers/commands/zap-optin");
const optOutHandler = require("./src/handlers/commands/zap-optout");
const purgeHandler = require("./src/handlers/commands/zap-purge");
const purgeAllHandler = require("./src/handlers/commands/zap-purge-all");
const zapHelpHandler = require("./src/handlers/commands/zap-help");

// Import action handlers
const handleContextToggleAction = require("./src/handlers/actions/enable-disable-context");

// Import middlewares
const scopedSupabaseMiddleware = require("./src/middlewares/scoped-supabse-middleware");
const botInChannelMiddleware = require("./src/middlewares/bot-in-channel-middleware");

const COMMAND_PREFIX = process.env.COMMAND_PREFIX || "zap";

/**
 * Express middleware configuration
 */
expressApp.use(express.urlencoded({ extended: true }));
expressApp.use(express.json());

// Mount OAuth routes
expressApp.use("/slack", oauthRouter);

/**
 * Slack event handlers registration
 */
// Bot joined a channel
slackApp.event("member_joined_channel", memberJoinedChannelHandler);

// Bot mentioned in a channel
slackApp.event("app_mention", appMentionHandler);

// Home tab opened
slackApp.event("app_home_opened", scopedSupabaseMiddleware , appHomeOpenedHandler);

// App uninstalled from workspace
slackApp.event("app_uninstalled", appUninstalledHandler);

slackApp.event("member_left_channel", memberLeftChannelHandler); // Bot joined a channel

// Bot left a channel

/**
 * Slash command handlers
 */
// /ask command handler with supabase middleware
slackApp.command(`/${COMMAND_PREFIX}-ask`, botInChannelMiddleware ,scopedSupabaseMiddleware, AskCommandHandler);
slackApp.command(`/${COMMAND_PREFIX}-feedback`, feedbackZapHandler);
slackApp.command(`/${COMMAND_PREFIX}-info`, infoHandler);
slackApp.command(`/${COMMAND_PREFIX}-optin`,botInChannelMiddleware, scopedSupabaseMiddleware, optInHandler);
slackApp.command(`/${COMMAND_PREFIX}-optout`,botInChannelMiddleware, scopedSupabaseMiddleware, optOutHandler);
slackApp.command(`/${COMMAND_PREFIX}-purge`,botInChannelMiddleware, scopedSupabaseMiddleware, purgeHandler);
slackApp.command(`/${COMMAND_PREFIX}-purge-all`,botInChannelMiddleware, scopedSupabaseMiddleware, purgeAllHandler);
slackApp.command(`/${COMMAND_PREFIX}-help`, botInChannelMiddleware , zapHelpHandler);



/**
 * Interactive actions handlers
 */
// Toggle smart context feature
slackApp.action("enable_context", scopedSupabaseMiddleware , (args) => handleContextToggleAction({ ...args, enableContext: true }));
slackApp.action("disable_context",scopedSupabaseMiddleware ,(args) => handleContextToggleAction({ ...args, enableContext: false }));

/**
 * 404 handler
 */
expressApp.use((req, res) => {
  res.status(404).send("404 - Not Found");
});

/**
 * Start Express server
 */
const PORT = process.env.PORT || 3001;
expressApp.listen(PORT, () => 
  console.log(`[SERVER] Express server running on port ${PORT}`)
);
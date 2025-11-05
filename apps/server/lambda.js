const serverless = require('@vendia/serverless-express');
const { loadSecrets } = require('./secrets');
const { expressApp } = require('./app');

let handler;

exports.handler = async (event, context) => {
  if (!handler) {
    await loadSecrets(); 
    handler = serverless({ app: expressApp });
  }
  return handler(event, context);
};
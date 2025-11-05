const { SSMClient, GetParametersByPathCommand } = require("@aws-sdk/client-ssm");

async function loadSecrets() {
  if (process.env.NODE_ENV === "production") {
    console.log("Production environment detected. Fetching secrets from AWS SSM Parameter Store...");
    const client = new SSMClient({ region: "us-east-1" });
    const command = new GetParametersByPathCommand({
      Path: process.env.SSM_PATH,
      WithDecryption: true,
    });

    try {
      const result = await client.send(command);

      if (!result.Parameters || result.Parameters.length === 0) {
        console.warn(`No secrets found at path: ${process.env.SSM_PATH}`);
        return;
      }

      for (const param of result.Parameters) {
        const name = param.Name.split('/').pop();
        process.env[name] = param.Value;
      }

      console.log(`Successfully loaded ${result.Parameters.length} secrets into process.env`);
    } catch (err) {
      console.error("FATAL: Failed to fetch secrets from AWS SSM:", err);
      process.exit(1); // Fail fast
    }
  } else {
    console.log("Local environment detected. Loading secrets from .env file...");
    require("dotenv").config();
  }
}

module.exports = { loadSecrets };
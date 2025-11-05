const { expressApp } = require('./app');
const { loadSecrets } = require('./secrets');

const PORT = process.env.PORT || 3001;

async function startServer() {
  await loadSecrets();
  expressApp.listen(PORT, () =>
    console.log(`[SERVER] Express server running on http://localhost:${PORT}`)
  );
}

startServer();
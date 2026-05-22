require('dotenv').config();

const app = require('./src/app');
const { validateEnv } = require('./src/config/env');

validateEnv();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SIEMlite API running on port ${PORT}`);
});

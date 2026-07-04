import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running on http://localhost:${port}`);
});

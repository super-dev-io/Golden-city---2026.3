import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import dotenv from 'dotenv';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

if (process.env.NODE_ENV !== 'production') {
    // load server-specific env file so server code gets MONGO_URI, JWT_SECRET, etc.
    dotenv.config({ path: 'backend/config/.config.env' });
}

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => res.json({ ok: true, service: 'Golden City Backend' }));

app.use(errorHandler);

export default app;

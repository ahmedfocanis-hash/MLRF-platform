import { app } from './app.js';
import { env } from './config/env.js';
import { initDatabase } from './config/db.js';

// Initialize Turso database tables on server initialization
const init = async () => {
  try {
    await initDatabase();
  } catch (error) {
    console.error('[Turso] Database initialization error:', error);
  }
};
void init();

// Bind to local port when running locally outside of serverless production
if (process.env.NODE_ENV !== 'production') {
  app.listen(env.PORT, () => {
    console.log(`MLRF API listening on http://localhost:${env.PORT}`);
  });
}

export default app;
export { app };

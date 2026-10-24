import { app } from './app.js';
import { env } from './config/env.js';
import { initDatabase } from './config/db.js';
// Bind to local port when running locally outside of serverless production
if (process.env.NODE_ENV !== 'production') {
    void initDatabase().catch((error) => {
        console.error('[Turso] Database initialization error:', error);
    });
    app.listen(env.PORT, () => {
        console.log(`MLRF API listening on http://localhost:${env.PORT}`);
    });
}
export default app;
export { app };
//# sourceMappingURL=server.js.map
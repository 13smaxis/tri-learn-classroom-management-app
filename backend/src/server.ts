import path from 'node:path';
import express from 'express';
import dotenv from 'dotenv';

const repoRoot = path.resolve(process.cwd(), '..');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(repoRoot, '.env') });
dotenv.config({ path: path.resolve(repoRoot, '.env.local') });

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'tri-learn-express-backend',
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  });
});

app.get('/', (_req, res) => {
  res.json({ message: 'TriLearn Express backend is running' });
});

app.listen(port, () => {
  console.log(`Express backend listening on http://localhost:${port}`);
});

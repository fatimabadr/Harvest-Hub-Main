
import dotenv from 'dotenv-extended';
import path from 'path';


dotenv.load({
  path: path.resolve(process.cwd(), '.env'),
  errorOnMissing: false,
  includeProcessEnv: true,
});


if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://localhost:5432/test_harvesthub';
}
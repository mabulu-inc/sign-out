import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import pg from 'pg';

const { Pool } = pg;

const SSM_PARAM = process.env['DB_CONNECTION_SSM_PARAM'];
const DATABASE_URL = process.env['DATABASE_URL'];

const ssm = new SSMClient({});

/**
 * Lazily initialised Pool — fetches the connection string from SSM
 * Parameter Store on the first call and reuses the Pool across warm
 * Lambda invocations.
 *
 * If the SSM fetch fails, the cached promise is discarded so the next
 * invocation retries (covers transient SSM blips without permanently
 * bricking a warm container).
 *
 * In test/local environments (no SSM_PARAM set), falls back to the
 * DATABASE_URL environment variable so the handler can be exercised
 * without AWS credentials.
 */
let poolPromise: Promise<pg.Pool> | null = null;

export function getPool(): Promise<pg.Pool> {
  if (!poolPromise) {
    poolPromise = createPool().catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

async function createPool(): Promise<pg.Pool> {
  if (!SSM_PARAM) {
    // Local / test fallback — no SSM, use env directly.
    // DATABASE_URL is captured at module load time so that dev-backend's
    // per-route env override is visible (the override is restored after
    // import, before the first request).
    if (!DATABASE_URL) {
      throw new Error(
        'Neither DB_CONNECTION_SSM_PARAM nor DATABASE_URL is set',
      );
    }
    return new Pool({ connectionString: DATABASE_URL });
  }

  const { Parameter } = await ssm.send(
    new GetParameterCommand({ Name: SSM_PARAM, WithDecryption: true }),
  );
  const connectionString = Parameter?.Value;
  if (!connectionString) {
    throw new Error(`SSM parameter ${SSM_PARAM} is empty or missing`);
  }
  return new Pool({ connectionString });
}

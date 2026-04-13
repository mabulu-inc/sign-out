import '@smplcty/logging';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { revokeSession } from '@smplcty/auth';
import { getPool } from './pool.js';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.debug('event', event);

  let body: unknown;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid JSON' }),
    };
  }

  if (typeof body !== 'object' || body === null) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid request body' }),
    };
  }

  const { session_id } = body as Record<string, unknown>;

  if (typeof session_id !== 'string' || session_id.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'session_id is required' }),
    };
  }

  try {
    const db = await getPool();
    await revokeSession(db, session_id);

    return { statusCode: 200, body: '' };
  } catch (err) {
    console.error('/sign-out error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

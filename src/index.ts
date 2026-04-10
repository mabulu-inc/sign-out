import '@smplcty/logging';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { revokeSession } from '@smplcty/auth';
import { getPool } from './pool.js';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.debug('event', event);

  const body: unknown = JSON.parse(event.body ?? '{}');

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

  const db = await getPool();
  await revokeSession(db, session_id);

  return { statusCode: 200, body: '' };
};

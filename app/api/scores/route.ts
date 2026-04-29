import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { validateScoreInput } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const result = validateScoreInput(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { playerId, name, chapter, orderMode, timeMs, misses } = result.data;

  await db.insert(schema.scores).values({
    playerId,
    name,
    chapter,
    orderMode,
    timeMs,
    misses,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

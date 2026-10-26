import { hasSameOrigin, badOriginResponse } from '../../../src/lib/auth.js';
import { createSituationAssessment } from '../../../src/lib/situationAssessment.js';
const allowedHazards = new Set(['banjir', 'gempa', 'kebakaran', 'longsor', 'erupsi', 'lainnya']);

export async function POST(request) {
  if (!hasSameOrigin(request)) return badOriginResponse();

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: 'Format permintaan tidak valid.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)
    || typeof body.hazard_type !== 'string'
    || !allowedHazards.has(body.hazard_type)
    || typeof body.user_description !== 'string'
    || !body.user_description.trim()
    || body.user_description.length > 4000
    || (body.location !== undefined && (typeof body.location !== 'string' || body.location.length > 160))) {
    return Response.json({ success: false, error: 'Data analisis situasi tidak valid.' }, { status: 400 });
  }

  const assessment = createSituationAssessment({
    hazardType: body.hazard_type,
    location: body.location,
    userDescription: body.user_description
  });
  return Response.json(
    { success: true, report_id: `demo-${Date.now()}`, data_status: 'demo', data: assessment },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

import { NextResponse } from 'next/server';
import { addEmergencyReport, readDb } from '../../../../src/lib/disasterDb.js';
import { badOriginResponse, getAuthenticatedUser, hasSameOrigin, requireSarUser } from '../../../../src/lib/auth.js';
import { validateEmergencyReport } from '../../../../src/lib/emergencyReportValidation.js';
import {
  checkRequestRateLimit,
  rateLimitExceededResponse,
  rateLimitUnavailableResponse
} from '../../../../src/lib/requestRateLimit.js';

export async function GET(request) {
  const { response } = await requireSarUser(request);
  if (response) return response;
  try {
    const db = await readDb();
    return NextResponse.json({
      success: true,
      count: db.laporan_darurat.length,
      data: db.laporan_darurat
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('API /api/map/emergency-reports GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil laporan darurat.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!hasSameOrigin(request)) return badOriginResponse();

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Format permintaan tidak valid.' }, { status: 400 });
    }
    const reportInput = validateEmergencyReport(body);
    const rateLimit = await checkRequestRateLimit(request, 'sos', 3, 15 * 60);
    if (!rateLimit.available) return rateLimitUnavailableResponse();
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
    }

    const user = await getAuthenticatedUser(request);

    const report = await addEmergencyReport({
      ...reportInput,
      reporter_name: user?.name || 'Pengguna anonim',
      reporter_user_id: user?.id
    });

    return NextResponse.json({
      success: true,
      message: 'Laporan darurat berhasil dicatat ke database geospasial.',
      data: report
    }, { status: 201 });
  } catch (error) {
    if (error.status === 400) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('API /api/map/emergency-reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mencatat laporan darurat.' },
      { status: 500 }
    );
  }
}

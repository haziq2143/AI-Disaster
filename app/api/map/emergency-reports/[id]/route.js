import { NextResponse } from 'next/server';
import { getReportById, updateReportStatus } from '../../../../../src/lib/disasterDb.js';
import { requireSarUser } from '../../../../../src/lib/auth.js';

export async function GET(request, { params }) {
  const { response } = await requireSarUser(request);
  if (response) return response;
  try {
    const { id } = await params;
    const report = await getReportById(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Laporan darurat tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('API /api/map/emergency-reports/[id] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil detail laporan darurat.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const { response } = await requireSarUser(request);
  if (response) return response;
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const updated = await updateReportStatus(id, status);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Laporan darurat tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Status laporan darurat diperbarui.',
      data: updated
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Status laporan tidak valid.') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status laporan darurat.' },
      { status: 500 }
    );
  }
}

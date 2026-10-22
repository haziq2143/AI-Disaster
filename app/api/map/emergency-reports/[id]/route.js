import { NextResponse } from 'next/server';
import { getReportById, updateReportStatus } from '../../../../../src/lib/disasterDb.js';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const report = getReportById(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Laporan darurat tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil detail laporan darurat.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const updated = updateReportStatus(id, status);

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
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status laporan darurat.' },
      { status: 500 }
    );
  }
}

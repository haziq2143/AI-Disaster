import { NextResponse } from 'next/server';
import { getRoadHazards, toggleRoadHazard, addHazardReport, removeHazardReport } from '../../../../src/lib/disasterDb.js';

export async function GET() {
  try {
    const hazards = await getRoadHazards();
    return NextResponse.json({
      success: true,
      data_status: 'demo',
      timestamp: new Date().toISOString(),
      disclaimer: 'Aplikasi belum terhubung ke feed resmi bahaya jalan. Daftar kosong tidak berarti jalan aman.',
      data: hazards
    });
  } catch (error) {
    console.error('API /api/map/road-hazards GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat status bahaya jalan.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { hazardId, sessionId, action } = body;

    if (typeof hazardId !== 'string' || !hazardId.trim()) {
      return NextResponse.json({ success: false, error: 'hazardId tidak valid.' }, { status: 400 });
    }
    if (typeof sessionId !== 'string' || !sessionId.trim()) {
      return NextResponse.json({ success: false, error: 'sessionId tidak valid.' }, { status: 400 });
    }
    if (!['report', 'cancel'].includes(action)) {
      return NextResponse.json({ success: false, error: 'action harus "report" atau "cancel".' }, { status: 400 });
    }

    if (action === 'report') {
      const result = await addHazardReport(hazardId, sessionId);
      if (!result) {
        return NextResponse.json({ success: false, error: 'Hazard tidak ditemukan.' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        alreadyReported: result.alreadyReported,
        message: result.alreadyReported
          ? 'Anda sudah melaporkan titik bahaya ini sebelumnya.'
          : 'Laporan berhasil dicatat. Terima kasih atas laporan Anda.',
        data: {
          hazardId,
          report_count: result.hazard.report_count,
          is_blocked_by_community: result.hazard.is_blocked_by_community,
          block_threshold: result.hazard.block_threshold
        }
      });
    }

    // action === 'cancel'
    const result = await removeHazardReport(hazardId, sessionId);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Hazard tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      removed: result.removed,
      message: result.removed ? 'Laporan Anda berhasil dibatalkan.' : 'Laporan tidak ditemukan.',
      data: {
        hazardId,
        report_count: result.hazard.report_count,
        is_blocked_by_community: result.hazard.is_blocked_by_community,
        block_threshold: result.hazard.block_threshold
      }
    });
  } catch (error) {
    console.error('API /api/map/road-hazards POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses laporan.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, active } = body;

    if (typeof id !== 'string' || !id.trim() || (active !== undefined && typeof active !== 'boolean')) {
      return NextResponse.json(
        { success: false, error: 'Parameter id dan status hazard tidak valid.' },
        { status: 400 }
      );
    }

    const updated = await toggleRoadHazard(id, active !== undefined ? active : null);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Hazard dengan id tersebut tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Status bahaya ${updated.road_name} berhasil diperbarui: ${updated.active ? 'Aktif' : 'Non-aktif'}`,
      data: updated
    });
  } catch (error) {
    console.error('API /api/map/road-hazards PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status bahaya jalan.' },
      { status: 500 }
    );
  }
}

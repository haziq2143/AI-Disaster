import { getDisasterZones, addDisasterZone } from '../../../../src/lib/disasterDb.js';
import { requireSarUser } from '../../../../src/lib/auth.js';

export async function GET() {
  try {
    const zones = await getDisasterZones();
    return Response.json({
      success: true,
      data: zones
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('API /api/map/disaster-zones error:', error);
    return Response.json({ success: false, error: 'Gagal mengambil data zona bencana.' }, { status: 500 });
  }
}

export async function POST(request) {
  const { user, response } = await requireSarUser(request);
  if (response) return response;

  try {
    const body = await request.json();
    if (
      typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 120 ||
      typeof body.lat !== 'number' || !Number.isFinite(body.lat) || body.lat < -90 || body.lat > 90 ||
      typeof body.lng !== 'number' || !Number.isFinite(body.lng) || body.lng < -180 || body.lng > 180
    ) {
      return Response.json({ success: false, error: 'Data zona bencana tidak valid.' }, { status: 400 });
    }

    const zone = await addDisasterZone({
      name: body.name.trim(),
      hazard_type: body.hazard_type || 'gempa',
      severity_level: body.severity_level || 'level_2_warning',
      lat: body.lat,
      lng: body.lng,
      radius_km: Number(body.radius_km) || 2.0,
      description: body.description?.trim() || ''
    }, user);

    return Response.json({ success: true, data: zone }, { status: 201 });
  } catch (error) {
    console.error('API /api/map/disaster-zones POST error:', error);
    return Response.json({ success: false, error: error.message || 'Gagal menambahkan zona bencana.' }, { status: 500 });
  }
}

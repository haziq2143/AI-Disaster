import { updateDisasterZone, deleteDisasterZone } from '../../../../../src/lib/disasterDb.js';
import { requireSarUser } from '../../../../../src/lib/auth.js';

export async function PATCH(request, context) {
  const { user, response } = await requireSarUser(request);
  if (response) return response;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const updated = await updateDisasterZone(id, body, user);

    if (!updated) {
      return Response.json({ success: false, error: 'Zona bencana tidak ditemukan.' }, { status: 404 });
    }

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('API /api/map/disaster-zones/[id] PATCH error:', error);
    return Response.json({ success: false, error: error.message || 'Gagal memperbarui zona bencana.' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const { response } = await requireSarUser(request);
  if (response) return response;

  try {
    const { id } = await context.params;
    const deleted = await deleteDisasterZone(id);

    if (!deleted) {
      return Response.json({ success: false, error: 'Zona bencana tidak ditemukan.' }, { status: 404 });
    }

    return Response.json({ success: true, message: 'Zona bencana berhasil dihapus / diselesaikan.' });
  } catch (error) {
    console.error('API /api/map/disaster-zones/[id] DELETE error:', error);
    return Response.json({ success: false, error: 'Gagal menghapus zona bencana.' }, { status: 500 });
  }
}

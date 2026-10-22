import {
  familyErrorResponse,
  getBearerToken,
  getFamilyGroup,
  readFamilyRequestBody,
  updateFamilyGroup
} from '../../../../../src/lib/familyGroupStore.js';
import { requireAuthenticatedUser } from '../../../../../src/lib/auth.js';

export async function GET(request, { params }) {
  const { response } = requireAuthenticatedUser(request);
  if (response) return response;
  try {
    const { id } = await params;
    const data = await getFamilyGroup({ groupId: id, accessToken: getBearerToken(request) });
    return Response.json({ success: true, data });
  } catch (error) {
    return familyErrorResponse(error);
  }
}

export async function PUT(request, { params }) {
  const { response } = requireAuthenticatedUser(request);
  if (response) return response;
  try {
    const { id } = await params;
    const body = await readFamilyRequestBody(request);
    const data = await updateFamilyGroup({
      groupId: id,
      accessToken: getBearerToken(request),
      familyMembers: body.familyMembers,
      familyPlan: body.familyPlan
    });
    return Response.json({ success: true, data });
  } catch (error) {
    return familyErrorResponse(error);
  }
}

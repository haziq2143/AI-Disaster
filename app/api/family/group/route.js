import {
  createFamilyGroup,
  familyErrorResponse,
  readFamilyRequestBody
} from '../../../../src/lib/familyGroupStore.js';
import { requireAuthenticatedUser } from '../../../../src/lib/auth.js';

export async function POST(request) {
  const { response } = requireAuthenticatedUser(request);
  if (response) return response;
  try {
    const body = await readFamilyRequestBody(request);
    const data = await createFamilyGroup(body);
    return Response.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return familyErrorResponse(error);
  }
}

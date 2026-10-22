import {
  familyErrorResponse,
  joinFamilyGroup,
  readFamilyRequestBody
} from '../../../../src/lib/familyGroupStore.js';
import { requireAuthenticatedUser } from '../../../../src/lib/auth.js';

export async function POST(request) {
  const { user, response } = requireAuthenticatedUser(request);
  if (response) return response;
  try {
    const body = await readFamilyRequestBody(request);
    const data = await joinFamilyGroup({
      inviteToken: body.inviteToken,
      member: { ...body.member, name: user.name }
    });
    return Response.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return familyErrorResponse(error);
  }
}

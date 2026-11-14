import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '../app/api/map/routing/route.js';

test('real road routing endpoint returns multi-point coordinates following road network', async () => {
  const req = new Request('http://localhost:3000/api/map/routing?startLat=-5.9860&startLng=106.0520&endLat=-5.9800&endLng=106.0600&mode=driving');
  const response = await GET(req);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  assert.ok(result.data.routes.length >= 1);

  const route1 = result.data.routes[0];
  assert.ok(route1.coordinates.length > 10, 'Expected real road coordinates to have multiple turn points');
  assert.ok(route1.distanceMeters > 0);
  assert.ok(route1.steps.length > 0, 'Expected navigation turn steps');
  assert.ok(route1.steps[0].instruction);
});

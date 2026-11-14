import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '../app/api/alerts/bmkg/route.js';

test('BMKG alert endpoint returns valid structured response or fallback', async () => {
  const response = await GET();
  assert.ok(response.status === 200 || response.status === 502);

  const result = await response.json();
  if (response.status === 200) {
    assert.equal(result.success, true);
    assert.ok(result.data);
    assert.ok(result.data.magnitude);
    assert.ok(result.data.wilayah);
    assert.ok(result.data.tanggal);
  } else {
    assert.equal(result.success, false);
    assert.ok(result.error);
  }
});

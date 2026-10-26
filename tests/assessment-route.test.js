import assert from 'node:assert/strict';
import test from 'node:test';
import { POST } from '../app/api/assessment/route.js';

test('assessment endpoint returns the expected simulated output contract', async () => {
  const response = await POST(new Request('http://localhost:3000/api/assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hazard_type: 'gempa',
      user_description: 'Ada retakan setelah guncangan.',
      location: 'Bandung'
    })
  }));

  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  assert.equal(result.data_status, 'demo');
  assert.match(result.data.situation_summary, /Bandung/);
  assert.deepEqual(result.data.reported_information, ['Ada retakan setelah guncangan.']);
  assert.match(result.data.confidence_limitation, /bukan analisis AI/);
  assert.ok(Array.isArray(result.data.immediate_actions));
});

test('longsor guidance does not reuse flood assumptions', async () => {
  const response = await POST(new Request('http://localhost:3000/api/assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hazard_type: 'longsor',
      user_description: 'Terlihat retakan pada lereng.'
    })
  }));

  const result = await response.json();
  assert.equal(response.status, 200);
  assert.match(result.data.situation_summary, /tanah longsor/);
  assert.ok(result.data.immediate_actions.every(action => !action.desc.includes('banjir')));
  assert.ok(result.data.next_steps.every(step => !step.includes('air')));
});

test('assessment endpoint rejects invalid input', async () => {
  const response = await POST(new Request('http://localhost:3000/api/assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hazard_type: 'unknown', user_description: '' })
  }));

  assert.equal(response.status, 400);
});

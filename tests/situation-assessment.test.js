import assert from 'node:assert/strict';
import test from 'node:test';
import { createSituationAssessment } from '../src/lib/situationAssessment.js';

const hazards = ['banjir', 'gempa', 'kebakaran', 'longsor', 'erupsi', 'lainnya'];

test('returns hazard-specific cautious guidance without invented incident facts', () => {
  for (const hazardType of hazards) {
    const result = createSituationAssessment({
      hazardType,
      location: 'Area uji',
      userDescription: 'Kondisi yang dilaporkan pengguna'
    });

    assert.match(result.situation_summary, /belum diverifikasi/);
    assert.equal(result.reported_information[0], 'Kondisi yang dilaporkan pengguna');
    assert.equal(result.urgency_level, 'Panduan umum · urgensi belum dapat diverifikasi');
    assert.equal(result.immediate_actions.length, 3);
    assert.ok(result.next_steps.length > 0);
    assert.match(result.confidence_limitation, /bukan analisis AI/);
    if (hazardType === 'erupsi' || hazardType === 'longsor') {
      assert.ok(result.immediate_actions.every(action => !action.desc.includes('banjir')));
    }
  }
});

test('falls back to general guidance for an unrecognized hazard', () => {
  const result = createSituationAssessment({
    hazardType: 'unknown',
    userDescription: 'Butuh bantuan'
  });
  assert.match(result.situation_summary, /situasi darurat lainnya/);
  assert.match(result.immediate_actions[0].title, /Jauhi bahaya langsung/);
});

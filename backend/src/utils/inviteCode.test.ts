import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInviteCode, inviteCodesMatch } from './inviteCode.js';

test('normalizes whitespace and case', () => {
  assert.equal(normalizeInviteCode(' jan022830 '), 'JAN022830');
  assert.equal(normalizeInviteCode('Jan022830'), 'JAN022830');
});

test('matches invite codes across casing and whitespace', () => {
  assert.equal(inviteCodesMatch('jan022830', 'JAN022830'), true);
  assert.equal(inviteCodesMatch(' JAN022830 ', 'jan022830'), true);
  assert.equal(inviteCodesMatch('different-code', 'JAN022830'), false);
});

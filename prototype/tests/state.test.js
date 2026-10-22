import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, exampleState, currentResponse, latestRevision, isAcknowledged } from '../dist/state.js';

function act(state, action) {
  return applyAction(state, { orderId: state.order.id, orderKey: state.order.key, expectedRevision: latestRevision(state.order).number, ...action });
}
function responded() {
  return act(exampleState(), { type: 'respond', decision: 'accommodate', note: 'Cheese omitted. The kitchen reviewed the dressing and preparation question.' });
}
function acknowledged() {
  const state = responded();
  return act(state, { type: 'acknowledge', responseId: currentResponse(state.order).id });
}
const change = { type: 'change', ingredients: 'Chicken, rice, greens, yogurt dressing (milk)', preparation: 'Separate utensils; substituted dressing contains milk.', reason: 'The new dressing contains milk.' };

test('a recorded ingredient change supersedes response and acknowledgement, retaining history', () => {
  const original = acknowledged();
  const next = act(original, change);
  assert.equal(currentResponse(next.order), null);
  assert.equal(isAcknowledged(next.order), false);
  assert.equal(latestRevision(next.order).number, 2);
  assert.equal(next.order.responses.length, 1);
  assert.equal(next.order.acknowledgements.length, 1);
  assert.equal(latestRevision(original.order).number, 1, 'previous state must remain immutable');
  assert.equal(currentResponse(original.order).decision, 'accommodate');
  assert.throws(() => act(next, { type: 'complete' }), /current accommodation/);
});

test('preparation changes alone also require another review', () => {
  const original = acknowledged();
  const next = act(original, { ...change, ingredients: latestRevision(original.order).ingredients });
  assert.equal(currentResponse(next.order), null);
  assert.equal(isAcknowledged(next.order), false);
});

test('a stale form cannot respond, acknowledge, change, or complete a newer revision', () => {
  const next = act(acknowledged(), change);
  for (const action of [
    { type: 'respond', decision: 'accommodate', note: 'Old review' },
    { type: 'acknowledge', responseId: 1 },
    change,
    { type: 'complete' }
  ]) assert.throws(() => act(next, { ...action, expectedRevision: 1 }), /meal changed/);
});

test('replacing a response requires acknowledgement of that exact new response', () => {
  const next = act(acknowledged(), { type: 'respond', decision: 'clarify', note: 'Please clarify your preparation request.' });
  assert.equal(isAcknowledged(next.order), false);
  assert.throws(() => act(next, { type: 'acknowledge', responseId: 1 }), /response changed/);
});

for (const decision of ['unable', 'clarify']) {
  test(`${decision} response cannot complete the review, even when acknowledged`, () => {
    let state = act(exampleState(), { type: 'respond', decision, note: 'The kitchen cannot yet fulfill this request.' });
    state = act(state, { type: 'acknowledge', responseId: currentResponse(state.order).id });
    assert.throws(() => act(state, { type: 'complete' }), /current accommodation/);
  });
}

test('another current accommodation response and acknowledgement permit completion', () => {
  let state = act(acknowledged(), change);
  state = act(state, { type: 'respond', decision: 'accommodate', note: 'We can replace the yogurt dressing with olive oil.' });
  assert.throws(() => act(state, { type: 'complete' }), /acknowledgement/);
  state = act(state, { type: 'acknowledge', responseId: currentResponse(state.order).id });
  state = act(state, { type: 'complete' });
  assert.equal(state.order.completed, true);
  assert.throws(() => act(state, change), /review is complete/);
});

test('updating saved profile does not silently alter an existing request', () => {
  const original = exampleState();
  const next = applyAction(original, { type: 'profile', allergies: ['Peanuts'] });
  assert.deepEqual(next.profile.allergies, ['Peanuts']);
  assert.deepEqual(latestRevision(next.order).allergies, ['Milk']);
});

test('new requests cannot overwrite an unfinished review', () => {
  assert.throws(() => applyAction(exampleState(), { type: 'submit', mealId: 'bowl' }), /Finish or reset/);
});

test('unchanged details cannot create a misleading new version', () => {
  const state = responded();
  assert.throws(() => act(state, { type: 'change', ...latestRevision(state.order), reason: 'No actual change.' }), /No changes/);
});

test('an active request can receive revised allergy requirements, invalidating its response', () => {
  const state = responded();
  const next = act(state, { type: 'change', ...latestRevision(state.order), allergies: ['Milk', 'Peanuts'], reason: 'Additional allergy requirement.' });
  assert.equal(currentResponse(next.order), null);
  assert.deepEqual(latestRevision(next.order).allergies, ['Milk', 'Peanuts']);
});

test('invalid allergies and empty staff notes cannot be saved', () => {
  assert.throws(() => applyAction(exampleState(), { type: 'profile', allergies: ['Unknown'] }), /Select at least one/);
  assert.throws(() => act(exampleState(), { type: 'respond', decision: 'accommodate', note: ' ' }), /kitchen response/);
});

test('resetting and replacing order 24 cannot make an old form valid again', () => {
  const old = exampleState();
  const replacement = exampleState();
  assert.equal(old.order.id, replacement.order.id);
  assert.notEqual(old.order.key, replacement.order.key);
  assert.throws(() => act(replacement, { type: 'respond', orderKey: old.order.key, decision: 'accommodate', note: 'Old order review' }), /no longer active/);
});

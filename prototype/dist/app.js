import { ALLERGIES, MENU, createState, exampleState, applyAction, latestRevision, currentResponse, isAcknowledged, orderStatus } from './state.js';

const STORAGE_KEY = 'verifed.prototype.v1';
const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(STORAGE_KEY) : null;
let state = readState();
let view = new URLSearchParams(location.search).get('view') || 'both';
const drafts = new Map();

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return createState();
    if (saved.schema !== 1 || !Array.isArray(saved.profile?.allergies) || !Number.isInteger(saved.nextOrder)) throw new Error('Invalid saved data');
    if (saved.order && (!saved.order.key || !saved.order.revisions?.length || !Array.isArray(saved.order.responses) || !Array.isArray(saved.order.acknowledgements) || !Array.isArray(saved.order.history))) throw new Error('Invalid order');
    return saved;
  } catch {
    return createState();
  }
}

// Anything entered by a diner or kitchen staff is text, never HTML.
function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
const field = (name, value) => `<input type="hidden" name="${name}" value="${escape(value)}">`;
const contextFields = order => field('orderId', order.id) + field('orderKey', order.key) + field('expectedRevision', latestRevision(order).number);
const decisions = { accommodate: 'Can accommodate the request', unable: 'Cannot accommodate the request', clarify: 'Need clarification from the diner' };
const time = value => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function allergyChoices(selected) {
  return `<fieldset class="allergy-field"><legend>Allergy requirements</legend><div class="allergy-options">${ALLERGIES.map(allergy => `<label><input type="checkbox" name="allergies" value="${allergy}" ${selected.includes(allergy) ? 'checked' : ''}><span>${allergy}</span></label>`).join('')}</div></fieldset>`;
}

function profile() {
  return `<details class="profile" ${state.order ? '' : 'open'}><summary><span>Saved requirements</span><strong>${state.profile.allergies.map(escape).join(', ')}</strong></summary><form id="profile-form">${allergyChoices(state.profile.allergies)}<p class="help">Used for your next request. An existing request keeps the requirements you sent.</p><button class="button secondary" type="submit">Save requirements</button></form></details>`;
}

function requestForm() {
  return `<form id="request-form" class="card request-form"><div class="section-label"><span class="step-number">1</span><h3>Choose a meal</h3></div><fieldset class="menu"><legend class="sr-only">Menu</legend>${MENU.map((meal, index) => `<label class="menu-row"><input type="radio" name="mealId" value="${meal.id}" ${index === 0 ? 'checked' : ''}><span><strong>${meal.name}</strong><small>${meal.description}</small></span></label>`).join('')}</fieldset><p class="ingredient-preview" id="ingredient-preview"><strong>Menu ingredients</strong><span>${escape(MENU[0].ingredients)}</span></p><div class="section-label"><span class="step-number">2</span><h3>Tell the kitchen what you need</h3></div><label class="field-label" for="modifications">Requested changes</label><textarea id="modifications" name="modifications" rows="2" maxlength="1500" required>${MENU[0].modifications}</textarea><label class="field-label" for="question">Preparation question</label><textarea id="question" name="question" rows="3" maxlength="1500" required>Can you use clean utensils and a separate preparation surface?</textarea><div class="sending-requirements">Sending with: <strong>${state.profile.allergies.map(escape).join(', ')}</strong></div><button class="button primary full" type="submit">Send meal request <span aria-hidden="true">→</span></button></form>`;
}

function orderHeader(order) {
  const status = orderStatus(order);
  return `<div class="ticket-top"><span>MEAL REQUEST / ${order.id}</span><span>VERSION ${latestRevision(order).number}</span></div><div class="ticket-title"><h3>${escape(order.mealName)}</h3><span class="status ${status.tone}">${status.text}</span></div>`;
}

function requestDetails(order) {
  const revision = latestRevision(order);
  return `<dl class="request-details"><div><dt>Allergies</dt><dd>${revision.allergies.map(value => `<span class="allergy-tag">${escape(value)}</span>`).join('')}</dd></div><div><dt>Requested changes</dt><dd>${escape(revision.modifications)}</dd></div><div><dt>Preparation question</dt><dd>${escape(revision.question)}</dd></div></dl>`;
}

function renderHistory(order) {
  return `<details class="history"><summary>Request history <span>${order.history.length} events</span></summary><ol>${order.history.toReversed().map(event => `<li class="event ${event.kind}"><div class="event-title"><strong>${escape(event.title)}</strong><span>v${event.revision} · ${time(event.at)}</span></div><p>${escape(event.detail)}</p>${event.kind === 'responded' && event.revision !== latestRevision(order).number ? '<span class="outdated-label">Previous version · no longer current</span>' : ''}</li>`).join('')}</ol></details>`;
}

function dinerOrder(order) {
  const revision = latestRevision(order);
  const response = currentResponse(order);
  const lastChange = order.history.findLast(event => event.kind === 'changed');
  let responseContent;
  if (response) {
    responseContent = `<div class="response-heading"><span class="small-label">KITCHEN RESPONSE / VERSION ${response.revision}</span><span class="response-time">${time(response.at)}</span></div><h4>${decisions[response.decision]}</h4><p class="response-note">${escape(response.note)}</p>${isAcknowledged(order) ? '<div class="read-confirmation">✓ You have read this response.</div>' : `<form id="acknowledge-form">${contextFields(order)}${field('responseId', response.id)}<button class="button primary full">I've read this response</button><p class="help">Acknowledges the message; does not confirm that the food is allergen-free.</p></form>`}`;
  } else if (order.responses.length) {
    responseContent = `<div class="change-alert"><span class="alert-symbol" aria-hidden="true">!</span><div><h4>The earlier response is no longer current.</h4><p>${escape(lastChange?.detail || 'The meal details changed.')}</p><p>The kitchen must review version ${revision.number} before you can acknowledge a new response.</p></div></div>`;
  } else {
    responseContent = `<div class="waiting"><span class="waiting-dot" aria-hidden="true"></span><div><h4>Waiting for the kitchen</h4><p>Your requirements are sent. Staff still need to review the ingredients and preparation.</p></div></div>`;
  }
  return `<article class="card ticket">${orderHeader(order)}${requestDetails(order)}<div class="kitchen-response">${responseContent}</div><details class="meal-details"><summary>Current meal details</summary><dl><dt>Ingredients reported / menu recipe</dt><dd>${escape(revision.ingredients)}</dd><dt>Preparation details</dt><dd>${escape(revision.preparation)}</dd></dl></details>${renderHistory(order)}${order.completed ? '<div class="completed-note"><strong>This review is complete.</strong><p>You can send a new request below.</p></div>' : ''}</article>`;
}

function kitchenOrder(order) {
  const revision = latestRevision(order);
  const response = currentResponse(order);
  const ready = response?.decision === 'accommodate' && isAcknowledged(order);
  return `<article class="card kitchen-ticket">${orderHeader(order)}${requestDetails(order)}<div class="reported-details"><span class="small-label">CURRENT MEAL DETAILS</span><p><strong>Ingredients</strong>${escape(revision.ingredients)}</p><p><strong>Preparation</strong>${escape(revision.preparation)}</p></div>${order.completed ? '<div class="complete-banner">✓ Review completed for this version.</div>' : `<form id="response-form" class="review-form">${contextFields(order)}<h3>Review & respond</h3><p class="help">Check the recipe and preparation procedures, then record what you can accommodate.</p><label class="field-label" for="decision">Kitchen decision</label><select name="decision" id="decision"><option value="accommodate">Can accommodate</option><option value="unable">Cannot accommodate</option><option value="clarify">Need clarification</option></select><label class="field-label" for="note">Response to the diner</label><textarea name="note" id="note" rows="3" maxlength="1500" placeholder="Explain ingredients, requested changes and preparation details…" required></textarea><p class="help">This response applies only to version ${revision.number}. Recording a later change requires another review.</p><div class="draft-warning" hidden>This form belongs to an earlier version. <button type="button" class="text-button" data-discard="response-form">Discard edits and refresh</button></div><button class="button primary full">Record kitchen response</button></form><details class="edit-meal"><summary><span>Something changed?</span><span>Update meal details ↓</span></summary><form id="change-form">${contextFields(order)}<p class="help">Record ingredient or preparation changes here. Saving a change withdraws the previous response and diner acknowledgement.</p><label class="field-label" for="ingredients">Current ingredients</label><textarea id="ingredients" name="ingredients" rows="3" maxlength="1500" required>${escape(revision.ingredients)}</textarea><label class="field-label" for="preparation">Preparation details</label><textarea id="preparation" name="preparation" rows="3" maxlength="1500" required>${escape(revision.preparation)}</textarea><label class="field-label" for="reason">What changed?</label><textarea id="reason" name="reason" rows="2" maxlength="1500" required placeholder="Explain the change so the diner can understand it…"></textarea><button class="text-button sample-change" type="button" id="sample-change">Fill example: dressing now contains milk</button><div class="draft-warning" hidden>This form belongs to an earlier version. <button type="button" class="text-button" data-discard="change-form">Discard edits and refresh</button></div><button class="button secondary full">Save change & require new review</button></form></details><form id="complete-form" class="completion">${contextFields(order)}<button class="button secondary full" ${ready ? '' : 'disabled'}>Mark review complete</button><p class="help">${ready ? 'The diner has read the current accommodation response.' : 'Available after an accommodation response and the diner reads that response.'}</p></form>`}</article>`;
}

function render() {
  const order = state.order;
  document.querySelector('#diner-content').innerHTML = `${order ? dinerOrder(order) : '<div class="getting-started"><strong>Start with your requirements.</strong><p>Choose a sample meal below, or load the example to jump into an order.</p></div>'}${profile()}${!order || order.completed ? requestForm() : ''}`;
  document.querySelector('#kitchen-content').innerHTML = order ? kitchenOrder(order) : `<div class="empty-kitchen"><div class="empty-ticket" aria-hidden="true"><span></span><span></span><span></span></div><h3>No requests yet</h3><p>Send a meal request from the diner view.<br>It will appear here for the kitchen to review.</p><div class="empty-steps"><span>Request</span><span aria-hidden="true">→</span><span>Review</span><span aria-hidden="true">→</span><span>Respond</span></div></div><div class="how-it-works"><span class="small-label">THE IMPORTANT PART</span><h3>A response follows the meal.</h3><p>If staff record a change after responding, the old response becomes outdated. Both views show that another review is needed.</p></div>`;
  for (const [id, draft] of drafts) {
    const form = document.getElementById(id);
    if (!form || draft.orderKey !== String(order?.key ?? '')) { drafts.delete(id); continue; }
    for (const input of form.elements) {
      if (!(input.name in draft.values)) continue;
      if (input.type === 'checkbox' || input.type === 'radio') input.checked = draft.values[input.name].includes(input.value);
      else input.value = draft.values[input.name];
    }
    if (form.closest('details')) form.closest('details').open = true;
    if (form.querySelector('.draft-warning') && Number(form.elements.expectedRevision.value) !== latestRevision(order).number) {
      form.querySelector('.draft-warning').hidden = false;
      if (id === 'response-form') form.querySelector('.help:last-of-type').textContent = `This draft was started for version ${form.elements.expectedRevision.value}. Refresh the form to review version ${latestRevision(order).number}.`;
    }
  }
  if (document.getElementById('request-form')) updateMenuPreview(false);
  setView(view);
}

function setView(nextView) {
  view = ['both', 'diner', 'kitchen'].includes(nextView) ? nextView : 'both';
  document.querySelector('#workspace').dataset.view = view;
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  const url = new URL(location.href);
  if (view === 'both') url.searchParams.delete('view'); else url.searchParams.set('view', view);
  history.replaceState(null, '', url);
}

function showNotice(message, error = false) {
  const notice = document.getElementById('notice');
  notice.hidden = false;
  notice.className = `notice ${error ? 'notice-error' : ''}`;
  notice.textContent = message;
  notice.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

async function commit(action, message, useExample = false) {
  try {
    const save = () => {
      const fresh = readState();
      const next = useExample ? exampleState() : applyAction(fresh, action);
      // Update the UI only after persistence succeeds.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      state = next;
    };
    if (navigator.locks) await navigator.locks.request(STORAGE_KEY, save); else save();
    drafts.clear();
    render();
    channel?.postMessage('updated');
    showNotice(message);
  } catch (error) {
    state = readState();
    render();
    showNotice(error.name === 'QuotaExceededError' ? 'Browser storage is full. Clear space before saving this demo.' : error.message, true);
  }
}

function rememberDraft(form) {
  const values = {};
  for (const input of form.elements) {
    if (!input.name) continue;
    if (input.type === 'radio' || input.type === 'checkbox') {
      values[input.name] ||= [];
      if (input.checked) values[input.name].push(input.value);
    } else values[input.name] = input.value;
  }
  drafts.set(form.id, { orderKey: String(state.order?.key ?? ''), values });
}

function updateMenuPreview(resetChanges = true) {
  const form = document.getElementById('request-form');
  const meal = MENU.find(item => item.id === new FormData(form).get('mealId'));
  document.querySelector('#ingredient-preview span').textContent = meal.ingredients;
  if (resetChanges) form.elements.modifications.value = meal.modifications;
}

document.addEventListener('input', event => {
  if (event.target.form) rememberDraft(event.target.form);
});
document.addEventListener('change', event => {
  if (event.target.name === 'mealId') updateMenuPreview();
  if (event.target.form) rememberDraft(event.target.form);
});
document.addEventListener('submit', event => {
  const form = event.target;
  event.preventDefault();
  const data = new FormData(form);
  const action = { orderId: Number(data.get('orderId')), orderKey: data.get('orderKey'), expectedRevision: Number(data.get('expectedRevision')) };
  if (form.id === 'profile-form') commit({ type: 'profile', allergies: data.getAll('allergies') }, 'Requirements saved for your next meal request.');
  if (form.id === 'request-form') commit({ type: 'submit', mealId: data.get('mealId'), allergies: state.profile.allergies, modifications: data.get('modifications'), question: data.get('question') }, 'Meal request sent. The kitchen can now review it.');
  if (form.id === 'response-form') commit({ ...action, type: 'respond', decision: data.get('decision'), note: data.get('note') }, 'Kitchen response recorded. The diner can read it now.');
  if (form.id === 'change-form') commit({ ...action, type: 'change', ingredients: data.get('ingredients'), preparation: data.get('preparation'), reason: data.get('reason') }, 'Meal details changed. A new kitchen review is required.');
  if (form.id === 'acknowledge-form') commit({ ...action, type: 'acknowledge', responseId: Number(data.get('responseId')) }, 'Diner acknowledgement recorded for the current response.');
  if (form.id === 'complete-form') commit({ ...action, type: 'complete' }, 'Review complete. Both sides reviewed the same meal version.');
});
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.view) setView(button.dataset.view);
  if (button.dataset.discard) { drafts.delete(button.dataset.discard); render(); }
  if (button.id === 'sample-change') {
    const form = document.getElementById('change-form');
    form.elements.ingredients.value = 'Chicken, rice, greens, yogurt dressing (contains milk); cheese omitted';
    form.elements.preparation.value = 'Separate utensils were used, but the substituted dressing contains milk.';
    form.elements.reason.value = 'The lemon dressing was replaced with a yogurt dressing containing milk.';
    rememberDraft(form);
  }
  if (button.id === 'load-example' && (!state.order || confirm('Replace the current demo request with the sample chicken bowl?'))) commit({}, 'Example loaded. Try recording a kitchen response, then changing the dressing.', true);
  if (button.id === 'reset' && confirm('Clear this browser’s Verifed demo data and start again?')) commit({ type: 'reset' }, 'Demo reset. You can start a new meal request.');
});

function sync() {
  state = readState();
  render();
}
window.addEventListener('storage', event => { if (event.key === STORAGE_KEY || event.key === null) sync(); });
channel?.addEventListener('message', sync);
window.addEventListener('focus', sync);
render();

// The meal snapshots are deliberately small. Every review belongs to one snapshot.
export const ALLERGIES = ['Milk', 'Eggs', 'Peanuts', 'Tree nuts', 'Soy', 'Wheat', 'Sesame', 'Fish', 'Shellfish'];
export const MENU = [
  { id: 'bowl', name: 'Chicken garden bowl', description: 'Grilled chicken, rice & crisp greens', ingredients: 'Chicken, rice, greens, cheddar cheese, lemon dressing', modifications: 'No cheese, please.' },
  { id: 'pasta', name: 'Tomato basil pasta', description: 'Penne, slow-roasted tomato & basil', ingredients: 'Wheat penne, tomatoes, basil, olive oil, Parmesan cheese', modifications: 'Please omit the Parmesan.' },
  { id: 'salad', name: 'Harvest salad', description: 'Roasted vegetables, apple & crunch', ingredients: 'Mixed greens, squash, apple, walnuts, mustard vinaigrette', modifications: 'Please omit the walnuts.' },
  { id: 'soup', name: 'Roasted tomato soup', description: 'Warm tomato soup with a sourdough side', ingredients: 'Tomatoes, cream, vegetable stock, basil, wheat sourdough', modifications: 'Can this be prepared without cream?' }
];

export function createState() {
  return { schema: 1, profile: { allergies: ['Milk'] }, nextOrder: 24, order: null };
}

export function latestRevision(order) {
  return order.revisions.at(-1);
}

export function currentResponse(order) {
  return order.responses.findLast(response => response.revision === latestRevision(order).number) || null;
}

export function isAcknowledged(order) {
  const response = currentResponse(order);
  return Boolean(response && order.acknowledgements.some(entry => entry.responseId === response.id));
}

export function orderStatus(order) {
  if (order.completed) return { text: 'Review complete', tone: 'green' };
  const response = currentResponse(order);
  if (!response) return latestRevision(order).number > 1
    ? { text: 'Changed · review needed', tone: 'red' }
    : { text: 'Waiting for kitchen', tone: 'amber' };
  if (response.decision === 'unable') return { text: 'Cannot accommodate', tone: 'red' };
  if (response.decision === 'clarify') return { text: 'Clarification needed', tone: 'amber' };
  return { text: isAcknowledged(order) ? 'Diner has read the response' : 'Kitchen has responded', tone: 'green' };
}

function requireText(value, name) {
  const clean = String(value || '').trim();
  if (!clean) throw new Error(`Please enter ${name}.`);
  if (clean.length > 1500) throw new Error(`Please keep ${name} under 1,500 characters.`);
  return clean;
}

function cleanAllergies(values) {
  const selected = [...new Set(values || [])].filter(value => ALLERGIES.includes(value));
  if (!selected.length) throw new Error('Select at least one allergy requirement.');
  return selected;
}

// Read current state first, then reject an action from an outdated screen.
// This is a demo guard. A real service needs the same check in a server transaction.
export function applyAction(previous, action, now = new Date().toISOString()) {
  const state = structuredClone(previous);
  if (action.type === 'reset') return createState();
  if (action.type === 'profile') {
    state.profile.allergies = cleanAllergies(action.allergies);
    return state;
  }
  if (action.type === 'submit') {
    if (state.order && !state.order.completed) throw new Error('Finish or reset the current demo request before creating another.');
    const meal = MENU.find(item => item.id === action.mealId);
    if (!meal) throw new Error('Please select a meal.');
    const allergies = cleanAllergies(action.allergies);
    const modifications = requireText(action.modifications, 'your requested changes');
    const question = requireText(action.question, 'your preparation question');
    state.profile.allergies = allergies;
    state.order = {
      id: state.nextOrder++, key: crypto.randomUUID(), mealId: meal.id, mealName: meal.name, completed: false,
      revisions: [{ number: 1, allergies, modifications, question, ingredients: meal.ingredients, preparation: 'Preparation details have not been reviewed yet.', at: now }],
      responses: [], acknowledgements: [],
      history: [{ kind: 'sent', title: 'Meal request sent', detail: 'The kitchen has been asked to review your ingredients and preparation question.', revision: 1, at: now }]
    };
    return state;
  }

  const order = state.order;
  if (!order || action.orderId !== order.id || action.orderKey !== order.key) throw new Error('This meal request is no longer active. Reload the current request.');
  const revision = latestRevision(order);
  if (action.expectedRevision !== revision.number) throw new Error('The meal changed while this form was open. Review the latest version and try again.');
  if (order.completed) throw new Error('This review is complete. Create a new request for another meal.');

  if (action.type === 'change') {
    const ingredients = requireText(action.ingredients, 'the current ingredients');
    const preparation = requireText(action.preparation, 'the preparation details');
    const allergies = action.allergies ? cleanAllergies(action.allergies) : revision.allergies;
    const modifications = action.modifications === undefined ? revision.modifications : requireText(action.modifications, 'your requested changes');
    const question = action.question === undefined ? revision.question : requireText(action.question, 'your preparation question');
    const changed = ingredients !== revision.ingredients || preparation !== revision.preparation || modifications !== revision.modifications || question !== revision.question || JSON.stringify(allergies) !== JSON.stringify(revision.allergies);
    if (!changed) throw new Error('No changes to save. Update an ingredient or preparation detail first.');
    const next = { ...revision, number: revision.number + 1, ingredients, preparation, allergies, modifications, question, at: now };
    order.revisions.push(next);
    order.history.push({ kind: 'changed', title: 'Meal details changed', detail: requireText(action.reason, 'a brief explanation of the change'), revision: next.number, at: now });
  } else if (action.type === 'respond') {
    if (!['accommodate', 'unable', 'clarify'].includes(action.decision)) throw new Error('Choose a kitchen response.');
    const note = requireText(action.note, 'the kitchen response');
    // Replacing a response also requires the diner to read the new response.
    const response = { id: order.responses.length + 1, revision: revision.number, decision: action.decision, note, at: now };
    order.responses.push(response);
    order.history.push({ kind: 'responded', title: 'Kitchen response recorded', detail: note, responseId: response.id, revision: revision.number, at: now });
  } else if (action.type === 'acknowledge') {
    const response = currentResponse(order);
    if (!response || response.id !== action.responseId) throw new Error('The kitchen response changed. Read the latest response first.');
    if (isAcknowledged(order)) throw new Error('You have already read this response.');
    order.acknowledgements.push({ responseId: response.id, revision: revision.number, at: now });
    order.history.push({ kind: 'read', title: 'Diner read the response', detail: 'The diner acknowledged the current kitchen response.', revision: revision.number, at: now });
  } else if (action.type === 'complete') {
    const response = currentResponse(order);
    if (!response || response.decision !== 'accommodate' || !isAcknowledged(order)) throw new Error('A current accommodation response and diner acknowledgement are required.');
    order.completed = true;
    order.history.push({ kind: 'completed', title: 'Review completed', detail: 'The kitchen and diner have reviewed the same version of the request.', revision: revision.number, at: now });
  } else {
    throw new Error('Unknown action.');
  }
  return state;
}

export function exampleState() {
  return applyAction(createState(), { type: 'submit', mealId: 'bowl', allergies: ['Milk'], modifications: 'No cheese, please. Check whether the dressing contains milk.', question: 'Can you use clean utensils and a separate preparation surface?' });
}

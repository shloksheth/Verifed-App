// A short-lived draft survives opening an ingredient or editing dietary needs.
// Account/guest and restaurant keys keep different diners' selections apart.
// Nothing is sent to the restaurant or persisted after the app closes.
const drafts = new Map();

export function readChipotleDraft(key) {
  return [...(drafts.get(key) || [])];
}

export function saveChipotleDraft(key, ids) {
  drafts.set(key, [...ids]);
}

// Domain objects contain JSON values, so this copy works in Hermes and Node.
export const copy = (value) => JSON.parse(JSON.stringify(value));
let makeId = () => globalThis.crypto.randomUUID();
export function configureIdFactory(factory) {
  makeId = factory;
}
export const newId = () => makeId();

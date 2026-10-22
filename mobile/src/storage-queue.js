export function createSerialQueue() {
  let pending = Promise.resolve();
  return (task) => {
    const result = pending.then(task);
    pending = result.catch(() => {});
    return result;
  };
}

// Inject storage so ownership, persistence failures and ordering can be tested.
export function createScanLibrary(storage) {
  let pending = Promise.resolve();
  const key = (owner) => `verifed-menu-scans-v1:${owner}`;
  const read = async (owner) => {
    const value = await storage.getItem(key(owner));
    if (!value) return [];
    const records = JSON.parse(value);
    if (!Array.isArray(records))
      throw new Error("Saved menus could not be read.");
    return records
      .filter(
        (record) =>
          typeof record.id === "string" && Array.isArray(record.items),
      )
      .slice(0, 10);
  };
  const change = (owner, edit) => {
    const operation = pending.then(async () => {
      const records = edit(await read(owner));
      const text = JSON.stringify(records);
      if (text.length > 1_000_000)
        throw new Error("Saved menus are full. Delete an older menu first.");
      await storage.setItem(key(owner), text);
      return records;
    });
    pending = operation.catch(() => {});
    return operation;
  };
  return {
    read,
    save: (owner, menu) =>
      change(owner, (records) => {
        // Source-photo cache URIs are temporary; persist menu text, not a broken image link.
        const { photo, ...record } = menu;
        return [
          { ...record, savedAt: new Date().toISOString() },
          ...records.filter((item) => item.id !== record.id),
        ].slice(0, 10);
      }),
    remove: (owner, id) =>
      change(owner, (records) => records.filter((item) => item.id !== id)),
    clear: (owner) => {
      // Serialize against saves without reading possibly damaged saved JSON.
      const operation = pending.then(() => storage.removeItem(key(owner)));
      pending = operation.catch(() => {});
      return operation;
    },
  };
}

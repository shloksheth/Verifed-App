// Once the database confirms a write, a failed follow-up read must not invite a duplicate submission.
export async function finishCommittedWrite(value, refresh, warn) {
  try {
    await refresh();
  } catch (error) {
    warn(
      `Saved successfully, but the latest view could not load. Retry refresh. ${error.message}`,
    );
  }
  return value;
}

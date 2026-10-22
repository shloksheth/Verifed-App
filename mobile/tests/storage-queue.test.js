import test from "node:test";
import assert from "node:assert/strict";
import { createSerialQueue } from "../src/storage-queue.js";

test("rapid async writes preserve both edits instead of overwriting a stale read", async () => {
  const enqueue = createSerialQueue();
  let saved = [];
  const add = (value) =>
    enqueue(async () => {
      const draft = [...saved];
      await new Promise((resolve) => setTimeout(resolve, 2));
      draft.push(value);
      saved = draft;
    });
  await Promise.all([add("first"), add("second")]);
  assert.deepEqual(saved, ["first", "second"]);
});

test("a failed persistence operation does not block later edits", async () => {
  const enqueue = createSerialQueue();
  await assert.rejects(
    enqueue(async () => {
      throw new Error("disk full");
    }),
  );
  assert.equal(await enqueue(async () => "saved"), "saved");
});

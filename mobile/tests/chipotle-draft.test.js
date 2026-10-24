import test from "node:test";
import assert from "node:assert/strict";
import { readChipotleDraft, saveChipotleDraft } from "../src/chipotle-draft.js";

test("Chipotle drafts survive screen remounts without leaking between diners or restaurants", () => {
  const key = "guest:chipotle-one";
  const selected = ["rice", "beans"];
  saveChipotleDraft(key, selected);
  selected.push("not-saved");
  const reopened = readChipotleDraft(key);
  assert.deepEqual(reopened, ["rice", "beans"]);
  reopened.pop();
  assert.deepEqual(readChipotleDraft(key), ["rice", "beans"]);
  assert.deepEqual(readChipotleDraft("account-two:chipotle-one"), []);
  assert.deepEqual(readChipotleDraft("guest:chipotle-two"), []);
});

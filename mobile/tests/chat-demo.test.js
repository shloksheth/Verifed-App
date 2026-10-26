import test from "node:test";
import assert from "node:assert/strict";
import { addDemoMessage, chatScript } from "../src/chat-demo.js";

test("each input advances the same prepared reply sequence without interpreting the input", () => {
  let first = [], second = [];
  for (let turn = 0; turn < chatScript.length; turn++) {
    first = addDemoMessage(first, `Question ${turn}`);
    second = addDemoMessage(second, `Anything else ${turn}`);
    assert.equal(first.at(-1).content, chatScript[turn]);
    assert.equal(second.at(-1).content, first.at(-1).content);
  }
  assert.equal(addDemoMessage(first, "One more").at(-1).content, chatScript.at(-1));
});

test("empty input does not consume a reply and sending leaves existing messages intact", () => {
  const messages = [{ id: "welcome", role: "assistant", content: "Welcome" }];
  assert.equal(addDemoMessage(messages, "  "), messages);
  const next = addDemoMessage(messages, "  Hello  ");
  assert.equal(messages.length, 1);
  assert.equal(next[1].content, "Hello");
  assert.equal(next[2].content, chatScript[0]);
  assert.equal(addDemoMessage([], "x".repeat(700))[0].content.length, 600);
});

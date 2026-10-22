import test from "node:test";
import assert from "node:assert/strict";
import { dishes } from "../src/data.js";
import {
  makeRequest,
  transitionRequest,
  assessDish,
  rankDishes,
  makeDemoState,
} from "../src/domain.js";

const start = () =>
  makeRequest(
    dishes[0],
    { allergies: ["Milk"], question: "Separate utensils?" },
    "diner-a",
  );
const respond = (request) =>
  transitionRequest(
    request,
    "respond",
    {
      decision: "accommodate",
      message: "Separate utensils and dressing ingredients checked.",
    },
    "staff",
    request.revision,
  );
const acknowledge = (request) =>
  transitionRequest(
    request,
    "acknowledge",
    { responseId: request.response.id },
    "diner",
    request.revision,
  );

test("request snapshot does not change when source dish or input changes", () => {
  const dish = structuredClone(dishes[0]),
    input = { allergies: ["Milk"] };
  const request = makeRequest(dish, input, "diner");
  dish.ingredients.push("Cream");
  input.allergies.push("Soy");
  assert.deepEqual(request.snapshot.allergies, ["Milk"]);
  assert.ok(!request.snapshot.ingredients.includes("Cream"));
});
test("diner can acknowledge current response then complete", () => {
  const request = acknowledge(respond(start()));
  assert.equal(
    transitionRequest(request, "complete", {}, "diner", 1).status,
    "completed",
  );
});
test("ingredient change removes response and acknowledgment; preserves old snapshot", () => {
  const old = acknowledge(respond(start()));
  const next = transitionRequest(
    old,
    "change",
    { ingredients: ["Chicken", "Butter"], reason: "Supplier substitution" },
    "staff",
    1,
  );
  assert.equal(next.revision, 2);
  assert.equal(next.status, "review_required");
  assert.equal(next.response, null);
  assert.equal(next.acknowledgedResponseId, null);
  assert.ok(!next.events[0].snapshot.ingredients.includes("Butter"));
  assert.equal(old.status, "acknowledged");
  assert.throws(
    () => transitionRequest(next, "complete", {}, "diner", 2),
    /acknowledge/,
  );
});
test("stale revision cannot acknowledge a new response", () => {
  const old = respond(start()),
    changed = transitionRequest(
      old,
      "change",
      { reason: "New preparation" },
      "staff",
      1,
    ),
    next = respond(changed);
  assert.throws(
    () =>
      transitionRequest(
        next,
        "acknowledge",
        { responseId: old.response.id },
        "diner",
        1,
      ),
    /changed/,
  );
  assert.throws(
    () =>
      transitionRequest(
        next,
        "acknowledge",
        { responseId: old.response.id },
        "diner",
        2,
      ),
    /outdated/,
  );
});
test("replaced response in same revision invalidates old response ID", () => {
  const first = respond(start()),
    second = respond(first);
  assert.notEqual(first.response.id, second.response.id);
  assert.throws(
    () =>
      transitionRequest(
        second,
        "acknowledge",
        { responseId: first.response.id },
        "diner",
        1,
      ),
    /outdated/,
  );
});
test("staff must record a change before replacing acknowledged response", () => {
  assert.throws(
    () => respond(acknowledge(respond(start()))),
    /Record a change/,
  );
});
test("clarification can be answered and resubmitted with a new revision", () => {
  const question = transitionRequest(
    start(),
    "respond",
    { decision: "clarify", message: "Does this include milk derivatives?" },
    "staff",
    1,
  );
  const next = transitionRequest(
    question,
    "resubmit",
    { question: "Yes, including butter." },
    "diner",
    1,
  );
  assert.equal(next.status, "submitted");
  assert.equal(next.revision, 2);
  assert.equal(next.response, null);
});
test("decline is closed and cannot be acknowledged", () => {
  const declined = transitionRequest(
    start(),
    "respond",
    { decision: "decline", message: "We cannot accommodate this preparation." },
    "staff",
    1,
  );
  assert.throws(() => acknowledge(declined), /closed/);
});
test("cancelled and completed requests reject further edits", () => {
  const cancelled = transitionRequest(start(), "cancel", {}, "diner", 1);
  assert.throws(() => respond(cancelled), /closed/);
  const completed = transitionRequest(
    acknowledge(respond(start())),
    "complete",
    {},
    "diner",
    1,
  );
  assert.throws(
    () => transitionRequest(completed, "change", { reason: "x" }, "staff", 1),
    /closed/,
  );
});
test("diner cannot respond; staff cannot acknowledge", () => {
  assert.throws(
    () =>
      transitionRequest(
        start(),
        "respond",
        { decision: "accommodate", message: "x" },
        "diner",
        1,
      ),
    /permission/,
  );
  const request = respond(start());
  assert.throws(
    () =>
      transitionRequest(
        request,
        "acknowledge",
        { responseId: request.response.id },
        "staff",
        1,
      ),
    /permission/,
  );
});
test("response requires decision and message", () => {
  assert.throws(
    () =>
      transitionRequest(
        start(),
        "respond",
        { decision: "safe", message: "x" },
        "staff",
        1,
      ),
    /Choose/,
  );
  assert.throws(
    () =>
      transitionRequest(
        start(),
        "respond",
        { decision: "accommodate", message: " " },
        "staff",
        1,
      ),
    /Choose/,
  );
});
test("malformed arrays and non-text fields rejected before reaching staff UI", () => {
  for (const allergies of [{}, null, [{}], ["x".repeat(101)]])
    assert.throws(
      () => makeRequest(dishes[0], { allergies }, "x"),
      /Invalid list/,
    );
  assert.throws(
    () => transitionRequest(start(), "resubmit", { question: {} }, "diner", 1),
    /Invalid text/,
  );
});
test("catalog rename updates active snapshot and retains old event", () => {
  const next = transitionRequest(
    start(),
    "change",
    { dishName: "New bowl", reason: "Menu update" },
    "staff",
    1,
  );
  assert.equal(next.dishName, "New bowl");
  assert.equal(next.snapshot.dishName, "New bowl");
  assert.equal(next.events[0].snapshot.dishName, dishes[0].name);
});
test("known allergy conflict always ranks behind a taste match without known conflict", () => {
  const profile = {
    allergies: ["Milk"],
    likes: ["Creamy", "Herby"],
    restrictions: [],
    dislikes: [],
  };
  assert.equal(assessDish(dishes[2], profile).level, "conflict");
  assert.equal(rankDishes([dishes[2], dishes[0]], profile)[0].id, dishes[0].id);
});
test("missing restriction and unconfirmed ingredients are unknown, never safe", () => {
  assert.equal(
    assessDish(dishes[0], { restrictions: ["Vegan"] }).level,
    "unknown",
  );
  assert.equal(assessDish(dishes[7], {}).level, "unknown");
  assert.equal(assessDish(dishes[0], {}).level, "review");
});
test("demo fixtures are independent on reset", () => {
  const first = makeDemoState();
  first.dishes[0].ingredients.push("changed");
  assert.ok(!makeDemoState().dishes[0].ingredients.includes("changed"));
});
test("high ratings teach a bounded taste preference without outranking allergy conflicts", () => {
  const profile = { allergies: ["Milk"], likes: [], dislikes: [] };
  const meals = [{ rating: 5, tags: ["Creamy", "Herby"] }];
  assert.ok(
    assessDish(dishes[2], profile, meals).tasteScore >
      assessDish(dishes[2], profile).tasteScore,
  );
  assert.equal(
    rankDishes([dishes[2], dishes[0]], profile, meals)[0].id,
    dishes[0].id,
  );
  assert.ok(assessDish(dishes[2], profile, meals).learnedReasons.length > 0);
});
test("explicit taste dislikes outweigh learned positive ratings", () => {
  const assessment = assessDish(dishes[2], { dislikes: ["Creamy"] }, [
    { rating: 5, tags: ["Creamy", "Herby"] },
  ]);
  assert.ok(assessment.tasteScore < 0);
  assert.ok(
    !assessment.learnedReasons.some((reason) => reason.includes("creamy")),
  );
});

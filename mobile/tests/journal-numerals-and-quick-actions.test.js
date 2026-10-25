import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const navigation = readFileSync(new URL("../components/FloatingNavigation.js", import.meta.url), "utf8");
const journal = readFileSync(new URL("../components/Journal.js", import.meta.url), "utf8");

test("the plus action saves a meal using the existing journal composer, without a duplicate entry", () => {
  const saveActions = navigation.match(/label: "Save a meal", icon: "create-outline", action: "meal"/g) || [];
  assert.equal(saveActions.length, 1);
  assert.doesNotMatch(navigation, /label: "Log a meal"/);
  assert.match(navigation, /if \(action === "meal"\)\s*\{\s*openSheet\(\{ type: "meal" \}\)/);
  assert.match(journal, /api\.saveMeal\(\{/);
  assert.match(journal, /<Sheet title=\{entry \? "Edit meal" : "Save a meal"\} onClose=\{onClose\}>/);
});

test("journal summary numerals use a readable tabular medium-weight face and larger hierarchy", () => {
  const styles = journal.split("const j = StyleSheet.create({")[1];
  assert.ok(styles, "journal style definition missing");
  const expectStyle = (name) => {
    const section = styles.match(new RegExp("^  " + name + ": \\{([\\s\\S]*?)^  \\},", "m"));
    assert.ok(section, "missing number style: " + name);
    assert.match(section[1], /fontFamily: "HomeMedium"/);
    assert.match(section[1], /fontWeight: "500"/);
    assert.match(section[1], /fontVariant: \["tabular-nums"\]/);
    return section[1];
  };
  assert.match(expectStyle("count"), /fontSize: 34/);
  assert.match(expectStyle("filterCount"), /fontSize: 12/);
  assert.match(expectStyle("ratingNumber"), /fontSize: 13/);
  assert.match(expectStyle("detailRatingValue"), /fontSize: 21/);
  assert.match(journal, /<Text style=\{j\.detailRatingValue\}>\{entry\.rating\}\/5<\/Text>/);
});

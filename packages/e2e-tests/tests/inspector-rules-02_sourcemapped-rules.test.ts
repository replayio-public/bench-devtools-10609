import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  checkAppliedRules,
  getElementsListRow,
  openElementsPanel,
  selectElementsListRow,
  toggleElementsListRow,
} from "../helpers/elements-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_inspector_sourcemapped.html" });

test("inspector-rules-02: Sourcemapped rules should be viewed", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");

  await openElementsPanel(page);
  const bodyLocator = await getElementsListRow(page, { text: "body", type: "opening" });
  await toggleElementsListRow(page, bodyLocator, true);

  await selectElementsListRow(page, { text: "maindiv" });
  await checkAppliedRules(page, [
    {
      selector: "div",
      source: "styles.css:2",
      properties: [{ text: "background-color: blue;", overridden: false }],
    },
  ]);
});

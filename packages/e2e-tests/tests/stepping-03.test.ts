import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import {
  reverseStepOverToLine,
  rewindToLine,
  stepOverToLine,
} from "../helpers/pause-information-panel";
import { clickSourceTreeNode } from "../helpers/source-explorer-panel";
import { addBreakpoint } from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "doc_rr_basic.html" });

test(`stepping-03: Stepping past the beginning or end of a frame should act like a step-out`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  // Open doc_rr_basic.html
  await clickSourceTreeNode(page, "recording");
  await clickSourceTreeNode(page, "test/examples");
  await clickSourceTreeNode(page, exampleKey);

  await addBreakpoint(page, { lineNumber: 20, url: exampleKey });

  await rewindToLine(page, 20);
  await executeAndVerifyTerminalExpression(page, "number", "10");
  await reverseStepOverToLine(page, 19);
  await reverseStepOverToLine(page, 11);

  // After reverse-stepping out of the topmost frame we should rewind to the
  // last breakpoint hit.
  await reverseStepOverToLine(page, 20);
  await executeAndVerifyTerminalExpression(page, "number", "9");

  // TODO [RUN-3271] Chromium currently requires an extra step here
  await stepOverToLine(page, 20);
  await stepOverToLine(page, 21);
  await stepOverToLine(page, 21);
  await stepOverToLine(page, 12);
  await stepOverToLine(page, 16);
  // TODO [RUN-3271] Chromium currently requires an extra step here
  await stepOverToLine(page, 16);
  await stepOverToLine(page, 17);

  // After forward-stepping out of the topmost frame we should run forward to
  // the next breakpoint hit.
  await stepOverToLine(page, 20);
  await executeAndVerifyTerminalExpression(page, "number", "10");
});

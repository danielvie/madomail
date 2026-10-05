const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const elements = [];
const panels = [];
const C = { ink: '#243348', muted: '#65748a', line: '#ccd5e1', paper: '#ffffff', bg: '#f5f7fb', blue: '#e8f0ff', blueInk: '#305ca5', green: '#e6f4ed', greenInk: '#246447', red: '#fceceb', redInk: '#a13e39', amber: '#fff5dc', labelGreen: '#076239', purple: '#e4d7f5', purpleInk: '#41236d' };
let group = null;
function element(type, x, y, width, height, extra = {}) {
  const n = elements.length + 1;
  const e = { id: `classify-${n}`, type, x, y, width, height, angle: 0, strokeColor: C.line, backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, groupIds: group ? [group] : [], frameId: null, roundness: null, seed: n * 7919, version: 1, versionNonce: n * 3571, isDeleted: false, boundElements: null, updated: 1, link: null, locked: false, ...extra };
  elements.push(e);
  return e;
}
function box(x, y, w, h, fill = C.paper, stroke = C.line) {
  return element('rectangle', x, y, w, h, { backgroundColor: fill, strokeColor: stroke });
}
function text(x, y, value, size = 18, color = C.ink) {
  const lines = value.split('\n');
  // ponytail: conservative text estimates, not font shaping. Use Excalidraw metrics for pixel-exact exports.
  return element('text', x, y, Math.max(...lines.map(s => s.length)) * size * 0.62, lines.length * size * 1.25, { text: value, originalText: value, fontSize: size, fontFamily: 5, textAlign: 'left', verticalAlign: 'top', containerId: null, autoResize: true, lineHeight: 1.25, strokeColor: color });
}
function button(x, y, w, value, fill = C.paper, color = C.ink) {
  const b = box(x, y, w, 36, fill);
  b.roundness = { type: 3 };
  const t = text(x + 12, y + 8, value, 16, color);
  assert(t.width <= w - 24, `Button too narrow: ${value}`);
}
function badge(x, y, value, fill = C.green, color = C.greenInk) {
  const w = value.length * 16 * 0.62 + 20;
  const b = box(x, y, w, 28, fill, fill);
  b.roundness = { type: 3 };
  text(x + 10, y + 4, value, 16, color);
  return w;
}
function check(x, y, on = false) {
  box(x, y, 18, 18, on ? C.greenInk : C.paper);
  if (on) text(x + 4, y - 1, 'x', 16, C.paper);
}
function arrow(x, y, dx, dy) {
  return element('arrow', x, y, Math.abs(dx), Math.abs(dy), { strokeColor: C.blueInk, strokeWidth: 2, points: [[0, 0], [dx, dy]], startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: 'arrow', elbowed: false });
}
function panel(id, x, y, w, h, title) {
  group = id;
  panels.push({ id, x, y, width: w, height: h });
  box(x, y, w, h);
  if (title) text(x + 24, y + 22, title, 26);
}
function section(y, title, subtitle) {
  group = null;
  text(40, y, title, 30);
  text(40, y + 44, subtitle, 20, C.muted);
}
function lines(x, y, values, size = 20, step = 38) {
  values.forEach((value, i) => text(x, y + i * step, value, size));
}

text(40, 28, 'Mado Mail / hover actions, context menu and drag-to-staging', 36);
text(40, 86, 'Combined direction: 02 + 04 + 05. Existing Gmail labels appear before subjects. Synthetic messages. Design only.', 20, C.muted);
text(40, 126, 'Assumptions: labels are read-only; Auto-apply is OFF in these examples. Interaction defaults below remain proposals.', 18, C.muted);

panel('workspace', 40, 200, 2320, 810);
box(40, 200, 2320, 60, C.bg);
button(60, 212, 270, 'Filter messages...', C.paper, C.muted);
button(344, 212, 124, 'Run query');
button(482, 212, 94, 'Rules');
button(590, 212, 108, 'Refresh');
text(730, 222, '22 messages / 6 senders', 18, C.muted);
text(1760, 222, 'Auto-apply OFF', 18, C.muted);
button(2050, 212, 288, 'Theme: Light');
box(40, 260, 2320, 40, C.bg);
text(60, 271, 'Preview preserves unread status. Archive and Trash stay pending until Apply.', 18, C.muted);
box(40, 300, 1220, 44, C.bg);
text(114, 313, 'SENDER', 16, C.muted);
text(378, 313, 'LABELS / SUBJECT', 16, C.muted);
text(1176, 313, 'DATE', 16, C.muted);
const rows = [
  ['Office of the Pres.', '1', 'ESTUDOS/UW University', 'State of the University', 'Today'],
  ['Ada Chen', '3', 'Projects 2/3', 'Review notes', '10:30'],
  ['Studio digest', '12', 'Newsletters', 'Weekly...', 'Today'],
  ['Calendar', '4', '', 'Event reminders', 'Today'],
  ['Travel', '1', 'Travel', 'Itinerary...', 'Mon'],
  ['Reports', '1', 'Finance', 'Monthly...', 'Mon'],
];
rows.forEach(([sender, count, label, subject, date], i) => {
  const y = 344 + i * 64;
  box(40, y, 1220, 64, i === 1 ? C.blue : C.paper);
  if (i === 1) box(40, y, 4, 64, C.blueInk, C.blueInk);
  check(60, y + 23);
  if (Number(count) > 1) text(88, y + 20, '>', 18, C.muted);
  text(114, y + 20, sender, 18);
  text(336, y + 22, count, 16, C.muted);
  let subjectX = 378;
  if (label) subjectX += badge(subjectX, y + 18, label, i === 0 ? C.labelGreen : C.green, i === 0 ? C.paper : C.greenInk) + 14;
  text(subjectX, y + 22, subject, 16);
  if (i === 0) text(1176, y + 22, date, 16, C.muted);
  if (i === 1) {
    button(928, y + 14, 114, 'Archive', C.green, C.greenInk);
    button(1052, y + 14, 96, 'Trash', C.red, C.redInk);
    button(1158, y + 14, 80, '...');
  }
  // The open context menu covers the date cells on subsequent rows.
});
// Same menu for the overflow button, right-click and Shift+F10. Row-local scope.
box(792, 478, 446, 310, C.paper, C.blueInk);
text(812, 494, 'ADA CHEN / 3 MESSAGES', 18, C.muted);
text(812, 536, 'Archive these 3 messages', 18, C.greenInk);
text(812, 574, 'Trash these 3 messages', 18, C.redInk);
box(812, 611, 406, 1, C.line);
text(812, 628, 'Sender rule...', 18);
text(812, 670, 'Expand messages', 18);
text(812, 712, 'Select these 3 messages', 18);
text(812, 754, 'Esc to close', 16, C.muted);
text(64, 814, 'Hover / focus: Archive, Trash, ...', 20, C.blueInk);
text(64, 852, 'No action column. No Always buttons on each row.', 18, C.muted);
text(64, 890, 'Labels remain visible; the subject truncates before controls.', 18, C.muted);
text(64, 928, 'The open menu stays attached to its target, not the pointer.', 18, C.muted);

box(1260, 300, 8, 660, C.line);
box(1268, 300, 632, 660);
box(1268, 300, 632, 44, C.bg);
text(1292, 313, 'PREVIEW / 1 MESSAGE', 18, C.blueInk);
text(1292, 382, 'Review notes', 28);
text(1292, 430, 'Ada Chen <ada@example.test>', 18);
badge(1292, 474, 'Projects');
text(1292, 526, 'Today, 10:30 / unread unchanged', 18, C.muted);
box(1268, 578, 632, 54, C.bg);
text(1292, 596, 'Remote images allowed', 18, C.muted);
button(1704, 587, 172, 'Block images');
text(1292, 674, 'Hi,\n\nHere are the notes for our next review.\nPlease check the updated dates.\n\nThanks,\nAda', 20);
text(1292, 922, 'Reading and checking remain separate.', 18, C.muted);

box(1900, 300, 8, 660, C.line);
box(1908, 300, 452, 660, C.bg);
text(1932, 316, 'STAGING / 3 PENDING', 20);
box(1932, 366, 404, 220, C.green, C.greenInk);
text(1952, 384, 'To archive / 2', 22, C.greenInk);
text(1952, 435, 'Digest / 2', 18);
button(2200, 425, 114, 'Put back');
text(1952, 504, 'Drop messages here', 18, C.greenInk);
text(1952, 542, 'Creates pending Archive marks', 16, C.muted);
box(1932, 608, 404, 220, C.red, C.redInk);
text(1952, 626, 'To trash / 1', 22, C.redInk);
text(1952, 677, 'Offers / 1', 18);
button(2200, 667, 114, 'Put back');
text(1952, 746, 'Drop messages here', 18, C.redInk);
text(1952, 784, 'Trash is not permanent deletion', 16, C.muted);
button(1932, 884, 404, 'Apply / 2 Archive, 1 Trash', C.green, C.greenInk);
box(40, 960, 2320, 50, C.bg);
text(64, 977, 'Row: read / expand     Checkbox: select     Drag: move to a bin     Right-click: menu', 18, C.muted);
button(1986, 967, 166, 'Reader: on', C.blue, C.blueInk);
button(2166, 967, 170, 'Staging: on', C.blue, C.blueInk);

section(1070, '02  Drag feedback and label display', 'Keep the list quiet. Show the target and message count only when the interaction needs them.');
panel('drag-detail', 40, 1160, 1136, 540, 'Drag a checked batch');
box(64, 1228, 432, 152, C.bg);
check(84, 1252, true); text(120, 1248, 'Ada Chen / 3 messages', 18);
check(84, 1310, true); text(120, 1306, 'Travel / 1 message', 18);
box(538, 1242, 262, 94, C.blue, C.blueInk);
text(556, 1256, '4 messages', 22, C.blueInk);
text(556, 1298, '2 senders', 18, C.muted);
arrow(808, 1286, 68, 0);
box(886, 1228, 266, 152, C.green, C.greenInk);
text(904, 1248, 'To archive', 22, C.greenInk);
text(904, 1294, 'Release to stage 4', 18, C.greenInk);
text(904, 1336, 'Drop target active', 16, C.muted);
lines(64, 1416, [
  'Checked row drag: all checked messages, deduplicated by message ID.',
  'Unchecked row drag: only that row; a sender group includes its messages.',
  'Badge follows the pointer. Highlight only the hovered bin.',
  'Drop outside / Esc: no change. Drag does not open a message.',
  'Hidden staging: use its dock toggle first; no automatic pane opening.',
  'Auto-apply ON: say "Release to archive/trash N now" before dropping.',
], 18, 40);

panel('label-detail', 1224, 1160, 1136, 540, 'Existing Gmail labels, before the subject');
badge(1248, 1232, 'ESTUDOS/UW University', C.labelGreen, C.paper);
text(1498, 1236, 'State of the University', 20);
text(1248, 1284, 'One message: show its own labels, with their Gmail names.', 18, C.muted);
badge(1248, 1336, 'Projects 2/3');
badge(1404, 1336, 'Studies 1/3', C.purple, C.purpleInk);
badge(1550, 1336, '+2', C.bg, C.muted);
text(1614, 1340, 'Review notes', 20);
lines(1248, 1400, [
  'Sender group: combine labels across the messages represented by that row.',
  '2/3 means two of the three messages have that label. All three: omit count.',
  'At most two badges, then +N. Narrow rows show fewer, never wrap.',
  'Use a shared width budget so labels do not consume the subject.',
  'Hover / focus reveals full names, counts and overflow labels.',
  'Show user labels only; hide INBOX, UNREAD and other system labels.',
  'Read-only badges. No assigning, deleting or filtering labels in this change.',
], 18, 38);

section(1760, '03  Interaction contract', 'Chosen mechanisms: hover/focus actions + context menu + drag-to-staging. Details below define the proposed behavior.');
panel('actions', 40, 1850, 744, 398, 'Action targets');
lines(64, 1920, [
  'Hover Archive / Trash always acts on that row.',
  'The row menu uses the same row-local scope.',
  'Menu header states sender and message count.',
  'Bulk toolbar remains available when boxes are checked.',
  'A drag from a checked row uses the checked batch.',
  'Sender rule opens a prefilled editor for one sender.',
  'Confirming saves the rule and acts on current matches.',
  'No drag or ordinary Archive/Trash creates a rule.',
], 18, 36);
panel('input', 828, 1850, 744, 398, 'Mouse, keyboard and focus');
lines(852, 1920, [
  'Hover OR keyboard focus reveals row controls.',
  'Keep controls visible while their menu is open.',
  '... / right-click / Shift+F10 opens the same menu.',
  'Right-click does not read or change checkmarks.',
  'Arrows navigate the menu; Enter acts; Esc closes.',
  'Tab reaches controls; restore row focus on close.',
  'Click reads/expands; drag starts after a threshold.',
  'Checkboxes and buttons never initiate row dragging.',
], 18, 36);
panel('safety', 1616, 1850, 744, 398, 'Preserve existing behavior');
lines(1640, 1920, [
  'OFF: choices stage; Apply writes to Gmail.',
  'ON: choices submit immediately, including drops.',
  'Keep unread status, retry and unknown-write guards.',
  'Disable actions and drops while writes are blocked.',
  'Keep reader content and scroll through menu/drag use.',
  'Put back cancels a pending mark, not a Gmail write.',
  'Right-click is now for menus, not range selection.',
  'Label lookup failure must not block mail triage.',
], 18, 36);

section(2320, '04  Implementation instructions', 'Work in the Rust GPUI app. Implement after design approval; no application code changes are included in this diagram.');
panel('impl-data', 40, 2410, 1136, 550, '1  Load and resolve label metadata');
lines(64, 2486, [
  'File: gpui-poc/src/gmail.rs',
  'Add label_ids to Email and deserialize Message.labelIds with a default.',
  'Keep those IDs when Message::into_email builds the Inbox model.',
  'Fetch users.labels.list once per refresh, not once per message.',
  'Build an ID -> name / type / visibility catalog; reuse the current auth.',
  'The list response does NOT include colors. Fetch users.labels.get for',
  'relevant user labels to resolve textColor and backgroundColor.',
  'Cache by label ID within the account/session; bound concurrent requests.',
  'Use neutral badges until colors load; cached names survive transient errors.',
  'Unknown IDs need a label-unavailable hint, not silent data loss.',
  'Respect messageListVisibility=hide. Refresh metadata to pick up changes.',
], 18, 36);
let source = text(64, 2906, 'API reference: users.labels.list and users.labels.get', 16, C.blueInk);
source.link = 'https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/list';

panel('impl-layout', 1224, 2410, 1136, 550, '2  Render badges and contextual controls');
lines(1248, 2486, [
  'Files: gpui-poc/src/main.rs and gpui-poc/src/triage.rs',
  'In row(), remove the fixed 250/142 px THIS / ALWAYS column.',
  'Place a capped badge strip before subject text; remaining subject truncates.',
  'For groups, derive label counts from row.ids, not from the whole sender.',
  'Use stable label ordering; show at most two badges and a +N overflow.',
  'Truncate long names; full text/counts must be available on hover and focus.',
  'Use valid Gmail colors with readable contrast; neutral fallback if needed.',
  'Overlay Archive / Trash / ... at the row end, without shifting columns.',
  'Reveal on hover/focus/menu-open; ensure controls are keyboard reachable.',
  'Keep sender text visible while reading. Do not replace it with "Reading".',
  'Update demo Email constructors and show labels in the preview header too.',
], 18, 36);

panel('impl-events', 40, 2992, 1136, 600, '3  Route menu and drop actions through existing commands');
lines(64, 3068, [
  'File: gpui-poc/src/main.rs; row(), bins(), stage(), Command and table_key()',
  'Store menu row key, message IDs and anchor. Clamp popup to the viewport.',
  'Dismiss on outside click/Esc; close if refresh/filter invalidates the row.',
  'Archive/Trash reuse Command::Stage; extend rule editor with sender-create mode.',
  'Only that confirmation uses Always save-and-stage; Rules edits stay local.',
  'Resolve stable IDs at execution; do not retarget a menu to a newer hover.',
  'Use installed GPUI drag/drop APIs; verify signatures in the pinned source.',
  'Drag payload is message IDs plus count, never message bodies or HTML.',
  'If the dragged row is fully checked, snapshot the checked set; else row.ids.',
  'Deduplicate IDs. Revalidate against undecided messages before a drop.',
  'Archive/Trash bins call the existing stage() path once with those IDs.',
  'Do not bypass busy/unknown guards or settings.auto_apply; cancel safely.',
  'No new global shortcut mode and no replacement of the preview WebView.',
  'Verify native reader bounds/focus do not swallow a drag crossing the pane.',
], 18, 36);

panel('impl-tests', 1224, 2992, 1136, 600, '4  Add checks, then verify on Windows');
lines(1248, 3068, [
  'Files: triage.rs tests, gmail.rs tests, triage_check.rs and demo fixtures',
  'Labels: none, multiple, hidden/system, mixed groups, unknown IDs, long names.',
  'Mock label list/get: verify colors use get; failures keep triage available.',
  'Targets: row actions ignore other checked mail; group/child IDs deduplicate.',
  'Drags: unchecked row vs checked batch, partial group, stale IDs and cancel.',
  'Writes: OFF stages; ON submits; failures/unknown states remain guarded.',
  'Menus: .../right-click/Shift+F10 agree; Esc/focus restore; edge placement.',
  'Smoke test: hover/Tab, label overflow, each drop bin, outside drop and resize.',
  'Check minimum width, light/dark contrast and drag across the native reader.',
  'Run: task test',
  'Run: task check-triage',
  'Run: task demo, then manually verify the combined interactions.',
  'Acceptance: no repeated action column; labels visible; each action runs once.',
], 18, 36);

group = null;
text(40, 3640, 'Not included: label editing, Gmail filters, automatic classification, new keyboard triage mode, or automatic staging-pane expansion.', 20, C.muted);
source = text(40, 3690, 'Gmail label resource and color fields', 18, C.blueInk);
source.link = 'https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels';
source = text(780, 3690, 'Gmail label details API', 18, C.blueInk);
source.link = 'https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/get';

// Runnable checks protect editable scene structure and label layout.
assert.equal(new Set(elements.map(e => e.id)).size, elements.length);
const texts = elements.filter(e => e.type === 'text');
for (const e of elements) {
  assert(Number.isFinite(e.x) && Number.isFinite(e.y));
  assert(e.width >= 0 && e.height >= 0);
  if (e.type === 'text') { assert.equal(e.fontFamily, 5); assert(e.fontSize >= 16); }
  if (e.groupIds.length) {
    const bounds = panels.find(p => p.id === e.groupIds[0]);
    assert(bounds, `Missing panel: ${e.id}`);
    assert(e.x >= bounds.x && e.y >= bounds.y && e.x + e.width <= bounds.x + bounds.width && e.y + e.height <= bounds.y + bounds.height, `Outside panel: ${e.text || e.id}`);
  }
}
for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
  const a = texts[i], b = texts[j];
  assert(!(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y), `Text overlap: ${a.text} / ${b.text}`);
}
for (const required of ['Combined direction: 02 + 04 + 05.', 'ESTUDOS/UW University', '04  Implementation instructions', 'Auto-apply ON:', 'users.labels.get']) {
  assert(texts.some(e => e.text.includes(required)), `Missing requirement: ${required}`);
}
const scene = { type: 'excalidraw', version: 2, source: 'https://excalidraw.com', elements, appState: { viewBackgroundColor: C.bg, gridSize: null }, files: {} };
const output = path.join(__dirname, 'mado-mail-classification-options.excalidraw');
fs.writeFileSync(output, JSON.stringify(scene, null, 2) + '\n');
assert.equal(JSON.parse(fs.readFileSync(output, 'utf8')).elements.length, elements.length);
console.log(`${output}: ${elements.length} editable elements; combined workspace, labels, interaction contract and implementation instructions; IDs, JSON, bounds, fonts and text overlaps checked.`);

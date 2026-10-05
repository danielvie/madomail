# Gmail label display

## Scope

Exploration only. No application changes or Gmail requests using the user's account. The reference image shows a colored user label before the subject. The proposal is read-only label display, not label creation, assignment, filtering, or removal.

## Current data and UI

The app already fetches each Inbox message using `format=metadata`. Google documents this format as including message IDs, labels, and headers. However, the Rust `Message` and `Email` types do not retain `labelIds`, and `Message::into_email` cannot pass them to the UI. Label membership therefore needs parsing, not another request per message. [Code: Gmail models and fetching](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/gpui-poc/src/gmail.rs), [Gmail formats](https://developers.google.com/workspace/gmail/api/reference/rest/v1/Format).

The app groups messages by sender address, not by Gmail thread. A group may contain unrelated messages with different labels. The wide row has a subject column; the compact row puts the subject below the sender. Active-message highlighting and bulk-checkbox highlighting already have distinct meanings. [Grouping](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/gpui-poc/src/triage.rs), [Row rendering](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/gpui-poc/src/main.rs).

## Recommended presentation

These are design recommendations, not approved implementation details.

- Show small colored chips immediately before the subject, as in Gmail. In compact rows, keep them on the subject line below the sender. Do not replace existing text or recolor the whole row.
- Limit the chip area so the subject remains readable. Show one or two chips as space permits, followed by `+N` for overflow. Do not grow every row to accommodate wrapping labels.
- Show full label names in tooltips and a wrapping label list in the native reader header. The reader provides a keyboard-reachable way to inspect overflow without relying on hover.
- Keep hierarchical names such as `ESTUDOS/UW University`. Truncate visually when needed, but preserve the complete name in the tooltip and reader.
- Chips are informational. Clicking the row, including a chip, still reads the message. Only the checkbox gutter marks bulk targets. Do not add label filtering or mutation to chip clicks in this iteration.
- Start with user labels. Omit system labels such as `INBOX`, `UNREAD`, `IMPORTANT`, and categories from the chip strip. Respect `messageListVisibility: hide` for row chips; show all user labels in the reader details. `labelListVisibility` concerns Gmail's label sidebar, not message-row badges. [Label resource and visibility enums](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels).
- Use Gmail's background and text color pair when available. Validate the colors and use readable theme-based fallback styling when missing or unusable. Badge colors must not change the displayed-message or checked-item indicators.

A dedicated label column is possible, but it takes space even for unlabeled messages and makes the three-pane layout tighter. Whole-row label colors would conflict with the current reading highlight and cannot represent multiple labels clearly.

## Sender groups need explicit semantics

Do not copy the first message's labels onto the group header. That would falsely attribute those labels to other messages.

Recommended summary: the union of labels, with counts among the messages represented by that row. For example, `University 2/3` means two of the group's three visible undecided messages carry that label. Apply the same chip-width budget. Individual child rows and the reader show exact message labels, without group counts.

The simpler alternative is no label chips on group headers, only on individual messages. This avoids aggregation but hides useful information while groups are collapsed. Counts would change when filtering or staging changes the messages represented by a group. The denominator must describe that visible group, not every message from the sender in Gmail. [Current grouping/filtering](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/gpui-poc/src/triage.rs).

## Gmail API requirements

1. Retain each message's `labelIds` from the existing metadata response. IDs identify membership; display names belong to the label catalog. [Message resource](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages).
2. Fetch `users.labels.list` to map label IDs to names, types, and visibility settings. The documented list response does **not** include colors. [List labels](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/list).
3. Fetch `users.labels.get` for distinct user labels needed by loaded messages to obtain color details. Cache by label ID within the current account, not per message. Colors are documented only for user labels. [Get label](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/get), [Label colors](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels#Color).
4. Reuse the existing authorized request path. The current `gmail.modify` scope already permits both label endpoints; no additional consent scope is needed. These display operations use GET only. [Existing authorization](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/gpui-poc/src/gmail.rs), [List scopes](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/list), [Get scopes](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/get).

The additional request cost is one catalog request plus up to one detail request per distinct relevant user label for a cold cache, not one request per message. Neutral chips can appear while colors load. Keep label fetching bounded; do not fetch details for every unused label in the mailbox. Refresh metadata on connect and explicit Refresh so renames, deletions, and color changes do not stay stale indefinitely.

## Likely implementation areas

- `gpui-poc/src/gmail.rs`: label IDs, catalog/detail models, authorized reads, and synthetic HTTP checks.
- `gpui-poc/src/main.rs`: account-scoped label catalog, row chips, overflow, and group summaries.
- `gpui-poc/src/reader.rs`: full labels in the native header, outside the email HTML.
- `gpui-poc/src/triage.rs`: group-label counts if that design is selected, plus synthetic fixtures.

Keep label IDs on messages and definitions keyed by ID. A rename or color change should not require treating a label as a new label. Do not persist credentials or duplicate the catalog in theme settings.

## Checks before shipping

- No labels, multiple labels, missing colors, missing catalog entries, long names, and nested names.
- Mixed labels within one sender group; correct counts after filtering and staging.
- Wide and compact rows preserve a usable subject area.
- Reading and checkbox behavior do not change when clicking label chips.
- Label lookup failures do not prevent Inbox loading or reading. Retain known metadata where possible and distinguish unavailable labels from an unlabeled message.
- GET-only label requests; no unread changes, Gmail writes, or new consent flow.
- Account changes cannot reuse another account's label definitions.

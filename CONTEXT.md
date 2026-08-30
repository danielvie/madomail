# Mado Mail

This context defines the language of Mado Mail's inbox-triage workspace. It separates individual Gmail messages and their temporary pending actions from saved sender rules.

## Inbox and messages

**Inbox**:
The current set of Gmail messages that Mado Mail presents for triage. It is narrower than all mail because it contains messages currently in Gmail's Inbox.
_Avoid_: All mail, mailbox

**Email message**:
One Gmail message represented in the workspace, with a sender, subject, date, short preview, and readable body content.
_Avoid_: Thread, conversation (unless referring specifically to Gmail's grouping)

**Sender**:
The person or address shown in a message's From field. Sender text is also the value against which sender rules are matched.
_Avoid_: Account, recipient

**Snippet**:
The short message preview supplied by Gmail and used for quick scanning and compact peeks.
_Avoid_: Message body

**Message body**:
The readable content of an email message used when the user expands an email peek.
_Avoid_: Snippet, attachment

## Triage

**Selection**:
The temporary set of email messages currently chosen for a triage command.
_Avoid_: Mark

**Mark**:
A temporary pending instruction attached to an email message: Archive or Delete. A mark is not yet applied to Gmail.
_Avoid_: Gmail label, sender rule

**Marked message**:
An email message that has a pending mark and is waiting to be applied or cleared.
_Avoid_: Marked item

**Archive**:
A triage action that removes a message from the Inbox without placing it in Gmail's Trash.
_Avoid_: Delete

**Delete**:
A triage action that moves a message to Gmail's Trash. It is not a permanent deletion.
_Avoid_: Archive

**Apply all**:
The command that sends every pending mark to Gmail and completes the corresponding triage actions.
_Avoid_: Save, Run query

**Auto-apply**:
A preference that sends an Archive or Delete action to Gmail immediately after the user selects messages, instead of creating pending marks.
_Avoid_: Apply all

**Unmark**:
The act of clearing pending marks without changing Gmail.
_Avoid_: Undo, Delete

## Saved sender rules

**Sender rule**:
A saved instruction consisting of sender text and an Archive or Delete action. When a rule query runs, it matches Inbox messages whose sender contains that text without regard to letter case.
_Avoid_: Marked item, Gmail filter

**Rule query**:
An operation that refreshes the Inbox and creates pending marks for messages matched by the saved sender rules. Running a rule query does not itself change Gmail.
_Avoid_: Gmail search, Apply all

**Rule list**:
The view where saved sender rules can be filtered, edited, or removed.
_Avoid_: Inbox, marked-message list

## Preview

**Email peek**:
A non-destructive preview of the email message associated with the row currently under the Ctrl-hover interaction. It shows the snippet in compact mode and the message body in expanded mode; opening a peek is not opening the message in Gmail.
_Avoid_: Message reader, Gmail window

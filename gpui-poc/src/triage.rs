use crate::gmail::Email;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Action {
    Archive,
    Trash,
    Space(u64),
}
impl Action {
    pub fn label(self) -> &'static str {
        match self {
            Self::Archive => "Archive",
            Self::Trash => "Trash",
            Self::Space(_) => "Space",
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Rule {
    pub id: String,
    pub from: String,
    pub action: Action,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Work {
    pub id: String,
    pub action: Action,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub label_ids: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Outcome {
    Confirmed,
    Failed(String),
    Unknown(String),
}
#[derive(Clone, Debug)]
pub struct Mark {
    pub action: Action,
    pub label_ids: Vec<String>,
    pub outcome: Option<Outcome>,
}

#[derive(Clone, Debug)]
pub struct Row {
    pub key: String,
    pub sender: String,
    pub ids: Vec<String>,
    pub header: bool,
    pub child: bool,
    pub unread: bool,
}

pub fn sender_address(from: &str) -> String {
    from.split_once('<')
        .and_then(|(_, tail)| tail.rsplit_once('>').map(|(address, _)| address))
        .unwrap_or(from)
        .trim()
        .to_lowercase()
}
pub fn sender_name(from: &str) -> &str {
    let name = from.split('<').next().unwrap_or(from).trim();
    if name.is_empty() { from } else { name }
}
pub fn rule_for<'a>(rules: &'a [Rule], from: &str) -> Option<&'a Rule> {
    let from = from.to_lowercase();
    rules
        .iter()
        .find(|r| !r.from.trim().is_empty() && from.contains(&r.from.trim().to_lowercase()))
}

#[derive(Default)]
pub struct Triage {
    pub emails: Vec<Email>,
    pub marks: BTreeMap<String, Mark>,
    pub selection: BTreeSet<String>,
    pub expanded: BTreeSet<String>,
    pub label_filter: BTreeSet<String>,
}
impl Triage {
    pub fn rows(&self, filter: &str) -> Vec<Row> {
        let filter = filter.trim().to_lowercase();
        let mut groups: BTreeMap<String, Vec<&Email>> = BTreeMap::new();
        for e in &self.emails {
            if !self.marks.contains_key(&e.id)
                && (self.label_filter.is_empty() || e.label_ids.iter().any(|id| self.label_filter.contains(id)))
                && (filter.is_empty()
                    || [&e.from, &e.subject, &e.snippet]
                        .iter()
                        .any(|s| s.to_lowercase().contains(&filter)))
            {
                groups.entry(sender_address(&e.from)).or_default().push(e);
            }
        }
        let mut groups: Vec<_> = groups.into_iter().collect();
        groups.sort_by(|a, b| b.1.len().cmp(&a.1.len()).then(a.0.cmp(&b.0)));
        let mut rows = Vec::new();
        for (key, messages) in groups {
            let open = messages.len() > 1 && self.expanded.contains(&key);
            rows.push(Row {
                key: format!("b:{key}"),
                sender: messages[0].from.clone(),
                ids: messages.iter().map(|e| e.id.clone()).collect(),
                header: open,
                child: false,
                unread: messages.iter().any(|e| e.label_ids.iter().any(|label| label == "UNREAD")),
            });
            if open {
                for e in messages {
                    rows.push(Row {
                        key: format!("m:{}", e.id),
                        sender: e.from.clone(),
                        ids: vec![e.id.clone()],
                        header: false,
                        child: true,
                        unread: e.label_ids.iter().any(|label| label == "UNREAD"),
                    });
                }
            }
        }
        rows
    }
    pub fn selected(&self, row: &Row) -> bool {
        !row.ids.is_empty() && row.ids.iter().all(|id| self.selection.contains(id))
    }
    pub fn select(&mut self, rows: &[Row], key: &str) {
        let Some(row) = rows.iter().find(|r| r.key == key) else { return; };
        let select = !self.selected(row);
        for id in &row.ids {
            if select {
                self.selection.insert(id.clone());
            } else {
                self.selection.remove(id);
            }
        }
    }
    pub fn select_all_or_clear(&mut self, rows: &[Row], key: &str) {
        let Some(row) = rows.iter().find(|row| row.key == key) else { return; };
        if self.selected(row) {
            self.selection.clear();
        } else {
            self.selection.extend(rows.iter().flat_map(|row| row.ids.iter().cloned()));
        }
    }
    pub fn undecided_ids(&self, ids: &[String]) -> Vec<String> {
        ids.iter().filter(|id| !self.marks.contains_key(*id) && self.emails.iter().any(|e| &e.id == *id))
            .cloned().collect::<BTreeSet<_>>().into_iter().collect()
    }
    pub fn action_ids(&self, row: &Row) -> Vec<String> {
        let ids = if self.selected(row) { self.selection.iter().cloned().collect() } else { row.ids.clone() };
        self.undecided_ids(&ids)
    }
    pub fn toggle_label_filter(&mut self, id: String) {
        if !self.label_filter.remove(&id) { self.label_filter.insert(id); }
        self.selection.clear();
    }
    pub fn label_removal_ids(&self, ids: &[String], label: &str) -> Vec<String> {
        self.undecided_ids(ids).into_iter().filter(|id| self.emails.iter()
            .any(|email| &email.id == id && email.label_ids.iter().any(|value| value == label))).collect()
    }
    pub fn remove_label(&mut self, ids: &[String], label: &str) {
        for email in &mut self.emails {
            if ids.contains(&email.id) { email.label_ids.retain(|id| id != label); }
        }
    }
    pub fn add_label(&mut self, ids: &[String], label: &str) {
        for email in &mut self.emails {
            if ids.contains(&email.id) && !email.label_ids.iter().any(|id| id == label) {
                email.label_ids.push(label.into());
            }
        }
    }
    pub fn set_read(&mut self, ids: &[String], read: bool) {
        for email in &mut self.emails {
            if ids.contains(&email.id) {
                if read {
                    email.label_ids.retain(|label| label != "UNREAD");
                } else if !email.label_ids.iter().any(|label| label == "UNREAD") {
                    email.label_ids.push("UNREAD".into());
                }
            }
        }
    }
    pub fn stage(&mut self, ids: &[String], action: Action) {
        self.stage_labels(ids, action, &[]);
    }
    pub fn stage_space(&mut self, ids: &[String], space: &crate::spaces::Space) {
        self.stage_labels(ids, Action::Space(space.id), &space.label_ids);
    }
    fn stage_labels(&mut self, ids: &[String], action: Action, labels: &[String]) {
        for id in ids {
            if self.emails.iter().any(|e| &e.id == id)
                && !self
                    .marks
                    .get(id)
                    .is_some_and(|m| matches!(m.outcome, Some(Outcome::Unknown(_))))
            {
                self.marks.insert(
                    id.clone(),
                    Mark {
                        action,
                        label_ids: labels.to_vec(),
                        outcome: None,
                    },
                );
                self.selection.remove(id);
            }
        }
    }
    pub fn unmark(&mut self, ids: &[String]) {
        self.marks
            .retain(|id, m| !ids.contains(id) || matches!(m.outcome, Some(Outcome::Unknown(_))));
    }
    pub fn apply_rules(&mut self, rules: &[Rule]) {
        for e in &self.emails {
            if !self.marks.contains_key(&e.id)
                && let Some(rule) = rule_for(rules, &e.from)
            {
                self.marks.insert(
                    e.id.clone(),
                    Mark {
                        action: rule.action,
                        label_ids: Vec::new(),
                        outcome: None,
                    },
                );
            }
        }
        self.selection.clear();
    }
    pub fn work(&self) -> Vec<Work> {
        self.marks
            .iter()
            .map(|(id, m)| Work {
                id: id.clone(),
                action: m.action,
                label_ids: m.label_ids.clone(),
            })
            .collect()
    }
    pub fn has_unknown(&self) -> bool {
        self.marks
            .values()
            .any(|m| matches!(m.outcome, Some(Outcome::Unknown(_))))
    }
    pub fn complete(&mut self, results: Vec<(Work, Outcome)>) {
        for (work, outcome) in results {
            if outcome == Outcome::Confirmed {
                self.emails.retain(|e| e.id != work.id);
                self.marks.remove(&work.id);
                self.selection.remove(&work.id);
            } else {
                self.marks.insert(
                    work.id,
                    Mark {
                        action: work.action,
                        label_ids: work.label_ids,
                        outcome: Some(outcome),
                    },
                );
            }
        }
    }
    pub fn replace_inbox(&mut self, mut emails: Vec<Email>) {
        // An incomplete write cannot disappear just because it no longer appears in the capped Inbox.
        for old in &self.emails {
            if self.marks.contains_key(&old.id) && !emails.iter().any(|e| e.id == old.id) {
                emails.push(old.clone());
            }
        }
        self.emails = emails;
        self.selection.clear();
    }
    pub fn recover(&mut self, work: Vec<Work>) {
        for w in work {
            if !self.emails.iter().any(|e| e.id == w.id) {
                self.emails.push(Email {
                    id: w.id.clone(),
                    from: "Interrupted submission".into(),
                    subject: "Recheck Gmail before retrying".into(),
                    date: String::new(),
                    snippet: String::new(),
                    label_ids: Vec::new(),
                });
            }
            self.marks.insert(
                w.id,
                Mark {
                    action: w.action,
                    label_ids: w.label_ids,
                    outcome: Some(Outcome::Unknown(
                        "Submission interrupted. Recheck Gmail.".into(),
                    )),
                },
            );
        }
    }
}

pub fn demo() -> Triage {
    let mut t = Triage::default();
    for (sender, count) in [
        ("Studio updates", 12),
        ("Build service", 8),
        ("Calendar", 4),
        ("Ada Chen", 3),
        ("Reports", 3),
        ("Travel", 2),
        ("Digest", 9),
        ("Receipts", 3),
        ("Offers", 6),
    ] {
        for i in 0..count {
            let id = format!("demo-{}", t.emails.len());
            let addr = sender.to_lowercase().replace(' ', ".");
            t.emails.push(Email {
                id: id.clone(),
                from: format!("{sender} <{addr}@example.test>"),
                subject: if sender == "Ada Chen" {
                    ["Review notes", "Updated schedule", "Project handover"][i].into()
                } else {
                    format!("{sender} / update {}", i + 1)
                },
                date: "Today, 10:30".into(),
                snippet: "Synthetic message for layout and interaction testing.".into(),
                label_ids: match sender {
                    "Ada Chen" if i < 2 => vec!["projects".into(), "studies".into(), "finance".into()],
                    "Ada Chen" => vec!["studies".into()],
                    "Studio updates" | "Digest" => vec!["news".into()],
                    "Reports" | "Receipts" => vec!["finance".into()],
                    _ => vec![],
                },
            });
            if i == 0 && ["Studio updates", "Calendar", "Ada Chen"].contains(&sender) {
                t.emails.last_mut().unwrap().label_ids.push("UNREAD".into());
            }
            if ["Digest", "Receipts", "Offers"].contains(&sender) {
                t.stage(
                    &[id],
                    if sender == "Offers" {
                        Action::Trash
                    } else {
                        Action::Archive
                    },
                );
            }
        }
    }
    t.expanded.insert("ada.chen@example.test".into());
    t
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn label_filters_intersect_text_before_grouping_and_selection() {
        let mut triage = demo();
        triage.selection.insert("demo-0".into());
        triage.toggle_label_filter("projects".into());
        assert!(triage.selection.is_empty());
        let rows = triage.rows("");
        assert_eq!(rows.iter().find(|row| row.header).unwrap().ids.len(), 2);
        assert_eq!(rows.iter().filter(|row| row.child).count(), 2);
        triage.select(&rows, &rows[0].key);
        assert_eq!(triage.selection, ["demo-24".into(), "demo-25".into()].into_iter().collect());
        assert!(triage.rows("handover").is_empty());
        assert_eq!(triage.rows("updated")[0].ids, vec!["demo-25"]);
        triage.toggle_label_filter("finance".into());
        assert!(triage.selection.is_empty());
        assert_eq!(triage.rows("").iter().filter(|row| !row.header).map(|row| row.ids.len()).sum::<usize>(), 5);
        let rows = triage.rows("");
        triage.select_all_or_clear(&rows, &rows[0].key);
        assert_eq!(triage.selection.len(), 5);
        assert!(triage.selection.iter().all(|id| !triage.marks.contains_key(id)));
        triage.toggle_label_filter("projects".into());
        triage.toggle_label_filter("finance".into());
        assert_eq!(triage.rows("").iter().filter(|row| !row.header).map(|row| row.ids.len()).sum::<usize>(), 32);
        triage.toggle_label_filter("missing".into());
        assert!(triage.rows("").is_empty());
    }
    #[test]
    fn removal_targets_only_represented_members_that_have_the_label() {
        let mut triage = demo();
        for email in &mut triage.emails { email.label_ids.push("INBOX".into()); }
        triage.selection = ["demo-0".into(), "demo-24".into()].into_iter().collect();
        let marks = triage.work();
        let before: Vec<_> = triage.emails.iter().map(|email| email.label_ids.clone()).collect();
        let row = triage.rows("").into_iter().find(|row| row.header).unwrap();
        let ids = triage.label_removal_ids(&row.ids, "projects");
        assert_eq!(ids, vec!["demo-24", "demo-25"]);
        assert!(!ids.contains(&"demo-0".into()));
        triage.remove_label(&ids, "projects");
        triage.remove_label(&ids, "projects");
        for (email, mut expected) in triage.emails.iter().zip(before) {
            if ids.contains(&email.id) { expected.retain(|id| id != "projects"); }
            assert_eq!(email.label_ids, expected);
        }
        assert_eq!(triage.work(), marks);
        assert_eq!(triage.selection.len(), 2);
        assert!(triage.label_removal_ids(&["demo-32".into(), "missing".into()], "news").is_empty());
    }
    #[test]
    fn immediate_label_addition_preserves_inbox_unread_selection_and_staging() {
        let mut triage = demo();
        for email in &mut triage.emails { email.label_ids.push("INBOX".into()); }
        let original: Vec<_> = triage.emails.iter().map(|email| email.label_ids.clone()).collect();
        let pending = triage.work();
        triage.selection = ["demo-0".into(), "demo-24".into()].into_iter().collect();
        let selected = triage.selection.clone();
        let ids: Vec<_> = selected.iter().cloned().collect();
        triage.add_label(&ids, "projects");
        triage.add_label(&ids, "projects");
        for (email, before) in triage.emails.iter().zip(original) {
            let mut expected = before;
            if ids.contains(&email.id) && !expected.iter().any(|id| id == "projects") { expected.push("projects".into()); }
            assert_eq!(email.label_ids, expected);
        }
        assert_eq!(triage.selection, selected);
        assert_eq!(triage.work(), pending);
    }
    #[test]
    fn spaces_snapshot_labels_stage_without_mutating_mail_and_recover_exact_work() {
        let mut triage = demo();
        let original: Vec<_> = triage.emails.iter().map(|e| (e.id.clone(), e.label_ids.clone())).collect();
        let ids = vec!["demo-0".into(), "demo-1".into()];
        let mut space = crate::spaces::Space { id: 7, name: "Work".into(), label_ids: vec!["projects".into(), "finance".into()] };
        triage.selection.extend(ids.clone());
        triage.stage_space(&ids, &space);
        assert!(triage.selection.is_empty());
        assert_eq!(triage.emails.iter().map(|e| (e.id.clone(), e.label_ids.clone())).collect::<Vec<_>>(), original);
        space.label_ids = vec!["news".into()];
        assert_eq!(triage.marks[&ids[0]].label_ids, vec!["projects", "finance"]);
        let work: Vec<_> = triage.work().into_iter().filter(|w| ids.contains(&w.id)).collect();
        let mut recovery = Triage::default();
        recovery.recover(work.clone());
        recovery.unmark(&ids);
        recovery.stage_space(&ids, &space);
        assert_eq!(recovery.work(), work);
        assert!(recovery.has_unknown());
        recovery.complete(vec![(work[0].clone(), Outcome::Confirmed), (work[1].clone(), Outcome::Failed("rejected".into()))]);
        assert!(!recovery.emails.iter().any(|e| e.id == ids[0]));
        assert_eq!(recovery.marks[&ids[1]].label_ids, vec!["projects", "finance"]);
        recovery.unmark(&ids);
        assert!(recovery.marks.is_empty());
        triage.unmark(&ids);
        assert_eq!(triage.emails.iter().map(|e| (e.id.clone(), e.label_ids.clone())).collect::<Vec<_>>(), original);
    }
    #[test]
    fn unread_rows_follow_message_labels_and_represented_group_members() {
        let mut t = demo();
        let rows = t.rows("");
        let parent = rows.iter().find(|r| r.header).unwrap();
        let unread = rows.iter().find(|r| r.child && r.unread).unwrap();
        let read = rows.iter().find(|r| r.child && !r.unread).unwrap();
        assert!(parent.unread);
        assert!(rows.iter().any(|r| !r.child && !r.unread));
        t.select(&rows, &read.key);
        assert!(!t.rows("").iter().find(|r| r.key == read.key).unwrap().unread);
        assert!(!t.rows("Updated schedule")[0].unread);
        t.expanded.clear();
        assert!(t.rows("").iter().find(|r| r.key == parent.key).unwrap().unread);
        t.stage(&unread.ids, Action::Archive);
        assert!(!t.rows("").iter().find(|r| r.key == parent.key).unwrap().unread);
        t.unmark(&unread.ids);
        let mut refreshed = t.emails.clone();
        for email in &mut refreshed { email.label_ids.retain(|label| label != "UNREAD"); }
        t.replace_inbox(refreshed);
        assert!(t.rows("").iter().all(|r| !r.unread));
    }
    #[test]
    fn explicit_read_targets_preserve_mail_selection_and_marks() {
        let mut t = demo();
        let rows = t.rows("");
        let target = rows.iter().find(|r| r.child && r.unread).unwrap();
        let other = rows.iter().find(|r| !r.child && r.unread && !r.ids.contains(&target.ids[0])).unwrap();
        t.selection.extend(other.ids.clone());
        let selection = t.selection.clone();
        let work = t.work();
        let labels: Vec<_> = t.emails.iter().map(|e| (e.id.clone(), e.label_ids.clone())).collect();
        t.set_read(&target.ids, true);
        t.set_read(&target.ids, true); // Repeating the action is harmless.
        assert_eq!(t.emails.len(), labels.len());
        assert_eq!(t.selection, selection);
        assert_eq!(t.work(), work);
        for (email, (id, original)) in t.emails.iter().zip(&labels) {
            let expected: Vec<_> = original.iter().filter(|label| !target.ids.contains(id) || label.as_str() != "UNREAD").cloned().collect();
            assert_eq!(email.label_ids, expected);
        }
        assert!(!t.rows("").iter().find(|r| r.key == target.key).unwrap().unread);
        assert!(!t.rows("").iter().find(|r| r.header).unwrap().unread);
        assert!(t.rows("").iter().find(|r| r.key == other.key).unwrap().unread);
        t.set_read(&target.ids, false);
        t.set_read(&target.ids, false);
        assert_eq!(t.emails.iter().map(|e| (e.id.clone(), e.label_ids.clone())).collect::<Vec<_>>(), labels);
        assert!(t.rows("").iter().find(|r| r.key == target.key).unwrap().unread);
        assert!(t.rows("").iter().find(|r| r.header).unwrap().unread);
        assert_eq!(t.selection, selection);
        assert_eq!(t.work(), work);
        t.set_read(&other.ids, true);
        assert!(!t.rows("").iter().find(|r| r.key == other.key).unwrap().unread);
        t.set_read(&other.ids, false);
        assert!(t.rows("").iter().find(|r| r.key == other.key).unwrap().unread);
        assert!(t.emails.iter().filter(|e| other.ids.contains(&e.id)).all(|e| e.label_ids.iter().filter(|label| *label == "UNREAD").count() == 1));
    }
    #[test]
    fn row_actions_and_drags_target_checked_batch_only_for_fully_checked_rows() {
        let mut t = demo();
        let rows = t.rows("");
        let group = &rows[0];
        let other = &rows[1];
        t.selection.insert(group.ids[0].clone());
        t.selection.extend(other.ids.clone());
        assert_eq!(t.action_ids(group).len(), group.ids.len());
        assert_eq!(t.action_ids(other).len(), other.ids.len() + 1);
        t.selection.extend(group.ids.clone());
        assert_eq!(t.action_ids(group).len(), group.ids.len() + other.ids.len());
        let mut snapshot = t.action_ids(group);
        snapshot.push(snapshot[0].clone()); snapshot.push("gone".into());
        t.stage(&group.ids, Action::Archive);
        assert_eq!(t.undecided_ids(&snapshot).len(), other.ids.len());
        t.emails.clear();
        assert!(t.undecided_ids(&snapshot).is_empty());
    }
    #[test]
    fn grouping_selection_and_filtering() {
        let mut t = demo();
        let rows = t.rows("");
        assert_eq!(rows[0].ids.len(), 12);
        assert_eq!(rows.iter().filter(|r| !r.child).count(), 6);
        t.select(&rows, &rows[1].key);
        assert_eq!(t.selection.len(), 8);
        t.select(&rows, &rows[2].key);
        assert_eq!(t.selection.len(), 12);
        t.select(&rows, &rows[1].key);
        assert_eq!(t.selection.len(), 4);
        assert_eq!(t.rows("Review notes")[0].ids.len(), 1);
        let expanded = rows.iter().find(|r| r.header).unwrap();
        t.select(&rows, &expanded.key);
        assert_eq!(t.selection.len(), 7);
    }
    #[test]
    fn middle_selection_uses_clicked_row_not_overall_selection() {
        let mut t = demo();
        t.expanded.insert("studio.updates@example.test".into());
        let rows = t.rows("");
        let child = rows.iter().find(|r| r.child).unwrap();
        let work = t.work();
        let labels: Vec<_> = t.emails.iter().map(|e| e.label_ids.clone()).collect();
        let expanded = t.expanded.clone();
        let undecided: BTreeSet<_> = t.emails.iter().filter(|e| !t.marks.contains_key(&e.id)).map(|e| e.id.clone()).collect();
        assert_eq!(undecided.len(), 32);

        t.select_all_or_clear(&rows, &child.key);
        assert_eq!(t.selection, undecided); // Includes collapsed groups; expanded children do not duplicate IDs.
        t.select_all_or_clear(&rows, &child.key);
        assert!(t.selection.is_empty());

        t.selection.extend(child.ids.clone());
        t.select_all_or_clear(&rows, &child.key);
        assert!(t.selection.is_empty()); // A checked message clears even when the rest are unchecked.
        t.selection.extend(child.ids.clone());
        t.select_all_or_clear(&rows, &rows[0].key);
        assert_eq!(t.selection, undecided); // A partially checked group selects all.
        t.selection.remove(&rows.last().unwrap().ids[0]);
        t.select_all_or_clear(&rows, &child.key);
        assert!(t.selection.is_empty());

        assert_eq!(t.work(), work);
        assert_eq!(t.emails.iter().map(|e| e.label_ids.clone()).collect::<Vec<_>>(), labels);
        assert_eq!(t.expanded, expanded);
    }
    #[test]
    fn middle_selection_respects_filter_and_ignores_missing_rows() {
        let mut t = demo();
        let ada = t.rows("Ada Chen")[0].clone();
        t.stage(&ada.ids[..1], Action::Archive);
        t.expanded.insert("ada.chen@example.test".into());
        let rows = t.rows("  ADA CHEN  ");
        t.select_all_or_clear(&rows, &rows[0].key);
        assert_eq!(t.selection, ada.ids[1..].iter().cloned().collect());
        assert!(t.selection.iter().all(|id| !t.marks.contains_key(id)));
        let selected = t.selection.clone();
        t.select_all_or_clear(&rows, "missing");
        t.select_all_or_clear(&[], &rows[0].key);
        assert_eq!(t.selection, selected);
        t.select_all_or_clear(&rows, &rows[1].key);
        assert!(t.selection.is_empty());
    }
    #[test]
    fn expanded_group_checkbox_tracks_children_without_affecting_other_groups() {
        let mut t = demo();
        let rows = t.rows("");
        let parent = rows.iter().find(|r| r.header).unwrap();
        let children: Vec<_> = rows
            .iter()
            .filter(|r| r.child && r.sender == parent.sender)
            .collect();
        t.select(&rows, &rows[0].key);
        let outside = t.selection.clone();
        t.select(&rows, &parent.key);
        assert!(t.selected(parent));
        assert_eq!(t.selection.len(), outside.len() + 3);
        t.select(&rows, &children[0].key);
        assert!(!t.selected(parent));
        assert_eq!(
            parent
                .ids
                .iter()
                .filter(|id| t.selection.contains(*id))
                .count(),
            2
        );
        t.select(&rows, &parent.key);
        assert!(t.selected(parent));
        t.select(&rows, &parent.key);
        assert_eq!(t.selection, outside);
        t.selection.clear();
        t.select(&rows, &children[0].key);
        t.select(&rows, &children[1].key);
        assert_eq!(t.selection.len(), 2);
        assert!(!t.selection.contains(&children[2].ids[0]));
        t.select(&rows, &children[0].key);
        assert_eq!(t.selection.len(), 1);
    }
    #[test]
    fn checked_row_read_and_stage_actions_include_all_checked_messages() {
        for checked in [false, true] {
            let mut t = demo();
            let rows = t.rows("");
            let row = rows.iter().find(|row| row.key == "m:demo-24").unwrap();
            t.selection = ["demo-0", "demo-25"].into_iter().map(str::to_string).collect();
            if checked { t.selection.insert("demo-24".into()); }
            let selection = t.selection.clone();
            let ids = t.action_ids(row);
            assert_eq!(ids.iter().cloned().collect::<BTreeSet<_>>(), if checked { selection.clone() } else { row.ids.iter().cloned().collect() });
            let before: Vec<_> = t.emails.iter().map(|e| e.label_ids.clone()).collect();
            let marks = t.work();
            for read in [true, false] {
                t.set_read(&ids, read);
                for (email, original) in t.emails.iter().zip(&before) {
                    if ids.contains(&email.id) {
                        assert_eq!(email.label_ids.iter().any(|label| label == "UNREAD"), !read);
                        assert_eq!(email.label_ids.iter().filter(|l| l.as_str() != "UNREAD").collect::<Vec<_>>(), original.iter().filter(|l| l.as_str() != "UNREAD").collect::<Vec<_>>());
                    } else { assert_eq!(&email.label_ids, original); }
                }
                assert_eq!(t.selection, selection);
                assert_eq!(t.work(), marks);
            }
            for action in [Action::Archive, Action::Trash] {
                t.stage(&ids, action);
                assert!(ids.iter().all(|id| t.marks[id].action == action));
                assert_eq!(t.marks.len(), marks.len() + ids.len());
                assert_eq!(t.selection, selection.iter().filter(|id| !ids.contains(id)).cloned().collect());
                t.unmark(&ids);
            }
        }
    }
    #[test]
    fn partial_selection_staging_and_unknown_writes() {
        let mut t = demo();
        let rows = t.rows("");
        let ids = rows[0].ids.clone();
        t.selection.insert(ids[0].clone());
        assert!(!t.selected(&rows[0]));
        t.select(&rows, &rows[0].key);
        assert!(t.selected(&rows[0]));
        t.stage(&ids, Action::Archive);
        assert!(t.selection.is_empty());
        let unknown = Work {
            id: ids[0].clone(),
            action: Action::Archive,
            label_ids: Vec::new(),
        };
        t.complete(vec![
            (unknown.clone(), Outcome::Unknown("timeout".into())),
            (
                Work {
                    id: ids[1].clone(),
                    action: Action::Archive,
                    label_ids: Vec::new(),
                },
                Outcome::Confirmed,
            ),
        ]);
        t.unmark(&ids);
        assert!(t.marks.contains_key(&ids[0]));
        assert!(!t.emails.iter().any(|e| e.id == ids[1]));
        t.replace_inbox(vec![]);
        assert!(t.emails.iter().any(|e| e.id == ids[0]));
        t.complete(vec![(unknown, Outcome::Failed("Still in Inbox".into()))]);
        t.unmark(&ids);
        assert!(!t.has_unknown());
    }
    #[test]
    fn interrupted_submissions_stay_unknown_until_reconciled() {
        let mut t = Triage::default();
        let work = Work {
            id: "submitted".into(),
            action: Action::Trash,
            label_ids: Vec::new(),
        };
        t.recover(vec![work.clone()]);
        assert!(t.has_unknown());
        t.unmark(std::slice::from_ref(&work.id));
        assert_eq!(t.marks.len(), 1);
        t.replace_inbox(vec![]);
        assert_eq!(t.emails.len(), 1);
        t.complete(vec![(work, Outcome::Confirmed)]);
        assert!(t.marks.is_empty() && t.emails.is_empty());
    }

    #[test]
    fn rules_keep_first_match_and_do_not_replace_manual_marks() {
        let mut t = demo();
        let rules = vec![
            Rule {
                id: "1".into(),
                from: "STUDIO".into(),
                action: Action::Archive,
            },
            Rule {
                id: "2".into(),
                from: "example.test".into(),
                action: Action::Trash,
            },
        ];
        t.apply_rules(&rules);
        assert_eq!(t.marks["demo-0"].action, Action::Archive);
        assert_eq!(t.marks["demo-32"].action, Action::Archive);
        assert_eq!(t.marks.len(), 50);
    }
}

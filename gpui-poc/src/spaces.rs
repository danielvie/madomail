use crate::labels::{Catalog, Label};
use anyhow::{Result, ensure};
use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Space {
    pub id: u64,
    pub name: String,
    pub label_ids: Vec<String>,
}

pub fn validate_labels(ids: &[String]) -> Result<()> {
    let mut unique = BTreeSet::new();
    ensure!(!ids.is_empty() && ids.len() <= 100, "Select 1..100 labels");
    ensure!(ids.iter().all(|id| !id.trim().is_empty() && id.len() <= 256
        && !id.chars().any(char::is_control) && unique.insert(id)
        && !matches!(id.as_str(), "INBOX" | "TRASH" | "SPAM" | "UNREAD" | "STARRED" | "IMPORTANT" | "SENT" | "DRAFT" | "DRAFTS" | "CHAT")
        && !id.starts_with("CATEGORY_")), "Invalid or duplicate space label");
    Ok(())
}

pub fn validate(spaces: &[Space]) -> Result<()> {
    ensure!(spaces.len() <= 100, "At most 100 spaces are supported");
    let mut ids = BTreeSet::new();
    for space in spaces {
        ensure!(space.id > 0 && ids.insert(space.id), "Invalid or duplicate space ID");
        ensure!(!space.name.trim().is_empty() && space.name == space.name.trim()
            && space.name.len() <= 128 && !space.name.chars().any(char::is_control), "Space name must be 1..128 bytes");
        validate_labels(&space.label_ids)?;
    }
    Ok(())
}

pub fn available(ids: &[String], catalog: &Catalog) -> bool {
    !catalog.unavailable && validate_labels(ids).is_ok()
        && ids.iter().all(|id| catalog.entries.get(id).is_some_and(|label| label.kind == "user"))
}

pub fn find<'a>(catalog: &'a Catalog, query: &str) -> Vec<&'a Label> {
    let query = query.trim().to_lowercase();
    // ponytail: subsequence matching, ranked by skipped characters; use a dedicated scorer if larger catalogs need typo tolerance.
    let mut matches: Vec<_> = catalog.entries.values().filter(|label| label.kind == "user")
        .filter_map(|label| {
            let name = label.name.to_lowercase();
            let mut chars = name.chars().enumerate();
            let mut score = 0;
            let mut previous = 0;
            for q in query.chars() {
                let (index, _) = chars.find(|(_, ch)| *ch == q)?;
                score += index.saturating_sub(previous);
                previous = index + 1;
            }
            Some((score, name, label))
        }).collect();
    matches.sort_by(|a, b| (&a.0, &a.1, &a.2.id).cmp(&(&b.0, &b.1, &b.2.id)));
    matches.into_iter().map(|(_, _, label)| label).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn fuzzy_search_uses_names_includes_hidden_labels_and_excludes_system_labels() {
        let catalog = crate::labels::demo();
        assert_eq!(find(&catalog, " PRJ ")[0].id, "projects");
        assert_eq!(find(&catalog, "hdd")[0].id, "hidden");
        assert!(find(&catalog, "inbox").is_empty());
        assert!(find(&catalog, "jpr").is_empty());
        assert_eq!(find(&catalog, "").len(), 5);
        let mut unicode = catalog.clone();
        unicode.entries.get_mut("projects").unwrap().name = "Café 中文".into();
        assert_eq!(find(&unicode, "É文")[0].id, "projects");
    }
    #[test]
    fn space_validation_rejects_empty_system_duplicate_and_unavailable_labels() {
        for labels in [vec![], vec!["INBOX"], vec!["projects", "projects"], vec!["TRASH"], vec!["CATEGORY_SOCIAL"]] {
            assert!(validate_labels(&labels.into_iter().map(str::to_owned).collect::<Vec<_>>()).is_err());
        }
        let catalog = crate::labels::demo();
        assert!(available(&["projects".into(), "hidden".into()], &catalog));
        assert!(!available(&["missing".into()], &catalog));
        assert!(!available(&["projects".into()], &Catalog { unavailable: true, ..catalog }));
    }
}

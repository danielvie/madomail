use crate::theme::Palette;
use gpui::{Hsla, IntoElement, Rgba, div, prelude::*, px};
use serde::Deserialize;
use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Debug, Deserialize)]
pub struct Label {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub kind: String,
    #[serde(default, rename = "messageListVisibility")]
    pub visibility: String,
    #[serde(default)]
    pub color: Option<LabelColor>,
}
#[derive(Clone, Debug, Deserialize)]
pub struct LabelColor {
    #[serde(rename = "textColor")]
    pub text: String,
    #[serde(rename = "backgroundColor")]
    pub background: String,
}
#[derive(Clone, Debug, Default)]
pub struct Catalog {
    pub entries: BTreeMap<String, Label>,
    pub unavailable: bool,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Badge {
    pub id: Option<String>,
    pub text: String,
    pub colors: Option<(Hsla, Hsla)>,
}

pub fn colors(color: &LabelColor) -> Option<(Hsla, Hsla)> {
    let parse = |s: &str| {
        (s.len() == 7 && s.starts_with('#') && s[1..].bytes().all(|b| b.is_ascii_hexdigit()))
            .then(|| Rgba::try_from(s).ok()).flatten()
    };
    let text = parse(&color.text)?;
    let background = parse(&color.background)?;
    Some((text.into(), background.into()))
}

pub fn summarize<'a>(members: impl Iterator<Item = &'a [String]>, catalog: &Catalog, hide: bool) -> Vec<Badge> {
    let mut counts = BTreeMap::<&str, usize>::new();
    let mut total = 0;
    for labels in members {
        total += 1;
        for id in labels.iter().map(String::as_str).collect::<BTreeSet<_>>() {
            *counts.entry(id).or_default() += 1;
        }
    }
    let mut badges = Vec::new();
    let mut unknown = false;
    for (id, count) in counts {
        match catalog.entries.get(id) {
            Some(label) if label.kind == "user" && (!hide || label.visibility != "hide") => {
                let text = if count < total { format!("{} {count}/{total}", label.name) } else { label.name.clone() };
                badges.push((label.name.clone(), id, Badge { id: Some(id.into()), text, colors: label.color.as_ref().and_then(colors) }));
            }
            Some(_) => {}
            // Gmail system IDs are uppercase. Unknown IDs are still reported unless known system IDs.
            None if matches!(id, "INBOX" | "UNREAD" | "STARRED" | "IMPORTANT" | "SENT" | "DRAFT" | "DRAFTS" | "SPAM" | "TRASH" | "CHAT") || id.starts_with("CATEGORY_") => {}
            None => unknown = true,
        }
    }
    badges.sort_by(|a, b| (&a.0, a.1).cmp(&(&b.0, b.1)));
    let mut result: Vec<_> = badges.into_iter().map(|(_, _, badge)| badge).collect();
    if unknown { result.push(Badge { id: None, text: "Label unavailable".into(), colors: None }); }
    result
}

pub fn full_text(badges: &[Badge]) -> String {
    badges.iter().map(|b| b.text.as_str()).collect::<Vec<_>>().join("\n")
}

pub fn visible_count(count: usize, budget: f32) -> usize {
    count.min(if budget >= 180. { 2 } else if budget >= 90. { 1 } else { 0 })
}

pub fn chip(badge: &Badge, width: f32, p: Palette) -> impl IntoElement {
    let (ink, background) = badge.colors.unwrap_or((p.ink, p.panel2));
    // ponytail: approximate intrinsic width; GPUI truncates to the shared budget. Use shaped metrics if this wastes space.
    div().w(px(width.min(badge.text.chars().count() as f32 * 7. + 10.))).min_w_0().px_1().py(px(1.)).rounded_sm()
        .bg(background).text_color(ink).text_xs().flex()
        .child(div().flex_1().min_w_0().truncate().child(badge.text.clone()))
}

pub fn demo() -> Catalog {
    let labels: Vec<Label> = serde_json::from_str(r##"[
        {"id":"projects","name":"Projects","type":"user","color":{"textColor":"#ffffff","backgroundColor":"#076239"}},
        {"id":"studies","name":"ESTUDOS/UW University","type":"user","color":{"textColor":"#41236d","backgroundColor":"#e4d7f5"}},
        {"id":"news","name":"Newsletters","type":"user"},
        {"id":"finance","name":"Finance","type":"user"},
        {"id":"hidden","name":"Hidden label","type":"user","messageListVisibility":"hide"},
        {"id":"INBOX","name":"Inbox","type":"system"}
    ]"##).unwrap();
    Catalog { entries: labels.into_iter().map(|l| (l.id.clone(), l)).collect(), unavailable: false }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn counts_are_per_message_hide_system_and_hidden_and_keep_unknown() {
        let catalog = demo();
        let messages: Vec<Vec<String>> = [vec!["projects", "projects", "INBOX", "hidden"], vec!["projects", "studies"], vec!["missing"]]
            .into_iter().map(|v| v.into_iter().map(str::to_owned).collect()).collect();
        let badges = summarize(messages.iter().map(Vec::as_slice), &catalog, true);
        assert_eq!(badges.iter().map(|b| b.text.as_str()).collect::<Vec<_>>(), vec!["ESTUDOS/UW University 1/3", "Projects 2/3", "Label unavailable"]);
        assert_eq!(badges.iter().map(|b| b.id.as_deref()).collect::<Vec<_>>(), vec![Some("studies"), Some("projects"), None]);
        let single = summarize(std::iter::once(messages[0].as_slice()), &catalog, false);
        assert_eq!(single.iter().map(|b| b.text.as_str()).collect::<Vec<_>>(), vec!["Hidden label", "Projects"]);
        assert!(summarize(std::iter::once([].as_slice()), &catalog, true).is_empty());
    }
    #[test]
    fn colors_preserve_gmail_values_even_with_low_contrast() {
        for background in ["#076239", "#16a765", "#ffffff"] {
            let expected = Some((Rgba::try_from("#ffffff").unwrap().into(), Rgba::try_from(background).unwrap().into()));
            assert_eq!(colors(&LabelColor { text: "#ffffff".into(), background: background.into() }), expected);
        }
        for text in ["red", "#zzzzzz", "#fff"] {
            assert!(colors(&LabelColor { text: text.into(), background: "#ffffff".into() }).is_none());
        }
        assert_eq!(visible_count(5, 200.), 2);
        assert_eq!(visible_count(5, 100.), 1);
        assert_eq!(visible_count(5, 60.), 0);
        assert_eq!(visible_count(0, 200.), 0);
    }
}

use gpui::{App, Global, Hsla, rgb};
use serde::{Deserialize, Serialize};

/// Custom palettes inherit omitted colors from Frost. GPUI validates hexadecimal color strings.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct Palette {
    pub canvas: Hsla,
    pub panel: Hsla,
    pub panel2: Hsla,
    pub line: Hsla,
    pub ink: Hsla,
    pub ink_dim: Hsla,
    pub accent: Hsla,
    pub danger: Hsla,
    pub on_accent: Hsla,
}
impl Default for Palette {
    fn default() -> Self {
        Self {
            canvas: rgb(0xf6f8fa).into(),
            panel: rgb(0xffffff).into(),
            panel2: rgb(0xeef1f5).into(),
            line: rgb(0xdfe4ea).into(),
            ink: rgb(0x16191d).into(),
            ink_dim: rgb(0x626b76).into(),
            accent: rgb(0x4f46e5).into(),
            danger: rgb(0xd92d20).into(),
            on_accent: rgb(0xffffff).into(),
        }
    }
}
impl Global for Palette {}
impl Palette {
    pub fn current(cx: &App) -> Self {
        *cx.global::<Self>()
    }
    pub fn apply(self, cx: &mut App) {
        cx.set_global(self);
        // Refresh existing readers as well as the Inbox and all input entities.
        cx.refresh_windows();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn custom_palette_inherits_frost_and_rejects_invalid_colors() {
        let p: Palette = serde_json::from_str(r##"{"accent":"#087f5b"}"##).unwrap();
        assert_eq!(p.accent, rgb(0x087f5b).into());
        assert_eq!(p.canvas, Palette::default().canvas);
        for json in [
            r##"{"accent":"red"}"##,
            r##"{"canvas":"#zz0000"}"##,
            r##"{"unknown":"#ffffff"}"##,
        ] {
            assert!(serde_json::from_str::<Palette>(json).is_err());
        }
        assert_eq!(
            serde_json::from_slice::<Palette>(&serde_json::to_vec(&p).unwrap()).unwrap(),
            p
        );
    }
}

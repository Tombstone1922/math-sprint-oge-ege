export const colors = {
  ink: '#16243B', muted: '#526278', background: '#F3F6FA', white: '#FFFFFF',
  navy: '#182F50', blue: '#2A56CC', bluePale: '#EAF0FF', mint: '#E3F4EB',
  green: '#136840', amber: '#FFF0CC', red: '#A73343', border: '#DFE6F0',
  redPale: '#FBECEF', heroCaption: '#BCD2F6', heroText: '#DFEAFA',
};

export const layout = { maxWidth: 720, gutter: 22, compactGutter: 16, hitTarget: 48 };

export const radius = { field: 14, card: 20, feature: 26, pill: 999 };

export const surface = {
  panel: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card },
  field: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.field },
  hero: { backgroundColor: colors.navy, borderRadius: radius.feature },
  pressed: { opacity: .82 },
};

// Twenty quiet card backgrounds. A problem keeps its shade in both stages.
export const cardPalette = [
  '#F6F8FC', '#F7F8F5', '#F8F7F5', '#F6F8F8', '#F8F7FA',
  '#F7F9F6', '#F9F7F6', '#F6F7FA', '#F8F9F5', '#F7F6F9',
  '#F5F8FA', '#F9F8F5', '#F6F9F7', '#F8F6F7', '#F6F7F8',
  '#F8F8F4', '#F5F7F9', '#F8F6F5', '#F6F9F9', '#F7F7FA',
] as const;

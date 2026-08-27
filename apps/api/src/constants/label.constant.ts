export const LABEL_NAME_MAX = 40;
export const LABEL_IDS_MAX = 20;

export const LABEL_COLORS = [
  '#EB5757',
  '#F2994A',
  '#F2C94C',
  '#27AE60',
  '#2F80ED',
  '#9B51E0',
  '#BB6BD9',
  '#56CCF2',
  '#6FCF97',
  '#4F4F4F',
] as const;

export type LabelColorValue = (typeof LABEL_COLORS)[number];

export const DEFAULT_LABEL_COLOR = LABEL_COLORS[4];

export const LABEL_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function isLabelColor(value: string): boolean {
  return LABEL_COLOR_PATTERN.test(value);
}

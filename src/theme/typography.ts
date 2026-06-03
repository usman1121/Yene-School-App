import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  h2: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  h3: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 20 },
  bodyBold: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  captionBold: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  small: { fontSize: 10, fontWeight: '500', lineHeight: 14 },
  label: { fontSize: 14, fontWeight: '500', lineHeight: 18 },
  kpi: { fontSize: 10, fontWeight: '600', lineHeight: 14, letterSpacing: 0.5 },
};

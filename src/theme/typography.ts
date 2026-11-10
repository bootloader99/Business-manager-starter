

export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',

  headingMedium: 'Poppins-Medium',
  headingSemiBold: 'Poppins-SemiBold',
  headingBold: 'Poppins-Bold',
} as const;

export const typography = {
  // Screen titles and major page headings
  title: {
    fontFamily: fontFamily.headingSemiBold,
    fontSize: 24,
    lineHeight: 32,
  },

  // Section headings
  section: {
    fontFamily: fontFamily.headingSemiBold,
    fontSize: 18,
    lineHeight: 26,
  },

  // Card headings and list item names
  cardTitle: {
    fontFamily: fontFamily.headingMedium,
    fontSize: 16,
    lineHeight: 23,
  },

  // Prominent totals and dashboard figures
  metric: {
    fontFamily: fontFamily.headingSemiBold,
    fontSize: 22,
    lineHeight: 29,
  },

  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },

  secondary: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },

  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
  },

  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },

  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
  },
} as const;

// ChemLab UZ — dizayn token tizimi
// Palette laboratoriya jurnali va reaktiv yorliqlaridan ilhomlangan:
// issiq qog'oz foni, chuqur laboratoriya yashil-ko'k rangi, GHS ogohlantirish ranglari.

export const colors = {
  ink: '#16211C',        // asosiy matn
  inkSoft: '#4B564E',    // ikkinchi darajali matn
  paper: '#F6F5EF',      // fon — laboratoriya qog'ozi
  panel: '#FFFFFF',      // kartalar foni
  hairline: '#DDD9CB',   // nozik chegara

  labTeal: '#0F6E56',      // brand — asosiy amal
  labTealDeep: '#0B5744',  // hover/active
  labTealSoft: '#E1F0EA',  // yengil fon

  reagentAmber: '#B9791F',   // ogohlantirish — kam qoldi / muddati yaqin
  reagentAmberSoft: '#FBF0DD',

  hazardRed: '#A63A2E',      // xavf — muddati o'tgan / rad etilgan
  hazardRedSoft: '#FBE9E6',

  glassBlue: '#2B6693',      // ma'lumot — jarayonda
  glassBlueSoft: '#E7EFF5',

  slate: '#6B6A5F',
};

export const antdTheme = {
  token: {
    colorPrimary: colors.labTeal,
    colorLink: colors.labTeal,
    colorSuccess: '#3A7D5C',
    colorWarning: colors.reagentAmber,
    colorError: colors.hazardRed,
    colorInfo: colors.glassBlue,
    colorText: colors.ink,
    colorTextSecondary: colors.inkSoft,
    colorBgLayout: colors.paper,
    colorBgContainer: colors.panel,
    colorBorder: colors.hairline,
    colorBorderSecondary: colors.hairline,
    fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
    fontFamilyCode: "'IBM Plex Mono', monospace",
    borderRadius: 8,
    borderRadiusLG: 12,
    wireframe: false,
  },
  components: {
    Layout: {
      siderBg: colors.ink,
      headerBg: colors.panel,
      bodyBg: colors.paper,
    },
    Menu: {
      darkItemBg: colors.ink,
      darkItemSelectedBg: colors.labTealDeep,
      darkItemHoverBg: '#212E27',
      darkItemColor: '#C9D0CA',
      darkItemSelectedColor: '#FFFFFF',
    },
    Table: {
      headerBg: colors.paper,
      headerColor: colors.inkSoft,
      borderColor: colors.hairline,
      rowHoverBg: colors.labTealSoft,
    },
    Card: {
      colorBorderSecondary: colors.hairline,
    },
    Button: {
      controlHeight: 36,
      fontWeight: 500,
    },
  },
};

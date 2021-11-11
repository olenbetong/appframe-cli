import { createTheme } from "@mui/material/styles";

const bodyStyles = getComputedStyle(document.body);
function getThemeValue(name: string) {
  return bodyStyles.getPropertyValue(`--${name}`)?.trim() ?? "";
}

declare module "@mui/material/styles" {
  interface Theme {
    config: {
      drawerWidth: React.CSSProperties["width"];
    };
  }
  interface ThemeOptions {
    config: {
      drawerWidth: React.CSSProperties["width"];
    };
  }
}

export default createTheme({
  config: {
    drawerWidth: "25rem",
  },
  palette: {
    primary: {
      main: getThemeValue("brand-primary"),
      dark: getThemeValue("brand-dark"),
    },
    secondary: { main: getThemeValue("brand-light") },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        h1: { fontSize: "2.488rem" },
        h2: { fontSize: "2.074rem" },
        h3: { fontSize: "1.728rem" },
        h4: { fontSize: "1.44rem" },
        h5: { fontSize: "1.2rem" },
        h6: { fontSize: "1rem" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          "& .MuiTypography-h1": {
            fontSize: "1.25rem",
            fontWeight: "500",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.2rem",
          fontWeight: 500,
          paddingLeft: 16,
          paddingRight: 16,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: "rgba(0, 0, 0, 0.72)",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "filled",
      },
    },
    MuiSelect: {
      defaultProps: {
        variant: "filled",
      },
    },
    MuiFormControl: {
      defaultProps: {
        variant: "filled",
      },
    },
  },
});

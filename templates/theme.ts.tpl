import { createTheme } from "@mui/material/styles";
import React from "react";

const div = document.createElement("div");
div.style.color = "var(--brand-primary)";
div.style.backgroundColor = "var(--brand-light)";
div.style.borderTopColor = "var(--brand-tertiary)";
div.style.borderRightColor = "var(--brand-dark)";
document.body.append(div);

const computed = getComputedStyle(div);

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
  interface DeprecatedThemeOptions {
    config?: {
      drawerWidth?: React.CSSProperties["width"];
    };
  }
}

export default createTheme({
  config: {
    drawerWidth: "20rem",
  },
  palette: {
    primary: { main: computed.color, dark: computed.borderRightColor },
    secondary: { main: computed.backgroundColor },
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
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        // rounded: {
        //   borderRadius: 2,
        // },
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

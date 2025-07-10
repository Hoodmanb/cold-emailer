"use client";

import { createTheme } from "@mui/material/styles";

const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 400,
      md: 800,
      lg: 1200,
      xl: 1536,
    },
  },
});

export default lightTheme;


// "use client";

// import { createTheme } from "@mui/material/styles";

// const common = {
//   breakpoints: {
//     values: {
//       xs: 0,
//       sm: 400,
//       md: 800,
//       lg: 1200,
//       xl: 1536,
//     },
//   },
//   shape: {
//     borderRadius: 12, // ~0.75rem
//   },
//   components: {
//     MuiPaper: {
//       styleOverrides: {
//         root: {
//           backgroundImage: "none",
//         },
//       },
//     },
//     MuiButton: {
//       styleOverrides: {
//         root: {
//           borderRadius: "12px",
//           textTransform: "none",
//         },
//       },
//     },
//     MuiCard: {
//       styleOverrides: {
//         root: {
//           borderRadius: "12px",
//         },
//       },
//     },
//   },
// };

// export const lightTheme = createTheme({
//   ...common,
//   palette: {
//     mode: "light",
//     background: {
//       default: "hsl(220, 65%, 97%)", // --background
//       paper: "hsl(0, 0%, 100%)",     // --card
//     },
//     text: {
//       primary: "hsl(220, 13%, 9%)",             // --foreground
//       secondary: "hsl(220, 9%, 46%)",           // --muted-foreground
//     },
//     primary: {
//       main: "hsl(217, 92%, 59%)",               // --primary
//       contrastText: "hsl(0, 0%, 98%)",          // --primary-foreground
//     },
//     secondary: {
//       main: "hsl(220, 43%, 93%)",               // --secondary
//       contrastText: "hsl(217, 33%, 17%)",       // --secondary-foreground
//     },
//     error: {
//       main: "hsl(0, 72%, 51%)",                 // --destructive
//       contrastText: "hsl(0, 0%, 98%)",          // --destructive-foreground
//     },
//     success: {
//       main: "hsl(142, 71%, 45%)",               // --success
//       contrastText: "hsl(0, 0%, 98%)",          // --success-foreground
//     },
//     warning: {
//       main: "hsl(38, 92%, 50%)",                // --warning
//       contrastText: "hsl(0, 0%, 98%)",          // --warning-foreground
//     },
//     divider: "hsl(220, 43%, 91%)",              // --border
//   },
//   components: {
//     ...common.components,
//     MuiCard: {
//       styleOverrides: {
//         root: {
//           backgroundColor: "hsl(0, 0%, 100%)",  // --card
//           color: "hsl(220, 13%, 9%)",           // --card-foreground
//         },
//       },
//     },
//   },
// });

// export const darkTheme = createTheme({
//   ...common,
//   palette: {
//     mode: "dark",
//     background: {
//       default: "hsl(222, 47%, 11%)",            // --background
//       paper: "hsl(222, 47%, 11%)",              // --card
//     },
//     text: {
//       primary: "hsl(213, 31%, 91%)",            // --foreground
//       secondary: "hsl(213, 13%, 65%)",          // --muted-foreground
//     },
//     primary: {
//       main: "hsl(217, 92%, 59%)",               // --primary
//       contrastText: "hsl(0, 0%, 98%)",          // --primary-foreground
//     },
//     secondary: {
//       main: "hsl(222, 47%, 17%)",               // --secondary
//       contrastText: "hsl(213, 31%, 91%)",       // --secondary-foreground
//     },
//     error: {
//       main: "hsl(0, 63%, 31%)",                 // --destructive
//       contrastText: "hsl(213, 31%, 91%)",       // --destructive-foreground
//     },
//     success: {
//       main: "hsl(142, 71%, 45%)",               // --success
//       contrastText: "hsl(0, 0%, 98%)",          // --success-foreground
//     },
//     warning: {
//       main: "hsl(38, 92%, 50%)",                // --warning
//       contrastText: "hsl(0, 0%, 98%)",          // --warning-foreground
//     },
//     divider: "hsl(222, 47%, 17%)",              // --border
//   },
//   components: {
//     ...common.components,
//     MuiCard: {
//       styleOverrides: {
//         root: {
//           backgroundColor: "hsl(222, 47%, 11%)", // --card
//           color: "hsl(213, 31%, 91%)",           // --card-foreground
//         },
//       },
//     },
//   },
// });


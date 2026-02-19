# AI Rules for Material UI App

## Tech Stack

- You are building a React application.
- Use TypeScript.
- Use React Router. KEEP the routes in src/App.tsx
- Always put source code in the src folder.
- Put pages into src/pages/
- Put components into src/components/
- The main page (default page) is src/App.tsx

## Component Usage

- Import UI components directly from `@mui/material` (e.g., `import { Button, Card, TextField } from "@mui/material"`)
- Import icons from `@mui/icons-material` (e.g., `import { Add, Delete } from "@mui/icons-material"`)
- Do NOT create wrapper components in src/components/ui/ that duplicate MUI components
- src/components/ is for custom, app-specific components only

## Component Library: Material UI (MUI) v6

- Documentation: https://mui.com/material-ui/
- Use sx prop for one-off styles, styled() for reusable styled components
- Theme customization via src/theme.ts (createTheme)
- Follow Material Design 3 guidelines

## Styling

- Use MUI's sx prop or styled() API — Do NOT use Tailwind CSS
- Use MUI layout components: Box, Stack, Grid, Container
- Theme palette colors: primary, secondary, error, warning, info, success
- Typography variants: h1-h6, subtitle1-2, body1-2, caption, overline

## Forms

- Use react-hook-form with zod for validation
- MUI TextField, Select, Checkbox, Switch, Radio components

## Available MUI Components

Button, IconButton, TextField, Select, Checkbox, Switch, Radio, Slider, Card, CardContent, CardActions, CardHeader, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableHead, TableBody, TableRow, TableCell, Tabs, Tab, Badge, Alert, Snackbar, Tooltip, Avatar, Chip, List, ListItem, Accordion, Divider, LinearProgress, CircularProgress, Skeleton, Drawer, AppBar, Toolbar, Menu, MenuItem, Autocomplete, Typography, Box, Stack, Grid, Container, Paper

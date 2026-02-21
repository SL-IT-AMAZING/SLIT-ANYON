# Preview Infrastructure - Visual Maps

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ANYON ELECTRON APP                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐          ┌──────────────────────┐        │
│  │   RENDERER PROCESS   │          │    MAIN PROCESS      │        │
│  │   (React/Browser)    │          │  (Node.js/Electron)  │        │
│  ├──────────────────────┤          ├──────────────────────┤        │
│  │                      │          │                      │        │
│  │ ┌────────────────┐   │          │ registerPreview   │        │
│  │ │ template-      │   │          │ Scheme()          │        │
│  │ │ detail.tsx     │   │◄─────────┤ registerPreview   │        │
│  │ │                │   │   IPC    │ Protocol()        │        │
│  │ │ <iframe srcDoc>│   │          │                      │        │
│  │ └────────────────┘   │          │ protocol.handle     │        │
│  │                      │          │ ("anyon-preview")   │        │
│  │ ┌────────────────┐   │          │                      │        │
│  │ │PreviewIframe   │   │          └──────────────────────┘        │
│  │ │<iframe src>    │   │                                           │
│  │ │ anyon-preview  │   │          ┌──────────────────────┐        │
│  │ │ :// protocol   │   │◄─────────┤ File System         │        │
│  │ └────────────────┘   │  Protocol│                      │        │
│  │                      │  Handler │ preview-apps/       │        │
│  │ ┌────────────────┐   │          │ ├─ preview-shadcn/  │        │
│  │ │ Design System  │   │          │ │  └─ dist/         │        │
│  │ │ Switcher       │   │          │ ├─ preview-mui/     │        │
│  │ │                │   │          │ └─ ...              │        │
│  │ └────────────────┘   │          └──────────────────────┘        │
│  │                      │                                           │
│  └──────────────────────┘                                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Request Flow: Design System Preview (anyon-preview://)

```
┌─────────────────┐
│  React Component│
│  <iframe src=   │
│  "anyon-preview │
│  ://shadcn/...">│
└────────┬────────┘
         │
         v
┌─────────────────────────────┐
│  Browser/Electron Network   │
│  Request: anyon-preview://  │
│  shadcn/assets/style.css    │
└────────┬────────────────────┘
         │
         v
┌───────────────────────────────────────────┐
│  Electron Protocol Handler                │
│  protocol.handle("anyon-preview")         │
├───────────────────────────────────────────┤
│                                            │
│  1. Parse URL                             │
│     hostname: "shadcn"                    │
│     pathname: "/assets/style.css"         │
│                                            │
│  2. Validate hostname                     │
│     Is "shadcn" in DESIGN_SYSTEM_IDS?    │
│     ✓ YES → continue                     │
│     ✗ NO → 404 Not Found                 │
│                                            │
│  3. Build dist path                       │
│     preview-apps/preview-shadcn/dist/    │
│                                            │
│  4. Resolve requested file                │
│     preview-apps/preview-shadcn/dist/    │
│     assets/style.css                      │
│                                            │
│  5. Security checks                       │
│     ✓ No ".." sequences                   │
│     ✓ Path in distRoot                    │
│     ✓ Not absolute path                   │
│                                            │
│  6. File exists?                          │
│     ✓ YES → continue                     │
│     ✗ NO → try index.html                │
│                                            │
│  7. Get MIME type                         │
│     .css → "text/css"                     │
│                                            │
│  8. Serve file                            │
│     net.fetch(file://..., headers)       │
│                                            │
└────────────┬────────────────────────────┘
             │
             v
┌─────────────────────────────────┐
│  File System                     │
│  /Users/.../preview-shadcn/dist/ │
│  assets/style.css               │
└────────────┬────────────────────┘
             │
             v
┌─────────────────────────────────┐
│  Response: File Content          │
│  Content-Type: text/css          │
│  [CSS content bytes]             │
└────────────┬────────────────────┘
             │
             v
┌─────────────────────────┐
│  Browser (iframe)       │
│  Receives CSS           │
│  Applies styles         │
│  Renders preview        │
└─────────────────────────┘
```

---

## 3. Request Flow: Template Preview (srcDoc)

```
┌──────────────────────────┐
│  template-detail.tsx     │
│  componentDidMount       │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  IPC Call                │
│  ipc.template.           │
│  getTemplateContent({    │
│    templatePath: "..."   │
│  })                      │
└────────────┬─────────────┘
             │ (renderer→main)
             v
┌────────────────────────────────────┐
│  Main Process Handler              │
│  template_handlers.ts              │
│                                    │
│  createTypedHandler(               │
│    "get-template-content",        │
│    async (_, {templatePath}) => {  │
│                                    │
│      html = fs.readFile(           │
│        templatePath                │
│      )                             │
│      return { html }               │
│    }                               │
│  )                                 │
└────────────┬─────────────────────┘
             │
             v
┌─────────────────────────────────┐
│  File System                     │
│  Read entire HTML file to memory │
│  [1MB - 100MB HTML content]      │
└────────────┬────────────────────┘
             │
             v
┌─────────────────────────────────────┐
│  IPC Response                        │
│  {                                   │
│    html: "<!DOCTYPE html>..."        │
│  }                                   │
└────────────┬──────────────────────┘
             │ (main→renderer)
             v
┌──────────────────────────────┐
│  React State                 │
│  setPreviewHtml(htmlString)  │
└────────────┬─────────────────┘
             │
             v
┌──────────────────────────────┐
│  Render                      │
│  <iframe                     │
│    srcDoc={previewHtml}      │
│    sandbox="allow-scripts"   │
│  />                          │
└────────────┬─────────────────┘
             │
             v
┌──────────────────────────────┐
│  Browser (iframe)            │
│  srcDoc creates new document │
│  Parses & renders HTML       │
│  ⚠️ MEMORY OVERHEAD:         │
│  Entire file in RAM          │
└──────────────────────────────┘
```

---

## 4. File Organization

```
ANYON-B2C/
│
├── src/
│   ├── main/
│   │   ├── preview-protocol.ts          ← ⭐ CORE PROTOCOL HANDLER
│   │   │   ├── registerPreviewScheme()
│   │   │   ├── registerPreviewProtocol()
│   │   │   ├── getPreviewDistRoot()
│   │   │   └── MIME_TYPES mapping
│   │   │
│   │   └── main.ts                      ← ⭐ REGISTRATION ENTRY POINT
│   │       ├── registerPreviewScheme()  (line 60, before app.ready)
│   │       └── registerPreviewProtocol()(line 140, after app.ready)
│   │
│   ├── ipc/
│   │   ├── utils/
│   │   │   └── preview_server_manager.ts
│   │   │       ├── getPreviewUrl()      ← Generate nonce + URL
│   │   │       └── stopActivePreview()
│   │   │
│   │   ├── types/
│   │   │   └── templates.ts
│   │   │       ├── GetTemplateContentParams
│   │   │       ├── GetTemplateContentResult
│   │   │       └── templateContracts
│   │   │
│   │   └── handlers/
│   │       └── template_handlers.ts
│   │           └── registerTemplateHandlers()
│   │
│   ├── components/
│   │   └── preview_panel/
│   │       ├── PreviewIframe.tsx        ← ⭐ DEV APP PREVIEW
│   │       │   ├── Uses appUrl from dev server
│   │       │   ├── Navigation history
│   │       │   ├── postMessage listener
│   │       │   └── Error handling
│   │       │
│   │       ├── PreviewPanel.tsx
│   │       ├── Console.tsx
│   │       └── ...other components
│   │
│   ├── pages/
│   │   └── template-detail.tsx          ← ⭐ TEMPLATE PREVIEW (srcDoc)
│   │       ├── Fetch template HTML via IPC
│   │       ├── srcDoc iframe
│   │       └── Dynamic scaling
│   │
│   └── shared/
│       └── designSystems.ts
│           ├── DESIGN_SYSTEMS[]         ← 6 design systems
│           └── DESIGN_SYSTEM_IDS        ← Whitelist for protocol
│
└── preview-apps/
    ├── preview-shadcn/
    │   ├── dist/                        ← ⭐ SERVED VIA PROTOCOL
    │   │   ├── index.html
    │   │   └── assets/
    │   ├── src/
    │   └── package.json (Vite setup)
    │
    ├── preview-mui/
    ├── preview-antd/
    ├── preview-chakra/
    ├── preview-mantine/
    └── preview-daisyui/
```

---

## 5. Protocol URL Parsing

```
URL: anyon-preview://shadcn/assets/style.css

┌──────────────────────────────────────┐
│ Parse with new URL()                 │
├──────────────────────────────────────┤
│                                      │
│ protocol:   "anyon-preview:"         │
│ hostname:   "shadcn"                 │
│ pathname:   "/assets/style.css"      │
│                                      │
└──────────────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ Validate hostname                    │
├──────────────────────────────────────┤
│                                      │
│ DESIGN_SYSTEM_IDS = [                │
│   "shadcn",         ← ✓ Found        │
│   "mui",                             │
│   "antd",                            │
│   "chakra",                          │
│   "mantine",                         │
│   "daisyui"                          │
│ ]                                    │
│                                      │
└──────────────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ Build dist root path                 │
├──────────────────────────────────────┤
│                                      │
│ if (app.isPackaged) {                │
│   distRoot = path.join(              │
│     process.resourcesPath,           │
│     "preview-dists",                 │
│     "preview-shadcn",                │
│     "dist"                           │
│   )                                  │
│ } else {                             │
│   distRoot = path.join(              │
│     process.cwd(),                   │
│     "preview-apps",                  │
│     "preview-shadcn",                │
│     "dist"                           │
│   )                                  │
│ }                                    │
│                                      │
│ Result:                              │
│ "/Users/.../ANYON/preview-apps/      │
│  preview-shadcn/dist"                │
│                                      │
└──────────────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ Extract & validate request path      │
├──────────────────────────────────────┤
│                                      │
│ originalPath = "/assets/style.css"   │
│ requestedPath = "assets/style.css"   │
│ (remove leading /)                   │
│                                      │
│ normalized = path.normalize(         │
│   "assets/style.css"                 │
│ )                                    │
│                                      │
│ Security check 1:                    │
│ Contains ".."? NO ✓                  │
│ Is absolute? NO ✓                    │
│                                      │
└──────────────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ Resolve full file path               │
├──────────────────────────────────────┤
│                                      │
│ filePath = path.join(                │
│   distRoot,                          │
│   requestedPath                      │
│ )                                    │
│                                      │
│ Result:                              │
│ "/.../preview-shadcn/dist/           │
│ assets/style.css"                    │
│                                      │
│ resolvedPath = path.resolve(         │
│   filePath                           │
│ )                                    │
│                                      │
│ (fully qualified, no .. or .)        │
│                                      │
└──────────────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ Security boundary check              │
├──────────────────────────────────────┤
│                                      │
│ Does resolvedPath stay in distRoot?  │
│                                      │
│ resolvedPath.startsWith(             │
│   path.resolve(distRoot)             │
│ ) ✓ YES                              │
│                                      │
│ Security check 2: PASS               │
│                                      │
└──────────────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ Check file exists                    │
├──────────────────────────────────────┤
│                                      │
│ fs.existsSync(resolvedPath) ✓ YES    │
│                                      │
└──────────────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ Determine MIME type                  │
├──────────────────────────────────────┤
│                                      │
│ ext = path.extname(resolvedPath)     │
│     = ".css"                         │
│                                      │
│ mimeType = MIME_TYPES[".css"]        │
│          = "text/css"                │
│                                      │
│ Defaults to                          │
│ "application/octet-stream"           │
│                                      │
└──────────────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ Serve file                           │
├──────────────────────────────────────┤
│                                      │
│ return net.fetch(                    │
│   `file://${resolvedPath}`,          │
│   { headers:                         │
│     { "Content-Type": mimeType }     │
│   }                                  │
│ )                                    │
│                                      │
│ FILE CONTENT SENT TO IFRAME          │
│                                      │
└──────────────────────────────────────┘
```

---

## 6. Security Check Decision Tree

```
                    ┌─────────────────────┐
                    │ Protocol Request    │
                    │ anyon-preview://... │
                    └──────────┬──────────┘
                               │
                               v
                    ┌──────────────────────┐
                    │ Extract hostname     │
                    │ & pathname           │
                    └──────────┬───────────┘
                               │
                      ┌────────┴────────┐
                      v                 v
           ┌─────────────────┐  ┌───────────────┐
           │ Is hostname in  │  │ Normalize     │
           │ DESIGN_SYSTEM   │  │ pathname      │
           │ _IDS?           │  │               │
           └────────┬────────┘  └───────────────┘
                    │                   │
         ┌──────────┴────────┐          │
         │                   │          │
        YES                  NO         │
         │                   │          │
         v                   v          │
    Continue             404 ✗          │
     │                                  │
     └──────────────────┬───────────────┘
                        │
                        v
             ┌──────────────────────┐
             │ Check for ".." or    │
             │ absolute path        │
             └──────────┬───────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
       Found                       Not Found
          │                           │
          v                           v
      403 ✗                      Continue
                                    │
                                    v
                        ┌───────────────────────┐
                        │ Resolve full path &   │
                        │ check boundary        │
                        │ (stays in distRoot?)  │
                        └───────────┬───────────┘
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                       YES                    NO
                         │                     │
                         v                     v
                    Continue               403 ✗
                         │
                         v
                ┌─────────────────────┐
                │ File exists?        │
                └────────┬────────────┘
                         │
             ┌───────────┴───────────┐
             │                       │
            YES                     NO
             │                       │
             v                       v
         Serve File         Try index.html
             │
             ├─ Exists? ─YES─ Serve
             └─ No ────────── 404 ✗
```

---

## 7. Component Communication Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    REACT COMPONENT                           │
│            (template-detail.tsx)                             │
└────────────────────┬─────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        v                         v
    ┌────────────┐         ┌─────────────┐
    │ useEffect  │         │ State       │
    │ on mount   │         │             │
    │            │         │ previewHtml │
    │ Fetch IPC  │         │             │
    └─────┬──────┘         └─────────────┘
          │
          v
    ┌──────────────────┐
    │ ipc.template.get │
    │ TemplateContent()│
    └─────┬────────────┘
          │ IPC Message
          v
    ┌──────────────────────────────┐
    │ ELECTRON MAIN PROCESS        │
    │ (template_handlers.ts)       │
    └─────┬────────────────────────┘
          │
          v
    ┌──────────────────────────────┐
    │ fetchTemplateContent()       │
    │ fs.readFile(path)            │
    │ return { html: ... }         │
    └─────┬────────────────────────┘
          │ IPC Response
          v
    ┌──────────────────────────────┐
    │ REACT COMPONENT              │
    │ setPreviewHtml(htmlString)   │
    └─────┬────────────────────────┘
          │
          v
    ┌──────────────────────────────┐
    │ Render                       │
    │ <iframe srcDoc={previewHtml}/>
    └─────┬────────────────────────┘
          │
          v
    ┌──────────────────────────────┐
    │ BROWSER IFRAME               │
    │                              │
    │ Parses & renders HTML        │
    │ sandbox="allow-scripts"      │
    └──────────────────────────────┘
```

---

## 8. Size Comparison: Protocol vs srcDoc

```
MEMORY USAGE FOR 10MB TEMPLATE HTML

┌─────────────────────────────────────────┐
│ srcDoc Approach                         │
├─────────────────────────────────────────┤
│                                         │
│ 1. Read file → 10MB in memory           │
│ 2. Return from IPC → copy in transit    │
│ 3. Store in React state → 10MB in RAM   │
│ 4. Render iframe with srcDoc → 10MB     │
│                                         │
│ TOTAL MEMORY: ~40MB (4x file size)      │
│ ❌ Not scalable for large files         │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Protocol Approach (anyon-preview://)    │
├─────────────────────────────────────────┤
│                                         │
│ 1. Browser requests file via protocol   │
│ 2. Main process opens file stream       │
│ 3. net.fetch streams to iframe          │
│ 4. Browser receives in chunks           │
│                                         │
│ TOTAL MEMORY: ~1MB (streaming buffer)   │
│ ✅ Scalable, no memory overhead         │
│                                         │
└─────────────────────────────────────────┘

Performance Comparison:

Time →

srcDoc:  ████ (read) ████ (ipc) ████ (render)
         [Serialization overhead]

Protocol: ██ (stream) ████ (render)
         [Parallel, no overhead]
```

---

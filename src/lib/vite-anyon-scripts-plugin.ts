import fs from 'fs';
import path from 'path';
import { Plugin } from 'vite';

interface AnyonScriptsPluginOptions {
  workerDir?: string;
  projectRoot?: string;
}

export function anyonScriptsPlugin(options: AnyonScriptsPluginOptions = {}): Plugin {
  const { workerDir = 'worker', projectRoot = path.resolve(__dirname, '..', '..') } = options;
  
  let anyonScripts: string[] = [];
  
  return {
    name: 'anyon-scripts',
    buildStart() {
      // Load all the Anyon scripts that would be injected by the proxy server
      const scripts = [];
      
      // Helper function to load script content
      const loadScript = (filePath: string, description: string) => {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          console.log(`✓ Loaded ${description} from ${filePath}`);
          return content;
        } catch (error) {
          console.warn(`⚠️ Failed to load ${description}: ${error instanceof Error ? error.message : String(error)}`);
          return null;
        }
      };
      
      // Load scripts from node_modules (same as proxy server)
      const htmlToImagePath = path.join(projectRoot, 'node_modules', 'html-to-image', 'dist', 'html-to-image.js');
      const stacktracePath = path.join(projectRoot, 'node_modules', 'stacktrace-js', 'dist', 'stacktrace.min.js');
      
      const htmlToImageContent = loadScript(htmlToImagePath, 'html-to-image.js');
      const stacktraceContent = loadScript(stacktracePath, 'stacktrace.min.js');
      
      // Load scripts from worker directory
      const workerScripts = [
        { file: 'anyon-shim.js', desc: 'anyon-shim.js' },
        { file: 'anyon-component-selector-client.js', desc: 'anyon-component-selector-client.js' },
        { file: 'anyon-screenshot-client.js', desc: 'anyon-screenshot-client.js' },
        { file: 'anyon-visual-editor-client.js', desc: 'anyon-visual-editor-client.js' },
        { file: 'anyon_logs.js', desc: 'anyon_logs.js' },
        { file: 'anyon-sw-register.js', desc: 'anyon-sw-register.js' },
      ];
      
      for (const { file, desc } of workerScripts) {
        const scriptPath = path.join(projectRoot, workerDir, file);
        const content = loadScript(scriptPath, desc);
        if (content) {
          scripts.push(content);
        }
      }
      
      // Add node_modules scripts
      if (stacktraceContent) scripts.unshift(stacktraceContent);
      if (htmlToImageContent) scripts.push(htmlToImageContent);
      
      anyonScripts = scripts;
      console.log(`Loaded ${scripts.length} Anyon scripts for injection`);
    },
    transformIndexHtml(html) {
      // Inject scripts into the head, similar to proxy server
      const scriptTags = anyonScripts.map(script => `<script>${script}</script>`).join('\n');
      
      return {
        html: html.replace(
          /<head[^>]*>/i,
          `$&\n${scriptTags}`
        ),
        tags: []
      };
    }
  };
}

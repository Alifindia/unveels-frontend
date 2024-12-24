import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

const baseRoutes = [
  "/",
  "/skin-tone-finder",
  "/personality-finder",
  "/face-analyzer",
  "/skin-analysis",
  "/find-the-look",
  "/virtual-assistant",
  "/virtual-try-on-product",
  "/virtual-try-on",
  "/see-improvement",
  "/virtual-try-on-accesories",
  "/virtual-try-on-makeup",
  "/virtual-try-on-product",
  "/virtual-try-on-web",
  "/find-the-look-web",
  "/skin-tone-finder-web",
  "/virtual-avatar-web",
  "/skin-analysis-web",
  "/see-improvement-web",
  "/personality-finder-web",
];

function generateHtmlFromTemplate(route: string) {
  // Read the original index.html
  const template = fs.readFileSync(
    path.resolve(__dirname, "index.html"),
    "utf-8",
  );

  // Find root div position
  const moduleScriptPos = template.indexOf('<script type="module"');

  // Split the template into parts
  const beforeScript = template.slice(0, moduleScriptPos);
  const afterScript = template.slice(moduleScriptPos);

  // Create the modified HTML with route script before module script
  const modifiedHtml =
    beforeScript +
    `    <script>
      window.__INITIAL_ROUTE__ = "${route}";
    </script>\n` +
    afterScript;

  return modifiedHtml;
}

const inputObjects = Object.fromEntries(
  baseRoutes.map((route) => {
    const name = route === "/" ? "index" : route.slice(1);
    const htmlPath = path.resolve(__dirname, `pages/${name}.html`);

    // Ensure pages directory exists
    if (!fs.existsSync("pages")) {
      fs.mkdirSync("pages");
    }

    // Write modified template file
    fs.writeFileSync(htmlPath, generateHtmlFromTemplate(route));

    return [name, htmlPath];
  }),
);

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/rest": {
        target: "https://unveels.com/",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/rest/, "/en/rest"),
      },
    },
  },
  build: {
    manifest: true,
    assetsDir: "media/unveels",
    rollupOptions: {
      input: inputObjects,
    },
  },
});

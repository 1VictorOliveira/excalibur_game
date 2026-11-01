import { defineConfig } from "vite";

// Em desenvolvimento a base é "/". No GitHub Actions, a variável VITE_BASE
// é definida automaticamente como "/nome-do-repositorio/" (veja .github/workflows/deploy.yml).
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
});

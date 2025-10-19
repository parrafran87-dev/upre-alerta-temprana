# UPRE — Generador de Boletas AT (Vite + React + TypeScript)

## Desarrollo local
```bash
npm i
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Publicación en GitHub Pages
1) Crea un repo llamado `upre-alerta-temprana` y sube estos archivos.
2) Si publicas en `https://<usuario>.github.io/upre-alerta-temprana/`, deja `base` en `vite.config.ts` como `'/upre-alerta-temprana/'`.
   Si usas `https://<usuario>.github.io/` (raíz), cambia `base` a `'/'`.
3) Habilita Pages: *Settings → Pages → Build and deployment → Source: GitHub Actions*.
4) Haz un push a `main`. El workflow compilará y desplegará a Pages.

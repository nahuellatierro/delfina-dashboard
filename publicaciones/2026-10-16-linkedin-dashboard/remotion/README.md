# Video del dashboard (Remotion)

Video de 40 s, 1080×1350, para el post del 16/10/2026. Números reales de `dashboard_metricas` al 15/10.

```sh
npm install
npm run render            # out/dashboard-delfina.mp4 (sin audio)
node musica.mjs           # out/musica.wav (pista sintetizada, 96 BPM)
ffmpeg -i out/dashboard-delfina.mp4 -i out/musica.wav \
  -filter_complex "[1:a]volume=1.6,alimiter=limit=0.89[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest dashboard-delfina-musica.mp4
```

Conviene correrlo en una carpeta fuera de OneDrive (por `node_modules`). `npm run studio` abre el editor de Remotion.

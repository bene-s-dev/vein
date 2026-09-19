import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Vite plugin: POST /api/save-sprite  →  public/assets/sprites/<key>.webp
function spriteSaverPlugin() {
  return {
    name: 'sprite-saver',
    configureServer(server) {
      server.middlewares.use('/api/save-sprite', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { key, dataUrl } = JSON.parse(body);
            if (!key || !dataUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing key or dataUrl' }));
              return;
            }
            // Strip data:image/webp;base64, prefix
            const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64, 'base64');

            const dir = path.resolve('./public/assets/sprites');
            fs.mkdirSync(dir, { recursive: true });
            const filePath = path.join(dir, `${key}.webp`);
            fs.writeFileSync(filePath, buffer);

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ ok: true, file: `assets/sprites/${key}.webp` }));
          } catch (err) {
            console.error('[sprite-saver] Error:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [spriteSaverPlugin()],
  server: {
    port: 3000,
    open: false,
    host: true,
    allowedHosts: true
  }
});

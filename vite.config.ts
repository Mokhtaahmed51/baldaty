import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function logoUploaderPlugin(): Plugin {
  return {
    name: 'logo-uploader',
    configureServer(server) {
      server.middlewares.use('/api/upload-logo', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const { imageBase64 } = parsed;
              if (imageBase64) {
                const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                const srcPath = path.resolve(__dirname, 'src/baldaty_logo.png');
                const pubDir = path.resolve(__dirname, 'public');
                const pubPath = path.resolve(pubDir, 'baldaty_logo.png');
                const rootPath = path.resolve(__dirname, 'baldaty_logo.png');
                fs.mkdirSync(pubDir, { recursive: true });
                fs.writeFileSync(srcPath, buffer);
                fs.writeFileSync(pubPath, buffer);
                fs.writeFileSync(rootPath, buffer);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, size: buffer.length }));
                return;
              }
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: String(err) }));
              return;
            }
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No image provided' }));
          });
        } else {
          res.writeHead(405).end();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), logoUploaderPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

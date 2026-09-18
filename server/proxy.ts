import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env / .env.local if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [k, ...v] = trimmed.split('=');
          const key = k.trim();
          const val = v.join('=').trim().replace(/^["'](.*)["']$/, '$1');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const DEEP_IMAGE_BASE_URL = 'https://deep-image.ai/rest_api';

/**
 * Resolves local image URLs (e.g. /src/assets/... or /assets/...) into base64 Data URIs
 */
function resolveImagePayload(imageStr: string): string | null {
  if (!imageStr) return null;
  if (imageStr.startsWith('data:') || imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
    return imageStr;
  }

  // Attempt to resolve local path
  const cleanPath = imageStr.replace(/^\/+/, '');
  const candidatePaths = [
    path.resolve(rootDir, cleanPath),
    path.resolve(rootDir, 'src', cleanPath),
    path.resolve(rootDir, 'public', cleanPath),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        const ext = path.extname(candidate).toLowerCase().replace('.', '');
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        const base64 = fs.readFileSync(candidate).toString('base64');
        return `data:${mime};base64,${base64}`;
      } catch (err) {
        console.error('Failed to read local image for enhancement:', err);
      }
    }
  }

  return imageStr;
}

/**
 * Main handler for /api/enhance-image requests
 */
export async function handleEnhanceRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Status polling endpoint: GET /api/enhance-image/status or /api/image-enhance/status
  if ((pathname === '/api/enhance-image/status' || pathname === '/api/image-enhance/status') && req.method === 'GET') {
    const jobId = url.searchParams.get('jobId');
    const apiKey = process.env.DEEP_IMAGE_API_KEY;

    if (!jobId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Missing jobId parameter' }));
      return;
    }

    if (!apiKey) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        status: 'unconfigured',
        error: 'DEEP_IMAGE_API_KEY is not configured.'
      }));
      return;
    }

    try {
      const response = await fetch(`${DEEP_IMAGE_BASE_URL}/result/${jobId}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'X-API-KEY': apiKey,
        },
      });

      const data = (await response.json().catch(() => null)) as any;

      if (!response.ok) {
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          status: 'error',
          error: data?.message || data?.error || `Status check failed with HTTP ${response.status}`,
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        status: data?.status || 'complete',
        resultUrl: data?.result_url || data?.url,
        jobId,
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to connect to Deep Image AI status API',
      }));
    }
    return;
  }

  // Enhancement dispatch endpoint: POST /api/enhance-image or /api/image-enhance
  if ((pathname === '/api/enhance-image' || pathname === '/api/image-enhance') && req.method === 'POST') {
    const apiKey = process.env.DEEP_IMAGE_API_KEY;

    let bodyText = '';
    req.on('data', (chunk) => {
      bodyText += chunk;
    });

    req.on('end', async () => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON request payload' }));
        return;
      }

      if (!apiKey) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          status: 'unconfigured',
          error: 'Deep Image AI API key is not configured. Set DEEP_IMAGE_API_KEY in your .env file to enable cloud AI enhancement.',
        }));
        return;
      }

      const { image, preset = 'auto', options } = parsed;

      if (!image) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'No image provided for enhancement' }));
        return;
      }

      const resolvedImage = resolveImagePayload(image);

      // Determine enhancements list and dimensions based on preset / custom options
      const enhancements: string[] = [];
      let width: string | undefined = undefined;

      if (options && typeof options === 'object') {
        if (options.deblur) enhancements.push('deblur');
        if (options.denoise) enhancements.push('denoise');
        if (options.light) enhancements.push('light');
        if (options.color) enhancements.push('color');
        if (options.upscale === '4x') width = '400%';
        else if (options.upscale === '2x') width = '200%';
      } else if (preset === 'product') {
        enhancements.push('light', 'color', 'deblur', 'denoise');
        width = '200%';
      } else if (preset === 'catalog') {
        enhancements.push('deblur', 'denoise', 'light');
      } else {
        // 'auto' default: balanced exposure, color correction, deblur and denoise
        enhancements.push('light', 'color', 'denoise', 'deblur');
        width = '200%';
      }

      // Ensure at least one enhancement operation
      if (enhancements.length === 0) {
        enhancements.push('light', 'color', 'denoise', 'deblur');
      }

      const deepImagePayload: Record<string, any> = {
        url: resolvedImage,
        enhancements,
        output_format: 'jpeg',
      };

      if (width) {
        deepImagePayload.width = width;
      }

      try {
        const response = await fetch(`${DEEP_IMAGE_BASE_URL}/process_result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'X-API-KEY': apiKey,
          },
          body: JSON.stringify(deepImagePayload),
        });

        const data = (await response.json().catch(() => null)) as any;

        if (!response.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            status: 'failed',
            error: data?.message || data?.error || `Deep Image AI rejected request (HTTP ${response.status})`,
          }));
          return;
        }

        // Deep Image AI may return either an immediate result_url or a pending job hash
        if (data?.result_url || data?.url) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            status: 'complete',
            resultUrl: data.result_url || data.url,
            operationsApplied: enhancements,
            preset,
          }));
        } else if (data?.job || data?.job_id || data?.hash) {
          const jobId = data.job || data.job_id || data.hash;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            status: 'in_progress',
            jobId,
            operationsApplied: enhancements,
            preset,
          }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            status: 'failed',
            error: 'Unrecognized response structure from Deep Image AI API',
          }));
        }
      } catch (err) {
        console.error('Deep Image AI Proxy Error:', err);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          status: 'error',
          error: err instanceof Error ? err.message : 'Could not communicate with Deep Image AI',
        }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
}

// If executed directly via `node server/proxy.ts` or tsx
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = process.env.PORT || 3001;
  const server = http.createServer(handleEnhanceRequest);
  server.listen(PORT, () => {
    console.log(`🚀 Deep Image AI Proxy Server running at http://localhost:${PORT}`);
    console.log(`   DEEP_IMAGE_API_KEY: ${process.env.DEEP_IMAGE_API_KEY ? 'Configured ✅' : 'Unconfigured ⚠️ (Graceful fallback active)'}`);
  });
}

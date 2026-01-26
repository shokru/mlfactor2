/**
 * MyST Server Wrapper for Railway/Cloud Deployment
 * 
 * This script solves two problems:
 * 1. MyST only binds to localhost - we proxy to make it publicly accessible
 * 2. MyST embeds localhost:3100 URLs in HTML - we rewrite them to the public URL
 */

const http = require('http');
const httpProxy = require('http-proxy');
const { spawn } = require('child_process');

// Railway provides PORT env var; MyST will use its default (3000)
const PUBLIC_PORT = process.env.PORT || 8080;
const MYST_PORT = 3000;

console.log(`Starting MyST deployment wrapper...`);
console.log(`Public port: ${PUBLIC_PORT}`);
console.log(`MyST internal port: ${MYST_PORT}`);

// Start MyST in the background
const mystProcess = spawn('npx', ['myst', 'start', '--port', String(MYST_PORT)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

mystProcess.stdout.on('data', (data) => {
  console.log(`[MyST] ${data.toString().trim()}`);
});

mystProcess.stderr.on('data', (data) => {
  console.error(`[MyST Error] ${data.toString().trim()}`);
});

mystProcess.on('error', (err) => {
  console.error('Failed to start MyST:', err);
  process.exit(1);
});

mystProcess.on('close', (code) => {
  console.log(`MyST process exited with code ${code}`);
  process.exit(code);
});

// Helper function to make a request to MyST and rewrite localhost URLs
function proxyWithRewrite(req, res, contentType) {
  const options = {
    hostname: 'localhost',
    port: MYST_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${MYST_PORT}` }
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    let body = [];
    
    proxyRes.on('data', chunk => body.push(chunk));
    proxyRes.on('end', () => {
      let content = Buffer.concat(body).toString('utf8');
      
      // Get the public host from the request
      const host = req.headers.host || 'localhost';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      
      // Rewrite all localhost:3100 URLs to the public URL
      content = content.replace(/http:\/\/localhost:3100/g, `${protocol}://${host}`);
      
      // Copy safe headers
      const skipHeaders = ['content-length', 'content-encoding', 'transfer-encoding'];
      Object.keys(proxyRes.headers).forEach(key => {
        if (!skipHeaders.includes(key.toLowerCase())) {
          res.setHeader(key, proxyRes.headers[key]);
        }
      });
      
      res.statusCode = proxyRes.statusCode;
      res.end(content);
    });
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502);
    res.end('Error fetching from MyST');
  });
  
  // Forward request body if present
  req.pipe(proxyReq);
}

// Create proxy server for binary/non-rewritable requests
const proxy = httpProxy.createProxyServer({
  target: `http://localhost:${MYST_PORT}`,
  ws: true
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('MyST server is starting up, please refresh in a moment...');
  }
});

// Create HTTP server that binds to all interfaces
const server = http.createServer((req, res) => {
  const url = req.url || '/';
  
  // Determine if this request needs URL rewriting
  // HTML pages and config.json contain localhost:3100 references
  const needsRewrite = 
    url === '/' ||
    url === '/config.json' ||
    url.startsWith('/config.json?') ||
    url.match(/^\/[^.]*$/) ||  // Pages without extensions (like /chap_00_preface)
    url.endsWith('.html');
  
  if (needsRewrite) {
    proxyWithRewrite(req, res);
  } else {
    // For static assets (JS, CSS, images), proxy without modification
    proxy.web(req, res);
  }
});

// Handle WebSocket upgrades (for MyST live reload)
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

// Wait a bit for MyST to start, then start the proxy
setTimeout(() => {
  server.listen(PUBLIC_PORT, '0.0.0.0', () => {
    console.log(`\n✅ Proxy server listening on 0.0.0.0:${PUBLIC_PORT}`);
    console.log(`   Forwarding to MyST at localhost:${MYST_PORT}`);
    console.log(`   Rewriting localhost:3100 URLs in HTML responses`);
    console.log(`\n🌐 Your site should be accessible now!\n`);
  });
}, 3000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  mystProcess.kill();
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  mystProcess.kill();
  server.close();
  process.exit(0);
});

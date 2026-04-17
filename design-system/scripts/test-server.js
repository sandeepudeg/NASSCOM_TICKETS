/**
 * TicketIQ Design System - Test Server
 * Simple HTTP server for running visual and performance tests
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 
      'Content-Type': mimeType,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

function serveDirectory(res, dirPath, requestPath) {
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error');
      return;
    }
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TicketIQ Design System - Directory Listing</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
        h1 { color: #4f46e5; }
        ul { list-style: none; padding: 0; }
        li { margin: 0.5rem 0; }
        a { color: #4f46e5; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .file { color: #6b7280; }
        .dir { font-weight: 500; }
    </style>
</head>
<body>
    <h1>Directory: ${requestPath}</h1>
    <ul>
        ${requestPath !== '/' ? '<li><a href="../" class="dir">📁 ..</a></li>' : ''}
        ${files.map(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          const isDir = stats.isDirectory();
          const icon = isDir ? '📁' : '📄';
          const className = isDir ? 'dir' : 'file';
          const href = path.join(requestPath, file).replace(/\\/g, '/');
          
          return `<li><a href="${href}" class="${className}">${icon} ${file}</a></li>`;
        }).join('')}
    </ul>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });
}

const server = http.createServer((req, res) => {
  // Enable CORS for testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // Remove leading slash and decode URI
  pathname = decodeURIComponent(pathname.substring(1));
  
  // Default to index.html for root
  if (pathname === '') {
    pathname = 'demo.html';
  }
  
  const filePath = path.join(ROOT_DIR, pathname);
  
  // Security check - prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    if (stats.isDirectory()) {
      // Try to serve index.html from directory
      const indexPath = path.join(filePath, 'index.html');
      fs.stat(indexPath, (indexErr) => {
        if (!indexErr) {
          serveFile(res, indexPath);
        } else {
          serveDirectory(res, filePath, '/' + pathname);
        }
      });
    } else {
      serveFile(res, filePath);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 TicketIQ Design System Test Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${ROOT_DIR}`);
  console.log('');
  console.log('Available demo pages:');
  console.log(`  📄 Main Demo: http://localhost:${PORT}/demo.html`);
  console.log(`  🧩 Components: http://localhost:${PORT}/demo-components.html`);
  console.log(`  📐 Layout: http://localhost:${PORT}/demo-layout.html`);
  console.log(`  🎬 Animations: http://localhost:${PORT}/demo-animations.html`);
  console.log(`  ⚛️  React: http://localhost:${PORT}/demo-react.html`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

module.exports = server;
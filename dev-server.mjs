// 借灯本地预览服务器（临时用，勿提交进仓库）。
// 用法：node dev-server.mjs  然后浏览器打开 http://localhost:8000/
import http from "node:http";
import {createReadStream, statSync} from "node:fs";
import {join, normalize, extname} from "node:path";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 8000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const rel = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = normalize(join(ROOT, rel));

  if (!filePath.startsWith(normalize(ROOT))) {
    res.writeHead(403, {"Content-Type": "text/plain; charset=utf-8"});
    res.end("Forbidden");
    return;
  }

  let isDir = false;
  try {
    isDir = statSync(filePath).isDirectory();
  } catch {
    res.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
    res.end("Not Found");
    return;
  }
  if (isDir) {
    res.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
    res.end("Not Found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": MIME[extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`借灯 dev server 已启动：http://localhost:${PORT}/`);
});

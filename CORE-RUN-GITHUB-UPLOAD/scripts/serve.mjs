import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("public");
const port = Number(process.env.PORT || 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
  const relative = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  let file = join(root, relative === "/" ? "index.html" : relative);

  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, "index.html");
    response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Local: http://127.0.0.1:${port}`);
});

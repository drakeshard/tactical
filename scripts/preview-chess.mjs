import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const root = process.cwd();
const host = "127.0.0.1";
const requestedPort = Number(process.env.PORT ?? 4173);
const port = Number.isSafeInteger(requestedPort) && requestedPort > 0 ? requestedPort : 4173;

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
]);

function resolveRequestPath(url) {
  const parsed = new URL(url ?? "/", `http://${host}`);
  const pathname = decodeURIComponent(parsed.pathname);
  const relative = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const absolute = path.resolve(root, `.${relative}`);
  return absolute.startsWith(`${root}${path.sep}`) ? absolute : undefined;
}

const server = http.createServer(async (request, response) => {
  const file = resolveRequestPath(request.url);
  if (!file) {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  try {
    const data = await fs.readFile(file);
    response.writeHead(200, {
      "Content-Type": contentTypes.get(path.extname(file)) ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`Chess sample: http://${host}:${port}/examples/chess/`);
});

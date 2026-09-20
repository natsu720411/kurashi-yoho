import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const chunkDir = resolve(root, "scripts/ogp-chunks");
const chunkNames = ["01a.txt", "01b.txt", "02.txt", "03.txt", "04.txt"];

const chunks = await Promise.all(
  chunkNames.map((name) => readFile(resolve(chunkDir, name), "utf8"))
);

const base64 = chunks.join("").replace(/\s+/g, "");
if (base64.length !== 24112) {
  throw new Error(`Unexpected OGP base64 length: ${base64.length}`);
}

const image = Buffer.from(base64, "base64");
const hash = createHash("sha256").update(image).digest("hex");

if (
  image.length !== 18083 ||
  hash !== "c72974cb2037294928a28badb597cfbcf49ad38eac4ab1f1eefb12fe7dc5dea3"
) {
  throw new Error("OGP image integrity check failed");
}

const output = resolve(root, "public/ogp-guides.jpg");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, image);

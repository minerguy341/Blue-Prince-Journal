import { createDecipheriv, pbkdf2Sync } from "node:crypto";
import { gunzipSync } from "node:zlib";

/** Public Easy Save 3 password for Blue Prince (Steam). Overridable via env. */
const STEAM_PASSWORD =
  process.env.BLUE_PRINCE_ES3_PASSWORD ??
  "D#vnrl%TI_9q0euFPIx+wKRuNx%Aja2-AtuH1jtMSk2k%H1jXjUPor08QaeQE=p5l=LAIWaSYms-68SYVS0PPoWxgM1B8?8tirM+UGr=cp!5a3=B5tBsKYEUfqxN!H9DvRVkLW?6cMeZWxgov%OOXmfl9zRiqWPsXq95lEc4yax7hqf5m_i5ssn-OGgLA8LJu2ETibBi7DwLc-zQ4M9jRGIdV_izS_J_=3FA=rAo0HUiEr-HWYVnuK$OQUyaVMchXxf%EBo3A7Z-PXYm$6PPG%fJfWzV7M$L5he#y5cb?kVR67IfGzG$UzBcLhNMDhQFwQSEX59ZG7hP32q?6PgirmvGTd-45+7ZKyG$FrDHoNw7ceUhrxYdzYSHd0yRz0T_RR_R5$GZda%DDfCUPHIaVlIhMq4FEOzo?GL7wyXr9XD7SD_QGpjZh&NDwycjnBeOy2mmFazlOV5eR7jsiwYDde9jCOH&cOxeTody=iUEt|l7JCQ8IyX|0g3H&NO6DMveVqC9|OPkOZpO3DpM|||3LJ7PX40rZJXmLILu0UXU9hpM5";

const GAME_PASS_PASSWORD = process.env.BLUE_PRINCE_ES3_GAMEPASS_PASSWORD ?? "swansong";

function decryptAes128Cbc(enc: Buffer, password: string): Buffer {
  const iv = enc.subarray(0, 16);
  const key = pbkdf2Sync(password, iv, 100, 16, "sha1");
  const decipher = createDecipheriv("aes-128-cbc", key, iv);
  return Buffer.concat([decipher.update(enc.subarray(16)), decipher.final()]);
}

function maybeGunzip(buf: Buffer): Buffer {
  if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
    return gunzipSync(buf);
  }
  return buf;
}

function looksLikeText(buf: Buffer): boolean {
  const sample = buf.subarray(0, Math.min(buf.length, 64)).toString("utf8");
  return sample.includes("{") || sample.includes("BluePrint") || sample.trimStart().startsWith("{");
}

export function es3ToJsonText(raw: string): string {
  let out = raw;
  const pattern = /\d+:\{/g;
  let match: RegExpExecArray | null;
  const replacements: { start: number; end: number; text: string }[] = [];
  while ((match = pattern.exec(out))) {
    const start = match.index;
    const digits = match[0].slice(0, -2);
    replacements.push({
      start,
      end: start + digits.length,
      text: `"${digits}_fixed"`,
    });
  }
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    out = out.slice(0, r.start) + r.text + out.slice(r.end);
  }
  return out;
}

export function parseEs3Json(text: string): unknown {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    return JSON.parse(es3ToJsonText(trimmed));
  }
}

export function decryptEs3Buffer(enc: Buffer): Buffer {
  const candidates = [STEAM_PASSWORD, GAME_PASS_PASSWORD];
  const errors: string[] = [];
  for (const password of candidates) {
    try {
      const decrypted = maybeGunzip(decryptAes128Cbc(enc, password));
      if (looksLikeText(decrypted)) return decrypted;
    } catch (error) {
      errors.push(`${password === GAME_PASS_PASSWORD ? "game-pass" : "steam"}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  try {
    const unzipped = maybeGunzip(enc);
    if (looksLikeText(unzipped)) return unzipped;
  } catch (error) {
    errors.push(`gzip: ${error instanceof Error ? error.message : String(error)}`);
  }
  throw new Error(`Could not decrypt Easy Save 3 buffer (${errors.join("; ") || "unrecognized format"})`);
}

export function decodeSaveBytes(bytes: Buffer): unknown {
  const asText = bytes.toString("utf8");
  const trimmed = asText.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseEs3Json(asText);
  }
  const decrypted = decryptEs3Buffer(bytes);
  return parseEs3Json(maybeGunzip(decrypted).toString("utf8"));
}

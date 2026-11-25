export type ClamAvScanResult =
  | { ok: true }
  | { ok: false; infected: true; signature: string }
  | { ok: false; infected: false; error: string };

export type ClamAvClientConfig = {
  host: string;
  port: number;
  timeoutMs: number;
};

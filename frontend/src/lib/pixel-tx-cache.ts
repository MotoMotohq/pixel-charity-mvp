const KEY = "aether_pixel_tx_v1";

type Row = { pixel: number; hash: string; t: number };

function read(): Row[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as Row[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function rememberPixelTx(pixel: number, hash: string): void {
  const list = read().filter((x) => !(x.pixel === pixel && x.hash === hash));
  list.unshift({ pixel, hash, t: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 48)));
}

/** Latest known tx hash for a pixel (from this browser). */
export function txHashForPixel(pixel: number): string | undefined {
  return read().find((x) => x.pixel === pixel)?.hash;
}

export function allCachedTxRows(): Row[] {
  return read();
}

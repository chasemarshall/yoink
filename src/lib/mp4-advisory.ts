/**
 * Patches an M4A/MP4 file buffer to include the iTunes advisory atom (rtng).
 * This sets the "Explicit" flag that Apple Music / iTunes displays.
 *
 * The rtng atom lives at: moov > udta > meta > ilst > rtng > data
 * We find the ilst container and append the rtng atom to it,
 * then update all parent atom sizes.
 */

export function setExplicitTag(buffer: Buffer): Buffer {
  // Build the rtng atom: ilst child that contains a data atom with value 1 (explicit)
  // data atom: 4 size + 4 "data" + 4 type (21=integer) + 4 locale (0) + 1 value
  const dataPayload = Buffer.alloc(17);
  dataPayload.writeUInt32BE(17, 0); // data atom size
  dataPayload.write("data", 4, 4, "ascii");
  dataPayload.writeUInt32BE(21, 8); // type indicator: integer
  dataPayload.writeUInt32BE(0, 12); // locale
  dataPayload.writeUInt8(1, 16); // 1 = explicit

  // rtng atom: 4 size + 4 "rtng" + data atom
  const rtngAtom = Buffer.alloc(8 + dataPayload.length);
  rtngAtom.writeUInt32BE(rtngAtom.length, 0);
  rtngAtom.write("rtng", 4, 4, "ascii");
  dataPayload.copy(rtngAtom, 8);

  // Find ilst atom position and size
  const ilstInfo = findAtomPath(buffer, ["moov", "udta", "meta", "ilst"]);
  if (!ilstInfo) return buffer; // Can't find ilst, return unchanged

  // Insert rtng atom at the end of ilst
  const ilstEnd = ilstInfo.offset + ilstInfo.size;
  const before = buffer.subarray(0, ilstEnd) as Buffer;
  const after = buffer.subarray(ilstEnd) as Buffer;
  const result = Buffer.concat([before, rtngAtom, after]);

  // Update sizes: ilst and all its parents need to grow by rtngAtom.length
  const growth = rtngAtom.length;
  const path = ["moov", "udta", "meta", "ilst"];
  updateAtomSizes(result, path, growth);

  return result;
}

interface AtomInfo {
  offset: number;
  size: number;
}

function findAtomPath(buffer: Buffer, path: string[]): AtomInfo | null {
  let searchStart = 0;
  let searchEnd = buffer.length;
  let result: AtomInfo | null = null;

  for (let p = 0; p < path.length; p++) {
    const name = path[p];
    const found = findAtom(buffer, name, searchStart, searchEnd);
    if (!found) return null;

    result = found;

    // For "meta" atoms, there's a 4-byte version/flags field after the header
    const headerSize = name === "meta" ? 12 : 8;
    searchStart = found.offset + headerSize;
    searchEnd = found.offset + found.size;
  }

  return result;
}

function findAtom(buffer: Buffer, name: string, start: number, end: number): AtomInfo | null {
  let pos = start;
  while (pos + 8 <= end) {
    const size = buffer.readUInt32BE(pos);
    if (size < 8) return null; // invalid
    const atomName = buffer.toString("ascii", pos + 4, pos + 8);
    if (atomName === name) {
      return { offset: pos, size };
    }
    pos += size;
  }
  return null;
}

function updateAtomSizes(buffer: Buffer, path: string[], growth: number): void {
  let searchStart = 0;
  let searchEnd = buffer.length;

  for (const name of path) {
    const found = findAtom(buffer, name, searchStart, searchEnd);
    if (!found) return;

    // Update this atom's size
    buffer.writeUInt32BE(found.size + growth, found.offset);

    const headerSize = name === "meta" ? 12 : 8;
    searchStart = found.offset + headerSize;
    searchEnd = found.offset + found.size + growth;
  }
}

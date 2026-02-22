/**
 * Patches an M4A/MP4 file buffer to include iTunes catalog atoms.
 * These atoms make Apple Music recognize the file as a catalog match:
 *   cnID = content/track ID
 *   plID = playlist/album (collection) ID
 *   atID = artist ID
 *   geID = genre ID
 *
 * Each atom lives at: moov > udta > meta > ilst > {atom} > data
 */

import type { ItunesCatalogIds } from "./itunes";

export function setCatalogIds(buffer: Buffer, ids: ItunesCatalogIds): Buffer {
  const atoms: { name: string; value: number }[] = [];

  if (ids.trackId) atoms.push({ name: "cnID", value: ids.trackId });
  if (ids.collectionId) atoms.push({ name: "plID", value: ids.collectionId });
  if (ids.artistId) atoms.push({ name: "atID", value: ids.artistId });
  if (ids.genreId) atoms.push({ name: "geID", value: ids.genreId });

  if (atoms.length === 0) return buffer;

  // Build all atoms as one block to insert
  const atomBuffers = atoms.map(({ name, value }) => {
    // data atom: 4 size + 4 "data" + 4 type (21=integer) + 4 locale (0) + 4 value (32-bit)
    const dataAtom = Buffer.alloc(24);
    dataAtom.writeUInt32BE(24, 0); // data atom size
    dataAtom.write("data", 4, 4, "ascii");
    dataAtom.writeUInt32BE(21, 8); // type: integer
    dataAtom.writeUInt32BE(0, 12); // locale
    dataAtom.writeUInt32BE(value, 16); // the catalog ID

    // wrapper atom: 4 size + 4 name + data atom
    const wrapper = Buffer.alloc(8 + dataAtom.length);
    wrapper.writeUInt32BE(wrapper.length, 0);
    wrapper.write(name, 4, 4, "ascii");
    dataAtom.copy(wrapper, 8);

    return wrapper;
  });

  const insertBlock = Buffer.concat(atomBuffers);

  // Find ilst atom
  const ilstInfo = findAtomPath(buffer, ["moov", "udta", "meta", "ilst"]);
  if (!ilstInfo) return buffer;

  // Insert at end of ilst
  const ilstEnd = ilstInfo.offset + ilstInfo.size;
  const before = buffer.subarray(0, ilstEnd) as Buffer;
  const after = buffer.subarray(ilstEnd) as Buffer;
  const result = Buffer.concat([before, insertBlock, after]);

  // Update sizes for ilst and all parents
  const growth = insertBlock.length;
  updateAtomSizes(result, ["moov", "udta", "meta", "ilst"], growth);

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
    if (size < 8) return null;
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

    buffer.writeUInt32BE(found.size + growth, found.offset);
    const headerSize = name === "meta" ? 12 : 8;
    searchStart = found.offset + headerSize;
    searchEnd = found.offset + found.size + growth;
  }
}

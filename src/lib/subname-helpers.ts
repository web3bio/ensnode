import { bytesToPacket } from "@ensdomains/ensjs/utils";
import { type Hex, concat, keccak256, namehash, toHex } from "viem";

// NOTE: most of these utils could/should be pulled in from some (future) ens helper lib, as they
// implement standard and reusable logic for typescript ens libs bu aren't necessarily implemented
// or exposed by ensjs or viem

export const ROOT_NODE = namehash("");
export const ETH_NODE = namehash("eth");

export const makeSubnodeNamehash = (node: Hex, label: Hex) => keccak256(concat([node, label]));

// converts uint256-encoded nodes to hex
export const tokenIdToLabel = (tokenId: bigint) => toHex(tokenId, { size: 32 });

/**
 * These characters are prohibited in normalized ENS names per the ENSIP-15
 * standard (https://docs.ens.domains/ensip/15). Names containing labels with
 * one or more of these characters are unusable by any app implementing
 * ENSIP-15 (e.g., via https://github.com/adraffy/ens-normalize.js
 * or https://github.com/namehash/ens-normalize-python).
 * 
 * While many other characters (beyond these 4) are not supported by
 * ENSIP-15, only the following 4 characters are classified as "unindexable" due
 * to specific indexing concerns.
 * 
 * Onchain ENS contracts do not enforce ENSIP-15 normalization for reasons
 * including the gas costs of enforcement. This allows unnormalized labels
 * containing these characters to exist onchain. Such labels must be handled
 * carefully by indexers to avoid conflicts.
 * 
 * Some indexed labels are "unknown" (or "unindexable") but still require a
 * representation within indexed data. For this purpose, a special "unknown
 * label" format is defined that represents these labels in the format of
 * "[{labelhash}]" where {labelhash} is the labelhash of the unknown label.
 * When an indexed label is in this format it is necessary to distinguish an
 * "unknown" label containing a labelhash, from an unnormalized label literal
 * that is formatted to appear like an "unknown" label. For example, if the
 * unnormalized label literal
 * "[24695ee963d29f0f52edfdea1e830d2fcfc9052d5ba70b194bddd0afbbc89765]"
 * is indexed, it will be considered "unindexable" (due to the square bracket
 * characters) and therefore be represented as the following "unknown" label instead
 * "[80968d00b78a91f47b233eaa213576293d16dadcbbdceb257bca94b08451ba7f]"
 * which encodes the labelhash of the unnormalized label literal in
 * square brackets.
 */
const UNINDEXABLE_LABEL_CHARACTERS = [
  '\0', // null byte: PostgreSQL does not allow storing this character in text fields.
  '.',  // conflicts with ENS label separator logic.
  '[',  // conflicts with "unknown label" representations.
  ']'   // conflicts with "unknown label" representations.
];

const UNINDEXABLE_LABEL_CHARACTER_CODES = new Set(
  UNINDEXABLE_LABEL_CHARACTERS.map((char) => char.charCodeAt(0))
);

/**
 * Check if any characters in `label` are "unindexable".
 * 
 * Related logic in ENS Subgraph:
 * https://github.com/ensdomains/ens-subgraph/blob/master/src/utils.ts#L68
 */
export const isLabelIndexable = (label: string) => {
  if (!label) return false;

  for (let i = 0; i < label.length; i++) {
    if (UNINDEXABLE_LABEL_CHARACTER_CODES.has(label.charCodeAt(i))) return false;
  }

  return true;
};

// TODO: this should be standardized via helper lib
// this is basically just ensjs#bytesToPacket w/ custom validity check
// https://github.com/ensdomains/ens-subgraph/blob/master/src/nameWrapper.ts#L30
export function decodeDNSPacketBytes(buf: Uint8Array): [string | null, string | null] {
  if (buf.length === 0) return ["", "."];

  const name = bytesToPacket(buf);
  const labels = name.split(".");

  if (!labels.length) return [null, null];
  if (!labels.every(isLabelIndexable)) return [null, null];

  return [labels[0]!, name];
}

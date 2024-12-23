import { type Hex, concat, keccak256 } from "viem";

// TODO: pull from ens utils lib or something
export const NAMEHASH_ZERO =
	"0x0000000000000000000000000000000000000000000000000000000000000000";
export const NAMEHASH_ETH =
	"0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae";

// TODO: this should probably be a part of some ens util lib
export const makeSubnodeNamehash = (node: Hex, label: Hex) =>
	keccak256(concat([node, label]));

// https://github.com/wevm/viem/blob/main/src/utils/ens/encodeLabelhash.ts
export const encodeLabelhash = (hash: Hex): `[${string}]` =>
	`[${hash.slice(2)}]`;

// https://github.com/ensdomains/ens-subgraph/blob/master/src/utils.ts#L68
const INVALID_CHARACTER_CODES_IN_LABEL = new Set([0, 46, 91, 93]);
export const isLabelValid = (name: string) => {
	if (!name) return false;

	for (let i = 0; i < name.length; i++) {
		if (INVALID_CHARACTER_CODES_IN_LABEL.has(name.charCodeAt(i))) return false;
	}

	return true;
};

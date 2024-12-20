import type { Address, Hex } from "viem";

export const makeResolverId = (node: Hex, address: Address) =>
	[address, node].join("-");

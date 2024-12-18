import type { Address, Hex } from "viem";

export const makeResolverId = (node: Hex, address: Address) =>
	[node, address].join("/");

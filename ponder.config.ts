import { createConfig, factory, mergeAbis } from "ponder";
import { http, getAbiItem } from "viem";

import { LegacyPublicResolver } from "./abis/LegacyPublicResolver";
import { Registry } from "./abis/Registry";
import { Resolver } from "./abis/Resolver";

// just for testing...
const END_BLOCK = 12_000_000;

const RESOLVER_ABI = mergeAbis([LegacyPublicResolver, Resolver]);

const REGISTRY_OLD_ADDRESS = "0x314159265dd8dbb310642f98f50c066173c1259b";
const REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

export default createConfig({
	networks: {
		mainnet: {
			chainId: 1,
			transport: http(process.env.PONDER_RPC_URL_1),
		},
	},
	contracts: {
		RegistryOld: {
			network: "mainnet",
			abi: Registry,
			address: REGISTRY_OLD_ADDRESS,
			startBlock: 3327417,
			endBlock: END_BLOCK,
		},
		Registry: {
			network: "mainnet",
			abi: Registry,
			address: REGISTRY_ADDRESS,
			startBlock: 9380380,
			endBlock: END_BLOCK,
		},
		OldRegistryResolvers: {
			network: "mainnet",
			abi: RESOLVER_ABI,
			address: factory({
				address: REGISTRY_OLD_ADDRESS,
				event: getAbiItem({ abi: Registry, name: "NewResolver" }),
				parameter: "resolver",
			}),
			startBlock: 9380380,
			endBlock: END_BLOCK,
		},
		Resolver: {
			network: "mainnet",
			abi: RESOLVER_ABI,
			address: factory({
				address: REGISTRY_ADDRESS,
				event: getAbiItem({ abi: Registry, name: "NewResolver" }),
				parameter: "resolver",
			}),
			startBlock: 9380380,
			endBlock: END_BLOCK,
		},
	},
});

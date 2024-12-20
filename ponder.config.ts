import { createConfig, factory } from "ponder";
import { http, getAbiItem } from "viem";

import { Registry } from "./abis/Registry";
import { Resolver } from "./abis/Resolver";

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
			address: "0x314159265dd8dbb310642f98f50c066173c1259b",
			startBlock: 3327417,
		},
		Registry: {
			network: "mainnet",
			abi: Registry,
			address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
			startBlock: 9380380,
		},
		// TODO: do we need an OldResolver config as well to watch for resolves using oldregistry?
		// probably.
		Resolver: {
			network: "mainnet",
			abi: Resolver,
			address: factory({
				address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
				event: getAbiItem({ abi: Registry, name: "NewResolver" }),
				parameter: "resolver",
			}),
			startBlock: 9380380,
		},
	},
});

import { createConfig } from "ponder";
import { http } from "viem";

import { Registry } from "./abis/Registry";

export default createConfig({
	networks: {
		mainnet: {
			chainId: 1,
			transport: http(process.env.PONDER_RPC_URL_1),
		},
	},
	contracts: {
		Registry: {
			network: "mainnet",
			abi: Registry,
			address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
			startBlock: 9380380,
		},
		// RegistryOld: {
		// 	network: "mainnet",
		// 	abi: Registry,
		// 	address: "0x314159265dd8dbb310642f98f50c066173c1259b",
		// 	startBlock: 3327417,
		// },
	},
});

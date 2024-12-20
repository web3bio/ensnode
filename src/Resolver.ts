import { ponder } from "ponder:registry";
import { ensureAccount } from "./lib/ensure";
import { makeResolverId } from "./lib/ids";

ponder.on("Resolver:setup", async ({ context, event }) => {});
ponder.on("Resolver:AddrChanged", async ({ context, event }) => {});
ponder.on("Resolver:AddressChanged", async ({ context, event }) => {
	const { node, coinType, newAddress } = event.args;

	await ensureAccount(context, newAddress);

	const resolverId = makeResolverId(node, event.log.address);
});
ponder.on("Resolver:NameChanged", async ({ context, event }) => {});
ponder.on("Resolver:ABIChanged", async ({ context, event }) => {});
ponder.on("Resolver:PubkeyChanged", async ({ context, event }) => {});
ponder.on("Resolver:TextChanged", async ({ context, event }) => {});
ponder.on("Resolver:ContenthashChanged", async ({ context, event }) => {});
ponder.on("Resolver:InterfaceChanged", async ({ context, event }) => {});
ponder.on("Resolver:VersionChanged", async ({ context, event }) => {});
ponder.on("Resolver:DNSRecordChanged", async ({ context, event }) => {});
ponder.on("Resolver:DNSRecordDeleted", async ({ context, event }) => {});
ponder.on("Resolver:DNSZonehashChanged", async ({ context, event }) => {});

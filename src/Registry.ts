import { type Context, ponder } from "ponder:registry";
import { resolvers } from "ponder:schema";
import { accounts, domains } from "ponder:schema";
import { type Address, type Hex, concat, keccak256, zeroAddress } from "viem";
import { makeResolverId } from "./lib/ids";

// TODO: pull from ens utils lib or something
// export const NAMEHASH_ETH =
// 	"0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae";
export const NAMEHASH_ZERO =
	"0x0000000000000000000000000000000000000000000000000000000000000000";

// TODO: this should probably be a part of some ens util lib
const makeSubnodeNamehash = (node: Hex, label: Hex) =>
	keccak256(concat([node, label]));

// https://github.com/wevm/viem/blob/main/src/utils/ens/encodeLabelhash.ts
const encodeLabelhash = (hash: Hex): `[${string}]` => `[${hash.slice(2)}]`;

async function ensureAccount(context: Context, address: Address) {
	return await context.db
		.insert(accounts)
		.values({ id: address })
		.onConflictDoNothing();
}

ponder.on("Registry:setup", async ({ context }) => {
	// ensure we have an account for the zeroAddress
	await ensureAccount(context, zeroAddress);

	// ensure we have a root Domain, owned by the zeroAddress
	await context.db
		.insert(domains)
		.values({
			id: NAMEHASH_ZERO,
			ownerId: zeroAddress,
			createdAt: 0n,
			isMigrated: true,
		})
		.onConflictDoNothing();
});

ponder.on("Registry:Transfer", async ({ context, event }) => {
	const { node, owner } = event.args;

	// ensure owner account
	await ensureAccount(context, owner);

	// ensure domain & update owner
	await context.db
		.insert(domains)
		.values([{ id: node, ownerId: owner, createdAt: event.block.timestamp }])
		.onConflictDoUpdate({ ownerId: owner });

	// TODO: log DomainEvent
});

ponder.on("Registry:NewOwner", async ({ context, event }) => {
	const { label, node, owner } = event.args;

	const subnode = makeSubnodeNamehash(node, label);

	// ensure owner
	await ensureAccount(context, owner);

	// upsert domain owner/parent
	const domain = await context.db
		.insert(domains)
		.values({
			id: subnode,
			ownerId: owner,
			parentId: node,
			createdAt: event.block.timestamp,
		})
		.onConflictDoUpdate({ ownerId: owner });

	// increment parent subdomainCount
	await context.db
		.update(domains, { id: node })
		.set((row) => ({ subdomainCount: row.subdomainCount + 1 }));

	// if the domain doesn't yet have a name, construct it here
	if (!domain.name) {
		const parent = await context.db.find(domains, { id: node });

		// TODO: how to get reverse mapping of labelhash to labelName?
		// this is likely the known labelhash CSV the graph schema mentioned...
		// https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L111
		const labelName = encodeLabelhash(label);
		const name = parent?.name ? `${labelName}.${parent.name}` : labelName;

		await context.db
			.update(domains, { id: domain.id })
			.set({ labelName, name });
	}
});

ponder.on("Registry:NewTTL", async ({ context, event }) => {
	const { node, ttl } = event.args;

	try {
		await context.db.update(domains, { id: node }).set({ ttl });
	} catch {
		// handle the edge case in which the domain no longer exists, which will throw update error
		// https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L215
	}

	// TODO: log DomainEvent
});

ponder.on("Registry:NewResolver", async ({ context, event }) => {
	const { node, resolver: resolverAddress } = event.args;

	// if zeroing out a domain's resolver, simply remove the reference
	// NOTE: old resolver resources are kept for historical reference
	if (event.args.resolver === zeroAddress) {
		await context.db.update(domains, { id: node }).set({ resolverId: null });
	} else {
		// otherwise upsert the resolver and update the domain to point to it
		const resolverId = makeResolverId(node, resolverAddress);

		await context.db
			.insert(resolvers)
			.values({
				id: resolverId,
				domainId: event.args.node,
				address: event.args.resolver,
			})
			.onConflictDoNothing();

		await context.db.update(domains, { id: node }).set({ resolverId });
	}

	// TODO: log DomainEvent
});

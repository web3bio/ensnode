import type { Context } from "ponder:registry";
import { accounts, resolvers } from "ponder:schema";
import type { Address } from "viem";

export async function upsertAccount(context: Context, address: Address) {
	return await context.db
		.insert(accounts)
		.values({ id: address })
		.onConflictDoNothing();
}

export async function upsertResolver(
	context: Context,
	values: typeof resolvers.$inferInsert,
) {
	return await context.db
		.insert(resolvers)
		.values(values)
		.onConflictDoUpdate(values);
}

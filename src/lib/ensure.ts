import type { Context } from "ponder:registry";
import { accounts } from "ponder:schema";
import type { Address } from "viem";

export async function ensureAccount(context: Context, address: Address) {
	return await context.db
		.insert(accounts)
		.values({ id: address })
		.onConflictDoNothing();
}

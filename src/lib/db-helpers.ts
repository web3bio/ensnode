import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

export async function upsertAccount(context: Context, address: Address) {
  return context.db.insert(schema.account).values({ id: address }).onConflictDoNothing();
}

export async function upsertResolver(
  context: Context,
  values: typeof schema.resolver.$inferInsert,
) {
  return context.db.insert(schema.resolver).values(values).onConflictDoUpdate(values);
}

export async function upsertRegistration(
  context: Context,
  values: typeof schema.registration.$inferInsert,
) {
  return context.db.insert(schema.registration).values(values).onConflictDoUpdate(values);
}

export async function upsertDomainText(
  context: Context,
  values: typeof schema.domainText.$inferInsert,
) {
  return context.db.insert(schema.domainText).values(values).onConflictDoUpdate(values);
}

export async function upsertDomainTextIgnore(
  context: Context,
  values: typeof schema.domainText.$inferInsert,
) {
  return context.db.insert(schema.domainText).values(values).onConflictDoNothing();
}

export async function upsertDomainResolvedRecords(
  context: Context,
  values: typeof schema.domainResolvedRecords.$inferInsert,
) {
  return context.db.insert(schema.domainResolvedRecords).values(values).onConflictDoUpdate(values);
}
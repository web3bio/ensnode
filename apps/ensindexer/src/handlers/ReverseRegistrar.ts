import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Node } from "@ensnode/utils/types";
import { Hex } from "viem";
import { createSharedEventValues, upsertReverseClaimedRecordsIgnore, upsertReverseClaimedRecords } from "../lib/db-helpers";
import { hasNullByte, uniq } from "../lib/lib-helpers";
import { EventWithArgs } from "../lib/ponder-helpers";
import { OwnedName } from "../lib/types";


export const makeReverseRegistrarHandlers = (ownedName: OwnedName) => {
    const sharedEventValues = createSharedEventValues(ownedName);

    return {
        async handleReverseClaimed({
            context,
            event,
        }: {
            context: Context;
            event: EventWithArgs<{addr: Hex; node: Node;}>;
        }) {
            const { addr, node } = event.args;

            // insert or upsert reverse_claimed
            const reverseClaimedRecord = await upsertReverseClaimedRecordsIgnore(context, {
                id: node,
                nodeId: node,
                addrId: addr,
                createdAt: event.block.timestamp,
            });

            // upsert update_at & 
            await context.db
            .update(schema.reverseClaimed, { id: node })
            .set({ addrId: addr, updatedAt: event.block.timestamp});
        }
    };
};

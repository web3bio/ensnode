import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Node } from "@ensnode/utils/types";
import { Hex } from "viem";
import { createSharedEventValues, upsertReverseClaimedRecordsIgnore, upsertReverseClaimedRecords } from "../lib/db-helpers";
import { hasNullByte, uniq } from "../lib/lib-helpers";
import { EventWithArgs } from "../lib/ponder-helpers";
import { OwnedName } from "../lib/types";
import { keccak256, hexToBytes, toHex, concat } from "viem";


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
        },

        async handleRawSetName({
            context,
            transaction,
        }: {
            context: Context;
            transaction: {
                from: string;
                input: string;
                blockNumber: bigint;
                timestamp: bigint;
                hash: string;
            };
        }) {
            const METHOD_ID = "0xc47f0027"; // Method ID for setName(string)
            const REVERSE_NODE = "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2";
            if (transaction.input.startsWith(METHOD_ID)) {
                // Extract the name parameter
                const rawData = transaction.input.slice(10); // Remove method ID
                const nameOffset = parseInt(rawData.slice(0, 64), 16) * 2;
                const nameLength = parseInt(rawData.slice(nameOffset, nameOffset + 64), 16);
                const nameHex = rawData.slice(nameOffset + 64, nameOffset + 64 + nameLength * 2);
                const nameBytes = hexToBytes(`0x${nameHex}` as `0x${string}`);
                const name = new TextDecoder().decode(nameBytes);

                // Calculate the reverse node
                const fromAddress = transaction.from;
                const labelHash = keccak256(hexToBytes(`0x${fromAddress}`));
                const reverseNode = keccak256(
                    new Uint8Array([
                        ...hexToBytes(REVERSE_NODE),
                        ...hexToBytes(labelHash),
                    ])
                );

                console.log(`SetName called by: ${fromAddress}, name: ${name}, Reverse Node: ${reverseNode}`);

                // console.log(`Reverse Node: ${reverseNode}`);
                // console.log(`Name: ${name}`);
                // console.log(`From Address: ${fromAddress}`);

                // Upsert the reverse_claimed record
                await context.db
                    .update(schema.reverseClaimed, { id: reverseNode })
                    .set({
                        addrId: `0x${fromAddress}`,
                        name: name,
                        updatedAt: transaction.timestamp,
                    });

                console.log(`Reverse node updated successfully for ${fromAddress}`);
            }
        },

        async handleSetNameOld({
            context,
            event,
        }: {
            context: Context;
            event: { 
                from: string;
                input: string;
                blockNumber: bigint;
                timestamp: bigint;
                hash: string;
            };
        }) {
            const METHOD_ID = "0xc47f0027"; // Method ID for setName(string)

            // Ensure this is a setName transaction
            if (event.input.startsWith(METHOD_ID)) {
                // Extract the name parameter
                const rawData = event.input.slice(10); // Remove method ID
                const nameOffset = parseInt(rawData.slice(0, 64), 16) * 2;
                const nameLength = parseInt(rawData.slice(nameOffset, nameOffset + 64), 16);
                const nameHex = rawData.slice(nameOffset + 64, nameOffset + 64 + nameLength * 2);
                const nameBytes = hexToBytes(`0x${nameHex}` as `0x${string}`);
                const name = new TextDecoder().decode(nameBytes);

                console.log(`SetName called by: ${event.from}, name: ${name}`);
            }
        },
        async handleSetName({
            context,
            event,
        }: {
            context: Context;
            event: EventWithArgs<{name: string;}>;
        }) {
            const { name } = event.args;
            const fromAddress = event.transaction.from;
            console.log(`SetName called by: ${fromAddress}, name: ${name}`);

            // ADDR_REVERSE_NODE (The node hash of "addr.reverse")
            const REVERSE_NODE = "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2";

            try {
                // Calculate the label hash from the address bytes
                const addressBytes = hexToBytes(fromAddress);
                const labelHash = keccak256(addressBytes);
        
                // Concatenate REVERSE_NODE and labelHash as raw bytes
                const reverseNode = keccak256(
                    new Uint8Array([
                        ...hexToBytes(REVERSE_NODE),
                        ...hexToBytes(labelHash),
                    ])
                );
        
                // Upsert the reverse_claimed record
                await upsertReverseClaimedRecordsIgnore(context, {
                    id: reverseNode,
                    nodeId: reverseNode,
                    addrId: fromAddress,
                    name: name,
                    createdAt: event.block.timestamp,
                });
        
                // Update the record with the latest timestamp
                await context.db
                    .update(schema.reverseClaimed, { id: reverseNode })
                    .set({ addrId: fromAddress, updatedAt: event.block.timestamp });
        
                console.log(`Reverse node updated successfully for ${fromAddress}`);
            } catch (error) {
                console.error(`Failed to process setName for ${fromAddress}:`, error);
            }
        },
    };
};

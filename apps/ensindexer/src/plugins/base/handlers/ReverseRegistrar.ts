import { ponder } from "ponder:registry";
import { makeReverseRegistrarHandlers } from "../../../handlers/ReverseRegistrar";
import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";

export default function ({ ownedName, namespace }: PonderENSPluginHandlerArgs<"base.eth">) {
  const {
    handleReverseClaimed
  } = makeReverseRegistrarHandlers(ownedName);
  
  ponder.on(namespace("ReverseRegistrar:BaseReverseClaimed"), handleReverseClaimed);
}

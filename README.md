
### goals

- ease of deployment for indiviudals to run their own infra
- initially, a 1:1 port of the subgraph, to engender confidence in mapping logic
  - subgraph api compatibility (not 100%)
    - matching the ~10 well-defined graphql queries
    - via ensjs, ens-app-v3, and viem (iff it uses subgraph)

### todo

- [x] implement old registry migration logic
- [x] confirm registry & 'empty' domain logic by checking during backfill
- [ ] implement old registry resolver logic
- [ ] integrate rainbow tables for label healing
  - load the tabel dump into pglite & query synchronously to match existing behavior
  - https://github.com/graphprotocol/ens-rainbow

## confidence

a strategy to obtain confidence in the ponder implementation, since subgraph is percieved as source of truth

1. first implement subgraph 1:1, noting any improvements along the way
2. find those 10 key queries from ensjs & ens-app-v3 and write a script that can query the subgraph for those 10 queries at n different blockheights for m different relevant nodes, saving those snapshots to disk
3. a diff script that executes the same queries against ponder and compares the results
4. once we have that script fully passing we can branch the codebase and start refactoring the indexing logic.
5. if we'd like to maintain 1:1 consistency we can ensure that any changes still pass that diff script, or we can decide to deviate from that datamodel and design the api from scratch, perhaps to match the new schema more closely

## well-known queries

### from ensjs

- [`getDecodedName`](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getDecodedName.ts) — Gets the full name for a name with unknown labels from the subgraph
  - basically: attempts to heal any encoded labels in a provided name using the subgraph
  - if name is fully decoded, return
  - split name into `n` labels
  - for all encoded labels (`[label]`), find all domains by `id`
    - hilariously this queries subgraph with `n` `domains(first: 1, where: { id: $label })` queries
  - also queries `domain(id: namehash(name))` but i'm not sure why, as it effectively duplicates the above label queries
  - in our ideal indexer, this query is replaced with a single `domain(id: namehash(name))` because the api would handle the full extent of the healing logic
- [`getNameHistory`](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getNameHistory.ts)
  - basically just all the events associated with a name
- [`getNamesForAddress`](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getNamesForAddress.ts)
  - gets all names related to an address via address=registrant,address=owner,address=wrappedOwner,address=resolvedAddress
  - supports `searchString`
  - supports filter by (current) expiry, by reverse records, by 'empty' domains
  - supports order by expiry date, name, labelName, createdAt
  - [expiryDate order by](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/filters.ts#L707) is an absolutely insane construction
  - supports pagination by constructing additional where clauses to exclude previous results
- [`getSubgraphRecords`](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getSubgraphRecords.ts) — Gets the records for a name from the subgraph
  - pretty straightforward, allows querying by specific resolver id
- [`getSubgraphRegistrant`](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getSubgraphRegistrant.ts) — Gets the name registrant from the subgraph.
  - only supports eth 2ld
- [`getSubnames`](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getSubnames.ts) — Gets the subnames for a name
  - supports `searchString`
  - supports filter by (current) expiry, by 'empty' domains
  - supports order by expiry date, name, labelName, createdAt
  - supports pagination by constructing additional where clauses to exclude previous results

### from ens-app-v3

- [`useResolverExists`](https://github.com/ensdomains/ens-app-v3/blob/328692ae832618f8143916c143b7e4cb9e520811/src/hooks/useResolverExists.ts#L27) — straightforward resolver existence check
- [`useRegistrationData`](https://github.com/ensdomains/ens-app-v3/blob/328692ae832618f8143916c143b7e4cb9e520811/src/hooks/useRegistrationData.ts#L31) — registration by id and nameRegistered events


### notes

- unable to automatically identify subname registries via onchain event, CCIP standard dosn't include any info about data source, so we'll need to encode manually for now
- ENSIP - how to automatically identify subname registrars
- ENSIP - shared interface for subdomain registrars
- ENSIP — standard for how a resolver on L1 can (optionally) emit an event specifying contract on an L2 that it proxies records from

- eth registry is ERC721, has many controllers (), no knowledge of pricing — delegated to registrar controllers
- eth old registry & new registry migration due to security issue, new then fallback to old, therefore ignore all old evens on domains that have been seen by new registry


## improvement notes

### architecture

```
┌──────────────────────────────────────────┐
│                   API                    │
└──────────┬──────────────┬────────────────┘
           │              │                │
┌──────────▼─┐  ┌────────▼───┐  ┌────────▼────────┐
│   Ponder   │  │ Label Heal │  │    CCIP Read    │
└────────────┘  └────────────┘  └─────────────────┘
```

basically an API server that stitches together these data sources to enable the more realtime/dynamic aspects of this data. label healing information changes all the time, CCIP reads are off-chain data, etc. the api layer implements a cache for both the label healing and ccip read sources for performant loads but relatively fresh reads


## label healing service

this service would ideally run its own ponder indexer that tracks healed labels emitted on-chain, as well as other data sources (rainbow tables, etc) and provides those as an api. it should

- tracks on-chain sources of healed names
- embeds existing rainbow tables
- embeds/tracks/sources any other source of healed names
- ignores any healed name with a null byte
  - TL;DR: postgres doesn't store null bytes, so should ignore any healed labels that include a null byte
  - https://ens.mirror.xyz/9GN77d-MqGvRypm72FcwgxlUnPSuKWhG3rWxddHhRwM
- stores a list of all possible healed names, regardless of normalization status
- (cron? on-demand?) iterate all yet-normalized names in the db, if is normalized, store in rainbow table of `hash -> healed`
- provide rainbowtable lookups to api service

this structure is because normalization changes over time, so set of valid healed names changes over time. any normalized name will never become invalid (in theory), so once added the the rainbow table it can live there forever. if this assumption is every incorrect, once can triviually re-index the healed names list to generate the rainbowtable

## indexer improvement notes

the 'empty' domains should be handled more accurately, depending on how important serving empty domains is for people.

- `Domain#subdomainCount` could/should be a computed property by count(children of parent)
  - removes need to recursively update parent records during domain delete
  - removes need to increment during domain creation
  - new impl likely needs to exclude 'empty' domains (see registry notes for context)

various resources use both null and zeroAddress to indicate emptiness, this is horrible and creates numerous checks like [this](https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getNamesForAddress.ts#L255) where they check for `!== NULL && !== zeroAddress`

### registry

- in `Registry:NewOwner`, the event emits `node` and `label`, `node` should be named `parent` and the computed subnode should be named `node` or `domain`
- empty domains aren't actually deleted from the index, but if a domain is empty the parent's subdomain count is reduced appropriately. options:
  1. if historical info not important (still available by blockheight queries), domains should be deleted, and `subdomainCount` computed with a simple count query
  2. if domain existance is necesssary, make `subdomainCount` computed with a where clause to exclude 'empty' domains
  3. if filters against subdomainCount are necessary, maybe the current logic works just fine

### label healing

label healing should be implemented outside of the indexer (see architecture above). this means removing the relevant fields (`name`, `labelName`) from the indexing schema and removing the label healing code in `Registry.ts`

iff filters against the healed name need to be supported, the cache can be persisted to the same postgres to support performant joins against indexer data

### resolver

- the local `Resolver` resource should be keyed by `CAIP-10 ID`, not pairwise ala subgraph, to match on-chain datamodel
  - the handlers should persist all keys and values emitted by the resolver in `Records`
  - the `Record` model stores (`node`, `key`, `value`) and is keyed by (`resolverId`, `node`, `key`)
  - on active resolver change, simply point the domain's `resolverId` to the resolver's address
  - any domain's records are computed through the current `resolverId` and querying

any resolver that implements the CCIP Read standard will have to have its records implemented at the API layer which can stitch the indexed data with realtime offchain data via CCIP Reads. if we don't want to implement the CCIP Read proxy as part of this unified api, the api should know if a Resolver defers to CCIP and communicate that effectively in the response so that clients can do it themselves.

### api

- the subgraph schema has a few fields an `Account` but clients probably only want the account's address, so we might as well just store the string there instead of making it a reference. clients incur some effort flattening the returned strucutre: https://github.com/ensdomains/ensjs/blob/main/packages/ensjs/src/functions/subgraph/getNameHistory.ts#L223


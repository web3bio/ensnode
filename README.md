
### goals

- initially, a 1:1 port of the subgraph, to engender confidence in mapping logic
- ease of deployment for indiviudals etc
- subgraph api compatibility (not 100%)
  - matching the ~10 well-defined graphql queries
  - via ensjs, ens-app-v3, and viem (iff it uses subgraph)
- what's difference between Registry and Registrar
- avoid null byte issues
  - https://ens.mirror.xyz/9GN77d-MqGvRypm72FcwgxlUnPSuKWhG3rWxddHhRwM
  - handled by healing logic, should only provide normalized names
  - normalization changes over time, so valid healed names must be cached/rerun or computed over time. any normalized name will never become invalid (in theory), so some process will re-check all currently invalid human-readable names, normalize them, and add them to the table iff available
- need strategy for confidence in cohesiveness with existing ens subgraph which is percieved as source of truth
  - could dual-index as OG schema + new schema and compare outputs — gives confidence over all outputs
  - can spot check against subgraph output for well-defined queries at various blockheights

### todo

- [x] implement old registry migration logic
- [ ] integrate a namedetect-style api
  - do queries against human-readable labels/names need to be supported? if not then this should probably live outside of indexer
  - otherwise indexer can do lookups in the rainbow tables (or against an api) during indexing
    - https://github.com/graphprotocol/ens-rainbow
  - the computed version is to just store id as usual, remove `name`, `labelName` and compute them on the fly at request time
- [ ] see if the logic in Registry:L102 can be removed, as domains are literally never deleted from the subgraph

### notes

- unable to automatically identify subname registries via onchain event, CCIP standard dosn't include any info about data source, so we'll need to encode manually for now
- ENSIP - how to automatically identify subname registrars
- ENSIP - shared interface for subdomain registrars

- eth registry is ERC721, has many controllers (), no knowledge of pricing — delegated to registrar controllers
- eth old registry & new registry migration due to security issue, new then fallback to old, therefore ignore all old evens on domains that have been seen by new registry


### improvement notes

- Resolver resource is actually a flattened version of the Resolver smart contract keyed pairwise between (node, resolverAddress). feels pretty weird
- subdomainCount could/should be a computed property by count(children of parent)
  - removes need to recursively update parent records during domain delete
  - removes need to increment during domain creation
  - would need custom query logic iff filtering by this value is to be supported on the api side
- empty domains aren't actually deleted from the index, but if a domain is empty the parent's subdomain count is reduced appropriately. feels like they should just be deleted

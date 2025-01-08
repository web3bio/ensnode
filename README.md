# ens-multichain indexer

> powered by ponder

estimated backfill time @ 50rps = 24-36 hours on M1 Macbook (~10x speedup)

### goals

> an optimized, multichain ens indexer that the community loves and integrates

- ease of deployment for indiviudals to run their own infra
- faster, more efficient, easier to use and deploy implementation
- v1 — **high confidence in subgraph equivalency**
  - 1:1 equivalency of results as compared to subgraph
    - matching the ~10 well-defined graphql queries
    - 100% ensjs, ens-app-v3 test suites passing
    - should 'just work', following [this documentation](https://github.com/ensdomains/ensjs/blob/main/docs/basics/custom-subgraph-uris.md)
  - dataset equivalency via subgraph dump diffs
  - query equivalency via proxy diff tool
- v2 — **optimized multichain indexer w/ unified namespace**
  - true multichain indexing (mainnet, base, linea, etc)
  - flattened, unified, multichain namespace
  - support key ens-app-v3 and wallet ENS funtions via optimized resolvers & PRs
  - high quality human-readable (healed) list of names by owner necessary for many UX
  - (possible) continued backwards compatibility with subgraph
  - support indexing subset of data, i.e. only domains under parent node

### todo

- [ ] gut check results of resolver index against subgraph up to block 12m
- [x] implement ethRegistry
- [ ] implement nameWrapper
- [ ] better understand reverse resolution & how that pertains to L2 primary names and impacts the future schema, etc
- [ ] subgraph graphql implementation within ponder
  - [ ] implement subgraph-style pagination api
  - [ ] support the well-known queries below
  - [ ] support collection queries as well, to power scraping diff tool
- [ ] CI/CD with indexing?
  - more recent endlbock for gut checks
- [ ] integrate rainbow tables for label healing
  - load the tabel dump into pglite & query synchronously to match existing behavior
  - https://github.com/graphprotocol/ens-rainbow

### notes

- unable to automatically identify subname registries via onchain event, CCIP standard dosn't include any info about data source, so we'll need to encode manually for now
- ENSIP - shared interface for subdomain registrars
- ENSIP — standard for how a resolver on L1 can (optionally) emit an event specifying contract on an L2 that it proxies records from
  - optional, in the popular case of L2-managed subnames
  - removes centralized dependency on the CCIP Gateway
  - flaky test experience with .cb.id name gateway
  - also helps indexer discovery

- eth registry is ERC721, has many controllers (), no knowledge of pricing — delegated to registrar controllers
- eth old registry & new registry migration due to security issue, new then fallback to old, therefore ignore all old evens on domains that have been seen by new registry

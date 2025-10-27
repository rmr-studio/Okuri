BlockService – test plan

Common setup/fixtures
• Mocked beans: BlockRepository, BlockTypeService, BlockReferenceService, BlockChildrenService (if split),
SchemaService, ActivityService, AuthTokenService.
• Security: use @SpringBootTest with @EnableMethodSecurity and @WithUserPersona to exercise @PreAuthorize.
• Factories: helpers to create BlockTypeEntity (STRICT/SOFT), BlockEntity (content vs reference metadata), and minimal
BlockSchema.
• Stubbing AuthTokenService.getUserId() with a fixed UUID.

Create block

1. Create content block (SOFT) – warnings allowed

	•	Setup: BlockTypeEntity.strictness = SOFT, SchemaService.validate(...) returns ["warn: extra field"].
	•	Scenario: call createBlock with BlockContentMetadata.
	•	Expect: block is saved; payload.meta.validationErrors contains warnings; ActivityService.logActivity(CREATE) called; no calls to reference/children services unless you attach parent+slot (see below).

	2.	Create content block (STRICT) – validation passes

	•	Setup: STRICT; SchemaService.validate returns [].
	•	Expect: saved; log CREATE; no exception.

	3.	Create content block (STRICT) – validation fails

	•	Setup: STRICT; SchemaService.validate returns ["error"].
	•	Expect: SchemaValidationException; no save; no log.

	4.	Create reference block – entity list

	•	Setup: ReferenceMetadata = EntityReferenceMetadata(items=[...]).
	•	Scenario: call createBlock.
	•	Expect: saved; BlockReferenceService.upsertLinksFor(block, items, pathPrefix) invoked; no schema validation; log CREATE.

	5.	Create reference block – nested block reference

	•	Setup: ReferenceMetadata = BlockReferenceMetadata(item={type=BLOCK, id=childId}).
	•	Expect: saved; BlockReferenceService.upsertReferenceFor(block, item) invoked; no schema validation; log CREATE.

	6.	Create block with parent+slot (owned child attach)

	•	Setup: request includes parentId and slot="addresses".
	•	Scenario: create content block.
	•	Expect: after save, BlockChildrenService.attachChild(parentId, childId, slot, orderIndex?) called; log CREATE still once.

	7.	Create block with archived BlockType

	•	Setup: BlockTypeEntity.archived=true.
	•	Expect: IllegalStateException("archived"); no save.

	8.	Create block with typeKey fallback path

	•	Setup: request uses (typeKey, typeVersion); BlockTypeService.getByKey returns appropriate type.
	•	Expect: same as (1)/(2) depending on strictness.

	9.	Unauthorized create

	•	Setup: persona without org role (or omit @WithUserPersona).
	•	Expect: access denied (Spring Security); no save.

Update block

10. Update content block – deep merge + SOFT

	•	Setup: existing content block; SchemaService.validate returns warnings; incoming block has partial payload (nested map).
	•	Expect: deep-merged result persisted; validationErrors stored; BlockChildrenService untouched; BlockReferenceService untouched (since references not in content metadata); log UPDATE.

	11.	Update content block – STRICT fail

	•	Setup: STRICT; validate returns errors.
	•	Expect: SchemaValidationException; no save; no log.

	12.	Update reference block – entity list change

	•	Setup: existing ref block (EntityReferenceMetadata); new metadata items differ.
	•	Expect: BlockReferenceService.upsertLinksFor called with delta; log UPDATE; no schema validation.

	13.	Update reference block – block reference change

	•	Setup: existing ref block (BlockReferenceMetadata) -> changes target id.
	•	Expect: BlockReferenceService.upsertReferenceFor called; log UPDATE.

	14.	Update wrong organisation

	•	Setup: existing.organisationId != block.organisationId.
	•	Expect: IllegalArgumentException; no save.

Get block / tree building

15. getBlock – returns ContentNode with children

	•	Setup: root is content block with nesting; BlockChildrenService.listChildrenBySlot(rootId) returns edges for slots; BlockRepository.findAllById returns child entities.
	•	Expect: BlockTree.root is ContentNode with children grouped by slot; no ReferenceNode.

	16.	getBlock – returns ReferenceNode (EntityReferenceMetadata)

	•	Setup: root is reference list; BlockReferenceService.findBlockReferences(rootId, metadata) returns Reference<*> with warning flags depending on fetch policy.
	•	Expect: ReferenceNode.reference contains list; warnings empty unless cyc guard fires.

	17.	getBlock – returns ReferenceNode (BlockReferenceMetadata)

	•	Setup: root is reference to another block; BlockReferenceService.findBlockReferences returns single Reference<BlockTree> (or unresolved if LAZY).
	•	Expect: ReferenceNode.reference is block-tree reference; not children map.

	18.	getBlock – cycle detection for owned children

	•	Setup: child tries to own ancestor; BlockChildrenService.attachChild would have prevented, but simulate via repository to return such relation anyway; getBlock should detect visited id and add warning.
	•	Expect: warning "Cycle detected..." on the node where detected.

Archive / delete

19. archiveBlock – toggles true and logs

	•	Setup: not archived.
	•	Expect: returns true; entity saved with archived=true; log ARCHIVE.

	20.	archiveBlock – idempotent

	•	Setup: already archived.
	•	Expect: returns false; no save.

	21.	deleteBlock – TBD

	•	Plan tests once implemented: pruning unreferenced descendants, protection if referenced elsewhere, transactional behavior.

⸻

BlockChildrenService – test plan

Common setup
• Mocked: BlockChildrenRepository (or your BlockChildEntity JPA repo), BlockRepository, BlockTypeService as needed.
• Constraints: assume unique (parent_id, slot, child_id) and order_index integer.

Attach / create edges

1. attachChild – happy path

	•	Setup: parent & child exist; child org matches; parent type allows nesting and slot.
	•	Expect: a row created with slot and orderIndex (end of list if none provided); returns edge; siblings renumber 0..n-1.

	2.	attachChild – idempotent

	•	Setup: same (parent,slot,child) attached twice.
	•	Expect: second call is no-op (or returns existing); siblings unchanged.

	3.	attachChild – invalid slot (not allowed by parent type)

	•	Setup: parent.type.nesting forbids slot or child’s type.
	•	Expect: IllegalArgumentException (or custom exception).

	4.	attachChild – org mismatch

	•	Setup: parent.org != child.org.
	•	Expect: IllegalArgumentException.

	5.	attachChild – cycle guard (prevent parent<-descendant)

	•	Setup: try to attach ancestor as a child. Simulate ancestor chain on repo.
	•	Expect: IllegalStateException (or custom CycleDetected); no write.

	6.	attachChildrenBulk – happy path

	•	Scenario: attach multiple children with provided order.
	•	Expect: rows inserted; indices normalized 0..n-1.

	7.	attachChildrenBulk – contains duplicate child ids

	•	Expect: dedupe or throw depending on your rule; test both policies.

Move / reorder

8. moveChildWithinSlot

	•	Setup: slot has children; move child from index i to j.
	•	Expect: orderIndex updates; normalized 0..n-1; only siblings in slot touched.

	9.	moveChildAcrossSlots

	•	Setup: move from slot A to slot B.
	•	Expect: remove from A (renumber A); insert at end (or specified index) in B (renumber B).

	10.	reorderSlot with explicit order list

	•	Setup: pass new ordered list of childIds.
	•	Expect: validate set equality; update orderIndex; normalized.

Detach / delete edges

11. detachChild

	•	Expect: row deleted; remaining siblings renumbered.

	12.	detachChildrenBySlot

	•	Expect: all edges in slot removed; if idempotent call again => no error.

	13.	detachAllChildren

	•	Expect: all edges for parent removed; idempotent.

Query

14. listChildrenBySlot – grouped order

	•	Setup: edges in multiple slots.
	•	Expect: map of slot -> children ordered by orderIndex.

	15.	listAllChildren – returns all edges ordered (slot then orderIndex)

	•	Expect: flat list or grouped map depending on API.

Concurrency / integrity

16. attachChild concurrent duplicate – unique constraint path

	•	Setup: repo throws DataIntegrityViolationException on second insert.
	•	Expect: service catches and returns existing edge (idempotent add).

	17.	move/reorder with gaps/duplicates in orderIndex (corrupted state)

	•	Setup: simulate gaps; call any operation.
	•	Expect: service normalizes to 0..n-1.

⸻

BlockReferenceService – test plan

Common setup
• Mock: BlockReferenceRepository, ReferenceResolver beans per EntityType you support (e.g., CLIENT, COMPANY, BLOCK).
• Use metadata:
• EntityReferenceMetadata(items=[...], fetchPolicy=LAZY|EAGER, allowDuplicates=false|true, path="$.items")
• BlockReferenceMetadata(item=BLOCK:uuid, fetchPolicy=LAZY|EAGER, path="$.block", expandDepth=n)

Upserts – entity lists

1. upsertLinksFor – insert brand new list

	•	Setup: no existing rows; items = [A,B,C].
	•	Expect: three rows with paths $.items[0..2] and orderIndex 0..2.

	2.	upsertLinksFor – reorder only

	•	Setup: existing [A,B,C]; new items [C,A,B].
	•	Expect: no deletions/insertions; only orderIndex updates; paths updated to [0..2].

	3.	upsertLinksFor – remove one, add one

	•	Setup: existing [A,B,C]; new [A,D].
	•	Expect: delete B,C; insert D; indices 0..1.

	4.	upsertLinksFor – allowDuplicates=false, duplicates requested

	•	Setup: items [A,A,B].
	•	Expect: dedup to [A,B] (or first occurrence wins); persist unique set; document behavior.

	5.	upsertLinksFor – allowDuplicates=true

	•	Setup: items [A,A,B].
	•	Expect: two rows for A with distinct path and indices 0,1; row for B at index 2.

	6.	upsertLinksFor – illegal type (BLOCK in entity list)

	•	Setup: items contains {type=BLOCK, id=...}.
	•	Expect: IllegalArgumentException.

	7.	upsertLinksFor – pathPrefix override

	•	Setup: call with "$.refs/accounts", items=[A,B].
	•	Expect: rows use that prefix + indices.

	8.	upsertLinksFor – block not persisted (no id)

	•	Expect: IllegalArgumentException("Block must be persisted").

Upserts – single block reference

9. upsertReferenceFor – insert new

	•	Setup: block has no ref rows.
	•	Expect: create one row (entityType=BLOCK, entityId=X, path="$.block").

	10.	upsertReferenceFor – swap target

	•	Setup: currently references X; request references Y.
	•	Expect: update row to Y.

	11.	upsertReferenceFor – multiple existing rows error

	•	Setup: repo returns >1 row for that block.
	•	Expect: throw guidance error “use upsertLinksFor…”.

	12.	upsertReferenceFor – non-BLOCK type

	•	Expect: IllegalArgumentException.

Resolution

13. findBlockReferences – LAZY (entity list)

	•	Setup: metadata LAZY, repo returns rows for [A,B]; no resolvers invoked.
	•	Expect: returned Reference list with warning=REQUIRES_LOADING, entity=null.

	14.	findBlockReferences – EAGER (entity list, supported type)

	•	Setup: resolver for CLIENT returns entity maps for [A,B].
	•	Expect: returned Reference list with entity set and warning=null.

	15.	findBlockReferences – EAGER unknown entity type

	•	Setup: resolver missing for type.
	•	Expect: warning=UNSUPPORTED, entity=null.

	16.	findBlockReferences – MISSING rows vs metadata.items

	•	Setup: metadata lists [A,B], repo has only row for A (B not found).
	•	Expect: one Reference with warning=MISSING for B.

	17.	findBlockReferences – BlockReferenceMetadata (single)

	•	Setup: LAZY => Reference<BlockTree> with warning=REQUIRES_LOADING.
	•	Setup: EAGER => mock resolver for blocks to return a minimal BlockTree.
	•	Expect: Reference contains entity as BlockTree (or null if missing) and warning accordingly.

	18.	resolveReferences – mixed entity types

	•	Setup: list contains CLIENT and COMPANY ids; resolvers for both; some unknown id.
	•	Expect: resolved where possible; MISSING for unknown; preserve orderIndex.

Housekeeping

19. removeReferencesForBlock

	•	Setup: existing rows for blockId.
	•	Expect: repo deleteByParentId(blockId) called.

	20.	removeStaleReferences(entityId)

	•	Setup: simulate repo returning rows referencing entityId; or design this as a repository method; assert delete invoked.

Concurrency

21. upsertLinksFor – concurrent insert duplicate

	•	Setup: mock save to throw constraint violation on duplicate insert path; rerun read-then-return existing.
	•	Expect: service idempotent outcome (final rows reflect desired list).
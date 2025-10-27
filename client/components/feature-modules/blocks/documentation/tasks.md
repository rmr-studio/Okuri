## Task 1 Type Update + Migration + Environment Editor Update + Mock Interactions

### Background Information + Requirements
The backend service that dictates the structure of all block related entities has been updated, and the overall internal structure has been changed. Observe all current generated types from `types.ts` and ensure that all current files within the `feature-modules/blocks` support the new type definitions. Update all core logic that is no longer supported
The current design of the block environment is based on an outdated block tree structure. So, its current implementation needs to be overhauled and simplified to meet the design requirements in `feature-modules/blocks/documentation/design.md

Ensure that the context provider provides a mutable environment where blocks can be created, deleted, moved away from parents, moved into other blocks, based on the type of block (ie. Allowing blocks to be moved inside blocks that have a nesting type), and ensure the block tree's within the enviroment are constantly updated
so that child links can be established.
Ensure that the rendering of a component with all data provided in the data payload, for Content nodes works as intended. For reference nodes, just add a placeholder for the rendered content. A Sample block payload can be found in `/feature-modules/blocks/documentation/design.md` and should be the main payload mocked and used
within `block.demo.tsx` for further testing.

Ensure that deletion of parent blocks only delete the parent, and currently nested children. If a child is moved away from a parent. Its reference to that current tree should have been removed, and the environment with all the included block trees should have been updated to reflect the positioning of that new block.
If a block had been moved to the top level of the environment. A new block tree should have been created, or if the child block had been moved to a new block tree. That child should have been inserted inside a new slot within that new block tree

Do not focus on endpoint connection. Just ensure that frontend data mutation through the context providers reflect all actions 

Ensure that `block.demo.tsx` provides a fully functioning environment that allows for all interaction capabilities

### Implementation Plan

## Task 2 Bespoke Block Type Creation

### Background Information + Requirements

In `/feature-modules/blocks/documentation.tsx` there are some specified bespoke block types for certain interactions
- Reference Blocks 
A reference block is a specific block type, that allows for a block to reference another block tree, or a list of entities.
All references blocks must contain this specific block type, and associated components to render a reference. There are two reference block types listed in the design documentation, one for referencing a singular block, and one for referencing a list of external entities

- Layout Containers
A layout container is a block type that allows a block to accept many nested child blocks (its constraints dictated by the nesting object) 

- Block list 
A block list is a block type that allows a block to accept many nested child blocks in a list format 

Ensure that these speciifc block types are implemented, so that their associated functionality can be developed upon



### Implementation Plan

## Task 3 Data Form entry

### Background Information + Requirements
### Implementation Plan

## Task 4 Endpoint Connection

### Background Information + Requirements
### Implementation Plan
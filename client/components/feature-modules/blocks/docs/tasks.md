### Task 1 (Removal of playground environment)
- The playground context providers handles the core block building interactions crucial to the block building and interaction layout capabilities.
But the Playground context and the demo file uses alot of mock data, and would not be appropriate for the integration of the block layout system
within other core areas of the applications (Client management, Organisation layouts, etc)
- Create a centralised interaction context wrapper that achieves the same fundamental features as the playground provider
    - Block actions (insertions, removal, layout adjustments)
    - Delete all Playground interfaces and types. Ensure that the `BlockTree` is the main data type being used, stored and manipulated,
    as this contains all information about a block. Its type, grid layout and component rendering metadata
    - Ensure that all blocks are wrapped in a Panel. A panel is not a special unique block, but is instead a wrapper over every other
    block rendered (to allow for deletion, editing, and nested block insertions in the event that the Block type has allowed for `nested`)
- Call this provider `BlockEnvironmentProvider`
    - You must ensure it acts in a similar way to the existing Playground provider
        - Expose functions that allow me to access the block environment, including data about the current structure of all blocks, all nested children within a block, etc
        - Ensure that when a nested block is moved from a parent block, to the top level. It becomes its own top level block, and the grid is adjusted to fit that block in.


### Task 1.5 (Child block movement)
- A block consists of a block type, the block payload itself, and then also holds the data of other blocks that are nested within that particular block. This might include a reference to an existing block. Or just an entire direct child block. With the current context. There needs to be functionality to ensure that if I alter the positioning of a child block (ie. Move it to the top level of an environment, or move it to an entirely different block) That data is then migrated and updated to its new position (ie. A new block tree is created where that child block is the root, or that block is moved to become a reference of the new nested block that it has been moved into).
If a block that was moved was considered to be a referenced block. A new summary block should be created

### Task 2 (Block Deletion)
- There is a current issue where If i move a child block outside of a parent block, and then delete the parent block. The child block that was recently moved OUTSIDE, is also deleted. Indicating that the child is still being referenced, and is considered to be apart of the parent block in the layout structure.
Upon completion of Task 1. Ensure that the deletion functionality looks at the real time layout structure of an environment. And appropriately deletes the correct blocks, based on a blocks current position and nesting location
### Task 3 (Data Form Mode)
- All current blocks use pre-filled data for the purpose of a demo. Each block Type has a `BlockFormStructure` data type that holds the form structure for each data attribute within a block. Implement functionality that will allow a user to customise and edit the data within a block inline through the form mode, and ensure that the data is persisted within the block
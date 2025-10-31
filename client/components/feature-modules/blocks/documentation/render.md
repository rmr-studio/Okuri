Current Rendering Workflow
---
1. block.demo.tsx builds an overarching grid for the entire environment
    1. it then builds the top level blocks as children
    2. In previous instances it would render these children blocks as 'panels' which was a specific component
    3. It then sets this grid inside a Grid Provider context wrapper
    4. Block.demo.tsx then calls the block-rendered-provider.tsx Which has a context of all top level blocks as an array

2. The block-rendered-provider then has access to the array of top level children
    1. For each child. It will then find the associated component with the registry provided. It will then use a portal and create that component and pass through the associated metadata extracted
    2. In the previous instance. Panel was a separate component, which would then wrap every block with a panel wrapper. 
3. Inside the panel wrapper. It would then get the original node and render its block
    1. This is then a separate grid widget to the panel, but gets access to the panel toolbar via a provider.
    2. The panel will then continue to use the block-rendered-provider.tsx to render every child grid, and then build and render every sub child within each block. Untill every block has been rendered


Currently render.tsx is not being called, as the rendering function would render the initial parent node. But since it no longer renders the Panel object that then renders recursively. None of the children will ever get rendered

What should happen
---
1. There definitely needs to be an environment block to allow a user to move a block outside of a tree and create its own tree from it
2. In the original implementations. The block.demo.tsx would first create an outer gridstack object (with the node id), and then an inner object (with no id), in which the inner grids
3. These two blocks should be intertwined into one block, as the outer layer should always represent the root node of the tree. Having two nestable grid stack widgets would cause a mismatch in ID identification whe moving blocks
4. Each of the parent blocks needs to:
    1. Be able to render its associated component (most of the time its a primtivie block or a layout container)
    2. Be wrapped in the wrapElement function found in render.tsx
    3. Then have the capability to render its children within the block

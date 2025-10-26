/**
 * Block System Exports
 *
 * Central export file for the block editor system.
 */

// Core interfaces
export * from "./interface/block.interface";
export * from "./interface/editor.interface";

// Context providers
export {
    EditorEnvironmentProvider,
    useEditorEnvironment,
} from "./context/editor-environment-provider";
export { EditorLayoutProvider, useEditorLayout } from "./context/editor-layout-provider";

// Utilities
export { BlockTreeAdapter } from "./util/block-tree.adapter";
export { BlockTreeBuilder } from "./util/block-tree.builder";

// Components
export { BlockDemoV2 } from "./components/demo/block-demo-v2";
export { EditorGridTracker } from "./components/editor-grid-tracker";
export { editorPanelRegistry } from "./components/panel/editor-panel";

// Factories
export * from "./components/demo/block-factories";

// todo : Create comprehensive drag and drop registry for all draggable types in the app

// import { ReactNode } from "react";

// export interface DragTypeConfig {
//     /** How the item looks inside the page */
//     render: (id: string | number, data?: any) => ReactNode;
//     /** How the item looks in drag overlay */
//     renderOverlay?: (id: string | number, data?: any) => ReactNode;
//     /** Valid parent types for drop rules */
//     validParents?: string[];
//     /** Valid children types if this type can contain others */
//     validChildren?: string[];
//     /** Extra flags for behaviors */
//     behaviors?: {
//         sortable?: boolean;
//         resizable?: boolean;
//         nestable?: boolean;
//     };
// }

// /**
//  * Registry of all draggable types across the app
//  */
// export const DragRegistry: Record<string, DragTypeConfig> = {
//     // 1. Nested form attributes
//     attribute: {
//         render: (id) => <div className="p-2 bg-white rounded">Attribute {id}</div>,
//         renderOverlay: (id) => <div className="p-2 bg-gray-200">Dragging {id}</div>,
//         validParents: ["attributeGroup"],
//         behaviors: { sortable: true },
//     },

//     attributeGroup: {
//         render: (id, data) => (
//             <div className="p-2 border rounded">
//                 Group {id}
//                 {data?.children}
//             </div>
//         ),
//         validChildren: ["attribute"],
//         behaviors: { sortable: true, nestable: true },
//     },

//     // 2. Display blocks for invoices/reports
//     displayBlock: {
//         render: (id) => <div className="bg-blue-100 p-2">Block {id}</div>,
//         validParents: ["containerBlock"],
//         behaviors: { resizable: true },
//     },

//     containerBlock: {
//         render: (id, data) => (
//             <div className="bg-blue-200 p-2 flex">{data?.children}</div>
//         ),
//         validChildren: ["displayBlock", "containerBlock"],
//         behaviors: { resizable: true, nestable: true },
//     },

//     // 3. Dashboard widgets
//     dashboardWidget: {
//         render: (id, data) => (
//             <div className="bg-green-100 p-2">{data?.title || `Widget ${id}`}</div>
//         ),
//         validParents: ["dashboard"],
//         behaviors: { resizable: true, sortable: true },
//     },

//     dashboard: {
//         render: (id, data) => (
//             <div className="grid grid-cols-3 gap-2">{data?.children}</div>
//         ),
//         validChildren: ["dashboardWidget"],
//         behaviors: { nestable: true },
//     },

//     // 4. Invoice tables
//     invoiceTable: {
//         render: (id) => <div className="bg-yellow-100 p-2">Invoice Table {id}</div>,
//         validParents: ["invoicePage"],
//         behaviors: { resizable: true },
//     },

//     invoicePage: {
//         render: (id, data) => (
//             <div className="flex flex-col gap-2">{data?.children}</div>
//         ),
//         validChildren: ["invoiceTable", "displayBlock"],
//         behaviors: { nestable: true },
//     },
// };

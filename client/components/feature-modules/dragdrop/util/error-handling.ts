// dragdrop/error-handling.ts
import { GridBlockProps } from "./types";

/**
 * Error types for the drag and drop system
 */
export enum DragDropErrorType {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    BLOCK_NOT_FOUND = "BLOCK_NOT_FOUND",
    INVALID_OPERATION = "INVALID_OPERATION",
    SIZE_CALCULATION_ERROR = "SIZE_CALCULATION_ERROR",
    REGISTRY_ERROR = "REGISTRY_ERROR",
}

export interface DragDropError {
    type: DragDropErrorType;
    message: string;
    details?: any;
    blockId?: string | number;
    operation?: string;
}

/**
 * Error handler class for drag and drop operations
 */
export class DragDropErrorHandler {
    private errors: DragDropError[] = [];
    private onError?: (error: DragDropError) => void;

    constructor(onError?: (error: DragDropError) => void) {
        this.onError = onError;
    }

    /**
     * Handle an error
     */
    handleError(error: DragDropError): void {
        this.errors.push(error);
        console.error(
            `[DragDrop] ${error.type}: ${error.message}`,
            error.details
        );

        if (this.onError) {
            this.onError(error);
        }
    }

    /**
     * Create and handle a validation error
     */
    handleValidationError(
        message: string,
        details?: any,
        blockId?: string | number
    ): void {
        this.handleError({
            type: DragDropErrorType.VALIDATION_ERROR,
            message,
            details,
            blockId,
            operation: "validation",
        });
    }

    /**
     * Create and handle a block not found error
     */
    handleBlockNotFoundError(
        blockId: string | number,
        operation?: string
    ): void {
        this.handleError({
            type: DragDropErrorType.BLOCK_NOT_FOUND,
            message: `Block with ID "${blockId}" not found`,
            blockId,
            operation,
        });
    }

    /**
     * Create and handle an invalid operation error
     */
    handleInvalidOperationError(
        message: string,
        operation?: string,
        details?: any
    ): void {
        this.handleError({
            type: DragDropErrorType.INVALID_OPERATION,
            message,
            operation,
            details,
        });
    }

    /**
     * Create and handle a size calculation error
     */
    handleSizeCalculationError(
        message: string,
        blockId?: string | number,
        details?: any
    ): void {
        this.handleError({
            type: DragDropErrorType.SIZE_CALCULATION_ERROR,
            message,
            blockId,
            details,
            operation: "size_calculation",
        });
    }

    /**
     * Create and handle a registry error
     */
    handleRegistryError(
        message: string,
        blockType?: string,
        details?: any
    ): void {
        this.handleError({
            type: DragDropErrorType.REGISTRY_ERROR,
            message,
            details: { blockType, ...details },
            operation: "registry",
        });
    }

    /**
     * Get all errors
     */
    getErrors(): DragDropError[] {
        return [...this.errors];
    }

    /**
     * Clear all errors
     */
    clearErrors(): void {
        this.errors = [];
    }

    /**
     * Get errors by type
     */
    getErrorsByType(type: DragDropErrorType): DragDropError[] {
        return this.errors.filter((error) => error.type === type);
    }

    /**
     * Check if there are any errors
     */
    hasErrors(): boolean {
        return this.errors.length > 0;
    }

    /**
     * Get the last error
     */
    getLastError(): DragDropError | null {
        return this.errors.length > 0
            ? this.errors[this.errors.length - 1]
            : null;
    }
}

/**
 * Validation utilities
 */
export class BlockValidator {
    private errorHandler: DragDropErrorHandler;

    constructor(errorHandler: DragDropErrorHandler) {
        this.errorHandler = errorHandler;
    }

    /**
     * Validate a block structure
     */
    validateBlock(block: GridBlockProps): boolean {
        if (!block.id) {
            this.errorHandler.handleValidationError(
                "Block must have an ID",
                block
            );
            return false;
        }

        if (!block.type) {
            this.errorHandler.handleValidationError(
                "Block must have a type",
                block
            );
            return false;
        }

        // Validate children recursively
        if (block.children) {
            for (const child of block.children) {
                if (!this.validateBlock(child)) {
                    return false;
                }
            }
        }

        // Validate sizes if provided
        if (block.sizes && block.children) {
            if (block.sizes.length !== block.children.length) {
                this.errorHandler.handleValidationError(
                    "Sizes array length must match children length",
                    {
                        sizes: block.sizes.length,
                        children: block.children.length,
                    },
                    block.id
                );
                return false;
            }

            const totalSize = block.sizes.reduce((sum, size) => sum + size, 0);
            if (Math.abs(totalSize - 100) > 0.1) {
                // Allow small floating point errors
                this.errorHandler.handleValidationError(
                    "Sizes must sum to 100",
                    { totalSize, sizes: block.sizes },
                    block.id
                );
                return false;
            }
        }

        return true;
    }

    /**
     * Validate a block tree
     */
    validateBlockTree(blocks: GridBlockProps[]): boolean {
        for (const block of blocks) {
            if (!this.validateBlock(block)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Validate block data
     */
    validateBlockData(block: GridBlockProps): boolean {
        // Add specific validation for different block types
        switch (block.type) {
            case "displayBlock":
                if (!block.data?.title) {
                    this.errorHandler.handleValidationError(
                        "DisplayBlock must have a title",
                        block.data,
                        block.id
                    );
                    return false;
                }
                break;

            case "dashboardWidget":
                if (!block.data?.title) {
                    this.errorHandler.handleValidationError(
                        "DashboardWidget must have a title",
                        block.data,
                        block.id
                    );
                    return false;
                }
                break;
        }

        return true;
    }
}

/**
 * Safe operation wrapper that catches and handles errors
 */
export function safeOperation<T>(
    operation: () => T,
    errorHandler: DragDropErrorHandler,
    operationName: string,
    fallback?: T
): T | undefined {
    try {
        return operation();
    } catch (error) {
        errorHandler.handleInvalidOperationError(
            `Operation "${operationName}" failed: ${
                error instanceof Error ? error.message : String(error)
            }`,
            operationName,
            error
        );
        return fallback;
    }
}

/**
 * Create a default error handler
 */
export function createErrorHandler(
    onError?: (error: DragDropError) => void
): DragDropErrorHandler {
    return new DragDropErrorHandler(onError);
}

/**
 * Create a validator with error handler
 */
export function createValidator(
    errorHandler: DragDropErrorHandler
): BlockValidator {
    return new BlockValidator(errorHandler);
}

export class InsufficientStockError extends Error {
    readonly code = 'INSUFFICIENT_STOCK';

    constructor(
        readonly productId: number,
        readonly productName: string,
        readonly available: number,
        readonly required: number,
    ) {
        super(
            `Insufficient stock for ${productName}. Available: ${available}; required: ${required}.`,
        );
        this.name = 'InsufficientStockError';
    }
}

export function isInsufficientStockError(
    error: unknown,
): error is InsufficientStockError {
    return error instanceof InsufficientStockError ||
        (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'INSUFFICIENT_STOCK' &&
            'productId' in error &&
            typeof error.productId === 'number' &&
            'productName' in error &&
            typeof error.productName === 'string' &&
            'available' in error &&
            typeof error.available === 'number' &&
            'required' in error &&
            typeof error.required === 'number'
        );
}

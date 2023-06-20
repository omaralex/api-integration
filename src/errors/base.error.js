export class BaseError extends Error {
    constructor(error = {}) {
        super(JSON.stringify(error));
    }
}

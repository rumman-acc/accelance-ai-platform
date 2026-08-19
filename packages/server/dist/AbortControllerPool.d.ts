/**
 * This pool is to keep track of abort controllers mapped to chatflowid_chatid
 */
export declare class AbortControllerPool {
    abortControllers: Record<string, AbortController>;
    /**
     * Add to the pool
     * @param {string} id
     * @param {AbortController} abortController
     */
    add(id: string, abortController: AbortController): void;
    /**
     * Remove from the pool
     * @param {string} id
     */
    remove(id: string): void;
    /**
     * Get the abort controller
     * @param {string} id
     */
    get(id: string): AbortController;
    /**
     * Abort
     * @param {string} id
     */
    abort(id: string): void;
}

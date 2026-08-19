"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbortControllerPool = void 0;
/**
 * This pool is to keep track of abort controllers mapped to chatflowid_chatid
 */
class AbortControllerPool {
    constructor() {
        this.abortControllers = {};
    }
    /**
     * Add to the pool
     * @param {string} id
     * @param {AbortController} abortController
     */
    add(id, abortController) {
        this.abortControllers[id] = abortController;
    }
    /**
     * Remove from the pool
     * @param {string} id
     */
    remove(id) {
        if (Object.prototype.hasOwnProperty.call(this.abortControllers, id)) {
            delete this.abortControllers[id];
        }
    }
    /**
     * Get the abort controller
     * @param {string} id
     */
    get(id) {
        return this.abortControllers[id];
    }
    /**
     * Abort
     * @param {string} id
     */
    abort(id) {
        const abortController = this.abortControllers[id];
        if (abortController) {
            abortController.abort();
            this.remove(id);
        }
    }
}
exports.AbortControllerPool = AbortControllerPool;
//# sourceMappingURL=AbortControllerPool.js.map
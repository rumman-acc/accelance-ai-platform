"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StickyNote_Agentflow {
    constructor() {
        this.label = 'Sticky Note';
        this.name = 'stickyNoteAgentflow';
        this.version = 1.0;
        this.type = 'StickyNote';
        this.color = '#fee440';
        this.category = 'Agent Flows';
        this.description = 'Add notes to the agent flow';
        this.inputs = [
            {
                label: '',
                name: 'note',
                type: 'string',
                rows: 1,
                placeholder: 'Type something here',
                optional: true
            }
        ];
        this.baseClasses = [this.type];
    }
    async run() {
        return undefined;
    }
}
module.exports = { nodeClass: StickyNote_Agentflow };
//# sourceMappingURL=StickyNote.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TeradataTD2Credential {
    constructor() {
        this.label = 'Teradata TD2 Auth';
        this.name = 'teradataTD2Auth';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Teradata TD2 Auth Username',
                name: 'tdUsername',
                type: 'string'
            },
            {
                label: 'Teradata TD2 Auth Password',
                name: 'tdPassword',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: TeradataTD2Credential };
//# sourceMappingURL=TeradataTD2.credential.js.map
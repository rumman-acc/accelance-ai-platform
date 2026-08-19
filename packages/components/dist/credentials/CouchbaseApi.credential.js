"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CouchbaseApi {
    constructor() {
        this.label = 'Couchbase API';
        this.name = 'couchbaseApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Couchbase Connection String',
                name: 'connectionString',
                type: 'url'
            },
            {
                label: 'Couchbase Username',
                name: 'username',
                type: 'string'
            },
            {
                label: 'Couchbase Password',
                name: 'password',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: CouchbaseApi };
//# sourceMappingURL=CouchbaseApi.credential.js.map
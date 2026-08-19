'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class PostgresUrl {
    constructor() {
        this.label = 'Postgres URL'
        this.name = 'PostgresUrl'
        this.version = 1.0
        this.inputs = [
            {
                label: 'Postgres URL',
                name: 'postgresUrl',
                type: 'url',
                placeholder: 'postgresql://localhost/mydb'
            }
        ]
    }
}
module.exports = { credClass: PostgresUrl }
//# sourceMappingURL=PostgresUrl.credential.js.map

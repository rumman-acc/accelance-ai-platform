'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
class BaiduQianfanApi {
    constructor() {
        this.label = 'Baidu Qianfan API'
        this.name = 'baiduQianfanApi'
        this.version = 2.0
        this.inputs = [
            {
                label: 'Qianfan Access Key',
                name: 'qianfanAccessKey',
                type: 'password'
            },
            {
                label: 'Qianfan Secret Key',
                name: 'qianfanSecretKey',
                type: 'password'
            }
        ]
    }
}
module.exports = { credClass: BaiduQianfanApi }
//# sourceMappingURL=BaiduApi.credential.js.map

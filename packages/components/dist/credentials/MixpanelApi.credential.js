"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MixpanelApi {
    constructor() {
        this.label = 'Mixpanel API';
        this.name = 'mixpanelApi';
        this.version = 1.0;
        this.description =
            'Refer to <a target="_blank" href="https://help.mixpanel.com/hc/en-us/articles/115004502806">Mixpanel Project Settings &gt; Access Keys &gt; Project Token</a> on how to get your project token';
        this.inputs = [
            {
                label: 'Project Token',
                name: 'projectToken',
                type: 'password',
                placeholder: '<MIXPANEL_PROJECT_TOKEN>'
            }
        ];
    }
}
module.exports = { credClass: MixpanelApi };
//# sourceMappingURL=MixpanelApi.credential.js.map
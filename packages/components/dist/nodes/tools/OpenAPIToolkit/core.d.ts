import { z } from 'zod/v3'
import { RunnableConfig } from '@langchain/core/runnables'
import { StructuredTool, ToolParams } from '@langchain/core/tools'
import { CallbackManagerForToolRun, Callbacks } from '@langchain/core/callbacks/manager'
import { ICommonObject } from '../../../src/Interface'
export declare const defaultCode =
    "const fetch = require('node-fetch');\nconst url = $url;\nconst options = $options;\n\ntry {\n\tconst response = await fetch(url, options);\n\tconst resp = await response.json();\n\treturn JSON.stringify(resp);\n} catch (error) {\n\tconsole.error(error);\n\treturn '';\n}\n"
export declare const howToUseCode =
    "- **Libraries:**  \n  You can use any libraries imported in Flowise.\n\n- **Tool Input Arguments:**  \n  Tool input arguments are available as the following variables:\n  - `$PathParameters`\n  - `$QueryParameters`\n  - `$RequestBody`\n\n- **HTTP Requests:**  \n  By default, you can get the following values for making HTTP requests:\n  - `$url`\n  - `$options`\n\n- **Default Flow Config:**  \n  You can access the default flow configuration using these variables:\n  - `$flow.sessionId`\n  - `$flow.chatId`\n  - `$flow.chatflowId`\n  - `$flow.input`\n  - `$flow.state`\n\n- **Custom Variables:**  \n  You can get custom variables using the syntax:\n  - `$vars.<variable-name>`\n\n- **Return Value:**  \n  The function must return a **string** value at the end.\n\n```js\nconst fetch = require('node-fetch');\nconst url = $url;\nconst options = $options;\n\ntry {\n\tconst response = await fetch(url, options);\n\tconst resp = await response.json();\n\treturn JSON.stringify(resp);\n} catch (error) {\n\tconsole.error(error);\n\treturn '';\n}\n\n```\n"
export interface BaseDynamicToolInput extends ToolParams {
    name: string
    description: string
    returnDirect?: boolean
}
export interface DynamicStructuredToolInput<T extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>>
    extends BaseDynamicToolInput {
    func?: (input: z.infer<T>, runManager?: CallbackManagerForToolRun) => Promise<string>
    schema: T
    baseUrl: string
    method: string
    headers: ICommonObject
    customCode?: string
    strict?: boolean
    removeNulls?: boolean
}
export declare class DynamicStructuredTool<
    T extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>
> extends StructuredTool {
    name: string
    description: string
    baseUrl: string
    method: string
    headers: ICommonObject
    customCode?: string
    strict?: boolean
    func: DynamicStructuredToolInput['func']
    schema: T
    private variables
    private flowObj
    private removeNulls
    constructor(fields: DynamicStructuredToolInput<T>)
    call(
        arg: z.output<T>,
        configArg?: RunnableConfig | Callbacks,
        tags?: string[],
        flowConfig?: {
            sessionId?: string
            chatId?: string
            input?: string
            state?: ICommonObject
        }
    ): Promise<string>
    protected _call(
        arg: z.output<T>,
        _?: CallbackManagerForToolRun,
        flowConfig?: {
            sessionId?: string
            chatId?: string
            input?: string
            state?: ICommonObject
        }
    ): Promise<string>
    setVariables(variables: any[]): void
    setFlowObject(flow: any): void
    isStrict(): boolean
}

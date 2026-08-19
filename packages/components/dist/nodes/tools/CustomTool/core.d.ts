import { z } from 'zod/v3';
import { RunnableConfig } from '@langchain/core/runnables';
import { StructuredTool, ToolParams } from '@langchain/core/tools';
import { CallbackManagerForToolRun, Callbacks } from '@langchain/core/callbacks/manager';
import { ICommonObject } from '../../../src/Interface';
export interface BaseDynamicToolInput extends ToolParams {
    name: string;
    description: string;
    code: string;
    returnDirect?: boolean;
}
export interface DynamicStructuredToolInput<T extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>> extends BaseDynamicToolInput {
    func?: (input: z.infer<T>, runManager?: CallbackManagerForToolRun) => Promise<string>;
    schema: T;
}
export declare class DynamicStructuredTool<T extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>> extends StructuredTool {
    name: string;
    description: string;
    code: string;
    func: DynamicStructuredToolInput['func'];
    schema: T;
    private variables;
    private flowObj;
    constructor(fields: DynamicStructuredToolInput<T>);
    call(arg: z.output<T>, configArg?: RunnableConfig | Callbacks, tags?: string[], flowConfig?: {
        sessionId?: string;
        chatId?: string;
        input?: string;
        state?: ICommonObject;
    }): Promise<string>;
    protected _call(arg: z.output<T>, _?: CallbackManagerForToolRun, flowConfig?: {
        sessionId?: string;
        chatId?: string;
        input?: string;
        state?: ICommonObject;
    }): Promise<string>;
    setVariables(variables: any[]): void;
    setFlowObject(flow: any): void;
}

import { type ICommonObject, type INodeData } from '.';
import type { ChatVertexAIInput, VertexAIInput } from '@langchain/google-vertexai';
type SupportedAuthOptions = ChatVertexAIInput['authOptions'] | VertexAIInput['authOptions'];
export declare const buildGoogleCredentials: (nodeData: INodeData, options: ICommonObject) => Promise<SupportedAuthOptions | null>;
export {};

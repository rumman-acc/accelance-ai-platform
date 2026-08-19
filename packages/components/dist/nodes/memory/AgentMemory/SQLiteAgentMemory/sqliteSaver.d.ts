import { BaseCheckpointSaver, Checkpoint, CheckpointMetadata } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import { BaseMessage } from '@langchain/core/messages';
import { CheckpointTuple, SaverOptions, SerializerProtocol } from '../interface';
import { IMessage, MemoryMethods } from '../../../../src/Interface';
export declare class SqliteSaver extends BaseCheckpointSaver implements MemoryMethods {
    protected isSetup: boolean;
    config: SaverOptions;
    threadId: string;
    tableName: string;
    constructor(config: SaverOptions, serde?: SerializerProtocol<Checkpoint>);
    sanitizeTableName(tableName: string): string;
    private getDataSource;
    private setup;
    getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined>;
    list(config: RunnableConfig, limit?: number, before?: RunnableConfig): AsyncGenerator<CheckpointTuple>;
    put(config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata): Promise<RunnableConfig>;
    delete(threadId: string): Promise<void>;
    getChatMessages(overrideSessionId?: string, returnBaseMessages?: boolean, prependMessages?: IMessage[]): Promise<IMessage[] | BaseMessage[]>;
    addChatMessages(): Promise<void>;
    clearChatMessages(overrideSessionId?: string): Promise<void>;
}

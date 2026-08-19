import { IServerSideEventStreamer } from '../../src';
export declare abstract class Moderation {
    abstract checkForViolations(input: string): Promise<string>;
}
export declare const checkInputs: (inputModerations: Moderation[], input: string) => Promise<string>;
export declare const streamResponse: (sseStreamer: IServerSideEventStreamer, chatId: string, response: string) => void;

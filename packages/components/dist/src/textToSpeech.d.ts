import { ICommonObject } from './Interface';
export declare const convertTextToSpeechStream: (text: string, textToSpeechConfig: ICommonObject, options: ICommonObject, abortController: AbortController, onStart: (format: string) => void, onChunk: (chunk: Buffer) => void, onEnd: () => void) => Promise<void>;
export declare const getVoices: (provider: string, credentialId: string, options: ICommonObject) => Promise<{
    id: string;
    name: string | undefined;
    category: import("@elevenlabs/elevenlabs-js/api").VoiceResponseModelCategory | undefined;
}[] | {
    id: string;
    name: string;
}[]>;

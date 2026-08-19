export declare enum TextToSpeechProvider {
    OPENAI = "openai",
    ELEVEN_LABS = "elevenlabs"
}
export interface TTSRequest {
    text: string;
    provider: TextToSpeechProvider;
    credentialId: string;
    voice?: string;
    model?: string;
}
export interface TTSResponse {
    audioBuffer: Buffer;
    contentType: string;
}
declare const _default: {
    getVoices: (provider: string, credentialId?: string) => Promise<any[]>;
};
export default _default;

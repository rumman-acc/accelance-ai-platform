import { AIMessageChunk } from '@langchain/core/messages'
import { ICommonObject, INodeData } from '../../src/Interface'
import { BaseMessageLike } from '@langchain/core/messages'
import { IFlowState, IArtifact, IFileAnnotation, ISavedImageResult, ISavedInlineImage, IResponseMetadata } from './Interface.Agentflow'
/**
 * Converts stored-file references in user messages to base64 image_url content
 * so LLM providers can process them. Returns both the updated messages and copies
 * of the originals that were transformed (for later reverting).
 *
 * The base64 content is only needed during model invocation — after the call,
 * use `revertBase64ImagesToFileRefs` to restore lightweight file references.
 */
export declare const processMessagesWithImages: (
    messages: BaseMessageLike[],
    options: ICommonObject
) => Promise<{
    updatedMessages: BaseMessageLike[]
    transformedMessages: BaseMessageLike[]
}>
/**
 * After model invocation, reverts base64 image_url items back to lightweight
 * stored-file references using the `_imageFileRefs` metadata in additional_kwargs.
 * This keeps chat history storage efficient (no base64 blobs).
 */
export declare const revertBase64ImagesToFileRefs: (messages: BaseMessageLike[]) => BaseMessageLike[]
/**
 * Converts LangChain message/chunk instances into plain JSON objects for clean DB storage.
 * This avoids persisting large `{ lc, type, kwargs }` blobs and keeps execution-details UI readable.
 */
export declare const normalizeMessagesForStorage: (messages: BaseMessageLike[]) => BaseMessageLike[]
/**
 * Builds unique image messages from the current upload payload.
 * Returns two versions:
 *   - `imageMessageWithFileRef`: lightweight stored-file references (for chat history)
 *   - `imageMessageWithBase64`: base64 data URLs (for model invocation)
 * Returns undefined if no new unique images are found.
 */
export declare const getUniqueImageMessages: (
    options: ICommonObject,
    messages: BaseMessageLike[],
    modelConfig?: ICommonObject
) => Promise<
    | {
          imageMessageWithFileRef: BaseMessageLike
          imageMessageWithBase64: BaseMessageLike
      }
    | undefined
>
/**
 * Processes past chat history messages, loading file uploads and converting
 * stored images to base64 for model consumption. Also preserves additional_kwargs
 * metadata (artifacts, file annotations, used tools) on each message.
 */
export declare const getPastChatHistoryImageMessages: (
    pastChatHistory: BaseMessageLike[],
    options: ICommonObject
) => Promise<{
    updatedPastMessages: BaseMessageLike[]
    transformedPastMessages: BaseMessageLike[]
}>
/** Returns the MIME type for a filename based on its extension. */
export declare const getMimeTypeFromFilename: (filename: string) => string
/** Returns the artifact type (for UI rendering) based on a filename's extension. */
export declare const getArtifactTypeFromFilename: (filename: string) => string
/** Saves base64 image data to storage and returns file information */
export declare const saveBase64Image: (
    outputItem: {
        result?: string
        id?: string
        output_format?: string
    },
    options: ICommonObject
) => Promise<ISavedImageResult | null>
/** Saves a Gemini inline image to storage. */
export declare const saveGeminiInlineImage: (
    inlineItem: {
        data?: string
        mimeType?: string
    },
    options: ICommonObject
) => Promise<ISavedImageResult | null>
/** Downloads a file from an OpenAI container (used for file citations in responses). */
export declare const downloadContainerFile: (
    containerId: string,
    fileId: string,
    filename: string,
    modelNodeData: INodeData,
    options: ICommonObject
) => Promise<{
    filePath: string
    totalSize: number
} | null>
/**
 * Replaces Gemini inlineData content items in a response with stored-file references,
 * so the response content doesn't contain raw base64 data.
 */
export declare const replaceInlineDataWithFileReferences: (response: AIMessageChunk, savedInlineImages: ISavedInlineImage[]) => void
/**
 * Processes response metadata from LLM providers to extract:
 *   - Image artifacts (OpenAI image generation, Gemini inline data)
 *   - File annotations (OpenAI container file citations)
 * Saves generated images to storage and returns metadata for the UI.
 */
export declare const extractArtifactsFromResponse: (
    responseMetadata: IResponseMetadata | undefined,
    modelNodeData: INodeData,
    options: ICommonObject
) => Promise<{
    artifacts: IArtifact[]
    fileAnnotations: IFileAnnotation[]
    savedInlineImages?: ISavedInlineImage[]
}>
/**
 * Scans assistant messages for image artifacts and inserts temporary user messages
 * containing the base64 image data right after each assistant message. This allows
 * the model to "see" previously generated images in follow-up turns.
 *
 * These temporary messages are marked with `_isTemporaryImageMessage: true` so they
 * can be stripped out after model invocation (they shouldn't be persisted).
 */
export declare const addImageArtifactsToMessages: (messages: BaseMessageLike[], options: ICommonObject) => Promise<void>
/** Merges new key-value pairs into the flow state. */
export declare const updateFlowState: (state: ICommonObject, updateState: IFlowState[]) => ICommonObject

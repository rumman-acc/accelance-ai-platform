import { IUploadFileSizeAndTypes } from '../Interface';
type IUploadConfig = {
    isSpeechToTextEnabled: boolean;
    isImageUploadAllowed: boolean;
    isRAGFileUploadAllowed: boolean;
    imgUploadSizeAndTypes: IUploadFileSizeAndTypes[];
    fileUploadSizeAndTypes: IUploadFileSizeAndTypes[];
};
/**
 * Method that checks if uploads are enabled in the chatflow
 * @param {string} chatflowid
 */
export declare const utilGetUploadsConfig: (chatflowid: string) => Promise<IUploadConfig>;
export {};

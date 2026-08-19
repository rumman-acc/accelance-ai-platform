'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.llmSupportsVision = exports.getImageUploads = exports.getAudioUploads = exports.addImagesToMessages = void 0
const storageUtils_1 = require('./storageUtils')
const addImagesToMessages = async (nodeData, options, multiModalOption) => {
    const imageContent = []
    let model = nodeData.inputs?.model
    if ((0, exports.llmSupportsVision)(model) && multiModalOption) {
        // Image Uploaded
        if (multiModalOption.image && multiModalOption.image.allowImageUploads && options?.uploads && options?.uploads.length > 0) {
            const imageUploads = (0, exports.getImageUploads)(options.uploads)
            for (const upload of imageUploads) {
                let bf = upload.data
                if (upload.type == 'stored-file') {
                    const contents = await (0, storageUtils_1.getFileFromStorage)(
                        upload.name,
                        options.orgId,
                        options.chatflowid,
                        options.chatId
                    )
                    // as the image is stored in the server, read the file and convert it to base64
                    bf = 'data:' + upload.mime + ';base64,' + contents.toString('base64')
                    imageContent.push({
                        type: 'image_url',
                        image_url: {
                            url: bf
                        }
                    })
                } else if (upload.type == 'url' && bf) {
                    imageContent.push({
                        type: 'image_url',
                        image_url: {
                            url: bf
                        }
                    })
                }
            }
        }
    }
    return imageContent
}
exports.addImagesToMessages = addImagesToMessages
const getAudioUploads = (uploads) => {
    return uploads.filter((upload) => upload.mime.startsWith('audio/'))
}
exports.getAudioUploads = getAudioUploads
const getImageUploads = (uploads) => {
    return uploads.filter((upload) => upload.mime.startsWith('image/'))
}
exports.getImageUploads = getImageUploads
const llmSupportsVision = (value) => !!value?.multiModalOption && value.multiModalOption.image?.allowImageUploads === true
exports.llmSupportsVision = llmSupportsVision
//# sourceMappingURL=multiModalUtils.js.map

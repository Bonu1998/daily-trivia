import { ActionInput, IContext } from "@flairlabs/flair-infra"
import _ from "lodash"
import { Constants } from "../Constants"

export class LanguageResources {
    constructor(
        public STRINGS = new LangStrings(),
        public IMAGES = new LangImages(),
        public AUDIOS = new LangAudios(),
    ) { }

    static getFile(input: ActionInput, context: IContext): Promise<LanguageResources> {
        return new Promise((resolve, reject) => {
            let localeContent = _.get(context.sessionContext.sessionData, Constants.STRINGS.LOCALE_CONTENT)
            let path = `${input.APP_NAME}/${input.STAGE}/${localeContent}/${Constants.FILE_NAMES.LANG_RESOURCE}`
            context.cacheClient.getObject(path, LanguageResources, (err: any, data: LanguageResources) => {
                if (err) {
                    context.logger.log(`Error while Fetching LanguageResources: path ${path} ${JSON.stringify(err)}`)
                    resolve(new LanguageResources())
                } else resolve(data)
            })
        })
    }
}

export class LangStrings {
    constructor(
        public APOLOGY: string[] = [],
        public WELCOME_SPEECH: string[] = [],
        public WELCOME_RETURNING: string[] = [],
        public ASK_TO_SELECT_STATE: string[] = [],
        public ASK_TO_SELECT_TOPIC: string[] = [],
        public SET_STATE_SUCCESS: string[] = [],
        public WRONG_STATE: string[] = [],
        public QUESTION_POINTS: string[] = []   
    ) { }
}

export class LangAudios {
    constructor(
        public WELCOME_AUDIO: string[] = []
    ) { }
}

export class LangImages {
    constructor(
        public DEFAULT_BG_IMAGE: string[] = []
    ) { }
}
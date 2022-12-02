import { ActionInput, IContext } from "@flairlabs/flair-infra"
import _ from "lodash"
import { Constants } from "../Constants"

export class LanguageResources {
    constructor(
        public STRINGS = new LangStrings(),
        public IMAGES = new LangImages(),
        public AUDIOS = new LangAudios(),
    ) { }

    static getFile(context: IContext): Promise<LanguageResources> {
        return new Promise((resolve, reject) => {
            let localeContent = _.get(context.sessionContext.sessionData, Constants.STRINGS.LOCALE_CONTENT)
            let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
            let appName = _.get(sessionData, Constants.STRINGS.APPNAME)
            let stage = _.get(sessionData, Constants.STRINGS.STAGE)
            let path = `${appName}/${stage}/${localeContent}/${Constants.FILE_NAMES.LANG_RESOURCE}`
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
        public INCORRECT_ANSWER: string[] = [],
        public CORRECT_ANSWER: string[] = [],
        public CORRECT_PERCENTAGE: string[] = [],
        public BADGE_SPEECH: string[] = [],
        public POINTS_SPEECH: string[] = [],
        public QUESTION_DETAILS: string[] = [],
        public QUESTION_COUNT: string[] = [],
        public CURRENT_QUE_POINTS: string[] = [],
        public END_SPEECH: string[] = [],
        public TOPIC_OF_THE_DAY: string[] = [],
        public QUESTION_NUMBER: string[] = [],
        public POINTS_TEXT: string[] = [],
        public TITLES: Titles = new Titles()
    ) { }
}

export class Titles {
    constructor(
        public TOPIC_OF_THE_DAY: string = ""
    ) { }
}

export class LangAudios {
    constructor(
        public WELCOME_AUDIO: string[] = []
    ) { }
}

export class LangImages {
    constructor(
        public DEFAULT_BG_IMAGE: string[] = [],
        public START_LOGO: string[] = []
    ) { }
}
import { ActionInput, IContext } from "@flairlabs/flair-infra"
import _ from "lodash"
import { Constants } from "../Constants"

export class AppConfig {

    constructor(
        public TEMPLATES: Template = {},
        public SUPPORTED_LOCALES: string[] = [],
        public DEFAULT_LOCALES: string[] = [],
        public MONETIZATION_LOCALES: string[] = []
    ) {}


    static getFile(context: IContext): Promise<AppConfig> {
        context.logger.log("@AppConfig.getFile invoked")
        return new Promise((resolve, reject) => {
            let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
            let appName = _.get(sessionData, Constants.STRINGS.APPNAME)
            let stage = _.get(sessionData, Constants.STRINGS.STAGE)
            let path = `${appName}/${stage}/${Constants.FILE_NAMES.APP_CONFIG}`
            context.logger.log("AppConfig path: "+path)
            context.cacheClient.getObject(path, AppConfig, (err: any, data: AppConfig) => {
                if (err) {
                    context.logger.log(`Error while Fectching AppConfig: path ${path} ${JSON.stringify(err)}`)
                    resolve(new AppConfig())
                } else resolve(data)
            })
        })
    }

    addDetailsInSessionData(input: ActionInput, context: IContext) {
        _.set(context.sessionContext.sessionData,
            Constants.STRINGS.IS_MONETIZATION_ENABLED,
            this.MONETIZATION_LOCALES.includes(input.LOCALE)
        )
        if (this.SUPPORTED_LOCALES.includes(input.LOCALE)) {
            _.set(context.sessionContext.sessionData, Constants.STRINGS.LOCALE_CONTENT, input.LOCALE)
        } else {
            _.set(context.sessionContext.sessionData,
                Constants.STRINGS.LOCALE_CONTENT,
                _.find(this.DEFAULT_LOCALES, (e) => { return e && e.includes(input.LOCALE.split('-')[0]) }) || this.DEFAULT_LOCALES[0] || "en-IN"
            )
        }
    }

}

class Template {
    [model: string]: any
}

class FreeGameplay {
    total_todays_question_per_day: number = 1
    total_bonus_questions_per_day: number = 1
    points_per_question: number = 1
    points_per_bonus_question: number = 1
}
class MonetizedGameplay {
    total_todays_question_per_day: number = 0
    total_bonus_questions_per_day: number = 0
    points_per_question: number = 0
    points_per_bonus_question: number = 0
}
class GamePlay {
    free: FreeGameplay = {
        total_todays_question_per_day: 0,
        total_bonus_questions_per_day: 0,
        points_per_question: 0,
        points_per_bonus_question: 0
    }
    monetized: MonetizedGameplay = {
        total_todays_question_per_day: 0,
        total_bonus_questions_per_day: 0,
        points_per_question: 0,
        points_per_bonus_question: 0
    }
    stateLeaderboardLength: number = 0
    playerStandingLenght: number = 0
}
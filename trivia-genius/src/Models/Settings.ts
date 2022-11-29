import { ActionInput, IContext } from "@flairlabs/flair-infra"
import _ from "lodash"
import { Constants } from "../Constants"



export class Settings {
    constructor(
        public STATES: string[] = [],
        public TOPICS: Topics[] = [],
        public PREMIUM_PRODUCTS: Product[] = [],
        public GAMEPLAY: GamePlay = new GamePlay()
    ) { }
    static getFile(context: IContext): Promise<Settings> {
        return new Promise((resolve, reject) => {
            let sessionData = _.get(context.sessionContext, Constants.STRINGS.SESSION_DATA)
            let appName = _.get(sessionData, Constants.STRINGS.APPNAME)
            let stage = _.get(sessionData,Constants.STRINGS.STAGE)
            let locale = _.get(sessionData, Constants.STRINGS.LOCALE)
            let path = `${appName}/${stage}/${locale}/localeSettings.json`
            context.cacheClient.getObject(path, Settings, (err: any, data: Settings) => {
                if (err) {
                    context.logger.log("Error_Fetching_LocaleSetting :" + JSON.stringify(err))
                    resolve(new Settings())
                }
                else resolve(data)
            })
        })
    }
}

class Product {
    constructor(
        name: string = "",
        duration: number = 0,
        referenceName: string = ""
    ) { }
}

class Topics {
    constructor(
        public name: string = "",
        public id: string = "",
        public isPremium: boolean = false,
        public isActive: boolean = false
    ) { }
}

class GamePlay {
    constructor(
        public total_todays_question_per_day: number = 0,
        public total_bonus_questions_per_day: number = 0,
        public points_per_question: number = 0,
        public points_per_bonus_question: number = 0,
        public stateLeaderboardLength: number = 0,
        public playerStandingLenght: number = 0,
        public options_for_question: string[] = []  //["A", "B", "C"] or ["1", "2", "3"]
    ) { }
}
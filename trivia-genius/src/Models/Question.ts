import { ActionInput, IContext } from "@flairlabs/flair-infra"
import _ from "lodash";
import { Constants } from "../Constants";



export class Question {
    constructor(
        public id: string = "",
        public que: string = "",
        public ans: string[] = [],
        public expl: string[] = [],
        public options: string[] = [],
    ) { }
    static getFile(context: IContext, topic: string): Promise<Question[]> {
        context.logger.log("Question.getFile invoked")
        let sessionData = context.sessionContext.sessionData;
        let appName = _.get(sessionData, Constants.STRINGS.APPNAME);
        let stage = _.get(sessionData, Constants.STRINGS.STAGE);
        let localeContent = _.get(sessionData, Constants.STRINGS.LOCALE_CONTENT);
        return new Promise((resolve, reject) => {
            let path = `${appName}/${stage}/${localeContent}/questions/${topic}.json`
            context.cacheClient.getArray(path, Question, (err: any, data: Question[]) => {
                if (err) {
                    context.logger.log("Error_Fetching_QuestionFile :" + JSON.stringify(err) + "PATH: "+path)
                    resolve([])
                }
                else resolve(data)
            })
        })
    }
}
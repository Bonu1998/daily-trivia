import { ActionInput, ActionResponse, IAction, IContext } from "@flairlabs/flair-infra";
import _, { result } from "lodash";
import { FetchNextQuestion } from "../Common/GamePlayeHelper";
import { InvalidAction, QuestionSpeechHelper } from "../Common/SpeechHelpers";
import { getUrl } from "../Common/Utils";
import { Constants } from "../Constants";
import { AppConfig } from "../Models/AppConfig";
import { LanguageResources } from "../Models/LanguageResources";
import { Question } from "../Models/Question";
import { Settings } from "../Models/Settings";

export default class AskQuestionAction implements IAction {
    async executeAction(input: ActionInput, context: IContext, data: any): Promise<ActionResponse> {
        let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
        let platForm = _.get(sessionData, Constants.STRINGS.PLATFORM)
        let isDisplayEnabled = _.get(sessionData, Constants.STRINGS.IS_DISPLAY_ENABLED)
        let result = await Promise.all([Settings.getFile(context), LanguageResources.getFile(context), AppConfig.getFile(context)])
        let settings: Settings = result[0]
        let languageResource: LanguageResources = result[1]
        let appConfig: AppConfig = result[2]
        let response: ActionResponse = new ActionResponse()
        try {
            let value = await FetchNextQuestion(context, settings)
            _.set(context.sessionContext.userData, Constants.STRINGS.ROUND_DATA, value.roundData)
            let val = await QuestionSpeechHelper(context, value.que[0], value.que[1], value.quesType, languageResource, settings)
            let userData = _.get(context, Constants.STRINGS.USER_DATA)
            let question: Question = _.get(userData, Constants.STRINGS.LAST_QUESTION) || new Question()


            response.ACTION.prompt = true
            response.ACTION.reprompt = true
            response.ACTION.shouldEndSession = false

            response.DATA.promptSpeech = val.speech
            response.DATA.repromptSpeech = val.reprompt

            let backgroundImageUrl = "", templateId = ""

            if (isDisplayEnabled) {
                response.DATA.backgroundImageUrl = { url: backgroundImageUrl }
                response.DATA.optionsList = question.options
                if (platForm == Constants.PLATFORM.ALEXA) {
                    response.ACTION.APL = true
                    response.OBJS.aplData = {
                        TOKEN: templateId,
                        PATH: getUrl(context, languageResource, Constants.URLS.TEMPLATE, getUrl(context, languageResource, Constants.URLS.TEMPLATE, appConfig.TEMPLATES[templateId]))
                    }
                }
            }
        }catch(e) {
            context.logger.log(`Error @AskQuestionAction : ${JSON.stringify(e)}`)
        } finally{
            return response
        }

    }
}
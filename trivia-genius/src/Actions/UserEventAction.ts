import { ActionInput, ActionResponse, IAction, IContext } from "@flairlabs/flair-infra";
import _ from "lodash";
import { FetchNextQuestion } from "../Common/GamePlayeHelper";
import { AskQuestionHelper, ShowTopicHelper } from "../Common/ResponseHelper";
import { QuestionSpeechHelper } from "../Common/SpeechHelpers";
import { addTag } from "../Common/Utils";
import { Constants } from "../Constants";
import { IntentMap } from "../IntentMap";
import { AppConfig } from "../Models/AppConfig";
import { LanguageResources } from "../Models/LanguageResources";
import { Question } from "../Models/Question";
import { Settings } from "../Models/Settings";

export default class UserEventAction implements IAction {
    async executeAction(input: ActionInput, context: IContext, data: any): Promise<ActionResponse> {
        let resp = new ActionResponse();
        let userData = _.get(context, Constants.STRINGS.USER_DATA)

        let userEventArgs: any = _.find(input.ARGS.USER_EVENT_ARGS || [], (e) => { return e && e.EVENT_NAME })
        let eventName = userEventArgs.eventName

        try {

            let files = await Promise.all([Settings.getFile(context), LanguageResources.getFile(context), AppConfig.getFile(context)])
            let settings = files[0]
            let languageResource = files[1]
            let appConfig = files[2]
            switch (eventName) {
                case Constants.SEND_EVENT.ASK_QUESTION:
                    let lastQuesType = _.get(userData, Constants.STRINGS.LAST_QUESTION_TYPE)
                    let que: any[] = _.get(userData, Constants.STRINGS.QUESTION_TAG)
                    resp = await AskQuestionHelper("", que[1], que[0], lastQuesType, context, settings, languageResource, resp)
                    break
                case Constants.SEND_EVENT.SHOW_TOPIC:
                    let lastQueType = _.get(userData, Constants.STRINGS.LAST_QUESTION_TYPE)
                    let lastQueTag = _.get(userData, Constants.STRINGS.QUESTION_TAG)
                    resp = ShowTopicHelper("", lastQueTag[1], lastQueType, context, settings, languageResource, appConfig, resp)
                default:

            }
        } catch (e) {

        } finally {
            return resp
        }
    }

}


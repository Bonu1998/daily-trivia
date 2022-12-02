import { ActionInput, ActionResponse, IAction, IContext } from "@flairlabs/flair-infra";
import _ from "lodash";
import { CheckAnswer, setAndGetQuestionPercentage, UpdateRoundData } from "../Common/AnswerHelper";
import { FetchNextQuestion } from "../Common/GamePlayeHelper";
import { AnswerSpeechHelper, QuestionSpeechHelper } from "../Common/SpeechHelpers";
import { SetUserStats } from "../Common/UserStatsHelper";
import { _random } from "../Common/Utils";
import { Constants } from "../Constants";
import { AppConfig } from "../Models/AppConfig";
import { LanguageResources } from "../Models/LanguageResources";
import { Settings } from "../Models/Settings";

export default class AnswerAction implements IAction {
    async executeAction(input: ActionInput, context: IContext, data: any): Promise<ActionResponse> {
        let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
        let userData = _.get(context, Constants.STRINGS.USER_DATA)
        let entitledStatus = false
        let response = new ActionResponse();
        let result = await Promise.all([LanguageResources.getFile(context), AppConfig.getFile(context), Settings.getFile(context)])
        let languageResource: LanguageResources = result[0]
        let appConfig: AppConfig = result[1]
        let settings: Settings = result[2]

        // try {
            if (input.ARGS.SLOT_VALUES && input.ARGS.SLOT_VALUES.length <= 0) {
                // Repeat implementation remaining
                response.ACTION["prompt"] = true
                response.DATA["promptSpeech"] = "Repeat"
            } else {
                let answerResult = CheckAnswer(input.ARGS.SLOT_VALUES, context)
                UpdateRoundData(context, answerResult)
                console.log("userData.ROUND_DATA")
                console.log(userData.ROUND_DATA)
                await SetUserStats(context, answerResult, settings);
                let speeches = await AnswerSpeechHelper(context, answerResult, languageResource, settings)
                let answerResultSpeech = `${speeches.answerStatus} ${speeches.explanation} ${speeches.percentageSpeech} ${speeches.badgeSpeech}${speeches.currentQuesPointsSpeech} ${speeches.pointsSpeech} ${speeches.countSpeech}`

                if (answerResult || entitledStatus) {
                    let value = await FetchNextQuestion(context, settings)
                    _.set(context.sessionContext.userData, Constants.STRINGS.ROUND_DATA, value.roundData)
                    context.logger.log("FetchNextQuestion resp: " + JSON.stringify(value))
                    if (value && value.errorReason) {
                        // EndScreen
                        response.ACTION["prompt"] = true
                        response.DATA["promptSpeech"] = `${_random(languageResource.STRINGS.END_SPEECH)}`
                    } else {
                        let val = await QuestionSpeechHelper(context, value.que[0], value.que[1], value.quesType, languageResource, settings)
                        context.logger.log("val")
                        context.logger.log(val)

                        let promptSpeech = `${answerResultSpeech} ${val.speech}`

                        response.ACTION.shouldEndSession = false
                        response.ACTION["prompt"] = true
                        response.ACTION["reprompt"] = true
                        response.DATA["promptSpeech"] = promptSpeech
                        // response.DATA["promptSpeech"] = `<audio src = '${audio}'></audio>${speech} ${val.speech}`
                        response.DATA["repromptSpeech"] = val.reprompt

                    }

                } else {
                    // EndScreen
                    response.ACTION["prompt"] = true
                    response.DATA["promptSpeech"] = `${answerResult} ${_random(languageResource.STRINGS.END_SPEECH)}`
                }
            }
        // } catch (e) {
            // context.logger.log("Error @AnswerAction:" + JSON.stringify(e))
        // } finally {
            return response
        // }
    }
}

import { ActionInput, ActionResponse, IAction, IContext } from "@flairlabs/flair-infra";
import _ from "lodash";
import { FetchNextQuestion } from "../Common/GamePlayeHelper";
// import { AskToSelectState } from "../Common/ResponseHelper";
import { InvalidAction, QuestionSpeechHelper } from "../Common/SpeechHelpers";
import { getUrl } from "../Common/Utils";
import { Constants } from "../Constants";
import { AppConfig } from "../Models/AppConfig";
import { LanguageResources } from "../Models/LanguageResources";
import { Question } from "../Models/Question";
import { Settings } from "../Models/Settings";

export default class SelectState implements IAction {
    executeAction(input: ActionInput, context: IContext): Promise<ActionResponse> {
        return new Promise((resolve, reject) => {

            let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
            let platForm = _.get(sessionData, Constants.STRINGS.PLATFORM)
            let isDisplayEnabled = _.get(sessionData, Constants.STRINGS.IS_DISPLAY_ENABLED)
            let lastSpeech = _.get(sessionData, Constants.STRINGS.LAST_SPEECH)

            let files: any[] = [
                Settings.getFile(context),
                LanguageResources.getFile(context),
                AppConfig.getFile(context)
            ]
            // if(lastContext)
            Promise.all(files).then((result) => {
                let settings: Settings = result[0]
                let languageResource: LanguageResources = result[1]
                let appConfig: AppConfig = result[2]
                let slotValues = input.ARGS["SLOT_VALUES"] || []
                if (slotValues.length <= 0) {
                    resolve(InvalidAction(context, languageResource, lastSpeech))
                } else {
                    let currentSlot = _.filter((e: any) => { return e && e.SLOT_TYPE == "STATES" })[0]
                    if (!currentSlot) {
                        resolve(InvalidAction(context, languageResource, lastSpeech, Constants.ACTIONS.INVALID_ACTION_APPOLOGY))
                    } else {
                        if (!settings.STATES.includes(currentSlot["SLOT_ID"])) {
                            resolve(InvalidAction(context, languageResource, lastSpeech, Constants.ACTIONS.INVALID_ACTION_APPOLOGY))
                        } else {
                            FetchNextQuestion(context, settings).then((value) => {
                                _.set(context.sessionContext.userData, Constants.STRINGS.ROUND_DATA, value.roundData)
                                QuestionSpeechHelper(context, value.que[0], value.que[1], value.quesType, languageResource, settings)
                                    .then((val) => {
                                        let userData = _.get(context, Constants.STRINGS.USER_DATA)
                                        let question: Question = _.get(userData, Constants.STRINGS.LAST_QUESTION) || new Question()

                                        let response: ActionResponse = new ActionResponse()

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
                                                    PATH: getUrl(context, languageResource, Constants.URLS.TEMPLATE, appConfig.TEMPLATES[templateId])
                                                }
                                            }
                                        }
                                    })
                                    .catch((e: any) => {
                                        context.logger.log(`Error @AskQuestion : ${JSON.stringify(e)}`)
                                        reject(e)
                                    })
                            }).catch((e) => {
                                context.logger.log(`Error @FetchNextQuestion : ${JSON.stringify(e)}`)
                                reject(e)
                            })
                        }
                    }
                }
            })
        })
    }
}
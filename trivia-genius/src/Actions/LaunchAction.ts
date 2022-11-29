import { ActionInput, ActionResponse, IAction, IContext } from "@flairlabs/flair-infra";
import { LanguageResources } from "../Models/LanguageResources";
import { InvalidAction, QuestionSpeechHelper, WelcomeSpeechAndAudio } from "../Common/SpeechHelpers";
import { addTag, getUrl, SendEventHelper, _random } from "../Common/Utils";
import { Constants } from "../Constants";
import { AppConfig } from "../Models/AppConfig";
import _ from "lodash";
import { FetchNextQuestion } from "../Common/GamePlayeHelper";
import { Settings } from "../Models/Settings";


export default class LaunchAction implements IAction {
    executeAction(input: ActionInput, context: IContext, appConfig: AppConfig): Promise<ActionResponse> {
        context.logger.log("LaunchAction invoked")
        let sessiondata = _.get(context, Constants.STRINGS.SESSION_DATA)
        return new Promise((resolve, reject) => {
            Promise.all([
                LanguageResources.getFile(input, context),
                Settings.getFile(context)
            ]).then((result) => {
                let response: ActionResponse = new ActionResponse();
                let languageResource: LanguageResources = result[0]
                let settings: Settings = result[1]
                context.logger.log("result")
                context.logger.log(JSON.stringify(result))
                let { speech, audio } = WelcomeSpeechAndAudio(input, context, languageResource);
                let backgroundImageUrl = getUrl(context, languageResource, Constants.URLS.DEFAULT_BG);
                let sendEvent = SendEventHelper(context, "", Constants.ACTIONS.LAUNCH);
                let isDisplayEnabled = _.get(sessiondata, Constants.STRINGS.IS_DISPLAY_ENABLED);
                let platForm = _.get(sessiondata, Constants.STRINGS.PLATFORM)

                let templateId = Constants.TEMPLATES.START

                if (isDisplayEnabled) {
                    response.ACTION["speech"] = true
                    response.DATA["promptSpeech"] = `${addTag(context, audio, Constants.TAGS.AUDIO)} ${speech}`
                    response.OBJS["sendEvent"] = sendEvent
                    response.DATA["backgroundImage"] = { url: backgroundImageUrl }
                    if (platForm == Constants.PLATFORM.ALEXA) {
                        response.ACTION["APL"] = true
                        response.OBJS["aplData"] = {
                            TOKEN: templateId,
                            PATH: appConfig.TEMPLATES[templateId]
                        }
                    }
                    resolve(response)
                } else {
                    FetchNextQuestion(context, settings).then((value) => {
                        _.set(context.sessionContext.userData, Constants.STRINGS.ROUND_DATA, value.roundData)
                        QuestionSpeechHelper(context, value.que[0], value.que[1], value.quesType, languageResource, settings)
                            .then((val) => {
                                response.ACTION["prompt"] = true
                                response.ACTION["reprompt"] = true
                                response.DATA["promptSpeech"] = `${addTag(context, audio, Constants.TAGS.AUDIO)} ${speech} ${val.speech}`
                                response.DATA["repromptSpeech"] = val.reprompt
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
            }).catch((e) => {
                reject(e)
            })
        })
    }
}

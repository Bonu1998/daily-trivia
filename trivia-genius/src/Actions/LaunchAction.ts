import { ActionInput, ActionResponse, IAction, IContext } from "@flairlabs/flair-infra";
import { LanguageResources } from "../Models/LanguageResources";
import { InvalidAction, QuestionSpeechHelper, WelcomeSpeechAndAudio } from "../Common/SpeechHelpers";
import { addTag, getUrl, SendEventHelper, _random } from "../Common/Utils";
import { Constants } from "../Constants";
import { AppConfig } from "../Models/AppConfig";
import _ from "lodash";
import { FetchNextQuestion } from "../Common/GamePlayeHelper";
import { Settings } from "../Models/Settings";
import { AskQuestionHelper } from "../Common/ResponseHelper";


export default class LaunchAction implements IAction {
    async executeAction(input: ActionInput, context: IContext, appConfig: AppConfig): Promise<ActionResponse> {
        context.logger.log("LaunchAction invoked")
        let sessiondata = _.get(context, Constants.STRINGS.SESSION_DATA)
        let userData = _.get(context, Constants.STRINGS.USER_DATA)
        let response: ActionResponse = new ActionResponse();
        try {
            let result = await Promise.all([LanguageResources.getFile(context), Settings.getFile(context)])
            let languageResource: LanguageResources = result[0]
            let settings: Settings = result[1]
            context.logger.log("result")
            context.logger.log(JSON.stringify(result))
            let { speech, audio } = WelcomeSpeechAndAudio(input, context, languageResource);
            let backgroundImageUrl = getUrl(context, languageResource, Constants.URLS.START_LOGO);
            let templateId = Constants.TEMPLATES.START
            let isDisplayEnabled = _.get(sessiondata, Constants.STRINGS.IS_DISPLAY_ENABLED);
            let platForm = _.get(sessiondata, Constants.STRINGS.PLATFORM)

            let welcomeSpeech = `${addTag(context, audio, Constants.TAGS.AUDIO)} ${speech}`

            let value = await FetchNextQuestion(context, settings)

            if (value && value.errorReason) {
                response.ACTION.prompt = true
                response.DATA.promptSpeech = `${welcomeSpeech} ${_random(languageResource.STRINGS.END_SPEECH)}`
            } else {
                if (isDisplayEnabled) {
                    let questionNumber = _.get(userData, Constants.STRINGS.NO_OF_QUE_FETCHED) || 0
                    let sendEvent = questionNumber == 1 ? Constants.SEND_EVENT.SHOW_TOPIC : Constants.SEND_EVENT.ASK_QUESTION
                    response.ACTION.prompt = true
                    response.DATA.promptSpeech = `${addTag(context, audio, Constants.TAGS.AUDIO)}`
                    response.OBJS.sendEvent = SendEventHelper(context, templateId, sendEvent)
                    response.DATA.background = { url: backgroundImageUrl }
                    if (platForm == Constants.PLATFORM.ALEXA) {
                        response.ACTION.APL = true
                        response.OBJS.aplData = {
                            TOKEN: templateId,
                            PATH: appConfig.TEMPLATES[templateId]
                        }
                    }
                } else {
                    response = await AskQuestionHelper(
                        `${addTag(context, audio, Constants.TAGS.AUDIO)} ${speech}`,
                        value.que[1],
                        value.que[0],
                        value.quesType,
                        context,
                        settings,
                        languageResource,
                        response)
                }
            }
        } catch (e) {
            context.logger.log(`Error @LaunchAction : ${JSON.stringify(e)}`)
        } finally {
            return response
        }

    }
}

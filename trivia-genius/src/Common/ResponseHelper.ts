import { ActionResponse, IContext } from "@flairlabs/flair-infra";
import _ from "lodash";
import { Constants } from "../Constants";
import { LanguageResources } from "../Models/LanguageResources";
import { Question } from "../Models/Question";
import { Settings } from "../Models/Settings";
import { FetchNextQuestion } from "./GamePlayeHelper";
import { GetQuestionHelperSpeehes, QuestionSpeechHelper } from "./SpeechHelpers";
import { getUrl, SendEventHelper, _random } from "./Utils";

import { String as TsString } from "typescript-string-operations"
import { AppConfig } from "../Models/AppConfig";

export async function AskQuestionHelper(
    extraSpeech: string,
    topic: string,
    questionIndex: number,
    questionType: string,
    context: IContext,
    settings: Settings,
    languageResource: LanguageResources,
    response: ActionResponse
) {
    try {
        let userData = _.get(context, Constants.STRINGS.USER_DATA)
        let questions = await Question.getFile(context, topic)
        let question: Question = questions[questionIndex]
        _.set(userData, Constants.STRINGS.LAST_QUESTION, question)
        let speeches = GetQuestionHelperSpeehes(context, topic, questionType, languageResource, settings, questions[questionIndex])
        response.ACTION.shouldEndSession = false
        response.ACTION["prompt"] = true
        response.ACTION["reprompt"] = true
        response.DATA.promptSpeech = `${extraSpeech} ${speeches.questionDesc} ${speeches.questionNumberSpeech} ${speeches.questionPointsSpeech} ${speeches.questionSpeech} ${speeches.optionSpeech}`
        response.DATA["repromptSpeech"] = `${speeches.questionSpeech} ${speeches.optionSpeech}`
    } catch (e) {
        context.logger.log(`Error @AskQuestionHelper: ${JSON.stringify(e)}`)
    } finally {
        return response
    }
}

export function ShowTopicHelper(
    extraSpeech: string,
    topic: string,
    questionType: string,
    context: IContext,
    settings: Settings,
    languageResource: LanguageResources,
    appConfig:AppConfig,
    response: ActionResponse
): ActionResponse {
    let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
    let platForm = _.get(sessionData, Constants.STRINGS.PLATFORM)
    let templateId = Constants.TEMPLATES.SHOW_TOPIC
    let speeches = GetQuestionHelperSpeehes(context, topic, questionType, languageResource, settings, new Question())
    response.ACTION.prompt = true
    let points = questionType == "TODAYS_QUESTION" ? settings.GAMEPLAY.points_per_question : settings.GAMEPLAY.points_per_bonus_question
    response.DATA.promptSpeech = `${extraSpeech} ${speeches.questionDesc} ${speeches.questionNumberSpeech} ${speeches.questionPointsSpeech}`
    response.OBJS.sendEvent = SendEventHelper(context, templateId, Constants.SEND_EVENT.ASK_QUESTION)
    response.DATA.background = { url: getUrl(context, languageResource, Constants.URLS.DEFAULT_BG) }
    let _topic = _.find(settings.TOPICS, (e)=> {return e && e.id == topic})
    response.DATA.points = TsString.format(_random(languageResource.STRINGS.POINTS_TEXT), points)
    response.DATA.primaryText = { text: _topic ? _topic.name : topic }
    response.DATA.primaryImage = { url : _topic ? getUrl(context, languageResource, Constants.URLS.TOPIC_LOGO) : ""}
    response.DATA.title = { text: languageResource.STRINGS.TITLES.TOPIC_OF_THE_DAY }
    if (platForm == Constants.PLATFORM.ALEXA) {
        response.ACTION.APL = true
        response.OBJS.aplData = {
            TOKEN: templateId,
            PATH: getUrl(context, languageResource, Constants.URLS.TEMPLATE, appConfig.TEMPLATES[templateId])
        }
    }
    return response
}
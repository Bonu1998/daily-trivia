import { ActionInput, ActionResponse, IContext } from "@flairlabs/flair-infra";
import _ from "lodash";
import { Constants } from "../Constants";
import { LanguageResources } from "../Models/LanguageResources";
import { databaseGet, getUrl, _random } from "./Utils";
import { String as TsString } from "typescript-string-operations"
import { Settings } from "../Models/Settings";
import { Question } from "../Models/Question";
import { getPlayerCareerPoints, getUserPoints, setAndGetQuestionPercentage } from "./AnswerHelper";
import { getTableName } from "../DataHelpers";

export function WelcomeSpeechAndAudio(input: ActionInput, context: IContext, languageResource: LanguageResources) {
    let userData = _.get(context, Constants.STRINGS.USER_DATA);
    let sessionCount = _.get(userData, Constants.STRINGS.SESSION_COUNT) || 0
    let speech = ""
    let audio = getUrl(context, languageResource, Constants.URLS.WELCOME_AUDIO)
    if (sessionCount > 1) {   //returning user
        speech = `${_random(languageResource.STRINGS.WELCOME_RETURNING)}`
    } else {
        speech = `${_random(languageResource.STRINGS.WELCOME_SPEECH)}`
    }
    return { speech, audio }
}


export function StateSpeehHelper(input: ActionInput, context: IContext, settings: Settings, languageResource: LanguageResources) {
    let slot = _.find(input.ARGS["SLOT_VALUES"], (e) => { return e && e.ID == "STATES" })
    let speech = ""
    if (slot) {
        if (settings.STATES.includes(slot["VALUE"]))
            speech = `${_random(languageResource.STRINGS.SET_STATE_SUCCESS)}`
        else
            speech = `${_random(languageResource.STRINGS.WRONG_STATE)}`
    } else {

    }
}


export function InvalidAction(context: IContext, languageResource: LanguageResources, reason: string, type?: any) {
    let resp = new ActionResponse();
    switch (type) {
        case Constants.ACTIONS.INVALID_ACTION_APPOLOGY:
            resp.ACTION.prompt = true
            resp.DATA.promptSpeech = `${_random(languageResource.STRINGS.APOLOGY)} ${reason}`
            resp.ACTION.reprompt = true
            resp.DATA.repromptSpeech = `${_random(languageResource.STRINGS.APOLOGY)} ${reason}`
            break
        case Constants.ACTIONS.INVALID_CLOSE:
            resp.ACTION.prompt = true
            resp.DATA.promptSpeech = ``
            resp.ACTION.shouldEndSession = true
            break;
        default:
            resp.DATA.promptSpeech = ``
            resp.ACTION.prompt = true
    }
    return resp
}

export function GetQuestionHelperSpeehes(context: IContext, topic: string, quesType: string, languageResource: LanguageResources, settings: Settings, question: Question) {
    let userData = _.get(context, Constants.STRINGS.USER_DATA)
    let noOfQueFetched = _.get(userData, Constants.STRINGS.NO_OF_QUE_FETCHED) || 0
    let questionPoints = 0, questionDesc = ""
    if (quesType == "TODAYS_QUESTION") {
        questionPoints = settings.GAMEPLAY.points_per_question
        if (noOfQueFetched == 1) questionDesc = TsString.format(_random(languageResource.STRINGS.TOPIC_OF_THE_DAY) || "", topic)
    } else {
        questionPoints = settings.GAMEPLAY.points_per_bonus_question
    }

    let optionSpeechArr = []

    for (let i = 0; i < question.options.length; i++) {
        optionSpeechArr.push(`${settings.GAMEPLAY.options_for_question[i]}: ${question.options[i]}`)
    }

    let optionSpeech = optionSpeechArr.join(",")
    let questionNumberSpeech = TsString.format(_random(languageResource.STRINGS.QUESTION_NUMBER), noOfQueFetched)
    let questionPointsSpeech = TsString.format(_random(languageResource.STRINGS.POINTS_SPEECH), questionPoints)

    return { optionSpeech, questionPointsSpeech, questionSpeech: question.que, questionNumberSpeech, questionDesc }
}


export async function QuestionSpeechHelper(context: IContext, questionIndex: number, topic: string, quesType: string, languageResource: LanguageResources, settings: Settings): Promise<any> {
    let speech = "", reprompt = ""
    let userData = _.get(context, Constants.STRINGS.USER_DATA)
    try {
        let questions = await Question.getFile(context, topic)
        context.logger.log("Question:" + JSON.stringify(questions))
        let question: Question = questions[questionIndex]
        _.set(userData, Constants.STRINGS.LAST_QUESTION, question)
        context.logger.log("question")
        context.logger.log(question)
        let optionSpeechArr: string[] = []
        let questionPoints = quesType == "TODAYS_QUESTION" ? settings.GAMEPLAY.points_per_question : settings.GAMEPLAY.points_per_bonus_question
        context.logger.log("questionPoints")
        context.logger.log(questionPoints)
        for (let i = 0; i < question.options.length; i++) {
            optionSpeechArr.push(`${settings.GAMEPLAY.options_for_question[i]}: ${question.options[i]}`)
        }
        let optionSpeech = optionSpeechArr.join(",")
        //add question number logic
        speech = `${TsString.format(_random(languageResource.STRINGS.QUESTION_DETAILS), "1st", topic, questionPoints)} ${question.que} ${optionSpeech}`
        reprompt = `${question.que} ${optionSpeech}`
    } catch (e) {
        context.logger.log(`Error @QuestionSpeechHelper : ${e}`)
    } finally {
        return { speech, reprompt }
    }
}

export async function AnswerSpeechHelper(context: IContext, result: boolean, languageResource: LanguageResources, settings: Settings) {
    let userData = _.get(context, Constants.STRINGS.USER_DATA)
    let lastQuestion: Question = _.get(userData, Constants.STRINGS.LAST_QUESTION)
    let roundData = _.get(userData, Constants.STRINGS.ROUND_DATA)
    let entitledStatus = false
    let lastQuesType = _.get(userData, Constants.STRINGS.LAST_QUESTION_TYPE)
    let percentage = 0
    let careerPoints = 0
    let currentQuesPoint = 0
    let badge = 1
    let topic = "History"
    try {
        percentage = await setAndGetQuestionPercentage(context, result)
        careerPoints = await getPlayerCareerPoints(context)
        currentQuesPoint = result ? getUserPoints(context, lastQuesType, entitledStatus, settings) : 0


        let answerStatus = result ? _random(languageResource.STRINGS.CORRECT_ANSWER) : _random(languageResource.STRINGS.INCORRECT_ANSWER)
        // let answerStatus = result ? "Correct" : "INCorrect"
        let percentageSpeech = TsString.format(_random(languageResource.STRINGS.CORRECT_PERCENTAGE), percentage)
        let badgeSpeech = TsString.format(_random(languageResource.STRINGS.BADGE_SPEECH), badge, topic)
        let currentQuesPointsSpeech = TsString.format(_random(languageResource.STRINGS.CURRENT_QUE_POINTS), currentQuesPoint)
        let pointsSpeech = TsString.format(_random(languageResource.STRINGS.POINTS_SPEECH), careerPoints)
        let countSpeech = roundData.noOfQuestionsFetched > 1 ? TsString.format(_random(languageResource.STRINGS.QUESTION_COUNT), roundData.noOfQuestionsFetched) : ""
        let totalPointsSpeech
        // let countSpeech = "countSpeech"
        return {
            answerStatus,
            percentageSpeech,
            badgeSpeech,
            pointsSpeech,
            countSpeech,
            explanation: lastQuestion.expl[0],
            currentQuesPointsSpeech
            // explanation: _random(lastQuestion.expl)
        }
    } catch (e) {
        throw `Error @AnswerSpeechHelper: ${JSON.stringify(e)}`
    }
}


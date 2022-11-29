import { ActionInput, ActionResponse, IContext } from "@flairlabs/flair-infra";
import _ from "lodash";
import { Constants } from "../Constants";
import { LanguageResources } from "../Models/LanguageResources";
import { getUrl, _random } from "./Utils";
import { String as TsString } from "typescript-string-operations"
import { Settings } from "../Models/Settings";
import { Question } from "../Models/Question";

export function WelcomeSpeechAndAudio(input: ActionInput, context: IContext, languageResource: LanguageResources) {
    let userData = _.get(context, Constants.STRINGS.USER_DATA);
    let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA);
    let sessionCount = _.get(userData, Constants.STRINGS.SESSION_COUNT) || 0
    let speech = "", reprompt = "", lastSpeech = ""
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


export function QuestionSpeechHelper(context:IContext, questionIndex: number, topic: string, quesType: string, languageResource: LanguageResources, settings: Settings):Promise<any> {
    return new Promise((resolve, reject)=>{
        let speech = "", reprompt = ""
        let userData = _.get(context, Constants.STRINGS.USER_DATA)
        Question.getFile(context, topic).then((questions)=>{
            let question = questions[questionIndex]
            _.set(userData, Constants.STRINGS.LAST_QUESTION, question)
            let speech = "", reprompt = ""
            let optionSpeechArr: string[] = []
            let questionPoints = quesType == "TODAYS_QUESTION" ? settings.GAMEPLAY.points_per_question : settings.GAMEPLAY.points_per_bonus_question
            for (let i = 0; i < question.options.length; i++) {
                optionSpeechArr.push(`${settings.GAMEPLAY.options_for_question[i]}: ${question.options[i]}`)
            }
            let optionSpeech = optionSpeechArr.join(",")
            speech = `${TsString.format(_random(languageResource.STRINGS.QUESTION_POINTS), questionPoints)} ${question.que} ${optionSpeech}`
            reprompt = `${question.que} ${optionSpeech}`
        }).catch((e)=>{
            context.logger.log(`Error @QuestionSpeechHelper : ${e}`)
        }).finally(()=>{
            resolve({ speech, reprompt })
        })
    })
}
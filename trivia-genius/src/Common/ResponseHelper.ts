import { ActionResponse, IContext } from "@flairlabs/flair-infra";
import _ from "lodash";
import { result } from "lodash";
import { ModuleResolutionKind } from "typescript";
import { Constants } from "../Constants";
import { LanguageResources } from "../Models/LanguageResources";
import { Question } from "../Models/Question";
import { Settings } from "../Models/Settings";
import { QuestionSpeechHelper } from "./SpeechHelpers";
import { _random } from "./Utils";

export function AskToSelectState(context: IContext, languageResource: LanguageResources) {
    return {
        speech: _random(languageResource.STRINGS.ASK_TO_SELECT_STATE),
        backgroundImageUrl: _random(languageResource.IMAGES.DEFAULT_BG_IMAGE)
    }
}

// export function AskQuestion(context: IContext, questionIndex: number, topic: string, quesType: string, settings: Settings, languageResource: LanguageResources): Promise<ActionResponse> {
//     let resp: ActionResponse = new ActionResponse();
//     let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
//     // let isDisplayEnabled = _.get(sessionData, Constants.STRINGS.IS_DISPLAY_ENABLED);
//     return new Promise((resolve, reject) => {
//         Promise.all([Question.getFile(context, topic)]).then((result) => {
//             let questions: Question[] = result[0]
//             let currentQuestion = questions[questionIndex]
//             if (!currentQuestion) reject("question index not found" + questionIndex + " " + topic)
//             else {
//                 let { speech, reprompt } = QuestionSpeechHelper(currentQuestion, quesType, languageResource, settings);
//                 resp.ACTION["speech"] = true
//                 resp.ACTION["reprompt"] = true
//                 resp.ACTION["shouldEndSession"] = false
//                 resp.DATA["repromptSpeech"] = reprompt
//                 resp.DATA["promptSpeech"] = speech
//                 // let templateId = Constants.TEMPLATES.QUESTION
//                 _.set(sessionData, Constants.STRINGS.LAST_SPEECH, reprompt);

//                 resolve(resp)
//             }
//         }).catch((e) => reject(e))
//     })
// }

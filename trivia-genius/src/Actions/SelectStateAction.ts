import { ActionInput, ActionResponse, IAction, IContext } from "@flairlabs/flair-infra";
import _ from "lodash";
import { FetchNextQuestion } from "../Common/GamePlayeHelper";
import { AskQuestion, AskToSelectState } from "../Common/ResponseHelper";
import { InvalidAction } from "../Common/SpeechHelpers";
import { Constants } from "../Constants";
import { LanguageResources } from "../Models/LanguageResources";
import { Settings } from "../Models/Settings";

export default class SelectState implements IAction {
    executeAction(input: ActionInput, context: IContext): Promise<ActionResponse> {
        return new Promise((resolve, reject) => {

            let sessionData = _.get(context.sessionContext, Constants.STRINGS.SESSION_DATA);
            let lastSpeech = _.get(sessionData, Constants.STRINGS.LAST_SPEECH)

            let files: any[] = [
                Settings.getFile(context),
                LanguageResources.getFile(input, context)
            ]
            // if(lastContext)
            Promise.all(files).then((result) => {
                let settings: Settings = result[0]
                let languageResource: LanguageResources = result[1]
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
                                AskQuestion(context, value.que[0], value.que[1], value.quesType, settings, languageResource)
                            }).catch((e) => {
                                context.logger.log(`Error @FetchNextQuestion : ${JSON.stringify(e)}`)
                                resolve(InvalidAction(context, languageResource, lastSpeech, Constants.ACTIONS.INVALID_CLOSE))
                            })
                        }
                    }
                }
            })
        })
    }
}
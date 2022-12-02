import { ActionInput, IContext } from "@flairlabs/flair-infra";
import _ from "lodash";
import { Constants } from "../Constants";
import { getTableName } from "../DataHelpers";
import { Question } from "../Models/Question";
import { Settings } from "../Models/Settings";
import { databaseGet, databaseSave, dateStringUtil, getTimeZoneBasedDate } from "./Utils";

export function UpdateRoundData(context: IContext, answerResult: boolean) {
    let userData = _.get(context, Constants.STRINGS.USER_DATA)
    let roundData = _.get(userData, Constants.STRINGS.ROUND_DATA) || {}
    let todaysDate = getTimeZoneBasedDate(context)
    roundData.lastPlayedDate = dateStringUtil(todaysDate).date
    roundData.ans = roundData && roundData.ans && _.isArray(roundData.ans) ? roundData.ans : []
    roundData.ans.push(answerResult)
    _.set(userData, Constants.STRINGS.ROUND_DATA, roundData)
    return
}

// roundData = {
//     questions,
//     lastPlayedDate: "", // Implememnt later
//     ans: [],
//     noOfQuestionsFetched: 0
// }
export function CheckAnswer(slots: any[], context: IContext) {
    let userData = _.get(context, Constants.STRINGS.USER_DATA)
    let lastQuestion: Question = _.get(userData, Constants.STRINGS.LAST_QUESTION)
    let answerSlot = slots[0]
    let options: string[] = ['a', 'b', 'c'] // Constants
    let result: boolean = false
    context.logger.log("slots")
    context.logger.log(JSON.stringify(slots))
    switch (answerSlot.SLOT_TYPE) {
        case "OPTION":
            let ansIndex = _.findIndex(options, (e: any) => { return e == _.lowerCase(answerSlot.SLOT_VALUE) })
            if (_.inRange(ansIndex, 0, lastQuestion.options.length)) result = lastQuestion.ans.includes(lastQuestion.options[ansIndex || ""])
            break
        case "OPTION_VALUE":
            result = lastQuestion.ans.includes(answerSlot.SLOT_VALUE || "")
            break
        case "ORDINAL":
            context.logger.log("ORDINAL CONDITION")
            context.logger.log(_.inRange(answerSlot.SLOT_VALUE - 1, 0, lastQuestion.options.length))
            context.logger.log(answerSlot.SLOT_VALUE - 1)
            context.logger.log(lastQuestion)
            if (_.inRange(parseInt(answerSlot.SLOT_VALUE) - 1, 0, lastQuestion.options.length)) {
                result = lastQuestion.ans.includes(lastQuestion.options[answerSlot.SLOT_VALUE - 1])
                context.logger.log("ssss" + lastQuestion.ans.includes(lastQuestion.options[answerSlot.SLOT_VALUE - 1]))
            }
            break
        default:
            context.logger.log('Error @CheckAnswer InValid SlotType: ' + answerSlot.SLOT_TYPE)
    }
    context.logger.log("USER_ANS_RESULT: " + result)
    return result
}

export function userScore(type: string, settings: Settings) {

}

export async function setAndGetQuestionPercentage(context: IContext, answerResult: boolean): Promise<number> {
    let userData = _.get(context, Constants.STRINGS.USER_DATA)
    let que: Question = _.get(userData, Constants.STRINGS.LAST_QUESTION)
    try {
        let data = await databaseGet(context, getTableName("user-answer-responses", context) || "", que.id)
        if (!data || _.isEmpty(data)) {
            data = {
                quesId: que.id,
                correct: answerResult ? 1 : 0,
                inCorrect: !answerResult ? 1 : 0
            }
        } else {
            if (answerResult)
                data.correct += 1
            else
                data.inCorrect += 1
        }
        let correctPercentage: number = (data.correct / (data.correct + data.inCorrect)) * 100
        if (correctPercentage == 100 || correctPercentage == 0) {
            correctPercentage = (Math.round(Math.random() * 70)) + 20
        }
        let saveResult = await databaseSave(context, getTableName("user-answer-responses", context) || "", data)
        if (saveResult) {
            context.logger.log("QUES_RESP_SAVE_RSULT: " + saveResult)
        }
        return correctPercentage
    } catch (e) {
        throw `@setAndGetQuestionPercentage: ${JSON.stringify(e)}`
    }
}


export function getUserPoints(context: IContext, type: string, entitledStatus: boolean, settings: Settings) {
    context.logger.log("getUserPoints invoked type: " + type)
    if (type == "TODAYS_QUESTION") {
        return settings.GAMEPLAY.points_per_question
    } else {
        if (!entitledStatus && type == "BONUS_QUESTION") {
            return settings.GAMEPLAY.points_per_bonus_question
        }
        else {
            return settings.GAMEPLAY.subscriber_points_per_bonus_question
        }
    }
}

export async function getPlayerCareerPoints(context: IContext): Promise<number> {
    let userData = _.get(context, Constants.STRINGS.USER_DATA)
    let userId = _.get(userData, Constants.STRINGS.USER_DATA)
    let points: number = 0
    try {
        let userStats = await databaseGet(context, getTableName("user-statistics", context), { userId })
        if (!_.isEmpty(userStats)) {
            if (userStats.topicsData.length > 0) {
                userStats.topicsData.forEach((ele: any) => {
                    points += ele.totalPoints || 0
                })
            }
        }
        return points
    } catch (e) {
        throw `Error @getPlayerCareerPoints ${JSON.stringify(e)}`
    }
}
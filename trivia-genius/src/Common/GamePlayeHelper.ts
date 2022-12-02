import { IContext } from "@flairlabs/flair-infra";
import _ from "lodash";
import { isContext } from "vm";
import { Constants } from "../Constants";
import { getTableName } from "../DataHelpers";
import { LanguageResources } from "../Models/LanguageResources";
import { Question } from "../Models/Question";
import { Settings } from "../Models/Settings";
import { databaseGet, databaseSave, dateStringUtil, getTimeZoneBasedDate, _random } from "./Utils";

export async function FetchNextQuestion(context: IContext, settings: Settings): Promise<any> {
    let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
    let userData = _.get(context, Constants.STRINGS.USER_DATA)
    let locale = _.get(sessionData, Constants.STRINGS.LOCALE)
    let appName = _.get(sessionData, Constants.STRINGS.APPNAME)
    let fragId = appName
    let entitledStatus = false
    let topics = settings.TOPICS.filter((e) => { return e && e.isActive && e.isPremium == entitledStatus })
    context.logger.log("TOPICS:" + topics)
    let todaysDate = getTimeZoneBasedDate(context);
    let yesterDayDate = getTimeZoneBasedDate(context);
    yesterDayDate.setDate(yesterDayDate.getDate() - 1);
    let dayId = dateStringUtil(todaysDate).date
    let previousDayId = dateStringUtil(yesterDayDate).date
    let roundData = _.get(userData, Constants.STRINGS.ROUND_DATA) || {}
    let lastPlayedDate = roundData.lastPlayedDate ? new Date(roundData.lastPlayedDate) : null
    let _resp: any
    try {
        if (roundData && !_.isEmpty(roundData) && lastPlayedDate && _.eq(dateStringUtil(lastPlayedDate).date, dateStringUtil(todaysDate).date)) {
            _resp = selectQuestion(context, roundData, entitledStatus, settings)
        } else {
            let fetchedData = await Promise.all([
                databaseGet(context, getTableName("daily-question-storage", context), { dayId, locale }),
                databaseGet(context, getTableName("daily-question-storage", context), { dayId: previousDayId, locale }),
                databaseGet(context, getTableName("fragments-storage", context), { fragId, locale })
            ])
            let data = fetchedData[0]
            let previousData = fetchedData[1] || {}
            let fragmentData = fetchedData[2] || {}
            let fragments = fragmentData && fragmentData.fragments ? fragmentData.fragments : {}
            context.logger.log("todays ques data:"+JSON.stringify(data))
            context.logger.log("prev ques data:"+JSON.stringify(previousData))
            context.logger.log("fragments fetched:"+JSON.stringify(fragmentData))
            if (!data || _.isEmpty(data)) {
                context.logger.log(`data empty`)
                let promises: any[] = [], questions: any[] = []
                let topicToExculde = previousData
                    && previousData.questions
                    && previousData.questions
                    && previousData.questions[0]
                    && previousData.questions[0][1]
                    ? previousData.questions[0][1] : ""
                topics = topics.filter((e) => { return !_.eq(e.id, topicToExculde) })
                let distributions = getDistribution(topics.map((e) => { return e.id }),
                    settings.GAMEPLAY.no_daily_question_per_day + settings.GAMEPLAY.no_bonus_questions_per_day + settings.GAMEPLAY.no_extra_bonus_per_day)
                let filesToFetch = _.keys(distributions)
                filesToFetch.forEach((e) => { promises.push(extractQueBatch(context, e, distributions[e], fragments[e] || [])) })
                let result = await Promise.all(promises)
                context.logger.log("result")
                context.logger.log(JSON.stringify(result))
                result.forEach((e) => {
                    context.logger.log(e)
                    fragments[e.topic] = e.fragments
                    questions = _.concat(questions, e.quesIndexArr)
                })
                questions = _.shuffle(questions)
                data = {
                    dayId,
                    locale,
                    questions,
                }
                fragmentData = {
                    fragId,
                    locale,
                    fragments
                }
                await Promise.all([
                    databaseSave(context, getTableName("daily-question-storage", context), data),
                    databaseSave(context, getTableName("fragments-storage", context), fragmentData)
                ])

                roundData = {
                    questions,
                    lastPlayedDate: dateStringUtil(todaysDate).date,
                    ans: [],
                    noOfQuestionsFetched: 0
                }
                _resp = selectQuestion(context, roundData, entitledStatus, settings)
            }
            else {
                roundData = {
                    questions: data.questions,
                    lastPlayedDate: dateStringUtil(todaysDate).date,
                    ans: [],
                    noOfQuestionsFetched: 0
                }
                _resp = selectQuestion(context, roundData, entitledStatus, settings)
            }
        }
        if (_resp && !_resp.errorReason) {
            _.set(userData, Constants.STRINGS.ROUND_DATA, _resp.roundData)
            _.set(userData, Constants.STRINGS.LAST_QUESTION_TYPE, _resp.quesType)
            _.set(userData, Constants.STRINGS.QUESTION_TAG, _resp.que)
        }
        return _resp
    } catch (e) {
        throw `@FetchNextQuestion ${JSON.stringify(e)}`
    }

}

export function selectQuestion(context: IContext, roundData: any, entitledStatus: boolean, settings: Settings) {
    context.logger.log("selectQuestion involed")
    context.logger.log("roundData")
    context.logger.log(JSON.stringify(roundData))
    context.logger.log("entitledStatus " + entitledStatus)

    let userData = _.get(context, Constants.STRINGS.USER_DATA)
    let que: any = null, errorReason: any = null, quesType: any = null
    let previousAnsResult = roundData.ans ? roundData.ans[roundData.ans.length - 1] || false : false
    let noOfQuestionsFetched = roundData.noOfQuestionsFetched || 0
    let questions = roundData.questions || []
    if (_.gte(noOfQuestionsFetched, questions.length)) {
        errorReason = "EXHAUSTED"
    } else {
        if (noOfQuestionsFetched != 0 && noOfQuestionsFetched > roundData.ans.length) {
            que = _.get(userData, Constants.STRINGS.QUESTION_TAG)
            quesType = _.get(userData, Constants.STRINGS.QUESTION_TAG)
        } else if ((previousAnsResult && _.lt(noOfQuestionsFetched, settings.GAMEPLAY.no_daily_question_per_day)) || _.eq(noOfQuestionsFetched, 0)) {
            que = questions[noOfQuestionsFetched]
            noOfQuestionsFetched +=1
            quesType = "TODAYS_QUESTION"
        } else if (previousAnsResult && _.lt(noOfQuestionsFetched, settings.GAMEPLAY.no_daily_question_per_day + settings.GAMEPLAY.no_bonus_questions_per_day)) {
            que = questions[noOfQuestionsFetched]
            noOfQuestionsFetched++
            quesType = "BONUS_QUESTION"
        } else {
            if (entitledStatus) {
                que = questions[noOfQuestionsFetched]
                noOfQuestionsFetched +=1
                quesType = _.lt(noOfQuestionsFetched, settings.GAMEPLAY.no_daily_question_per_day) ? "TODAYS_QUESTION" : "BONUS_QUESTION"
            } else {
                errorReason = "EXHAUSTED"
            }
        }
    }

    roundData.noOfQuestionsFetched = noOfQuestionsFetched
    context.logger.log("{ que, roundData, quesType, errorReason } " + JSON.stringify({ que, roundData, quesType, errorReason }))
    return { que, roundData, quesType, errorReason }
}


export async function extractQueBatch(context: IContext, topic: string, noOfQues: number, fragments: any[]): Promise<any> {

    context.logger.log("extractQueBatch invoked")
    context.logger.log("topic: " + topic)
    try {
        let questions: Question[] = await Question.getFile(context, topic)
        if (questions.length <= 0) throw "EMPTY Question " + JSON.stringify(topic)
        else {
            let quesIndexArr = [];
            while (quesIndexArr.length < noOfQues) {
                if (fragments.length == 0) fragments.push({ start: 0, end: questions.length - 1 }) // This check auto refreshes the fragment
                let fragIndex = _.random(0, fragments.length - 1)
                let ele = fragments[fragIndex]
                let quesIndex = _.random(ele.start, ele.end)
                quesIndexArr.push([quesIndex, topic]);
                fragments.splice(fragIndex, 1);
                if (quesIndex == ele.start && quesIndex < ele.end) {
                    fragments.push({
                        start: quesIndex + 1,
                        end: ele.end
                    })
                } else if (quesIndex == ele.end && quesIndex > ele.start) {
                    fragments.push({
                        start: ele.start,
                        end: quesIndex - 1
                    })
                } else if (quesIndex > ele.start && quesIndex < ele.end) {
                    fragments.push({
                        start: ele.start,
                        end: quesIndex - 1
                    })
                    fragments.push({
                        start: quesIndex + 1,
                        end: ele.end
                    })
                }
            }
            return { fragments, quesIndexArr, topic }
        }
    } catch (e) {
        throw "@extractQueBatch" + JSON.stringify(e)
    }
}

function getDistribution(elements: string[], total: number) {
    let result = {}
    let lastElement = ""
    let i = 0
    while (i < total) {
        let ele = _random(elements)
        if (!result || _.isEmpty(result)) {
            result[ele] = 1
            i++
            lastElement = ele
        } else {
            if (!_.eq(lastElement, ele)) {
                result[ele] = result[ele] ? result[ele] + 1 : 1
                lastElement = ele
                i++
            }
        }
    }
    return result
}

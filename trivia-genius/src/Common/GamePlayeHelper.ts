import { IContext } from "@flairlabs/flair-infra";
import _ from "lodash";
import { Constants } from "../Constants";
import { LanguageResources } from "../Models/LanguageResources";
import { Question } from "../Models/Question";
import { Settings } from "../Models/Settings";
import { getLocaleBasedDateLocal, _random } from "./Utils";

export async function FetchNextQuestion(context: IContext, settings: Settings): Promise<any> {
    let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
    let userData = _.get(context, Constants.STRINGS.USER_DATA)
    let entitledStatus = false
    let topics = settings.TOPICS.filter((e) => { return e && e.isActive && e.isPremium == entitledStatus })
    let todaysDate = getLocaleBasedDateLocal(context);
    let dayId = todaysDate.toDateString() // replace this with toISOString
    let roundData = _.get(userData, Constants.STRINGS.ROUND_DATA) || {}
    let lastPlayedDate = roundData.lastPlayedDate ? new Date(roundData.lastPlayedDate) : null
    return new Promise((resolve, reject) => {
        if (roundData && !_.isEmpty(roundData) && lastPlayedDate && _.eq(lastPlayedDate, todaysDate)) {
            let que = selectQuestion(roundData, entitledStatus)
            if (que.resp) resolve(que.resp)
            else reject(que.error)
        } else {
            context.dao.getById(process.env.QUESTION_TABLE || "", { dayId }, (data: any) => {
                if (!data || _.isEmpty(data)) {
                    context.logger.log(`data empty`)
                    let lastTopics: string[] = [], promises: any[] = []
                    let availableTopics = topics.map((e) => { return e.id })
                    lastTopics.push(_random(availableTopics))
                    promises.push(extractQueBatch(context, lastTopics[lastTopics.length - 1], settings.GAMEPLAY.total_todays_question_per_day, []))
                    availableTopics = _.without(availableTopics, ...lastTopics)
                    lastTopics.push(_random(availableTopics))
                    promises.push(extractQueBatch(context, lastTopics[lastTopics.length - 1], settings.GAMEPLAY.total_bonus_questions_per_day, []))

                    Promise.all(promises).then((result) => {
                        data = {
                            dayId: "",
                            todaysQuestions: result[0].quesIndexArr,
                            bonusQuestions: result[1].quesIndexArr,
                            fragments: {},
                            lastTopics
                        }
                        data.fragments[lastTopics[0]] = result[0].fragments
                        data.fragments[lastTopics[1]] = result[1].fragments

                        roundData = {
                            todaysQuestions: data.todaysQuestions,
                            bonusQuestions: data.bonusQuestions,
                            lastPlayedDate: "", // Implememnt later
                            ans:[]
                        }
                        let que = selectQuestion(roundData, entitledStatus)
                        if (que.resp) resolve(que.resp)
                        else reject(que.error)

                    }).catch((e) => reject(e))
                }
                else {
                    roundData = {
                        todaysQuestions: data.todaysQuestions,
                        bonusQuestions: data.bonusQuestions,
                        lastPlayedDate: "", // Implememnt later
                        ans:[]
                    }
                    let que = selectQuestion(roundData, entitledStatus)
                    if (que.resp) resolve(que.resp)
                    else reject(que.error)
                }
            })
        }
    })
}

export function selectQuestion(roundData: any, entitledStatus: boolean) {
    let que: any = null, error: any = null, quesType: any = null
    let previousAnsResult = roundData.ans ? roundData.ans[roundData.ans.length -1] || false : false
    if (roundData.todaysQuestions && roundData.todaysQuestions.length > 0) {
        let questionIndex = _.random(0, roundData.todaysQuestions.length - 1)
        que = roundData.todaysQuestions[questionIndex]
        roundData.todaysQuestions.splice(questionIndex, 1)
        quesType = "TODAYS_QUESTION"
    } else if (roundData.bonusQuestions && roundData.bonusQuestions.length > 0 && (previousAnsResult || entitledStatus)) {
        let questionIndex = _.random(0, roundData.bonusQuestions.length - 1)
        que = roundData.bonusQuestions[questionIndex]
        roundData.bonusQuestions.splice(questionIndex, 1)
        quesType = "BONUS_QUESTION"
    } else {
        // if in monetized region chance for upsell
        error = "EXHAUSTED"
    }
    return { resp: {que, roundData, quesType}, error }
}


export function extractQueBatch(context: IContext, topic: string, noOfQues: number, fragments: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
        Question.getFile(context, topic).then((questions: Question[]) => {
            if (questions.length <= 0) reject("EMPTY Question " + topic)
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
                resolve({ fragments, quesIndexArr })
            }
        }).catch((e) => {
            reject(e)
        })
    })
}
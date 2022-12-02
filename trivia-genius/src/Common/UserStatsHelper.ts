import { IContext } from "@flairlabs/flair-infra";
import _, { round } from "lodash";
import { Constants } from "../Constants";
import { getTableName } from "../DataHelpers";
import { Settings } from "../Models/Settings";
import { getUserPoints } from "./AnswerHelper";
import { databaseGet, databaseSave } from "./Utils";

export async function SetUserStats(context: IContext, userResult: boolean, settings: Settings) {
    let userData = _.get(context, Constants.STRINGS.USER_DATA)
    let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
    let entitledStatus = false
    let userId = _.get(userData, Constants.STRINGS.USER_ID)
    let locale = _.get(sessionData, Constants.STRINGS.LOCALE)
    let lastQuesType = _.get(userData, Constants.STRINGS.LAST_QUESTION_TYPE)
    let roundData = _.get(userData, Constants.STRINGS.ROUND_DATA)
    let noOfQuestionsFetched = _.get(userData, Constants.STRINGS.NO_OF_QUE_FETCHED)
    let quesIndex = noOfQuestionsFetched - 1
    let currentTopic = roundData.questions[quesIndex][1]
    let todaysDate = new Date() //implement locale based date
    let yesterdaysDate = new Date(todaysDate)
    yesterdaysDate.setDate(yesterdaysDate.getDate() - 1)
    let points = userResult ? getUserPoints(context, lastQuesType, entitledStatus, settings) : 0
    try {
        let userStats = await databaseGet(context, getTableName("user-statistics", context), { userId, locale })
        if (_.isEmpty(userStats)) {
            userStats = {
                userId,
                locale,
                dailyStreak: 1,
                highestStreak: 1,
                noOfDaysPlayed: 1,
                lastPlayedDate: todaysDate,     //changes this to string
                topicsData: []
            }
        }
        let lastPlayedDate: Date = new Date(userStats.lastPlayedDate)
        if (_.lt(lastPlayedDate, yesterdaysDate)) {
            userStats.dailyStreak = 0
        } else if (_.eq(yesterdaysDate, lastPlayedDate)) {
            userStats.dailyStreak += 1
            if (userStats.highestStreak < userStats.dailyStreak) userStats.highestStreak = userStats.dailyStreak
        }

        if (_.lt(lastPlayedDate, todaysDate)) {
            userStats.noOfDaysPlayed += 1
            userStats.lastPlayedDate = todaysDate   //change it to locale string
        }

        let topicIndex = userStats.topicsData.findIndex((e: any) => { return e && e.id == currentTopic })
        if (topicIndex == -1) {
            let topic = {
                id: roundData.questions[quesIndex][1],
                correctAnswers: userResult ? 1 : 0,
                incorrectAnswers: !userResult ? 1 : 0,
                totalPoints: points
            }
            userStats.topicsData.push(topic)
        } else {
            let topic = userStats.topicsData[topicIndex]
            if (userResult) {
                topic.correctAnswers += 1
                topic.totalPoints += points
            }
            else topic.incorrectAnswers += 1
            userStats.topicsData[topicIndex] = topic
        }
        let saveResult = await databaseSave(context, getTableName("user-statistics", context), userStats);
        if (saveResult) context.logger.log("USERSTATS_SAVED_SUCCESS")
        else context.logger.log("USERSTATS_SAVE_ERROR")

    } catch (e) {
        throw `Error@SetUserStats: ${JSON.stringify(e)}`
    }
}


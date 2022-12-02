import { ActionInput, IContext, IDao, IDataHelper } from "@flairlabs/flair-infra";
import _ from "lodash";
import { Constants } from "./Constants";
import { AppConfig } from "./Models/AppConfig";

export class DataHelper implements IDataHelper {

    getSessionData(event: ActionInput, context: IContext): Promise<any> {
        return new Promise((resolve, reject) => {
            if (process.env.ENABLE_SESSION_ATTRIBUTE == "true") {
                resolve(addDefaultSessionKeys(event, event.SESSION_DATA || {}))
            } else {
                context.dao.getById(`${event.APP_NAME}-session-data` || "", { SESSION_ID: event.SESSION_ID }, (_sessionData: any) => {
                    resolve(addDefaultSessionKeys(event, _sessionData))
                })
            }
        })
    }

    getUserData(event: ActionInput, context: IContext): Promise<any> {
        return new Promise((resolve, reject) => {
            context.dao.getById(`${event.APP_NAME}-user-data` || "", { USER_ID: event.USER_ID }, (userData: any) => {
                userData = userData || {}
                _.set(userData, "USER_ID", event.USER_ID)
                resolve(userData)
            })
        })
    }

    setSessionData(event: ActionInput, context: IContext): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            context.dao.save(`${event.APP_NAME}-session-data` || "", context.sessionContext.sessionData, (result: boolean) => {
                if (!result) {
                    reject("ERROR_SAVING_SESSION_DATA: " + JSON.stringify({ sessionData: context.sessionContext.sessionData, tableName: getTableName("session-data", context) || "" }))
                } else resolve(true)
            })
        })
    }

    setUserData(event: ActionInput, context: IContext): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            context.dao.save(`${event.APP_NAME}-user-data` || "", context.sessionContext.userData, (result: boolean) => {
                if (!result) {
                    reject("ERROR_SAVING_USER_DATA: " + JSON.stringify({ userData: context.sessionContext.userData, tableName: getTableName("user-data", context) || "" }))
                } else resolve(true)
            })
        })
    }

    deleteSessionData(key: string, context: IContext): Promise<Boolean> {
        let tn = process.env.USER_DATA_TABLENAME || `${_.get(context.sessionContext.sessionData, "APP_NAME")}-user-data`
        return new Promise((resolve, reject) => {
            context.dao.delete(tn || "", key, (result: boolean) => {
                if (!result) {
                    reject("ERROR_DELETING_SESSION_DATA: " + JSON.stringify({ key, tableName: tn || "" }))
                } else resolve(true)
            })
        })
    }
}


export function getTableName(type: string, context: IContext) {
    let result: any = null;
    let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
    let appName = _.get(sessionData, Constants.STRINGS.APPNAME)
    switch (type) {
        case "session-data":
            result = process.env.OVERRIDE_SESSION_DATA_TABLENAME || `${appName}-session-data`
            break;
        case "user-data":
            result = process.env.OVERRIDE_USER_DATA_TABLENAME || `${appName}-user-data`
            break;
        case "user-statistics":
            result = process.env.OVERRIDE_USER_STATISTICS_TABLENAME || `${appName}-user-statistics`
            break
        case "daily-question-storage":
            result = process.env.OVERRIDE_DAILY_QUES_TABLENAME || `${appName}-daily-question-storage`
            break
        case "fragments-storage":
            result = process.env.FRAGMENTS_TABLENAME || `fragments-storage`
            break
        case "user-answer-responses":
            result = process.env.USER_ANSWER_RESP_TABLENAME || `user-answer-responses`
            break
        default:
            console.log("ERROR: Invalid tableName type: ", type)
    }
    context.logger.log("Tablename: "+result)
    return result
}

function addDefaultSessionKeys(event: ActionInput, data: any) {
    _.set(data, "APPNAME", event.APP_NAME)
    _.set(data, "LOCALE", event.LOCALE)
    _.set(data, "STAGE", event.STAGE)
    _.set(data, "IS_NEWS_SESSION", event.IS_NEW_SESSION)
    _.set(data, "DEVICE_CONFIG", event.ARGS["DEVICE_CONFIG"] || {})
    _.set(data, "PLATFORM", event.PLATFORM)
    _.set(data, "SESSION_ID", event.SESSION_ID)
    return data
}
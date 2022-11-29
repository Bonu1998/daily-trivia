import { ActionInput, IContext, IDao, IDataHelper } from "@flairlabs/flair-infra";
import _ from "lodash";
import { AppConfig } from "./Models/AppConfig";

export class DataHelper implements IDataHelper {
    
    getSessionData(event: ActionInput, context: IContext): Promise<any> {
        return new Promise((resolve, reject) => {
            if (process.env.ENABLE_SESSION_ATTRIBUTES == "true") {
                resolve(addDefaultSessionKeys(event, event.SESSION_DATA || {}))
            } else {
                context.dao.getById(getTableName("session-data", event) || "", event.SESSION_ID, (_sessionData: any) => {
                    resolve(addDefaultSessionKeys(event, _sessionData))
                })
            }
        })
    }

    getUserData(event: ActionInput, context: IContext): Promise<any> {
        return new Promise((resolve, reject) => {
            context.dao.getById(getTableName("user-data", event) || "", event.USER_ID, (userData: any) => {
                userData = userData || {}
                _.set(userData, "USER_ID", event.USER_ID)
                resolve(userData)
            })
        })
    }

    setSessionData(event: ActionInput, context: IContext): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            context.dao.save(getTableName("session-data", event) || "", context.sessionContext.sessionData, (result: boolean) => {
                if (!result) {
                    reject("ERROR_SAVING_SESSION_DATA: " + JSON.stringify({ sessionData: context.sessionContext.sessionData, tableName: getTableName("session-data", event) || "" }))
                } else resolve(true)
            })
        })
    }

    setUserData(event: ActionInput, context: IContext): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            context.dao.save(getTableName("user-data", event) || "", context.sessionContext.userData, (result: boolean) => {
                if (!result) {
                    reject("ERROR_SAVING_USER_DATA: " + JSON.stringify({ userData: context.sessionContext.userData, tableName: getTableName("user-data", event) || "" }))
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

function getTableName(type: string, event: ActionInput) {
    let result: any = null;
    switch (type) {
        case "session-data":
            result = process.env.SESSION_DATA_TABLENAME || `${event.APP_NAME}-session-data`
            break;
        case "user-data":
            result = process.env.USER_DATA_TABLENAME || `${event.APP_NAME}-user-data`
            break;
        default:
            console.log("ERROR: Invalid tableName type: ", type)
    }
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
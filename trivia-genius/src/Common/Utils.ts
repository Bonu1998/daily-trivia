import { ActionInput, IContext } from "@flairlabs/flair-infra";
import _ from "lodash";
import { Constants } from "../Constants";
import { AppConfig } from "../Models/AppConfig";
import { String as TsString } from "typescript-string-operations"
import { LanguageResources } from "../Models/LanguageResources";

export function _random(arr: any[]) {
    return arr[_.random(0, arr.length - 1)]
}

export function addTag(context: IContext, value: any, tag: string) {
    switch (tag) {
        case "AUDIO":
            value = `<audio src = '${value}'></audio>`
        default:
            context.logger.log(`Error @addTag Invalid tag: ${tag}`)
    }
    return value
}

export function SendEventHelper(context: IContext, token: string, event: string) {
    let eventName
    let userData = context.sessionContext.userData
    let args: any = {}
    switch (event) {
        // switch is here incase to add data in args
        default:
            eventName = event
            context.logger.log(`Error @SendEventHelper: Invalid event ${event}`)
    }
    if (eventName) args["EVENT_NAME"] = eventName
    let sendEvent = {
        token,
        arguments: [args]
    }

    return sendEvent
}

export function getUrl(context: IContext, languageResource: LanguageResources, type: String, specific?: string) {
    let sessionData = context.sessionContext.sessionData
    let deviceSize = _.get(sessionData, Constants.STRINGS.DEVICE_SIZE);
    let stage = _.get(sessionData, Constants.STRINGS.STAGE)
    let appName = _.get(sessionData, Constants.STRINGS.APPNAME)
    let prefixUrl = `${process.env.CACHE_BASE_ADDR}${appName}/assets`
    let result = ""
    switch (type) {
        case Constants.URLS.TOPIC_LOGO:
            result = `${prefixUrl}/templates/${specific}`
            break;
        case Constants.URLS.TOPIC_LOGO:
            result = `${prefixUrl}/images/logos/${specific}.png`
            break;
        case Constants.URLS.WELCOME_AUDIO:
            result = `${prefixUrl}/audios/${_random(languageResource.AUDIOS.WELCOME_AUDIO)}`
            break;
        case Constants.URLS.DEFAULT_BG:
            result = `${prefixUrl}/images/bg/${TsString.format(_random(languageResource.IMAGES.DEFAULT_BG_IMAGE) || "", deviceSize)}`
            break;
        case Constants.URLS.START_LOGO:
            result = `${prefixUrl}/images/bg/${TsString.format(_random(languageResource.IMAGES.START_LOGO) || "", deviceSize)}`
            break;
        default:
            context.logger.log(`Error @ type not found: ${type}`)
    }
    return result
}

export function getTimeZoneBasedDate(context: IContext) {
    let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
    let deviceTimeZone = _.get(sessionData, Constants.STRINGS.DEVICE_TIMEZONE) || 'America/Los_Angeles'
    let localDateTime = new Date().toLocaleString("en-US", { timeZone: deviceTimeZone, hour12: false, year: "numeric", month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    let localDate = localDateTime.split(", ")[0]
    let localTime = localDateTime.split(", ")[1]
    return new Date(
        Date.UTC(
            parseInt(localDate.split("/")[2]),
            parseInt(localDate.split("/")[0]) - 1,
            parseInt(localDate.split("/")[1]),
            parseInt(localTime.split(":")[0]),
            parseInt(localTime.split(":")[1]),
            parseInt(localTime.split(":")[2])
        )
    )
}


export function databaseSave(context: IContext, tablename: string, dataToSave: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
        context.dao.save(tablename, dataToSave, (isSuccuess: boolean) => {
            context.logger.log("TABLE_NAME_SAVE:" + tablename + "DATA: " + JSON.stringify(dataToSave))
            resolve(isSuccuess)
        })
    })
}


export function databaseGet(context: IContext, tablename: string, key: any): Promise<any> {
    return new Promise((resolve, reject) => {
        context.dao.getById(tablename, key, (data: any) => {
            resolve(data)
        })
    })
}

export function dateStringUtil(date: Date) {
    return {
        date: date.toISOString().split('T')[0],
        time: date.toISOString().split('T')[1],
        day: date.toDateString().split(" ")[0],
        month: date.toDateString().split(" ")[1],
    }
}
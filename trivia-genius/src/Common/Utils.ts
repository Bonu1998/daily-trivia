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
        case Constants.TAGS.AUDIO:
            value = `<audio src = '${value}'></audio>`
        default:
            context.logger.log(`Error @addTag Invalid tag: ${tag}`)
    }
    return value
}

export function SendEventHelper(context: IContext, token: string, event: string) {
    let intentName
    let userData = context.sessionContext.userData
    let userState = _.get(userData, Constants.STRINGS.USER_STATE) || ""
    let args: any = {}
    switch (event) {
        case "LAUNCH":
            intentName = Constants.SEND_EVENT.ASK_TO_SELECT_STATE
            break
        default:
            context.logger.log(`Error @SendEventHelper: Invalid event ${event}`)
    }
    if (intentName) args["INTENT_NAME"] = intentName
    let sendEvent = {
        token,
        arguments: args
    }

    return sendEvent
}

export function getUrl(context: IContext, languageResource: LanguageResources, type: String) {
    let sessionData = context.sessionContext.sessionData
    let deviceSize = _.get(sessionData, Constants.STRINGS.DEVICE_SIZE);
    let stage = _.get(sessionData, Constants.STRINGS.STAGE)
    let appName = _.get(sessionData, Constants.STRINGS.APPNAME)
    let prefixUrl = `${process.env.CACHE_BASE_ADDR}${appName}/assets`
    let result = ""
    switch (type) {
        case Constants.URLS.WELCOME_AUDIO:
            result = `${prefixUrl}/audios/${_random(languageResource.AUDIOS.WELCOME_AUDIO)}`
            break;
        case Constants.URLS.DEFAULT_BG:
            result = `${prefixUrl}/images/bg/${TsString.format(_random(languageResource.IMAGES.DEFAULT_BG_IMAGE) || "", deviceSize)}`
            break;
        default:
            context.logger.log(`Error @ type not found: ${type}`)
    }
    return result
}

export function getLocaleBasedDateLocal(context: IContext) {
    let locale = _.get(context.sessionContext.sessionData, Constants.STRINGS.LOCALE)
    let tZ = {
        "en-IN": 'Asia/Kolkata',
        "en-US": 'America/Los_Angeles',
        "en-CA": 'America/Winnipeg',
        "en-AU": 'Australia/Sydney',
        "en-GB": 'Europe/London'
    }
    let timeZone = tZ[locale] ? tZ[locale] : tZ['en-US']
    let localDateTime = new Date().toLocaleString("en-US", { timeZone, hour12: false, year: "numeric", month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
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
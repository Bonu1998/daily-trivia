import { CacheClient, Monetization, DynamoDao, Logger, RPC } from '@flairlabs/flair-aws-infra'
import _ from 'lodash'
import { DataHelper } from './DataHelpers'
import { ActionInput, ExecuteActionsRequest, IContext, IRPC, ISessionContext } from '@flairlabs/flair-infra'
import { actionHandler } from './ActionHandler'
import { AppConfig } from './Models/AppConfig'
import { CheckSubscriptionStatus } from './Common/MonetizationHelper'



let bussinessHandler = async (input: ActionInput) => {

    let dataHelper = new DataHelper()
    let resp: any = {}

    try {
        let context = await getContext(input);
        resp = await actionHandler(input, context);
        let promises = []
        promises.push(dataHelper.setUserData(input, context))
        if (!process.env.ENABLE_SESSION_ATTRIBUTE) {
            if (resp.shouldEndSession) promises.push(dataHelper.deleteSessionData(input.SESSION_ID, context))
            else promises.push(dataHelper.setSessionData(input, context))
        } else {
            // resp. set session attributes
            resp["sessionAttributes"] = context.sessionContext.sessionData
        }

        let result: any[] = await Promise.allSettled(promises)
        context.logger.log("SESSION_DATA: " + JSON.stringify(context.sessionContext.sessionData))
        context.logger.log("USER_DATA: " + JSON.stringify(context.sessionContext.userData))
        for (let i = 0; i < result.length; i++) {
            if (result[i].status == "rejected") context.logger.log("ERROR_SAVING_DATA_TO_DB: " + JSON.stringify(result[i].reason || result[i]))
        }
    } catch (e) {
        console.log("Error")
    } finally {
        return resp
    }
}


let getContext = async (input: ActionInput): Promise<IContext> => {
    let context: IContext = {
        cacheClient: CacheClient.getCacheClient(),
        monetization: Monetization.getMonetization(),
        rpc: RPC.getRPC(), // replace this
        dao: DynamoDao.getDynamoDao(),
        sessionContext: {
            userData: {
                USER_ID: input.USER_ID
            }, sessionData: {
                SESSION_ID: input.SESSION_ID
            }
        },
        logger: Logger.getLogger()
    }
    let dataHelper = new DataHelper();
    try {
        let result = await Promise.all([dataHelper.getUserData(input, context), dataHelper.getSessionData(input, context)])
        if (result[0]) context.sessionContext.userData = result[0]
        if (result[1]) context.sessionContext.sessionData = result[1]

    } catch (e) {
        context.logger.log(`Error @getContext: ${JSON.stringify(e)}`)
    } finally {
        return context
    }

}

export { bussinessHandler }
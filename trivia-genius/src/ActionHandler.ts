import { ActionInput, IContext } from "@flairlabs/flair-infra";
import { CheckSubscriptionStatus } from "./Common/Monetization";
import { IntentMap } from "./IntentMap";
import { AppConfig } from "./Models/AppConfig";

let actionHandler = async (input: ActionInput, context: IContext) => {
    context.logger.log("actionHandler invoked")
    let resp: any = {};
    try {
        let appConfig = await AppConfig.getFile(input, context);
        context.logger.log("AppConfig")
        context.logger.log(JSON.stringify(appConfig))
        appConfig.addDetailsInSessionData(input, context);
        context.logger.log("SESSION_DATA AFTER: "+JSON.stringify(context.sessionContext.sessionData))
        await CheckSubscriptionStatus(input, context);
        let action =  IntentMap[input.VERB] ? IntentMap[input.VERB] : IntentMap["SESSION_END"]
        resp = await action.executeAction(input, context, appConfig)
     
    }catch(e){
        context.logger.log(`ERROR IN @actionHandler: ${e} ${JSON.stringify(input)}`)
    } finally{
        return resp
    }
}
export { actionHandler }



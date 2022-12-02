import { ActionInput, IContext } from "@flairlabs/flair-infra";
import { CheckSubscriptionStatus } from "./Common/MonetizationHelper";
import { IntentMap } from "./IntentMap";
import { AppConfig } from "./Models/AppConfig";

let actionHandler = async (input: ActionInput, context: IContext) => {
    context.logger.log("actionHandler invoked")
    context.logger.log("INPUT: "+JSON.stringify(input))
    let resp: any = {};
    try {
        let appConfig = await AppConfig.getFile(context);
        context.logger.log("AppConfig")
        context.logger.log(JSON.stringify(appConfig))
        appConfig.addDetailsInSessionData(input, context);
        context.logger.log("SESSION_DATA: "+JSON.stringify(context.sessionContext.sessionData))
        context.logger.log("USER_DATA: "+JSON.stringify(context.sessionContext.userData))
        await CheckSubscriptionStatus(input, context);
        let action =  IntentMap[input.VERB] ? IntentMap[input.VERB] : IntentMap["SESSION_END"]
        resp = await action.executeAction(input, context)
    }catch(e){
        context.logger.log(`ERROR IN @actionHandler: ${e} ${JSON.stringify(input)}`)
    } finally{
        return resp
    }
}
export { actionHandler }



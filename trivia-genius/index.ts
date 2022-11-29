import { bussinessHandler } from "./src/BussinessHandler";
import { invokeLambda } from "./src/WrapperUtils";
let handler = async (event: any) => {
    console.log("event:"+JSON.stringify(event))
    if (event.pathParameters.source == 'alexa') {
        try {
            return await alexaBaseHandler(event, false)
        } catch (e) {
            return {}
        }
    } else {
        bussinessHandler(event)
    }
}
// aws-infra
let alexaBaseHandler = async (event: any, isArn?: boolean): Promise<any> => {
    let resp = {
        version: "1.0",
        response: {
            shouldEndSession: true
        }
    }
    try {
        let authResponse = {}
        var authParams: any = {
            FunctionName: process.env.AUTHENTICATION_LAMBDA,
            Payload: JSON.stringify(event || "{}")
        }
        var preParams: any = {
            FunctionName: process.env.PRE_PROCESSING_LAMBDA,
        }
        
        if (!isArn) {
            authResponse = await invokeLambda(authParams)
            console.log("authResponse");
            console.log(authResponse); 
            let payload = JSON.parse(authResponse["Payload"]|| "{}").body || {}
            preParams["Payload"] = JSON.stringify(payload || "{}")
        } else {
            // add path params
            preParams["Payload"] = JSON.stringify(event || "{}")
        }
        console.log("PreParams: "+JSON.stringify(preParams));
        
        let preResponse = await invokeLambda(preParams);
        console.log("PreResponse: "+JSON.stringify(preResponse));
        let input = JSON.parse(preResponse["Payload"] || "{}").payload || {}
        let businessResponse: any = await bussinessHandler(input)
        console.log("BusinessResponse: "+JSON.stringify(businessResponse));
        
        var postParams: any = {
            FunctionName: process.env.POST_PROCESSING_LAMBDA, 
            Payload: JSON.stringify(businessResponse || "{}")
        }
        console.log("PostParams: "+JSON.stringify(postParams));
        let postResp = await invokeLambda(postParams)
        console.log("postResp")
        console.log(JSON.stringify(postResp))
        resp = JSON.parse(postResp["Payload"] || "{}").payload || resp
    } catch (e) {
        console.log(`Error @alexaBasehandler: ${e}`);
    }
    finally {
        console.log("RESPONSE:"+JSON.stringify(resp))
        return resp
    }
}
export {handler};
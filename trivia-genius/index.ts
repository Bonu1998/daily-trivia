import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { bussinessHandler } from "./src/BussinessHandler";
import { invokeLambda } from "./src/WrapperUtils";

const handler = async (event: any, context: Context): Promise<any> => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    let resp = {
        statusCode: 500,
        body: JSON.stringify({}),
    }
    if (event.pathParameters.source == 'alexa') {
        try {
            resp.body = JSON.stringify(await alexaBaseHandler(event, false))
            resp.statusCode = 200
            console.log("t------")
            console.log(JSON.stringify(resp))
        } catch (e) {
            console.log("ERROR @handler: " + JSON.stringify(e))
        }
    } else {
        resp = {
            statusCode: 200,
            body: JSON.stringify(await bussinessHandler(event)),
        };
    }
    return resp
};

// async function handler(event: any, context: any, callback: (resp: any) => void) {
//     console.log("event:" + JSON.stringify(event))
//     if (event.pathParameters.source == 'alexa') {
//         try {
//             let t = await alexaBaseHandler(event, true)
//             console.log("t------")
//             console.log(JSON.stringify(t))
//             callback(t)
//         } catch (e) {
//             console.log("ERROR @handler: " + JSON.stringify(e))
//             callback({})
//         }
//     } else {
//         callback(await bussinessHandler(event))
//     }
// }
// aws-infra
let alexaBaseHandler = async (event: any, isArn?: boolean): Promise<any> => {
    let resp = {
        version: "1.0",
        response: {
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
            let payload = JSON.parse(authResponse["Payload"] || "{}").body || {}
            preParams["Payload"] = JSON.stringify(payload || "{}")
        } else {
            // add path params
            preParams["Payload"] = JSON.stringify(event || "{}")
        }
        console.log("PreParams: " + JSON.stringify(preParams));

        let preResponse = await invokeLambda(preParams);
        console.log("PreResponse: " + JSON.stringify(preResponse));
        let input = JSON.parse(preResponse["Payload"] || "{}").payload || {}
        let businessResponse: any = await bussinessHandler(input)
        console.log("BusinessResponse: " + JSON.stringify(businessResponse));

        var postParams: any = {
            FunctionName: process.env.POST_PROCESSING_LAMBDA,
            Payload: JSON.stringify(businessResponse || "{}")
        }
        console.log("PostParams: " + JSON.stringify(postParams));
        let postResp = await invokeLambda(postParams)
        console.log("postResp")
        console.log(JSON.stringify(postResp))
        if (JSON.parse(postResp["Payload"] || "{}").payload) resp = JSON.parse(postResp["Payload"] || "{}").payload
    } catch (e) {
        console.log(`Error @alexaBasehandler: ${e}`);
    }
    finally {
        console.log("RESPONSE:" + JSON.stringify(resp))
        return resp
    }
}
export { handler };
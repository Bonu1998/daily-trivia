import aws from "aws-sdk";

// aws-infra i

let invokeLambda = (params: any): Promise<any> => {
    let lambda = new aws.Lambda({
        region: process.env.LAMBDA_REGION || "us-east-1"
    });
    return new Promise((resolve, reject) => {
        lambda.invoke(params, (err: any, data: any) => {
            if (err) {
                console.log("ERROR: Authentication", JSON.stringify(err));
                reject(err);
            }
            else {
                if (data) {
                    if (!data.Payload) reject("payload empty")
                    else if (!data.StatusCode) reject("statusCode Not Found")
                    else {
                        var _payload = JSON.parse(data.Payload || "{}");
                        if (_payload.statusCode == 200) {
                            resolve(data)
                        } else {
                            reject("statusCode not 200 " + _payload.statusCode);
                        }
                    }
                } else {
                    reject("response empty")
                }
            }
        })
    })
}

export { invokeLambda }
import { ActionInput, IContext } from "@flairlabs/flair-infra"
import _ from "lodash"
import { resolve } from "path"
import { Constants } from "../Constants"
import ISubscriptionDetail from "../Interfaces/ISubscriptionDetail"



export async function CheckSubscriptionStatus(input: ActionInput, context: IContext): Promise<void> {
    context.logger.log("CheckSubscriptionStatus Invoked")
    let sessionData = _.get(context, Constants.STRINGS.SESSION_DATA)
    let _userData = _.get(context, Constants.STRINGS.USER_DATA)
    let isMonetizationEnabled = _.get(sessionData, Constants.STRINGS.IS_MONETIZATION_ENABLED)
    if (!isMonetizationEnabled) {
        _.set(_userData, Constants.STRINGS.SUBSCRIPTION_DETAILS, [])
        return
    } else {
        let userData = _.get(context, Constants.STRINGS.USER_DATA)
        let subscriptionDetails: ISubscriptionDetail[] = _.get(userData, Constants.STRINGS.SUBSCRIPTION_DETAILS) || []
        return new Promise((resolve, reject) => {
            context.monetization.getProductList(input.ARGS["APP_INFORMATION"].API_ENDPOINT, input.ARGS["APP_INFORMATION"].API_ACCESS_TOKEN, input.LOCALE, (err: any, inSkillProduct: any) => {
                if (err) context.logger.log(`Error @CheckSubscriptionStatus: ${JSON.stringify(err)}`)
                inSkillProduct = inSkillProduct || []
                inSkillProduct.forEach((ele: any) => {
                    let subDetailItemIndex = _.findIndex(subscriptionDetails, (e) => { return e && _.eq(e.refrenceName, ele.refrenceName) })
                    let subDetailItem = subscriptionDetails[subDetailItemIndex]
                    if (subDetailItem) {
                        if (subDetailItem.endDate && ele.entitled == "ENTITLED") {
                            subscriptionDetails[subDetailItemIndex].subscriptionStatus = true
                            subscriptionDetails[subDetailItemIndex].entitledStatus = true
                            let endDate = new Date(subDetailItem.endDate);
                            let todaysDate = new Date()
                            if (_.gt(endDate, todaysDate)) {
                                // subscriptionDetails[subDetailItemIndex].refreshIndex : config
                                subscriptionDetails[subDetailItemIndex].startDate = endDate; // wrap enddate in date format
                                endDate.setMonth(endDate.getMonth() + (subscriptionDetails[subDetailItemIndex].refreshIndex || 1));
                                subscriptionDetails[subDetailItemIndex].endDate = endDate; // wrap enddate in date format
                            }
                        }
                    } else {
                        subscriptionDetails.push({
                            refrenceName: ele.refrenceName,
                            type: ele.refrenceName,
                            subscriptionStatus: false,
                            entitledStatus: false,
                            startDate: null,
                            endDate: null,
                            boughtDate: null,
                            productId: ele.productId
                            // refreshIndex : config
                        })
                    }
                })
                _.set(userData, Constants.STRINGS.SUBSCRIPTION_DETAILS, subscriptionDetails)
                resolve()
            })
        })
    }
}
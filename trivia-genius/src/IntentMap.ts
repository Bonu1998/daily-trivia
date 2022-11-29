import LaunchAction from "./Actions/LaunchAction";

export let IntentMap:any = {
    LAUNCH: new LaunchAction(),
    SESSION_END: new LaunchAction(),
}
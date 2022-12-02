import AnswerAction from "./Actions/AnswerAction";
import AskQuestionAction from "./Actions/AskQuestionAction";
import LaunchAction from "./Actions/LaunchAction";
import UserEventAction from "./Actions/UserEventAction";

export let IntentMap: any = {
    LAUNCH: new LaunchAction(),
    SESSION_END: new LaunchAction(),
    ANSWER_INTENT: new AnswerAction(),
    USER_EVENT: new UserEventAction(),
    ASK_QUESTION: new AskQuestionAction(),
}
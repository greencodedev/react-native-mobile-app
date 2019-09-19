import * as Constants from '../constants';

export const isUpdateGroupEvent = (eventType) => {
    switch (eventType) {
        case Constants.EVENT_BONUS_SPARK_REDUCED:
            return true;
        case Constants.EVENT_CHAT_MESSAGE:
            return true;
        case Constants.EVENT_TASK_COMPLETE:
            return true;
        case Constants.EVENT_TEAM_JOIN:
            return true;
        case Constants.EVENT_BRAINDUMP_COMPLETE:
            return true;
        default:
            return false;
    }
};
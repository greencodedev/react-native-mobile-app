import _ from 'lodash';

export const checkUnlockAllParties = (userTaskGroup) => {
    // Retrieve all tasks in the userTaskGroup
    // Retrieve all users in the userTaskGroup (in the _team object)
    // Retrieve the current story in the userTaskGroup
    // Check that all users have completed at least 1 task in the current story
    // If true - allow to sequence to the next story
    // If False - display a message to inform the logged in user that there’s a need to ensure all members need to complete their task. Allow a button to send a reminder
    console.log(userTaskGroup);
    const tasks = userTaskGroup._tasks;
    const users = userTaskGroup._team.emails.map(e => e.userDetails);
    const currentStory = userTaskGroup._typeObject;

    const pendingUsers = _.filter(users, u => {
        return !_.some(tasks, t => {
            return t.userID === u._id && t.metaData.subject.skill._id === currentStory._id && t.status === "complete";
        });
    });
    console.log('group users-> ',users);
    console.log('pending users-> ',pendingUsers);
    return pendingUsers;
}

export const checkUnlockNextSequence = (userTaskGroup,Stories) => {
    // Retrieve current story
    // Retrieve the current sequence number
    // Retrieve the next story
    // Check that the requirement is Date and requirementValue is before today
    // If true - allow to sequence to the next story
    // If false - increment userTaskGroup.taskCounter by one
    console.log('all stories ',Stories);
    const story = _.find(Stories, s => s._id === userTaskGroup._typeObject._id)
    const nextStory = _.find(Stories, s => s.groupName === story.groupName && s.sequence === story.sequence + 1)
    console.log('stroy-> ',story);
    console.log('next-> ',nextStory);
    if (nextStory && nextStory.requirement) {
        switch (nextStory.requirement) {
            case 'Achievement':
                break;
            case 'XP':
                break;
            case 'Date':
                if (nextStory.requirementValue && moment(nextStory.requirementValue).isBefore(moment())) {
                    return nextStory;
                }
            default:
                break;
        }
        return null;
    } else {
        console.log('Completed');
    }

}
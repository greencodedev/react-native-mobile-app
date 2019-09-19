import Company from "./schema/company";

const Realm = require('realm');
import Story, {STORY_SCHEMA} from './schema/story';
import Question, {QUESTION_SCHEMA} from './schema/question';
import Content, {CONTENT_SCHEMA} from './schema/content';
import Share, {SHARE_SCHEMA} from './schema/share';
import TaskGroup, {TASK_GROUP_SCHEMA} from './schema/taskGroup';
import Team, {TEAM_SCHEMA} from './schema/team';
import UserProfile, {USER_PROFILE_SCHEMA} from './schema/userProfile';
import UserTaskGroup, {USER_TASK_GROUP_SCHEMA} from './schema/userTaskGroup';
import Profile, {PROFILE_SCHEMA} from './schema/profile';
import Objective from "./schema/objective";

const databaseOptions = {
    path: 'soqqle.realm',
    schema: [Company, Story, Question, Content, Share, TaskGroup, Team, Profile, UserProfile, UserTaskGroup, Objective],
    deleteRealmIfMigrationNeeded: true,
    schemaVersion: 1
};

const realm = new Realm(databaseOptions);

export const saveWorld = (world, user) => {
    let groups;
    let questions;
    let stories;

    if (world.stories && world.stories.lstStories) {
        stories = world.stories.lstStories;
    }
    else {
        stories = [];
    }
    if (world.groups && world.groups.recommendGroups) {
        groups = world.groups.recommendGroups;
    }
    else {
        groups = [];
    }
    if (world.questions && world.questions.listQuestion) {
        questions = world.questions.listQuestion;
    }
    else {
        questions = [];
    }

    realm.write(() => {
        stories.forEach((story) => {
            try {
                realm.create(STORY_SCHEMA, story, Realm.UpdateMode.All)
            } catch (e) {
                console.log(e);
            }
        });
        questions.forEach((question) => {
            try {
                realm.create(QUESTION_SCHEMA, question, Realm.UpdateMode.All)
            } catch (e) {
                console.log(e);
            }
        });
        groups.forEach((group) => {
            try {
                realm.create(USER_TASK_GROUP_SCHEMA, group, Realm.UpdateMode.All)
            } catch (e) {
                console.log(e);
            }
        });
        try {
            realm.create(USER_PROFILE_SCHEMA, user, Realm.UpdateMode.Never)
        } catch (e) {
            console.log(e);
        }
    })
};

export const getStories = () => {
    return realm.objects(STORY_SCHEMA);
};

export const getQuestions = () => {
    return realm.objects(QUESTION_SCHEMA)
};

export const getMyProfile = () => {
    return realm.objects(USER_PROFILE_SCHEMA)
};
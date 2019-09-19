import React, {Component} from 'react';
import SocketIOClient from "socket.io-client";
import * as axios from 'axios';
import {CHAT_SOCKET_URL} from "../endpoints";
import {API_BASE_URL} from '../config';
import { isUpdateGroupEvent } from "../utils/EventUtil";
import {getGroupUserDetails} from "../utils/common";

const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 25000,
    headers: {'Content-type': 'application/json'}
});

export default class BaseComponent extends Component{

    constructor(props) {
        super(props);
        this.onReceivedMessage = this.onReceivedMessage.bind(this);
    }

    componentWillReceiveProps(nextProps, nextContext) {
        console.log(nextProps);
    }


    componentDidMount(): void {
        console.log('BaseComponent componentDidMount() called');

        let user = this.props.user;
        let query = `userID=${user._id}&username=${user._id}&firstName=${user.profile.firstName ? user.profile.firstName : ''}&lastName=${user.profile.lastName ? user.profile.lastName : ''}&userType=test`;
        this.socket = SocketIOClient(CHAT_SOCKET_URL, {query: query, transports: ['websocket']});
        this.socket.on('server:message', this.onReceivedMessage);
//        this._fetchMessages(user.email);
    }

    _fetchMessages(email) {
        const data = {
            email: email
        };

        this.props.messageActions.getMessages(data); //messageActions is undefind because its not bound with BaseComponent
    }

    onReceivedMessage(message) {
        if (isUpdateGroupEvent(message.type))
        { 
            this.refreshUserTask()
        };
    }

    refreshUserTask = () => {
         // fetch latest userTaskGroups
        // refresh the redux state
        instance.get(`${API_BASE_URL}/userTaskGroupWithMessage?user_email=${this.props.user.profile.email}`)
            .then((response) => {
                if (response && response.data && response.data.latestUserTaskGroups) {
                    // populate _team.emails with userDetails
                    // with getGroupUserDetails() from utils/common.js
                    let _data = getGroupUserDetails(response.data)
                    this.setState({
                        userTaskGroups: _data.latestUserTaskGroups
                    })
                    // refresh redux state
                    this.props.userActions.getUserTaskGroupsCompleted({
                        ...this.props.taskGroups,
                        taskGroups: [..._data.latestUserTaskGroups]
                    });
                    let latestUserTaskGroups = [..._data.latestUserTaskGroups];
                    let id = this.props.navigation.state.params.task_group_id;
                    let taskGroup = id && latestUserTaskGroups.filter(t => t._id === id)[0] || {};
                    // update the component state
                    // refreshed state will reflect on UI
                    this.setState((prevState, props) => {
                        return {
                            ...prevState,
                            taskGroup: {
                                ...prevState.taskGroup,
                                ...taskGroup
                            }
                        }
                    });
                }
            })
            // .then((responseJson) => console.log(JSON.stringify(responseJson, undefined, 2)))
            .catch((error) => console.log(error))
        }

    //save message in redux.
    _storeMessages(messages) {

    }
}
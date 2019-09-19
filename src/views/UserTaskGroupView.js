import React, { Component } from "react";
import { FlatList, SafeAreaView, View } from "react-native";
import { Client, Report } from "bugsnag-react-native";
import { BUGSNAG_KEY } from "../config";
const bugsnag = new Client(BUGSNAG_KEY);

import Header from "../components/Header";
import { PAGE_SIZE } from "../constants";
import TaskCard from "../components/TaskCard";
import styles from "../stylesheets/userTaskGroupStyles";
import PincodePopup from "../components/PincodePopup";
import {
  MAKE_GROUP_PUBLIC_API,
  MAKE_GROUP_PRIVATE_API,
  JOIN_BY_SECRET_CODE
} from "../endpoints"; 
import * as axios from "axios";
import { API_BASE_URL } from "../config";

let pageNum = 0;
let totalCount = 0;
let pageSize = PAGE_SIZE;
let userEmail = null;

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: { "Content-type": "application/json" }
});

// TODO: Update this class to new Lifecycle methods
export default class UserTaskGroupView extends Component {
  _renderItem = ({ item, index }) => {
    const data = item._typeObject;
    const teamLength = item._team.emails.length;
    const taskGroupId = item._id;
    const updatedAt = item.updatedAt;
    const createdAt = item.createdAt;
    const teams = item._team._id; // Stores selected team id
    let indexes = index; // Stores selected team index
    let array = this.state.userTasks; // Stores array of user tasks
    let refreshAfterDelete = this.handleRefresh; // Binding Refresh list function
    if (!data) return null;
    return (
      <TaskCard
        {...this.props}
        array={array}
        refreshAfterDelete={this.userLeftTaskGroup.bind(this)}
        index={indexes}
        teams={teams}
        task={data} //although this is named task, this is actually a story (refer to line 34, _typeObject - which is a story type
        teamLength={teamLength}
        taskGroupId={taskGroupId}
        currentGroupId={this.state.currentGroupId}
        team={item._team.emails || []}
        updatedDateTime={updatedAt}
        createdDateTime={createdAt}
        processing={this.state.processing}
        isPrivate={item.isPrivate}
        onChangeGroupType={() =>
          this.onChangeGroupType(item._id, item.isPrivate)
        }
        secretCode={item.secretCode}
        onChangeGroupKey={() => this.onChangeGroupKey(item._id)}
      />
    );
  };

  constructor(props) {
    super(props);
    this.state = {
      userTasks: [],
      initialLoading: true,
      loading: false,
      totalCount: null,
      refreshing: false,
      showKeyInput: false,
      showCreateKey: false,
      showChangeKey: false,
      groupId: false,
      processing: false,
      currentGroupId: null
    };
    userEmail =
      (this.props.user &&
        this.props.user.profile &&
        this.props.user.profile.email) ||
      null;
  }

  componentWillMount() {
    const response = this.props.taskGroups;
    const params = this.props.navigation.state.params;
    const isReset = (params && params.reset) || false;
    // if (
    //   response.taskGroups &&
    //   Object.keys(response.taskGroups).length &&
    //   !isReset
    // ) {
    //   pageNum = response.page;
    //   totalCount = response.count;
    //   this.setState({ userTasks: response.taskGroups });
    // } else {
    //   if (userEmail) {
    //     this.props.userActions.getUserTaskGroupsRequest({
    //       page: 1,
    //       load: true,
    //       user_email: userEmail
    //     });
    //   }
    // }
  }
  componentDidMount() {
  
    

    this.props.navigation.addListener("didFocus", () => {
      if (userEmail) {
        this.props.userActions.getUserTaskGroupsRequest({
          page: 1,
          load: true,
          user_email: userEmail
        });
      }
  });

    // this.setUserTaskGroups()
  }

  setUserTaskGroups() {
    const {taskGroups =[] } = this.props;
    this.setState({
      userTasks: taskGroups,
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.userTaskGroupsSuccess != this.props.userTaskGroupsSuccess) {
      let response = nextProps.taskGroups;
      if (Object.keys(response).length && nextProps.userTaskGroupsSuccess) {
        totalCount = response.count;
        pageNum = response.page;
        this.setState({
          userTasks: response.taskGroups,
          loading: false,
          refreshing: false
        });
      }
      if (
        !nextProps.userTaskGroupsSuccess &&
        nextProps.error &&
        Object.keys(nextProps.error).length
      ) {
        this.setState({
          loading: false,
          refreshing: false
        });
      }
    }
  }

  handleBackAction() {
    this.props.navigation.navigate({ routeName: "Story" });
  }

  handleRefresh() {
    if (userEmail) {
      this.setState({ refreshing: true });
      this.props.userActions.getUserTaskGroupsRequest({
        page: 1,
        user_email: userEmail
      });
    }
  }

  userLeftTaskGroup = (teamId) => {
    console.log('leaving ',this.props.taskGroups);
    let userTaskGroups = [...this.props.taskGroups.taskGroups].filter(g => g._team._id != teamId)
    console.log('existing',userTaskGroups);
    this.props.userActions.getUserTaskGroupsCompleted({
      ...this.props.taskGroups,
      taskGroups: userTaskGroups
    })
    this.setState({
      userTasks: userTaskGroups
    })
  }

  handleScroll() {
    if (pageNum * pageSize < totalCount && !this.state.loading && userEmail) {
      this.setState({ loading: true });
      this.props.userActions.getUserTaskGroupsRequest({
        page: pageNum + 1,
        previousData: this.state.userTasks,
        user_email: userEmail
      });
    }
  }

  // Join by secret code. This is to allow users to join their own favourite groups or friends using a special key ---> geeta
  onJoin = ({ code }) => {
    if (!!code) {
      // JOIN Private Team API Call
      let endpoint = JOIN_BY_SECRET_CODE.replace("{s_code}", code).replace(
        "{email}",
        this.props.user.profile.email
      );
      fetch(endpoint, {
        method: "GET"
      })
        .then(res => res.json())
        .then(res => {
          alert(res.response);
          this.handleRefresh()
        })
        .catch(e => {
          alert(e);
        });
    } else {
      this.setState({ showKeyInput: true });
    }
  };

  makeGroupPublicAPICall = groupId => {
    let { userTasks = [] } = this.state;
    instance
      .put(MAKE_GROUP_PUBLIC_API.replace("{}", groupId))
      .then(response => {
        userTasks = userTasks.map(task => {
          if (task._id === groupId) {
            delete task.secret_code;
            task.isPrivate = false;
          }
          return task;
        });
        this.props.userActions.updateUserTaskGroup(userTasks);
        console.log('usertask public call => ')
        console.log(JSON.stringify(userTasks, undefined, 2))
        this.setState({
          processing: false,
          userTasks,
          currentGroupId: null
        });
      })
      .catch(error => {
        bugsnag.notify(error);
        this.setState({
          processing: false,
          currentGroupId: null
        });
      });
  };

  makeGroupPrivateAPICall = (groupId, secretCode) => {
    let { userTasks = [] } = this.state;
    instance
      .put(MAKE_GROUP_PRIVATE_API.replace("{}", groupId), { secretCode })
      .then(response => {
        userTasks = userTasks.map(task => {
          if (task._id === groupId) {
            task.secretCode = response.data.code;
            task.isPrivate = true;
          }
          return task;
        });
        this.props.userActions.updateUserTaskGroup(userTasks);
        console.log('usertask private call => ')
        console.log(JSON.stringify(userTasks, undefined, 2))
        this.setState({
          processing: false,
          userTasks,
          currentGroupId: null
        });
      })
      .catch(error => {
        bugsnag.notify(error);
        this.setState({
          processing: false,
          currentGroupId: null
        });
      });
  };

  onChangeGroupType = (groupId, isPrivate) => {
    if (isPrivate) {
      this.setState({
        processing: true,
        currentGroupId: groupId
      });
      this.makeGroupPublicAPICall(groupId);
    } else {
      this.setState({
        processing: true,
        currentGroupId: groupId
      });
      this.makeGroupPrivateAPICall(groupId);
    }
  };

  onChangeGroupKey = groupId => {
    this.setState({ showChangeKey: true, groupId });
  };

  onGroupKeyManipulate = ({ code }) => {
    const { showChangeKey, showCreateKey, groupId } = this.state;
    if (!code || code.length < 5) {
      console.error("invalid key provided");
      return;
    }
    if ((showChangeKey || showCreateKey) && groupId) {
      this.setState({
        showCreateKey: false,
        showChangeKey: false,
        groupId: null,
        processing: true,
        currentGroupId: groupId
      });
      this.makeGroupPrivateAPICall(groupId, code);
    }
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Groups"
          navigation={this.props.navigation}
          rightText={"Join"}
          onRight={this.onJoin}
        />
        <View style={{ flex: 1, marginTop: 5 }}>
          <FlatList
            data={this.state.userTasks}
            keyExtractor={item => item._id}
            renderItem={this._renderItem}
            refreshing={this.state.refreshing}
            onRefresh={() => this.handleRefresh()}
            onScrollEndDrag={() => this.handleScroll()}
          />
        </View>
        <PincodePopup
          modalVisible={this.state.showKeyInput}
          onRequestClose={() => this.setState({ showKeyInput: false })}
          onSubmit={this.onJoin}
          emptyErr={"Please enter key to join group"}
        />
        {/*<PincodePopup
          modalVisible={this.state.showCreateKey}
          onRequestClose={() => this.setState({ showCreateKey: false })}
          onSubmit={this.onGroupKeyManipulate}
          emptyErr={"Please enter key to join group"}
        />*/}
        <PincodePopup
          modalVisible={this.state.showChangeKey}
          onRequestClose={() => this.setState({ showChangeKey: false })}
          onSubmit={this.onGroupKeyManipulate}
          emptyErr={"Please enter key to join group"}
        />
      </SafeAreaView>
    );
  }
}

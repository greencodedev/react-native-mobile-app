/**
 * @Updated taskViews
 **/

import React, { Component } from 'react';
import {
  View,
  ImageBackground,
  FlatList,
  Dimensions,
  StyleSheet,
  Platform,
  TouchableOpacity,
  TextInput,
  ScrollView
} from 'react-native';

import * as axios from 'axios';
import { Button, Text } from 'native-base';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp
} from 'react-native-responsive-screen';
import _ from 'lodash';
import { API_BASE_URL } from '../config';
import {
  SAVE_ANSWERS_PATH_API,
  USER_SPARK_LIST_PATH_API,
  CHAT_SOCKET_URL,
  TASK_GROUP_SEQUENCE_API_PATH,
  TASK_GROUP_SET_TASK_COUNTER_API_PATH,
  TASK_GROUP_SET_SEQUENCE_API_PATH
} from '../endpoints';
import Header from '../components/Header';
import QuestionCard from '../components/QuestionCard';
import styles from '../stylesheets/taskViewStyles';
import MixPanel from 'react-native-mixpanel';
import Modal from 'react-native-modal';
import IconIonicon from 'react-native-vector-icons/Ionicons';

import { Client } from 'bugsnag-react-native';
import { BUGSNAG_KEY } from '../config';
import { getGroupUserDetails } from '../utils/common';
import { ILLUMINATE_STRINGS } from '../utils/strings';

const bugsnag = new Client(BUGSNAG_KEY);

const { width } = Dimensions.get('window'); //full width

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: { 'Content-type': 'application/json' }
});

export default class IlluminateView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      task: this.props.navigation.state.params.group,
      questionContentArray: this.getRandomQuestions(
        this.props.navigation.state.params.group._typeObject
      ),
      currentQuestionIndex: 0,
      dummyText: 'Select and Answer',
      isVisible: true,
      selectedBottomBtnIndex: 3,
      strAnswer: ''
    };
    this.onFooterButtonClick = this.onFooterButtonClick.bind(this);
  }

  componentDidMount() {
    console.log('QuestionArray:', this.state.questionContentArray);
  }

  getRandomQuestions(taskDetail) {
    const noOfquestions = parseInt(taskDetail.objectiveValue);
    const requiredSkill = taskDetail.skill;
    const listOfQuestion = this.props.world.questions.listQuestion;

    // Fitering of questions as per required skill.
    const listOfMatchedSkilledQuestions = listOfQuestion
      .filter(function(item) {
        return item.roadmapSkill == requiredSkill;
      })
      .map(function(item) {
        return item;
      });

    return this.shuffleArray(listOfMatchedSkilledQuestions, noOfquestions);
  }

  /*Shuffling for Questions and pick the requied number of question
    
     params : 
               array - Total number of questions for shuffle 
                pickCount -  Required nubmer of questions 
      Return  :
        [
            {
                content1: "What is the difference between problem solving and critical thinking skills?",
                content2: undefined
            }
        ]
    ]
     
     */
  shuffleArray(array, pickCount) {
    let i = array.length - 1;
    for (; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }

    var contentArray = new Array();

    for (i = 0; i < pickCount; i++) {
      question = array[i];
      const content = {
        content1: question.question,
        content2: question.preLoad,
        contnet3: null, // For Answers
        content4: null
      };
      contentArray.push(content);
    }
    return contentArray;
  }

  /*  */
  onFooterButtonClick(buttonText) {
    const { questionContentArray, currentQuestionIndex } = this.state;
    if (currentQuestionIndex >= questionContentArray.length - 1) {
      alert('You have answered, All questions');
      return;
    }

    let selectedIndx = 3;
    if (buttonText == ILLUMINATE_STRINGS.btnTextDontCare) {
      selectedIndx = 1;
    } else if (buttonText == ILLUMINATE_STRINGS.btnTextNutral) {
      selectedIndx = 2;
    }

    const questionOne = questionContentArray[currentQuestionIndex];

    questionOne.content4 = buttonText;
    questionContentArray[currentQuestionIndex] = questionOne;
    this.setState({
      questionContentArray: questionContentArray,
      currentQuestionIndex: currentQuestionIndex + 1,
      selectedBottomBtnIndex: selectedIndx
    });
  }

  saveAnswer = () => {
    this.setState({
      isVisible: true
    });
  };
  cancelThisCustomAnswer = () => {
    this.setState({
      isVisible: true
    });
  };

  onTextInputFocus = () => {
    this.setState({
      isVisible: false
    });
  };

  renderTextInput = () => {
    return (
      <View>
        <View style={taskStyles.customInputContainer}>
          <View>
            <TextInput
              style={taskStyles.inputStyle}
              multiline
              placeholder={'Enter your answer here.'}
              placeholderTextColor={'white'}
            />
          </View>
        </View>
        <View style={taskStyles.btnContainer}>
          <TouchableOpacity
            style={taskStyles.borderLessButton}
            onPress={this.saveAnswer}
          >
            <Text style={taskStyles.btnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={taskStyles.borderedButton}
            onPress={this.cancelThisCustomAnswer}
          >
            <Text style={taskStyles.btnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  renderItem = ({ item }) => {
    const questionContent = item;
    if (
      typeof questionContent == 'string' ||
      typeof questionContent == 'undefined'
    ) {
      alert(questionContent); // Network Busy
      return;
    }

    return (
      <TouchableOpacity style={taskStyles.dataRow}>
        <View style={taskStyles.roundColor} />
        <Text style={taskStyles.textAnsColor}>{questionContent.content}</Text>
      </TouchableOpacity>
    );
  };

  onGoBack = () => {
    this.props.navigation.navigate({ routeName: 'Chat' });
  };

  render() {
    const {
      dummyText,
      isVisible,
      questionContentArray,
      currentQuestionIndex
    } = this.state;
    const questionOne = questionContentArray[currentQuestionIndex];
    if (questionOne.content2 == null || questionOne.content2.length <= 0) {
      // Show Alert here , No answers avaiable
      alert(ILLUMINATE_STRINGS.eMNoAnswersNotAvailable);
    }

    return (
      <View style={taskStyles.taskContainer}>
        {/* Part 1 : Questions */}
        <ImageBackground
          source={require('src/images/backpurple.png')}
          style={taskStyles.questionContainer}
        >
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              height: 30,
              marginTop: 20
            }}
          >
            <TouchableOpacity onPress={this.onGoBack}>
              <IconIonicon
                style={{ marginLeft: 20 }}
                name={'ios-arrow-back'}
                size={30}
                color={'white'}
              />
            </TouchableOpacity>
            <Text style={taskStyles.titleText}>{dummyText}</Text>
          </View>
          <Text style={taskStyles.questionText}>{questionOne.content1}</Text>
        </ImageBackground>

        {/* Part 2 , Answers  */}
        <View style={taskStyles.ansContainer}>
          {isVisible && (
            <View
              style={{
                flex: 1
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  height: 56,
                  alignItems: 'center'
                }}
              >
                <View style={[taskStyles.roundColor, { marginLeft: 26 }]} />
                {/* <View style={{ paddingLeft: 10 }}> */}
                <View style={taskStyles.ansInputTextContainer}>
                  <TextInput
                    style={taskStyles.textInput}
                    onFocus={this.onTextInputFocus}
                    placeholder={ILLUMINATE_STRINGS.placeHolderEnterAnswer}
                    placeholderTextColor={'rgba(255,255,255,0.7)'}
                  />
                </View>
              </TouchableOpacity>

              <FlatList
                renderItem={this.renderItem}
                data={questionOne.content2}
                initialNumToRender={100}
                keyExtractor={(item, index) => {
                  return item + index;
                }}
              />
            </View>
          )}

          {!isVisible && this.renderTextInput()}
        </View>

        {/* Part 3, Footer  */}
        {isVisible && (
          <View style={taskStyles.footerContainer}>
            <Button
              bordered
              style={[
                taskStyles.bottomBtn,
                this.state.selectedBottomBtnIndex === 1
                  ? taskStyles.bottomBtnSelected
                  : taskStyles.bottomBtnUnSelected
              ]}
              onPress={() => {
                this.onFooterButtonClick(ILLUMINATE_STRINGS.btnTextDontCare);
              }}
            >
              <Text uppercase={false} style={taskStyles.bottomBtnText}>
                {ILLUMINATE_STRINGS.btnTextDontCare}
              </Text>
            </Button>
            <Button
              bordered
              style={[
                taskStyles.bottomBtn,
                this.state.selectedBottomBtnIndex === 2
                  ? taskStyles.bottomBtnSelected
                  : taskStyles.bottomBtnUnSelected
              ]}
              onPress={() => {
                this.onFooterButtonClick(ILLUMINATE_STRINGS.btnTextNutral);
              }}
            >
              <Text uppercase={false} style={taskStyles.bottomBtnText}>
                {ILLUMINATE_STRINGS.btnTextNutral}
              </Text>
            </Button>
            <Button
              bordered
              style={[
                taskStyles.bottomBtn,
                this.state.selectedBottomBtnIndex === 3
                  ? taskStyles.bottomBtnSelected
                  : taskStyles.bottomBtnUnSelected
              ]}
              onPress={() => {
                this.onFooterButtonClick(ILLUMINATE_STRINGS.btnTextLikeThis);
              }}
            >
              <Text uppercase={false} style={taskStyles.bottomBtnText}>
                {ILLUMINATE_STRINGS.btnTextLikeThis}
              </Text>
            </Button>
          </View>
        )}
      </View>
    );
  }
}

const taskStyles = StyleSheet.create({
  taskContainer: {
    flex: 1,
    backgroundColor: 'rgba(68,0,104,1.0)'
  },
  questionContainer: {
    flex: 3
  },
  roundColor: {
    height: 20,
    width: 20,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#FF4763'
  },
  ansContainer: {
    flex: 6,
    backgroundColor: 'rgba(68,0,104,1.0)'
  },
  titleText: {
    flex: 1,
    color: 'white',
    textAlign: 'center',
    alignSelf: 'center',
    paddingRight: 10
  },
  questionText: {
    marginTop: Platform.OS === 'ios' ? 25 : 18,
    color: 'white',
    fontSize: Platform.OS === 'ios' ? 25 : 22,
    fontWeight: '500',
    fontFamily: 'SF UI Display',
    marginLeft: 40,
    marginRight: 40
  },
  flatListContainer: {
    flex: 1
  },
  dataRow: {
    marginHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 26,
    marginRight: 26,
    marginBottom: 8,
    borderBottomWidth: 1.5,
    borderColor: '#FF4763',
    flexDirection: 'row'
  },

  /* Ans TextView  */
  ansInputTextContainer: {
    marginLeft: 8,
    marginRight: 26,
    flex: 1,
    borderWidth: 1,
    borderColor: '#FF4763',
    height: 40
  },
  textInput: {
    color: 'white'
  },
  textAnsColor: {
    color: 'white',
    fontWeight: '400',
    fontSize: 14,
    fontFamily: 'SF UI Display',
    marginLeft: 8,
    marginRight: 18,
    marginBottom: 10
  },
  customInputContainer: {
    margin: 40,
    borderColor: '#FF4763',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(68,0,104,1.0)',
    justifyContent: 'flex-start'
  },
  inputStyle: {
    height: Platform.OS === 'ios' ? 160 : 130,
    color: 'white'
  },
  borderLessButton: {
    borderWidth: 1,
    borderColor: '#FF4763',
    height: 45,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  borderedButton: {
    borderColor: '#FF4763',
    height: 45,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  btnText: { color: 'white' },
  btnContainer: {
    paddingHorizontal: 80,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  /* Footer  */
  footerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginLeft: 26,
    marginRight: 26
  },
  bottomBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderColor: '#FF4763',
    height: 40,
    width: 100,
    marginRight: 10
  },
  bottomBtnUnSelected: {
    backgroundColor: 'transparent'
  },
  bottomBtnSelected: {
    backgroundColor: '#FF4763'
  },
  bottomBtnText: {
    color: 'white',
    fontSize: 14
  }
});

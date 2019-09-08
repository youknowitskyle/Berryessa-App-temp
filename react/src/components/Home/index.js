import React, { Component } from "react";
import { compose } from "recompose";

import {
  AuthUserContext,
  withAuthorization,
  withEmailVerification
} from "../Session";
import { withFirebase } from "../Firebase";
import { tsImportEqualsDeclaration } from "@babel/types";

const HomePage = () => (
  <div>
    <h1>Home Page</h1>
    <p>You are authenticated.</p>

    <Messages />

    <br />
    <h2>Announcements</h2>
    <Announcements />
  </div>
);

class AnnouncementsBase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: "",
      text: "",
      loading: false,
      announcement: []
    };
  }

  componentDidMount() {
    this.setState({ loading: true });

    this.props.firebase.announcements().on("value", snapshot => {
      const announcementObject = snapshot.val();

      if (announcementObject) {
        const announcementList = Object.keys(announcementObject).map(key => ({
          ...announcementObject[key],
          uid: key
        }));
        this.setState({
          announcements: announcementList,
          loading: false
        });
      } else {
        this.setState({ announcements: null, loading: false });
      }

      this.setState({ loading: false });
    });
  }

  componentWillUnmount() {
    this.props.firebase.announcements().off();
  }

  render() {
    const { title, text, announcements, loading } = this.state;

    return (
      <AuthUserContext.Consumer>
        {authUser => (
          <div>
            {loading && <div>Loading ...</div>}

            {announcements ? (
              <AnnouncementList
                authUser={authUser}
                announcements={announcements}
              />
            ) : (
              <div>There are no announcements...</div>
            )}
          </div>
        )}
      </AuthUserContext.Consumer>
    );
  }
}

const AnnouncementList = ({ authUser, announcements }) => (
  <ul>
    {announcements.map(announcement => (
      <AnnouncementItem
        authUser={authUser}
        key={announcement.uid}
        announcement={announcement}
      />
    ))}
  </ul>
);

class AnnouncementItem extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const { authUser, announcement } = this.props;

    return (
      <li>
        {
          <span>
            <strong>{announcement.title}</strong> {announcement.text} (Posted by{" "}
            {announcement.username})
            {announcement.editedAt && <span> (Edited) </span>}
          </span>
        }
      </li>
    );
  }
}

class MessagesBase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      text: "",
      loading: false,
      message: []
    };
  }

  onChangeText = event => {
    this.setState({ text: event.target.value });
  };

  onCreateMessage = (event, authUser) => {
    this.props.firebase.messages().push({
      text: this.state.text,
      userId: authUser.uid,
      createdAt: this.props.firebase.serverValue.TIMESTAMP,
      username: authUser.username
    });

    this.setState({ text: "" });

    event.preventDefault();
  };

  componentDidMount() {
    this.setState({ loading: true });

    this.props.firebase.messages().on("value", snapshot => {
      const messageObject = snapshot.val();

      if (messageObject) {
        const messageList = Object.keys(messageObject).map(key => ({
          ...messageObject[key],
          uid: key
        }));
        this.setState({
          messages: messageList,
          loading: false
        });
      } else {
        this.setState({ messages: null, loading: false });
      }

      this.setState({ loading: false });
    });
  }

  componentWillUnmount() {
    this.props.firebase.messages().off();
  }

  onRemoveMessage = uid => {
    this.props.firebase.message(uid).remove();
  };

  onEditMessage = (message, text) => {
    const { uid, ...messageSnapshot } = message;

    this.props.firebase.message(message.uid).set({
      ...messageSnapshot,
      text,
      editedAt: this.props.firebase.serverValue.TIMESTAMP
    });
  };

  render() {
    const { text, messages, loading } = this.state;

    return (
      <AuthUserContext.Consumer>
        {authUser => (
          <div>
            {loading && <div>Loading ...</div>}

            {messages ? (
              <MessageList
                authUser={authUser}
                messages={messages}
                onEditMessage={this.onEditMessage}
                onRemoveMessage={this.onRemoveMessage}
              />
            ) : (
              <div>There are no messages...</div>
            )}

            <form onSubmit={event => this.onCreateMessage(event, authUser)}>
              <input type="text" value={text} onChange={this.onChangeText} />
              <button type="submit">Send</button>
            </form>
          </div>
        )}
      </AuthUserContext.Consumer>
    );
  }
}

const MessageList = ({
  authUser,
  messages,
  onRemoveMessage,
  onEditMessage
}) => (
  <ul>
    {messages.map(message => (
      <MessageItem
        authUser={authUser}
        key={message.uid}
        message={message}
        onEditMessage={onEditMessage}
        onRemoveMessage={onRemoveMessage}
      />
    ))}
  </ul>
);

class MessageItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      editText: this.props.message.text
    };
  }

  onToggleEditMode = () => {
    this.setState(state => ({
      editMode: !state.editMode,
      editText: this.props.message.text
    }));
  };

  onChangeEditText = event => {
    this.setState({ editText: event.target.value });
  };

  onSaveEditText = () => {
    this.props.onEditMessage(this.props.message, this.state.editText);

    this.setState({ editMode: false });
  };

  render() {
    const { authUser, message, onRemoveMessage } = this.props;
    const { editMode, editText } = this.state;

    return (
      <li>
        {editMode ? (
          <input
            type="text"
            value={editText}
            onChange={this.onChangeEditText}
          />
        ) : (
          <span>
            <strong>{message.username}</strong> {message.text}
            {message.editedAt && <span> (Edited) </span>}
          </span>
        )}
        {authUser.uid === message.userId && (
          <span>
            {editMode ? (
              <span>
                <button onClick={this.onSaveEditText}>Save</button>
                <button onClick={this.onToggleEditMode}>Reset</button>
              </span>
            ) : (
              <button onClick={this.onToggleEditMode}>Edit</button>
            )}

            {!editMode && (
              <button
                type="button"
                onClick={() => onRemoveMessage(message.uid)}
              >
                Delete
              </button>
            )}
          </span>
        )}
      </li>
    );
  }
}

const Messages = withFirebase(MessagesBase);
const Announcements = withFirebase(AnnouncementsBase);

const condition = authUser => !!authUser;

//or equivalently:
//const condition = authUser => authUser != null;

export default withAuthorization(condition)(HomePage);

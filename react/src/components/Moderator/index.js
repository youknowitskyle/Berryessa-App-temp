import React, { Component } from "react";
import { Switch, Route, Link } from "react-router-dom";
import { compose } from "recompose";

import { withFirebase } from "../Firebase";
import {
  AuthUserContext,
  withAuthorization,
  withEmailVerification
} from "../Session";
import * as ROLES from "../../constants/roles";
import * as ROUTES from "../../constants/routes";

const ModeratorPage = () => (
  <div>
    <h1>Moderator</h1>
    <p>The Moderator Page is accessible by every signed in moderator user.</p>

    <Announcements />
  </div>
);

class AnnouncementsBase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      text: "",
      loading: false,
      announcement: []
    };
  }

  onChangeText = event => {
    this.setState({ text: event.target.value });
  };

  onCreateAnnouncement = (event, authUser) => {
    this.props.firebase.announcements().push({
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

  onRemoveAnnouncement = uid => {
    this.props.firebase.announcement(uid).remove();
  };

  onEditAnnouncement = (announcement, text) => {
    const { uid, ...announcementSnapshot } = announcement;

    this.props.firebase.announcement(announcement.uid).set({
      ...announcementSnapshot,
      text,
      editedAt: this.props.firebase.serverValue.TIMESTAMP
    });
  };

  render() {
    const { text, announcements, loading } = this.state;

    return (
      <AuthUserContext.Consumer>
        {authUser => (
          <div>
            {loading && <div>Loading ...</div>}

            {announcements ? (
              <AnnouncementList
                authUser={authUser}
                announcements={announcements}
                onEditAnnouncement={this.onEditAnnouncement}
                onRemoveAnnouncement={this.onRemoveAnnouncement}
              />
            ) : (
              <div>There are no announcements...</div>
            )}

            <form
              onSubmit={event => this.onCreateAnnouncement(event, authUser)}
            >
              <input type="text" value={text} onChange={this.onChangeText} />
              <button type="submit">Send</button>
            </form>
          </div>
        )}
      </AuthUserContext.Consumer>
    );
  }
}

const AnnouncementList = ({
  authUser,
  announcements,
  onRemoveAnnouncement,
  onEditAnnouncement
}) => (
  <ul>
    {announcements.map(announcement => (
      <AnnouncementItem
        authUser={authUser}
        key={announcement.uid}
        announcement={announcement}
        onEditAnnouncement={onEditAnnouncement}
        onRemoveAnnouncement={onRemoveAnnouncement}
      />
    ))}
  </ul>
);

class AnnouncementItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      editText: this.props.announcement.text
    };
  }

  onToggleEditMode = () => {
    this.setState(state => ({
      editMode: !state.editMode,
      editText: this.props.announcement.text
    }));
  };

  onChangeEditText = event => {
    this.setState({ editText: event.target.value });
  };

  onSaveEditText = () => {
    this.props.onEditAnnouncement(this.props.announcement, this.state.editText);

    this.setState({ editMode: false });
  };

  render() {
    const { authUser, announcement, onRemoveAnnouncement } = this.props;
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
            <strong>{announcement.username}</strong> {announcement.text}
            {announcement.editedAt && <span> (Edited) </span>}
          </span>
        )}
        {authUser.uid === announcement.userId && (
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
                onClick={() => onRemoveAnnouncement(announcement.uid)}
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

const Announcements = withFirebase(AnnouncementsBase);

const condition = authUser =>
  authUser &&
  (!!authUser.roles[ROLES.MODERATOR] || !!authUser.roles[ROLES.ADMIN]);

export default compose(
  withAuthorization(condition),
  withFirebase
)(ModeratorPage);

import React, { Component } from "react";
import { Switch, Route, Link } from "react-router-dom";
import { compose } from "recompose";
import DatePicker from "react-datepicker";
import { withFirebase } from "../Firebase";
import {
  AuthUserContext,
  withAuthorization,
  withEmailVerification
} from "../Session";
import * as ROLES from "../../constants/roles";
import * as ROUTES from "../../constants/routes";

import "react-datepicker/dist/react-datepicker.css";

import { PrayerView } from "../Prayer";

const ModeratorPage = () => (
  <div>
    <h1>Moderator</h1>
    <p>The Moderator Page is accessible by every signed in moderator user.</p>

    <h2>Prayer Requests</h2>
    <PrayerView />

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
      endDate: "",
      loading: false,
      announcement: [],
      error: false
    };
  }

  onChangeText = event => {
    this.setState({ text: event.target.value });
  };

  onChangeTitle = event => {
    this.setState({ title: event.target.value });
  };

  handleDateChange = date => {
    if (Date.parse(date) > Date.now()) {
      this.setState({ endDate: date, error: false });
    } else {
      this.setState({ error: true });
    }
  };

  onCreateAnnouncement = (event, authUser) => {
    const dateHolder = Date.parse(this.state.endDate);

    this.props.firebase.announcements().push({
      title: this.state.title,
      text: this.state.text,
      endDate: dateHolder,
      userId: authUser.uid,
      createdAt: this.props.firebase.serverValue.TIMESTAMP,
      username: authUser.username
    });
    this.setState({ title: "", text: "", endDate: "" });

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
        const filteredAnnouncements = announcementList.filter(item => {
          return parseInt(item.endDate) > Date.now();
        });
        this.setState({
          announcements: filteredAnnouncements,
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

  onEditAnnouncement = (announcement, title, text, dateHolder) => {
    const { uid, ...announcementSnapshot } = announcement;
    const endDate = Date.parse(dateHolder);

    this.props.firebase.announcement(announcement.uid).set({
      ...announcementSnapshot,
      title,
      text,
      endDate,
      editedAt: this.props.firebase.serverValue.TIMESTAMP
    });
  };

  render() {
    const { title, text, endDate, announcements, loading } = this.state;

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
              <input
                type="text"
                value={title}
                placeholder="Title"
                onChange={this.onChangeTitle}
              />
              <input
                type="text"
                value={text}
                placeholder="Body"
                onChange={this.onChangeText}
              />
              <span style={{ padding: "3px" }}>Expiration Date: </span>
              <DatePicker
                selected={this.state.endDate}
                onSelect={this.handleDateChange}
                onChange={this.handleDateChange}
                calendarAriaLabel="Expiration Date"
              />
              <button
                type="submit"
                disabled={
                  this.state.error ||
                  !this.state.endDate ||
                  !this.state.title ||
                  !this.state.text
                }
              >
                Send
              </button>
              {this.state.error && (
                <div style={{ color: "red" }}>Please enter a valid date.</div>
              )}
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
      editTitle: this.props.announcement.title,
      editText: this.props.announcement.text,
      editDate: this.props.announcement.endDate,
      error: false
    };
  }

  onToggleEditMode = () => {
    this.setState(state => ({
      editMode: !state.editMode,
      editTitle: this.props.announcement.title,
      editText: this.props.announcement.text,
      editDate: this.props.announcement.endDate
    }));
  };

  onChangeEditText = event => {
    this.setState({ editText: event.target.value });
  };

  onChangeEditTitle = event => {
    this.setState({ editTitle: event.target.value });
  };

  onChangeDate = event => {
    if (Date.parse(event) > Date.now()) {
      this.setState({ editDate: event, error: false });
    } else {
      this.setState({ error: true });
    }
  };

  onSaveEditText = () => {
    this.props.onEditAnnouncement(
      this.props.announcement,
      this.state.editTitle,
      this.state.editText,
      this.state.editDate
    );

    this.setState({ editMode: false });
  };

  render() {
    const { authUser, announcement, onRemoveAnnouncement } = this.props;
    const { editMode, editTitle, editText } = this.state;

    return (
      <li>
        {editMode ? (
          <React.Fragment>
            <input
              type="text"
              value={editTitle}
              onChange={this.onChangeEditTitle}
            />
            <input
              type="text"
              value={editText}
              onChange={this.onChangeEditText}
            />
            <DatePicker
              selected={this.state.editDate}
              onSelect={this.onChangeDate}
              onChange={this.onChangeDate}
            />
          </React.Fragment>
        ) : (
          <span>
            <strong>{announcement.title}</strong> {announcement.text} (Posted by{" "}
            {announcement.username})
            {announcement.editedAt && <span> (Edited) </span>}
          </span>
        )}
        <span>
          {editMode ? (
            <span>
              <button
                onClick={this.onSaveEditText}
                disabled={
                  this.state.error ||
                  !this.state.editDate ||
                  !this.state.editTitle ||
                  !this.state.editText
                }
              >
                Save
              </button>
              <button onClick={this.onToggleEditMode}>Cancel</button>
              {this.state.error && (
                <div style={{ color: "red" }}>Please enter a valid date.</div>
              )}
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

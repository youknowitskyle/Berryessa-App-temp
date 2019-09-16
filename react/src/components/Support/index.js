import React, { Component } from "react";
import Popup from "reactjs-popup";

import "../Prayer/styles.css";

import { AuthUserContext, withAuthorization } from "../Session";
import { withFirebase } from "../Firebase";
import Replies from "./reply";

import * as ROLES from "../../constants/roles";

const SupportPage = () => (
  <div>
    <h1>Support Requests</h1>
    <p>If you need support for anything, please submit your request below.</p>
    <Supports />
  </div>
);

class SupportsBase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      text: "",
      isAnonymous: false,
      loading: false,
      supports: [],
      limit: 5,
      reply: null //becomes id of message
    };
  }

  componentDidMount() {
    this.onListenForSupports();
  }

  onListenForSupports() {
    this.setState({ loading: true });

    this.props.firebase
      .supports()
      .orderByChild("createdAt")
      .limitToLast(this.state.limit)
      .on("value", snapshot => {
        const supportObject = snapshot.val();

        if (supportObject) {
          const supportList = Object.keys(supportObject).map(key => ({
            ...supportObject[key],
            uid: key
          }));
          // convert supports list from snapshot

          this.setState({
            supports: supportList,
            loading: false
          });
        } else {
          this.setState({ supports: null, loading: false });
        }
      });
  }

  componentWillUnmount() {
    this.props.firebase.supports().off();
  }

  onChangeText = event => {
    this.setState({ text: event.target.value });
  };

  onChangeCheckbox = event => {
    this.setState({ [event.target.name]: event.target.checked });
  };

  onCreateSupport = (event, authUser) => {
    this.props.firebase.supports().push({
      text: this.state.text,
      userId: authUser.uid,
      username: authUser.username,
      isAnonymous: this.state.isAnonymous,
      createdAt: this.props.firebase.serverValue.TIMESTAMP
    });

    this.setState({ text: "" });

    event.preventDefault();
  };

  onEditSupport = (support, text) => {
    const { uid, ...supportSnapshot } = support;

    this.props.firebase.support(support.uid).set({
      ...supportSnapshot,
      text,
      editedAt: this.props.firebase.serverValue.TIMESTAMP
    });
  };

  onRemoveSupport = uid => {
    this.props.firebase.support(uid).remove();
  };

  onNextPage = () => {
    this.setState(
      state => ({ limit: state.limit + 5 }),
      this.onListenForSupports
    );
  };

  render() {
    const { text, isAnonymous, supports, loading } = this.state;

    const isInvalid = text === "";

    return (
      <AuthUserContext.Consumer>
        {authUser => (
          <div>
            {!loading &&
              supports && (
                <button type="button" onClick={this.onNextPage}>
                  More
                </button>
              )}

            {loading && <div>Loading ...</div>}

            {supports ? (
              <SupportList
                authUser={authUser}
                supports={supports}
                onEditSupport={this.onEditSupport}
                onRemoveSupport={this.onRemoveSupport}
              />
            ) : (
              <div>There are no support requests ...</div>
            )}

            <form onSubmit={event => this.onCreateSupport(event, authUser)}>
              <input
                name="support"
                type="text"
                value={text}
                onChange={this.onChangeText}
                placeholder="Send a support request..."
              />
              <label>
                Send Anonymously:{" "}
                <input
                  name="isAnonymous"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={this.onChangeCheckbox}
                />{" "}
              </label>
              <button disabled={isInvalid} type="submit">
                Send
              </button>
            </form>
          </div>
        )}
      </AuthUserContext.Consumer>
    );
  }
}

const SupportList = ({
  authUser,
  supports,
  onEditSupport,
  onRemoveSupport
}) => (
  <ul>
    {supports.map(
      support =>
        (authUser.uid === support.userId ||
          !!authUser.roles[ROLES.ADMIN] ||
          !!authUser.roles[ROLES.MODERATOR]) && (
          <SupportItem
            authUser={authUser}
            key={support.uid}
            support={support}
            onEditSupport={onEditSupport}
            onRemoveSupport={onRemoveSupport}
          />
        )
    )}
  </ul>
);

class SupportItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      editText: this.props.support.text
    };
  }

  onToggleEditMode = () => {
    this.setState(state => ({
      editMode: !state.editMode,
      editText: this.props.support.text
    }));
  };

  onChangeEditText = event => {
    this.setState({ editText: event.target.value });
  };

  onSaveEditText = () => {
    this.props.onEditSupport(this.props.support, this.state.editText);

    this.setState({ editMode: false });
  };

  render() {
    const { authUser, support, onRemoveSupport } = this.props;
    const { editMode, editText } = this.state;

    const isInvalid = editText === "";

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
            <strong>
              {support.isAnonymous ? "Anonymous" : support.username}:{" "}
            </strong>
            {support.text}
            {support.editedAt && <span>(Edited)</span>}
          </span>
        )}
        {authUser.uid === support.userId && (
          <Popup
            trigger={open => (
              <button className="button">{open ? "Close" : ":"}</button>
            )}
            position="right top"
            closeOnDocumentClick
          >
            {editMode ? (
              <span className="card">
                <button
                  className="menu-item"
                  type="button"
                  disabled={isInvalid}
                  onClick={this.onSaveEditText}
                >
                  Save
                </button>
                <button
                  className="menu-item"
                  type="button"
                  onClick={this.onToggleEditMode}
                >
                  Reset
                </button>
              </span>
            ) : (
              <span className="card">
                <button
                  className="menu-item"
                  type="button"
                  onClick={this.onToggleEditMode}
                >
                  Edit
                </button>
                <button
                  className="menu-item"
                  type="button"
                  onClick={() => onRemoveSupport(support.uid)}
                >
                  Delete
                </button>
              </span>
            )}
          </Popup>
        )}
        <Popup
          trigger={<button className="button">Reply</button>}
          modal
          closeOnDocumentClick
        >
          <div>
            <span>
              User: {support.isAnonymous ? "Anonymous" : support.username}
            </span>
            <h1>{support.text}</h1>
            <Replies support={support} />
          </div>
        </Popup>
      </li>
    );
  }
}

class SupportViewBase extends SupportsBase {
  constructor(props) {
    super(props);
  }

  render() {
    const { supports, loading } = this.state;

    return (
      <div>
        <AuthUserContext.Consumer>
          {authUser => (
            <div>
              {!loading &&
                supports && (
                  <button type="button" onClick={this.onNextPage}>
                    More
                  </button>
                )}

              {loading && <div>Loading ...</div>}

              {supports ? (
                <SupportList
                  authUser={authUser}
                  supports={supports}
                  onEditSupport={this.onEditSupport}
                  onRemoveSupport={this.onRemoveSupport}
                />
              ) : (
                <div>There are no support requests ...</div>
              )}
            </div>
          )}
        </AuthUserContext.Consumer>
      </div>
    );
  }
}

const Supports = withFirebase(SupportsBase);
const SupportView = withFirebase(SupportViewBase);

const condition = authUser =>
  !!authUser &&
  (!!authUser.roles[ROLES.ADMIN] ||
    !!authUser.roles[ROLES.MODERATOR] ||
    !!authUser.roles[ROLES.APPROVED]);

//or equivalently:
//const condition = authUser => authUser != null;

export default withAuthorization(condition)(SupportPage);

export { SupportView, Supports };

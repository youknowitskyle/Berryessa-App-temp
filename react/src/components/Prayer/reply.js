import React, { Component } from "react";

import { AuthUserContext, withAuthorization } from "../Session";
import { withFirebase } from "../Firebase";

import * as ROLES from "../../constants/roles";

class ReplyBase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      text: "",
      isAnonymous: false,
      loading: false,
      replies: [],
      limit: 5
    };
  }

  componentDidMount() {
    this.onListenForReplies();
  }

  onListenForReplies() {
    this.setState({ loading: true });

    this.props.firebase
      .replies(this.props.prayer.uid)
      .orderByChild("createdAt")
      .limitToLast(this.state.limit)
      .on("value", snapshot => {
        const replyObject = snapshot.val();

        if (replyObject) {
          const replyList = Object.keys(replyObject).map(key => ({
            ...replyObject[key],
            uid: key
          }));
          // convert replies list from snapshot

          this.setState({
            replies: replyList,
            loading: false
          });
        } else {
          this.setState({ replies: null, loading: false });
        }
      });
  }

  componentWillUnmount() {
    this.props.firebase.replies(this.props.prayer.uid).off();
  }

  onChangeText = event => {
    this.setState({ text: event.target.value });
  };

  onChangeCheckbox = event => {
    this.setState({ [event.target.name]: event.target.checked });
  };

  onCreateReply = (event, authUser) => {
    this.props.firebase.replies(this.props.prayer.uid).push({
      text: this.state.text,
      prayerId: this.props.prayer.uid,
      userId: authUser.uid,
      username: authUser.username,
      isAnonymous: this.state.isAnonymous,
      createdAt: this.props.firebase.serverValue.TIMESTAMP
    });

    this.setState({ text: "" });

    event.preventDefault();
  };

  onEditReply = (reply, text) => {
    const { uid, ...replySnapshot } = reply;

    this.props.firebase
      .reply(this.props.prayer.uid)(reply.uid)
      .set({
        ...replySnapshot,
        text,
        editedAt: this.props.firebase.serverValue.TIMESTAMP
      });
  };

  onRemoveReply = uid => {
    this.props.firebase
      .reply(this.props.prayer.uid)(uid)
      .remove();
  };

  onNextPage = () => {
    this.setState(
      state => ({ limit: state.limit + 5 }),
      this.onListenForReplies
    );
  };

  render() {
    const { text, replies, loading } = this.state;

    const isInvalid = text === "";

    return (
      <AuthUserContext.Consumer>
        {authUser => (
          <div>
            {!loading && replies && (
              <button type="button" onClick={this.onNextPage}>
                More
              </button>
            )}

            {loading && <div>Loading ...</div>}

            {replies ? (
              <ReplyList
                authUser={authUser}
                replies={replies}
                onEditReply={this.onEditReply}
                onRemoveReply={this.onRemoveReply}
              />
            ) : (
              <div>There are no reply requests ...</div>
            )}

            <form onSubmit={event => this.onCreateReply(event, authUser)}>
              <input
                name="reply"
                type="text"
                value={text}
                onChange={this.onChangeText}
                placeholder="Send a reply..."
              />
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

const ReplyList = ({ authUser, replies, onEditReply, onRemoveReply }) => (
  <ul>
    {replies.map(
      reply =>
        (authUser.uid === reply.userId ||
          !!authUser.roles[ROLES.ADMIN] ||
          !!authUser.roles[ROLES.MODERATOR]) && (
          <ReplyItem
            authUser={authUser}
            key={reply.uid}
            reply={reply}
            onEditReply={onEditReply}
            onRemoveReply={onRemoveReply}
          />
        )
    )}
  </ul>
);

class ReplyItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      editText: this.props.reply.text
    };
  }

  onToggleEditMode = () => {
    this.setState(state => ({
      editMode: !state.editMode,
      editText: this.props.reply.text
    }));
  };

  onChangeEditText = event => {
    this.setState({ editText: event.target.value });
  };

  onSaveEditText = () => {
    this.props.onEditReply(this.props.reply, this.state.editText);

    this.setState({ editMode: false });
  };

  render() {
    const { authUser, reply, onRemoveReply } = this.props;
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
            <strong>{reply.isAnonymous ? "Anonymous" : reply.username}</strong>{" "}
            {reply.text}
            {console.log(reply)}
            {reply.editedAt && <span>(Edited)</span>}
          </span>
        )}
        {authUser.uid === reply.userId && (
          <span>
            {editMode ? (
              <span>
                <button disabled={isInvalid} onClick={this.onSaveEditText}>
                  Save
                </button>
                <button onClick={this.onToggleEditMode}>Reset</button>
              </span>
            ) : (
              <button onClick={this.onToggleEditMode}>Edit</button>
            )}
            {!editMode && (
              <button type="button" onClick={() => onRemoveReply(reply.uid)}>
                Delete
              </button>
            )}
          </span>
        )}
      </li>
    );
  }
}

const Replies = withFirebase(ReplyBase);

const condition = authUser =>
  !!authUser &&
  (!!authUser.roles[ROLES.ADMIN] ||
    !!authUser.roles[ROLES.MODERATOR] ||
    !!authUser.roles[ROLES.APPROVED]);

//or equivalently:
//const condition = authUser => authUser != null;

export default withAuthorization(condition)(Replies);

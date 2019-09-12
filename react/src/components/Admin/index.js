import React, { Component } from "react";
import { Switch, Route, Link } from "react-router-dom";
import { compose } from "recompose";
import Popup from "reactjs-popup";

import { withFirebase } from "../Firebase";
import { withAuthorization } from "../Session";
import * as ROLES from "../../constants/roles";
import * as ROUTES from "../../constants/routes";

const AdminPage = () => (
  <div>
    <h1>Admin</h1>
    <p>The Admin Page is accessible by every signed in admin user.</p>

    <Switch>
      <Route exact path={ROUTES.ADMIN_DETAILS} component={UserItem} />
      <Route exact path={ROUTES.ADMIN} component={UserList} />
    </Switch>
  </div>
);

class UserListBase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      users: []
    };
  }

  componentDidMount() {
    this.setState({ loading: true });

    this.props.firebase.users().on("value", snapshot => {
      const usersObject = snapshot.val();

      const usersList = Object.keys(usersObject).map(key => ({
        ...usersObject[key],
        uid: key
      }));

      this.setState({
        users: usersList,
        loading: false
      });
    });
  }

  componentWillUnmount() {
    this.props.firebase.users().off();
  }

  render() {
    const { users, loading } = this.state;

    return (
      <div>
        <h2>Users</h2>
        {loading && <div>Loading...</div>}

        <ul>
          {users.map(user => (
            <li key={user.uid}>
              <span>
                <strong>ID:</strong> {user.uid}
              </span>
              <span>
                <strong> | E-Mail:</strong> {user.email}
              </span>
              <span>
                <strong> | Username:</strong> {user.username}
              </span>
              <span>
                <strong> | Approved: </strong>{" "}
                {user.roles.APPROVED ? (
                  <span style={{ color: "green" }}>TRUE</span>
                ) : (
                  <span style={{ color: "red" }}>FALSE</span>
                )}
              </span>
              <span>
                <strong> | Parent: </strong>{" "}
                {user.roles.PARENT ? (
                  <span style={{ color: "green" }}>TRUE</span>
                ) : (
                  <span style={{ color: "red" }}>FALSE</span>
                )}
              </span>
              <span>
                <Link
                  to={{
                    pathname: `${ROUTES.ADMIN}/${user.uid}`,
                    state: { user }
                  }}
                >
                  {" "}
                  Details
                </Link>
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

class UserItemBase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      user: null,
      sentReset: false,
      approved: false,
      banned: false,
      probation: false,
      openBan: false,
      openSoftBan: false,
      ...props.location.state
    };
  }

  componentDidMount() {
    console.log("hello");

    if (this.state.user) {
      this.setState({
        approved: this.state.user.roles.APPROVED,
        banned: this.state.user.roles.BANNED,
        probation: this.state.user.roles.PROBATION
      });
      return;
    }

    this.setState({ loading: true });

    this.props.firebase
      .user(this.props.match.params.id)
      .on("value", snapshot => {
        this.setState({
          user: snapshot.val(),
          loading: false,
          approved: snapshot.val().roles.APPROVED,
          banned: snapshot.val().roles.BANNED,
          probation: snapshot.val().roles.PROBATION
        });
      });

    this.setState({
      approved: this.state.user.roles.APPROVED,
      banned: this.state.user.roles.BANNED,
      probation: this.state.user.roles.PROBATION
    });
  }

  componentWillUnmount() {
    this.props.firebase.user(this.props.match.params.id).off();
  }

  onSendPasswordResetEmail = () => {
    this.props.firebase.doPasswordReset(this.state.user.email);
    this.setState({
      sentReset: true
    });
  };

  onBanUser = () => {
    this.props.firebase.db
      .ref(`users/${this.props.match.params.id}/roles/`)
      .set({ BANNED: "BANNED" });

    this.setState({ banned: true });
  };

  onSoftBanUser = () => {
    this.props.firebase.db
      .ref(`users/${this.props.match.params.id}/roles/`)
      .update({ PROBATION: "PROBATION" });
    this.setState({ probation: true });
  };

  onApproveUser = () => {
    this.props.firebase.db
      .ref(`users/${this.props.match.params.id}/roles/`)
      .update({ APPROVED: "APPROVED" });

    this.setState({
      approved: true
    });
  };

  render() {
    const { user, loading } = this.state;

    return (
      <div>
        <h2>User ({this.props.match.params.id})</h2>
        {loading && <div>Loading ...</div>}

        {user && (
          <div>
            <span>
              <strong>ID: </strong> {this.props.match.params.id}
            </span>
            <span>
              <strong> | E-Mail:</strong> {user.email}
            </span>
            <span>
              <strong> | Username:</strong> {user.username}
            </span>
            <span style={{ padding: "5px" }}>
              {!this.state.approved && !this.state.banned && (
                <button
                  type="button"
                  onClick={this.onApproveUser}
                  style={{
                    backgroundColor: "green",
                    color: "white"
                  }}
                >
                  Approve User
                </button>
              )}
            </span>
            {/* <span>
              <button type="button" onClick={this.onSendPasswordResetEmail}>
                Send Password Reset
              </button>
              {this.state.sentReset && (
                <div style={{ color: "red" }}>Password reset sent</div>
              )}
            </span> */}

            {!!this.state.approved && !this.state.banned && (
              <span style={{ padding: "5px" }}>
                <button
                  type="button"
                  onClick={() => {
                    this.setState({ openSoftBan: true });
                  }}
                  style={{
                    backgroundColor: "fuchsia",
                    color: "white"
                  }}
                >
                  Soft Ban
                </button>

                <Popup
                  modal
                  closeOnDocumentClick
                  open={this.state.openSoftBan}
                  onClose={() => {
                    this.setState({ openSoftBan: false });
                  }}
                >
                  <br />
                  <div style={{ textAlign: "center" }}>
                    Are you sure you would like to put this user on probation?
                    They will no longer be able to submit prayer requests and
                    messages.
                  </div>
                  <br />
                  <div style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => {
                        this.props.firebase.db
                          .ref(`users/${this.props.match.params.id}/roles/`)
                          .update({ PROBATION: "PROBATION" });
                        this.setState({ probation: true, openSoftBan: false });
                      }}
                      style={{
                        backgroundColor: "fuchsia",
                        color: "white"
                      }}
                    >
                      Soft Ban User
                    </button>
                  </div>
                  <br />
                </Popup>
              </span>
            )}
            <span>
              {this.state.banned ? (
                <strong style={{ color: "red" }}>BANNED</strong>
              ) : (
                <span style={{ padding: "5px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      this.setState({ openBan: true });
                    }}
                    style={{
                      backgroundColor: "red",
                      color: "white"
                    }}
                  >
                    Ban User
                  </button>
                  <Popup
                    modal
                    closeOnDocumentClick
                    open={this.state.openBan}
                    onClose={() => {
                      this.setState({ openBan: false });
                    }}
                  >
                    <br />
                    <div style={{ textAlign: "center" }}>
                      Are you sure you would like to ban this user? This action
                      is irreversible.
                    </div>
                    <br />
                    <div style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => {
                          this.props.firebase.db
                            .ref(`users/${this.props.match.params.id}/roles/`)
                            .set({ BANNED: "BANNED" });

                          this.setState({ banned: true, openBan: false });
                        }}
                        style={{
                          backgroundColor: "red",
                          color: "white"
                        }}
                      >
                        Ban User
                      </button>
                    </div>
                    <br />
                  </Popup>
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    );
  }
}

const condition = authUser => authUser && !!authUser.roles[ROLES.ADMIN];

const UserList = withFirebase(UserListBase);
const UserItem = withFirebase(UserItemBase);

/*const UserItem = ({ match }) => (
  <div>
    <h2>User ({match.params.id})</h2>
  </div>
);*/

export default compose(
  withAuthorization(condition),
  withFirebase
)(AdminPage);

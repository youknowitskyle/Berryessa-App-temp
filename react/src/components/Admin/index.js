import React, { Component } from "react";
import { Switch, Route, Link } from "react-router-dom";
import { compose } from "recompose";

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
                  <div style={{ color: "green" }}>TRUE</div>
                ) : (
                  <div style={{ color: "red" }}>FALSE</div>
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
      ...props.location.state
    };
  }

  componentDidMount() {
    console.log("hello");

    if (this.state.user) {
      this.setState({
        approved: this.state.user.roles.APPROVED
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
          approved: snapshot.val().roles.APPROVED
        });
      });

    this.setState({
      approved: this.state.user.roles.APPROVED
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
            <span>
              {!this.state.approved && (
                <button type="button" onClick={this.onApproveUser}>
                  Approve User
                </button>
              )}
            </span>
            <span>
              <button type="button" onClick={this.onSendPasswordResetEmail}>
                Send Password Reset
              </button>
              {this.state.sentReset && (
                <div style={{ color: "red" }}>Password reset sent</div>
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

import React, { Component } from "react";

export class PermissionDenied extends Component {
  render() {
    return (
      <div>
        You are not allowed to view this page. Please contact your administrator
        if you think this is an error.
      </div>
    );
  }
}

export default PermissionDenied;

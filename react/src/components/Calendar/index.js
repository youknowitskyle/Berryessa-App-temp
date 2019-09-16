import React, { Component } from "react";

import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import request from "superagent";
import Popup from "reactjs-popup";

import * as ROLES from "../../constants/roles";

import { withAuthorization } from "../Session";

import "react-big-calendar/lib/css/react-big-calendar.css";

const CALENDAR_ID = "0smc23b1ra5r007ca8gf02q1ic@group.calendar.google.com";
const API_KEY = "AIzaSyCZT6wgDKyHv88Z_uemSC7GzVRGafL4IOY";

let url = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}`;

const localizer = momentLocalizer(moment);

class CalendarPageBase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      eventsList: [],
      openEvent: false,
      event: ""
    };
  }

  componentDidMount() {
    request.get(url).end((err, resp) => {
      if (!err) {
        const events = [];
        JSON.parse(resp.text).items.map(event => {
          const startHolder = event.start.date || event.start.dateTime;
          const endHolder = event.end.date || event.end.dateTime;

          const startDate = new Date(startHolder);
          const endDate = new Date(endHolder);

          events.push({
            start: startDate,
            end: endDate,
            title: event.summary,
            description: event.description
          });
        });
        this.setState({ eventsList: events });
      }
    });
  }

  onSelectEvent(event) {
    this.setState({ openEvent: true, event: event });
  }

  render() {
    return (
      <div>
        <h1>Calendar</h1>
        <br />

        <Calendar
          localizer={localizer}
          events={this.state.eventsList}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={event => this.onSelectEvent(event)}
          style={{ height: "420px" }}
        />
        <Popup
          modal
          closeOnDocumentClick
          open={this.state.openEvent}
          onClose={() => {
            this.setState({ openEvent: false });
          }}
        >
          <h1 style={{ textAlign: "center" }}>{this.state.event.title}</h1>
          <br />
          <br />
          <ul>
            <li>
              {this.state.event.start && this.state.event.end && (
                <div>
                  Date(s): {this.state.event.start.toString()} -{" "}
                  {this.state.event.end.toString()}
                </div>
              )}
            </li>
            <br />
            <li>
              {this.state.event.description && (
                <div>Description: {this.state.event.description}</div>
              )}
            </li>
          </ul>
        </Popup>
      </div>
    );
  }
}

const condition = authUser => !!authUser && !!ROLES.APPROVED;

const CalendarPage = withAuthorization(condition)(CalendarPageBase);

export default CalendarPage;

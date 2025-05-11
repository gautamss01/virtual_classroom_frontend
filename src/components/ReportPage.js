import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { classroomAPI } from "../services/api";
import "../styles/Reports.css";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "N/A";

  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end - start;

  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);

  return `${minutes} min ${seconds} sec`;
};

const ReportPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await classroomAPI.getClassroomReports(roomId);
        console.log("Report API response:", response);

        const data = response?.data?.data;

        if (data) {
          setEvents(data.events || []);
          setClassroom(data.classroom || { status: "NOT_STARTED" });
        } else {
          setError("Failed to retrieve report data from server");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setError(
          error.response?.data?.message || "Failed to fetch classroom reports"
        );
        setLoading(false);
      }
    };

    fetchReports();
  }, [roomId]);

  const handleBack = () => {
    navigate("/");
  };

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={handleBack}>Back to Home</button>
      </div>
    );
  }

  const eventsList = Array.isArray(events) ? events : [];

  const classSessions = [];
  let currentSession = null;

  eventsList.forEach((event) => {
    if (event.type === "START_CLASS") {
      currentSession = {
        startTime: event.timestamp,
        endTime: null,
        events: [event],
      };
      classSessions.push(currentSession);
    } else if (event.type === "END_CLASS") {
      if (currentSession) {
        currentSession.endTime = event.timestamp;
        currentSession.events.push(event);
        currentSession = null;
      }
    } else if (currentSession) {
      currentSession.events.push(event);
    }
  });

  const getAttendanceStats = (session) => {
    const uniqueStudents = new Set();
    const uniqueTeachers = new Set();

    session.events.forEach((event) => {
      if (event.userId && event.role) {
        if (event.role === "STUDENT") {
          uniqueStudents.add(event.userId);
        } else if (event.role === "TEACHER") {
          uniqueTeachers.add(event.userId);
        }
      }
    });

    return {
      students: uniqueStudents.size,
      teachers: uniqueTeachers.size,
    };
  };

  return (
    <div className="report-container">
      <h1>Classroom Report</h1>

      <div className="report-info-panel">
        <div className="room-info">
          <span className="info-label">Room ID:</span>
          <span className="info-value">{roomId}</span>
        </div>
      </div>

      <div className="report-header">
        <div className="status-badge">
          Current Status:{" "}
          <span className={classroom?.status?.toLowerCase() || "not_started"}>
            {classroom?.status?.replace("_", " ") || "NOT STARTED"}
          </span>
        </div>
        <button className="back-btn" onClick={handleBack}>
          Back to Home
        </button>
      </div>

      <div className="sessions-container">
        {classSessions.length > 0 ? (
          classSessions.map((session, index) => {
            const stats = getAttendanceStats(session);
            return (
              <div className="session-card" key={`session-${index}`}>
                <h3>Class Session {index + 1}</h3>
                <div className="session-meta">
                  <div className="session-info">
                    <p>
                      <strong>Started:</strong> {formatDate(session.startTime)}
                    </p>
                    <p>
                      <strong>Ended:</strong>{" "}
                      {session.endTime
                        ? formatDate(session.endTime)
                        : "Not ended yet"}
                    </p>
                    <p>
                      <strong>Duration:</strong>{" "}
                      {calculateDuration(session.startTime, session.endTime)}
                    </p>
                  </div>
                  <div className="session-stats">
                    <p>
                      <strong>Total Students:</strong> {stats.students}
                    </p>
                    <p>
                      <strong>Total Teachers:</strong> {stats.teachers}
                    </p>
                  </div>
                </div>

                <div className="events-table-container">
                  <h4>Participant Activity</h4>
                  <table className="events-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>User</th>
                        <th>Role</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.events.map((event, i) => (
                        <tr key={`event-${i}`}>
                          <td>{formatDate(event.timestamp)}</td>
                          <td>{event.userId || "System"}</td>
                          <td>{event.role || "-"}</td>
                          <td>
                            {event.type === "ENTER" && "Entered"}
                            {event.type === "EXIT" && "Left"}
                            {event.type === "START_CLASS" && "Started Class"}
                            {event.type === "END_CLASS" && "Ended Class"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-data">No class sessions found for this room.</p>
        )}
      </div>
    </div>
  );
};

export default ReportPage;

import React, { useEffect, useState, useRef } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useParams, useNavigate } from "react-router-dom";
import { classroomAPI } from "../services/api";
import "../styles/Classroom.css";

const Classroom = ({ role, userId }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("NOT_STARTED");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const initialized = useRef(false);
  const initTimeoutRef = useRef(null);
  const joinEmittedRef = useRef(false);

  useEffect(() => {
    if (!socket || !connected || !roomId || !userId || !role) {
      return;
    }

    if (!joinEmittedRef.current) {
      console.log(`Emitting join-room for ${role} ${userId} to room ${roomId}`);
      socket.emit("join-room", { roomId, userId, role });
      joinEmittedRef.current = true;
    }

    const setupSocketListeners = () => {
      socket.on("room-update", (response) => {
        console.log("Received room-update:", response);
        const data = response.data || response;
        setTeachers(data.teachers || []);
        setStudents(data.students || []);
        setIsActive(data.isActive || false);
        setStatus(data.status || "NOT_STARTED");
      });

      socket.on("classroom-created", (response) => {
        console.log("Received classroom-created:", response);
        setNotification(response.message || "Classroom created successfully");
        setTimeout(() => setNotification(null), 3000);
      });

      socket.on("join-success", (response) => {
        console.log("Received join-success:", response);
        const data = response.data || {};

        if (data.teachers) setTeachers(data.teachers);
        if (data.students) setStudents(data.students);
        if (data.isActive !== undefined) setIsActive(data.isActive);
        if (data.status) setStatus(data.status);

        setNotification(response.message || "Successfully joined classroom");
        setLoading(false);
        initialized.current = true;

        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
        }

        setTimeout(() => setNotification(null), 3000);
      });

      // Handle class started event
      socket.on("class-started", (response) => {
        console.log("Received class-started:", response);
        setIsActive(true);
        setStatus("ONGOING");
        setNotification(response.message || "Class has started");
        setTimeout(() => setNotification(null), 3000);
      });

      // Handle class ended event
      socket.on("class-ended", (response) => {
        console.log("Received class-ended:", response);
        setIsActive(false);
        setStatus("ENDED");
        if (role === "STUDENT") {
          setError(response.message || "The class has ended.");
        } else if (role === "TEACHER") {
          setNotification(
            response.message || "Class has been ended successfully"
          );
          setTimeout(() => setNotification(null), 3000);
        }
      });

      socket.on("join-denied", (response) => {
        console.log("Received join-denied:", response);
        setError(response.message || "Could not join the class");
        setLoading(false);
      });

      socket.on("error", (response) => {
        console.log("Received error:", response);
        setError(response.message || "An error occurred");
        setLoading(false);
      });

      // Handle successful leave
      socket.on("leave-success", (response) => {
        console.log("Received leave-success, navigating to home");
        navigate("/");
      });
    };

    setupSocketListeners();

    if (!initialized.current) {
      initTimeoutRef.current = setTimeout(() => {
        if (loading && !initialized.current) {
          console.log("Socket initialization timed out, falling back to API");
          initializeWithAPI();
        }
      }, 5000);
    }

    return () => {
      console.log("Cleaning up socket listeners and timeouts");
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }

      socket.off("room-update");
      socket.off("classroom-created");
      socket.off("join-success");
      socket.off("class-started");
      socket.off("class-ended");
      socket.off("join-denied");
      socket.off("error");
      socket.off("leave-success");
    };
  }, [socket, connected, roomId, userId, role, navigate]);

  const initializeWithAPI = async () => {
    try {
      console.log("Initializing classroom via API");
      const response = await classroomAPI
        .getClassroomStatus(roomId, role)
        .catch((err) => {
          if (err.status === 404 && role === "TEACHER") {
            return classroomAPI.createClassroom(roomId, role);
          }
          throw err;
        });

      const responseData = response.data.data || response.data;

      if (responseData) {
        setIsActive(responseData.isActive || false);
        setStatus(responseData.status || "NOT_STARTED");
      }

      setLoading(false);
      initialized.current = true;
    } catch (error) {
      console.error("Error initializing classroom:", error);
      setError(
        error.response?.data?.message ||
          "Failed to initialize classroom. Please try again."
      );
      setLoading(false);
    }
  };

  // Handle reconnection
  useEffect(() => {
    if (
      connected &&
      error === "Lost connection to the server. Please reload the page."
    ) {
      setError(null);
      if (socket && roomId && userId && role) {
        console.log("Reconnected, rejoining room");
        socket.emit("join-room", { roomId, userId, role });
      }
    }
  }, [connected, socket, roomId, userId, role, error]);

  // Handle leaving
  const handleLeaveRoom = () => {
    console.log("User clicked leave room button");
    if (socket && connected) {
      socket.emit("leave-room");
    } else {
      navigate("/");
    }
  };

  const handleStartClass = () => {
    if (socket && connected) {
      console.log("Emitting start-class event");
      socket.emit("start-class", { roomId });
    }
  };

  const handleEndClass = () => {
    if (socket && connected) {
      console.log("Emitting end-class event");
      socket.emit("end-class", { roomId });
    }
  };

  if (loading) {
    return <div className="loading">Initializing classroom...</div>;
  }

  if (error) {
    return (
      <div className="classroom-error">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="classroom-container">
      <h1>Classroom</h1>

      <div className="user-info-panel">
        <div className="room-info">
          <span className="info-label">Room ID:</span>
          <span className="info-value">{roomId}</span>
        </div>
        <div className="user-info">
          <span className="info-label">Logged in as:</span>
          <span className="info-value">{userId}</span>
          <span className="user-role">{role}</span>
        </div>
      </div>

      {notification && (
        <div className="notification-banner">
          <p>{notification}</p>
          <button onClick={() => setNotification(null)}>Dismiss</button>
        </div>
      )}
      <div className="classroom-status">
        <span className={`status-indicator ${status.toLowerCase()}`}></span>
        <p>Status: {status.replace("_", " ")}</p>
        <p className="connection-status">
          {connected ? (
            <span className="connected">Connected</span>
          ) : (
            <span className="disconnected">Disconnected</span>
          )}
        </p>
      </div>

      {role === "TEACHER" && (
        <div className="classroom-controls">
          <button
            className="start-btn"
            onClick={handleStartClass}
            disabled={
              isActive ||
              status === "ONGOING" ||
              status === "ENDED" ||
              !connected
            }
          >
            Start Class
          </button>
          <button
            className="end-btn"
            onClick={handleEndClass}
            disabled={!isActive || status !== "ONGOING" || !connected}
          >
            End Class
          </button>
        </div>
      )}

      <div className="classroom-lists">
        <div className="list-container">
          <h2>Student List</h2>
          <ul className="participant-list">
            {students.length > 0 ? (
              students.map((student, index) => (
                <li key={`student-${index}`}>{student}</li>
              ))
            ) : (
              <li className="empty-list">No students yet</li>
            )}
          </ul>
        </div>

        <div className="list-container">
          <h2>Teacher List</h2>
          <ul className="participant-list">
            {teachers.length > 0 ? (
              teachers.map((teacher, index) => (
                <li key={`teacher-${index}`}>{teacher}</li>
              ))
            ) : (
              <li className="empty-list">No teachers yet</li>
            )}
          </ul>
        </div>
      </div>

      <button
        className="leave-btn"
        onClick={handleLeaveRoom}
        disabled={!connected}
      >
        Leave Room
      </button>
    </div>
  );
};

export default Classroom;

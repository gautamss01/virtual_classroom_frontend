import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { classroomAPI } from "../services/api";
import "../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!roomId || !userId) {
      setError("Room ID and User ID are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (role === "TEACHER") {
        const response = await classroomAPI.createClassroom(roomId, role);

        const classStatus = response.data?.data?.status || "";
        if (classStatus === "ENDED") {
          setError("This class has already ended and cannot be joined.");
          setLoading(false);
          return;
        }
      } else {
        const response = await classroomAPI.getClassroomStatus(roomId, role);

        const classStatus = response.data?.data?.status || "";
        if (classStatus === "ENDED") {
          setError("This class has already ended and cannot be joined.");
          setLoading(false);
          return;
        }
      }

      localStorage.setItem("userId", userId);
      localStorage.setItem("role", role);
      navigate(`/classroom/${roomId}`);
    } catch (error) {
      console.error("Error joining classroom:", error);

      setError(
        error.response?.data?.message ||
          "Failed to join classroom. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const goToReports = () => {
    if (!roomId) {
      setError("Room ID is required to view reports");
      return;
    }
    navigate(`/reports/${roomId}`);
  };

  return (
    <div className="home-container">
      <h1>Virtual Classroom</h1>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter a unique room ID"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="userId">Your Name</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Select Role</label>
            <div className="role-selection">
              <label
                className={`role-option ${role === "STUDENT" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="role"
                  value="STUDENT"
                  checked={role === "STUDENT"}
                  onChange={() => setRole("STUDENT")}
                  disabled={loading}
                />
                Student
              </label>
              <label
                className={`role-option ${role === "TEACHER" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="role"
                  value="TEACHER"
                  checked={role === "TEACHER"}
                  onChange={() => setRole("TEACHER")}
                  disabled={loading}
                />
                Teacher
              </label>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="join-btn" disabled={loading}>
            {loading
              ? "Joining..."
              : role === "TEACHER"
              ? "Create/Join Classroom"
              : "Join Classroom"}
          </button>
        </form>

        <div className="reports-section">
          <h3>View Class Reports</h3>
          <p>
            Enter a Room ID above and click the button below to view reports
          </p>
          <button
            onClick={goToReports}
            className="reports-btn"
            disabled={loading}
          >
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;

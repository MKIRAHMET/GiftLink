import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Profile.css'

import { useAppContext } from '../../context/AuthContext';
const backendUrl = process.env.REACT_APP_BACKEND_URL

const Profile = () => {
  const [userDetails, setUserDetails] = useState({});
  const [updatedDetails, setUpdatedDetails] = useState({});
  const { setUserName } = useAppContext();
  const [changed, setChanged] = useState("");
  const authtoken = sessionStorage.getItem("auth-token");
  const email = sessionStorage.getItem("email");
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authtoken) {
      navigate("/app/login");
    } else {
      fetchUserProfile();
    }
    // eslint-disable-next-line
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      const name = sessionStorage.getItem('name');
      if (name || authtoken) {
        const storedUserDetails = {
          name: name,
          email: email
        };
        setUserDetails(storedUserDetails);
        setUpdatedDetails(storedUserDetails);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleInputChange = (e) => {
    setUpdatedDetails({
      ...updatedDetails,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
     const response = await fetch(`${backendUrl}/api/auth/update`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authtoken}`,
          "Content-Type": "application/json",
          "Email": email,
        },
        body: JSON.stringify(updatedDetails),
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.authtoken;
        sessionStorage.setItem("auth-token", newToken);
        sessionStorage.setItem("email", updatedDetails.email);
        sessionStorage.setItem("name", updatedDetails.name);

        setUserName(updatedDetails.name);
        setUserDetails(updatedDetails);
        setEditMode(false);

        setChanged("Name Changed Successfully!");
        setTimeout(() => {
          setChanged("");
          navigate("/");
        }, 1000);
      } else {
        setChanged("Failed to update profile");
        setTimeout(() => setChanged(""), 2000);
      }
    } catch (e) {
      setChanged("Error updating details: " + e.message);
      setTimeout(() => setChanged(""), 2000);
    }
  };

  return (
    <div className="profile-container">
      {editMode ? (
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={userDetails.email}
              disabled // Disable the email field
            />
          </label>
          <label>
            Name
            <input
              type="text"
              name="name"
              value={updatedDetails.name}
              onChange={handleInputChange}
            />
          </label>
          <button type="submit">Save</button>
        </form>
      ) : (
        <div className="profile-details">
          <h1>Hi, {userDetails.name}</h1>
          <p> <b>Email:</b> {userDetails.email}</p>
          <button onClick={handleEdit}>Edit</button>
          <span style={{ color: 'green', height: '.5cm', display: 'block', fontStyle: 'italic', fontSize: '12px' }}>{changed}</span>
        </div>
      )}
    </div>
  );
};

export default Profile;

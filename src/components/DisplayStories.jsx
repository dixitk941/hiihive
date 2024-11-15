import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const DisplayStories = ({ currentUser }) => {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const storiesRef = collection(db, "stories");
    const q = query(storiesRef, where("uid", "==", currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storiesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStories(storiesData);
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  return (
    <div className="story-container">
      {stories.map((story) => (
        <div key={story.id} className="story-card">
          <img src={story.avatar} alt="User avatar" className="avatar" />
          <img src={story.url} alt="Story content" className="story-content" />
        </div>
      ))}
    </div>
  );
};

export default DisplayStories;

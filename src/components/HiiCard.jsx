import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyB--KSDIQ_rkc1myOfFBgNjUka30VAKOtM",
  authDomain: "fragveda.firebaseapp.com",
  projectId: "fragveda",
  storageBucket: "fragveda.appspot.com",
  messagingSenderId: "709002213779",
  appId: "1:709002213779:web:314ffb4f33c4b117cd5066",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const HiiCard = ({ avatarUrl, username, fullName, bio, userId }) => {
  const [followersCount, setFollowersCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const qrValue = userId ? `https://hiihive.vercel.app/user/${userId}` : "";
  const referralLink = userId
    ? `https://hiihive.vercel.app/refer?ref=${userId}`
    : "";

  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        try {
          const userDocRef = doc(db, "users", userId);
          const userSnapshot = await getDoc(userDocRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            setFollowersCount(userData.followers?.length || 0);
            setFollowingCount(userData.following?.length || 0);
          } else {
            console.error("User not found");
          }

          const postsCollectionRef = collection(db, "users", userId, "posts");
          const postsSnapshot = await getDocs(postsCollectionRef);
          setPostsCount(postsSnapshot.size);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [userId]);

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert("Referral link copied! Share it with your friends.");
  };

  return (
    <div className="max-w-full sm:max-w-md mx-auto bg-[#121212] p-6 sm:p-8 rounded-3xl shadow-2xl text-white border-2 border-transparent hover:border-purple-500 transition-all">
      <div className="flex justify-center items-center mb-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 drop-shadow-md">
          Hive Card
        </h2>
      </div>

      <div className="flex justify-center my-4">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-purple-500 shadow-2xl transform transition-all hover:scale-105">
          <img
            src={avatarUrl || "/default-profile.jpg"}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-2xl sm:text-3xl font-bold text-white">
          {fullName || "Full Name"}
        </h3>
        <p className="text-base sm:text-lg text-white/70">
          @{username || "username"}
        </p>
        <p className="text-sm mt-1 text-white/50">{bio || "Your bio here..."}</p>
      </div>

      <div className="mt-6 flex justify-around text-center">
        <div>
          <h4 className="text-lg sm:text-xl font-bold text-white">
            {followersCount}
          </h4>
          <p className="text-sm text-white/70">Followers</p>
        </div>
        <div>
          <h4 className="text-lg sm:text-xl font-bold text-white">
            {postsCount}
          </h4>
          <p className="text-sm text-white/70">Posts</p>
        </div>
        <div>
          <h4 className="text-lg sm:text-xl font-bold text-white">
            {followingCount}
          </h4>
          <p className="text-sm text-white/70">Following</p>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 bg-gradient-to-r from-purple-500 via-pink-600 to-red-500 p-2 rounded-lg shadow-xl transform transition-all hover:scale-105 flex items-center justify-center">
          {qrValue && (
            <QRCodeCanvas
              value={qrValue}
              size={140}
              bgColor="transparent"
              fgColor="#ffffff"
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={handleCopyReferralLink}
          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-2 px-4 rounded shadow hover:opacity-90 transition"
        >
          Refer & Earn Rewards
        </button>
        <p className="mt-4 text-sm text-white/80">
          Share your referral link to get awesome rewards!
        </p>
      </div>
    </div>
  );
};

export default HiiCard;

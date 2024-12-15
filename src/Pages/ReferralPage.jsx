// ReferralPage.jsx
import React, { useState, useEffect } from "react";

const ReferralPage = ({ user }) => {
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    // Generate a referral code based on the user's UID
    // You can customize the code format (e.g., add a prefix or random characters)
    setReferralCode(user.uid.substring(0, 8).toUpperCase()); // Example: First 8 characters of UID
  }, [user]);

  return (
    <div className="max-w-lg mx-auto p-6 bg-[#121212] text-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-4">Refer & Earn Rewards</h2>
      <p className="text-center mb-6">Share your referral code and earn awesome rewards when your friends join!</p>

      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Your Referral Code</h3>
        <input
          type="text"
          readOnly
          value={referralCode}
          className="bg-transparent border-2 border-purple-500 text-white p-2 rounded-lg w-full text-center"
        />
      </div>

      <div className="text-center mb-6">
        <p className="text-sm text-white/70">Share this code with your friends to refer them!</p>
      </div>

      <p className="text-center text-sm text-white/70">
        Copy the code above and share it with your friends when they sign up.
      </p>
    </div>
  );
};

export default ReferralPage;

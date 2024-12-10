import React from "react";
import { QRCodeCanvas } from "qrcode.react";

const HiiCard = ({ avatarUrl, username, fullName, bio }) => {
  const qrValue = `https://hiihive.vercel.app/user/${username}`;

  return (
    <div className="max-w-sm mx-auto bg-gradient-to-r from-purple-500 via-pink-600 to-red-500 p-6 rounded-2xl shadow-lg text-white">
      {/* Header */}
      <div className="flex justify-center items-center mb-4">
        <h2 className="text-2xl font-bold text-center">Hive Card</h2>
      </div>

      {/* Avatar Section */}
      <div className="flex justify-center my-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white">
          <img
            src={avatarUrl || "/default-profile.jpg"}
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="text-center space-y-1">
        <h3 className="text-xl font-semibold">{fullName || "Full Name"}</h3>
        <p className="text-sm text-white/80">@{username || "username"}</p>
        <p className="text-xs mt-1 text-white/60">{bio || "Your bio here..."}</p>
      </div>

      {/* Branding */}
      <div className="mt-4 text-center">
        <p className="text-sm font-medium">Proud Member of</p>
        <h3 className="text-md font-semibold">HiiHive Community</h3>
      </div>

      {/* QR Code Section */}
      <div className="flex justify-center mt-6">
        <div className="relative w-40 h-40 bg-gradient-to-r from-purple-500 via-pink-600 to-red-500 p-2 rounded-lg shadow-xl mb-4">
          <QRCodeCanvas
            value={qrValue}
            size={180}
            bgColor="transparent"
            fgColor="#ffffff"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 text-center">
        <p className="text-sm">Scan the QR code to connect with us!</p>
      </div>
    </div>
  );
};

export default HiiCard;

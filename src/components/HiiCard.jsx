import React from "react";
import { QRCodeCanvas } from "qrcode.react";

const HiiCard = ({ avatarUrl, username, fullName, bio, userId }) => {
  const qrValue = userId ? `https://hiihive.vercel.app/user/${userId}` : '';
  // console.log('QR Value:', qrValue); // Debugging log
  // console.log('User ID:', userId); // Debugging log

  return (
    <div className="max-w-full sm:max-w-md mx-auto bg-[#121212] p-6 sm:p-8 rounded-3xl shadow-2xl text-white border-2 border-transparent hover:border-purple-500 transition-all">
      {/* Header */}
      <div className="flex justify-center items-center mb-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 drop-shadow-md">
          Hive Card
        </h2>
      </div>

      {/* Avatar Section */}
      <div className="flex justify-center my-4">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-purple-500 shadow-2xl transform transition-all hover:scale-105">
          <img
            src={avatarUrl || "/default-profile.jpg"}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="text-center space-y-1">
        <h3 className="text-2xl sm:text-3xl font-bold text-white">
          {fullName || "Full Name"}
        </h3>
        <p className="text-base sm:text-lg text-white/70">@{username || "username"}</p>
        <p className="text-sm mt-1 text-white/50">{bio || "Your bio here..."}</p>
      </div>

      {/* Branding */}
      <div className="mt-4 text-center">
        <p className="text-sm sm:text-base font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Proud Member of
        </p>
        <h3 className="text-lg sm:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
          HiiHive Community
        </h3>
      </div>

      {/* QR Code Section */}
      <div className="flex justify-center mt-6">
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 bg-gradient-to-r from-purple-500 via-pink-600 to-red-500 p-2 rounded-lg shadow-xl transform transition-all hover:scale-105 flex items-center justify-center">
          {qrValue && (
            <QRCodeCanvas
              value={qrValue}
              size={140} // Adjust QR size
              bgColor="transparent"
              fgColor="#ffffff"
              className="w-full h-full object-contain" // Ensure it fills the container proportionally
            />
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 text-center">
        <p className="text-sm sm:text-base text-white/80">Scan the QR code to connect with us!</p>
      </div>
    </div>
  );
};

export default HiiCard;

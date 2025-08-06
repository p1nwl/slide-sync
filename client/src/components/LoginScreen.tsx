import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePresentationStore } from "../store/presentationStore";

export const LoginScreen = () => {
  const [nickname, setNickname] = useState("");
  const navigate = useNavigate();
  const { setUserInfo } = usePresentationStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      const userId = `user_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setUserInfo(userId, nickname.trim());
      navigate("/presentations");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Collaborative Presentation
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your nickname to start
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="nickname"
                className="block text-sm font-medium text-gray-700"
              >
                Nickname
              </label>
              <div className="mt-1">
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Enter Presentation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

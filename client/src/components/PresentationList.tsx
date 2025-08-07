import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { usePresentationStore } from "../store/presentationStore";
import type { Presentation, Slide, PresentationElement } from "../types/index";

export const PresentationList = () => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [newPresentationTitle, setNewPresentationTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { nickname, userId, clearUserInfo } = usePresentationStore();

  const loadPresentations = React.useCallback(async () => {
    try {
      const data = await api.getPresentations();
      setPresentations(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error("Failed to load presentations:", error);
    }
  }, []);

  useEffect(() => {
    loadPresentations();
  }, [loadPresentations]);

  const handleCreatePresentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresentationTitle.trim() || !nickname || !userId) {
      console.error("Missing data for presentation creation:", {
        title: newPresentationTitle,
        nickname,
        userId: !!userId,
      });
      return;
    }

    try {
      setLoading(true);
      const newPresentation = await api.createPresentation(
        newPresentationTitle,
        nickname,
        userId
      );
      navigate(`/presentation/${newPresentation._id}`);
    } catch (error) {
      console.error("[UI] Failed to create presentation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPresentation = (presentationId: string) => {
    navigate(`/presentation/${presentationId}`);
  };

  const handleLogout = () => {
    clearUserInfo();
    navigate("/");
  };

  const generateSlidePreview = (slide: Slide | undefined) => {
    if (!slide || !slide.elements || slide.elements.length === 0) {
      return (
        <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center border">
          <span className="text-xs text-gray-400">Empty</span>
        </div>
      );
    }

    return (
      <div className="w-16 h-12 bg-white border rounded relative overflow-hidden">
        {slide.elements
          .slice(0, 3)
          .map((element: PresentationElement, index: number) => {
            const scaleFactor = 0.02;

            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left: `${(element.position?.x || 0) * scaleFactor}%`,
                  top: `${(element.position?.y || 0) * scaleFactor}%`,
                  width: element.size
                    ? `${(element.size.width || 20) * scaleFactor}%`
                    : "auto",
                  height: element.size
                    ? `${(element.size.height || 20) * scaleFactor}%`
                    : "auto",
                  ...element.style,
                  border: element.style?.border || "none",
                  borderRadius: element.style?.borderRadius || "0",
                  backgroundColor:
                    element.style?.backgroundColor || "transparent",
                  fontSize: "2px",
                }}
              >
                {element.type === "text" && (
                  <div className="w-full h-full flex items-center justify-center overflow-hidden">
                    <span className="truncate">T</span>
                  </div>
                )}
                {element.type === "image" && (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-[2px]">🖼</span>
                  </div>
                )}
                {(element.type === "rectangle" ||
                  element.type === "circle") && (
                  <div className="w-full h-full" />
                )}
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {nickname}!
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600">
            Create or join a collaborative presentation
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Create New Presentation
          </h2>
          <form onSubmit={handleCreatePresentation} className="flex gap-4">
            <input
              type="text"
              value={newPresentationTitle}
              onChange={(e) => setNewPresentationTitle(e.target.value)}
              placeholder="Enter presentation title"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </form>
        </div>
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Available Presentations
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {presentations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No presentations available yet</p>
              </div>
            ) : (
              presentations.map((presentation) => (
                <div
                  key={presentation._id}
                  className="px-6 py-4 flex justify-between items-center"
                >
                  <div className="flex items-center space-x-4">
                    {generateSlidePreview(presentation.slides?.[0])}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {presentation.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created{" "}
                        {new Date(presentation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinPresentation(presentation._id!)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Join
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

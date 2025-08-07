import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePresentation } from "../hooks/usePresentation";
import { useHistory } from "../hooks/useHistory";
import { usePresentationStore } from "../store/presentationStore";
import { useSocket } from "../hooks/useSocket";
import { SlideEditor } from "./SlideEditor";
import { UserList } from "./UserList";
import { SlidesList } from "./SlideList";
import { PresentationMode } from "./PresentationMode";
import type { PresentationElement } from "../types/index";
import html2pdf from "html2pdf.js";

export const PresentationEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const { userId, nickname } = usePresentationStore();
  const hasJoinedRef = useRef(false);

  const {
    presentation,
    loading,
    error,
    currentSlideIndex,
    setCurrentSlideIndex,
    handleAddSlide,
    handleRemoveSlide,
    handleChangeUserRole,
    updateCurrentSlide,
  } = usePresentation(id);

  const { joinPresentation, leavePresentation } = useSocket();

  const {
    slides: historySlides,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory(presentation?.slides || []);

  useEffect(() => {
    if (presentation?.slides) {
      pushHistory(presentation.slides);
    }
  }, [presentation?.slides, pushHistory]);

  useEffect(() => {
    if (id && userId && nickname) {
      joinPresentation(id, userId, nickname);
      hasJoinedRef.current = true;
    }

    return () => {
      if (id && userId && hasJoinedRef.current) {
        leavePresentation(id, userId);
      }
      hasJoinedRef.current = false;
    };
  }, [id, userId, nickname, joinPresentation, leavePresentation]);

  useEffect(() => {
    if (presentation && userId) {
      const currentUser = presentation.users.find((u) => u.id === userId);
      if (!currentUser) {
        console.warn("User not found in presentation, redirecting...");
        navigate("/presentations");
      }
    }
  }, [presentation, userId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading presentation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Presentation not found</div>
      </div>
    );
  }

  if (isPresentationMode) {
    return (
      <PresentationMode
        presentation={{ ...presentation, slides: historySlides }}
        currentSlideIndex={0}
        setCurrentSlideIndex={setCurrentSlideIndex}
        onExit={() => setIsPresentationMode(false)}
      />
    );
  }

  const currentUser = presentation.users.find((u) => u.id === userId);
  const isCreator = currentUser?.role === "creator";
  const isEditor = currentUser?.role === "editor" || isCreator;

  const handleAddNewSlide = () => {
    if (isCreator && userId) {
      handleAddSlide(userId);
    }
  };

  const handleRemoveCurrentSlide = () => {
    if (isCreator && userId && presentation.slides.length > 1) {
      handleRemoveSlide(currentSlideIndex, userId);
      if (currentSlideIndex >= presentation.slides.length - 1) {
        setCurrentSlideIndex(Math.max(0, presentation.slides.length - 2));
      }
    }
  };

  const handleUpdateCurrentSlideLocally = (elements: PresentationElement[]) => {
    if (!presentation) return;

    const newSlides = [...historySlides];
    newSlides[currentSlideIndex] = {
      ...newSlides[currentSlideIndex],
      elements,
    };

    pushHistory(newSlides);
  };

  const handleUpdateCurrentSlide = (elements: PresentationElement[]) => {
    if (!presentation || !id) return;
    handleUpdateCurrentSlideLocally(elements);
    updateCurrentSlide(elements);
  };

  const exportToPDF = () => {
    if (!presentation) return;

    const element = document.createElement("div");
    element.style.width = "1200px";
    element.style.minHeight = "800px";
    element.style.padding = "40px";
    element.style.backgroundColor = "white";

    presentation.slides.forEach((slide) => {
      const slideDiv = document.createElement("div");
      slideDiv.style.position = "relative";
      slideDiv.style.width = "100%";
      slideDiv.style.height = "720px";
      slideDiv.style.marginBottom = "40px";
      slideDiv.style.border = "1px solid #ccc";

      slide.elements.forEach((element) => {
        const elDiv = document.createElement("div");
        elDiv.style.position = "absolute";
        elDiv.style.left = `${element.position.x}px`;
        elDiv.style.top = `${element.position.y}px`;
        elDiv.style.width = element.size?.width
          ? `${element.size.width}px`
          : "auto";
        elDiv.style.height = element.size?.height
          ? `${element.size.height}px`
          : "auto";

        Object.entries(element.style || {}).forEach(([key, value]) => {
          elDiv.style.setProperty(key, value);
        });

        if (element.type === "text") {
          elDiv.textContent = element.content || "";
        } else if (element.type === "image") {
          const img = document.createElement("img");
          img.src = element.content || "";
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "contain";
          elDiv.appendChild(img);
        }

        slideDiv.appendChild(elDiv);
      });

      element.appendChild(slideDiv);
    });

    const opt = {
      margin: 10,
      filename: `${presentation.title}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">{presentation.title}</h1>
          {isCreator && (
            <div className="flex space-x-2">
              <button
                onClick={handleAddNewSlide}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Add Slide
              </button>
              {presentation.slides.length > 1 && (
                <button
                  onClick={handleRemoveCurrentSlide}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  disabled={presentation.slides.length <= 1}
                >
                  Remove Slide
                </button>
              )}
              <button
                onClick={exportToPDF}
                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
              >
                Export PDF
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isEditor && (
            <div className="flex space-x-1">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="px-2 py-1 bg-gray-200 rounded text-sm disabled:opacity-50"
                title="Undo"
              >
                ↶
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="px-2 py-1 bg-gray-200 rounded text-sm disabled:opacity-50"
                title="Redo"
              >
                ↷
              </button>
            </div>
          )}
          <button
            onClick={() => setIsPresentationMode(true)}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
          >
            Present
          </button>
          <span className="text-sm text-gray-600">
            {nickname} ({currentUser?.role})
          </span>
          <button
            onClick={() => navigate("/presentations")}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            Exit
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <SlidesList
            slides={presentation.slides}
            currentSlideIndex={currentSlideIndex}
            setCurrentSlideIndex={setCurrentSlideIndex}
            isCreator={isCreator}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {presentation && presentation.slides[currentSlideIndex] ? (
            <SlideEditor
              slide={presentation.slides[currentSlideIndex]}
              isEditor={isEditor}
              onUpdateSlide={handleUpdateCurrentSlide}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-gray-500">Loading slide...</div>
            </div>
          )}
        </div>

        <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
          <UserList
            users={presentation.users}
            currentUserId={userId}
            isCreator={isCreator}
            onChangeUserRole={handleChangeUserRole}
          />
        </div>
      </div>
    </div>
  );
};

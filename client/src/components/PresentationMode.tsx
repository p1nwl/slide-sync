import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Presentation, Slide } from "../types/index";

interface PresentationModeProps {
  presentation: Presentation;
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
}

export const PresentationMode = ({
  presentation,
  currentSlideIndex,
  setCurrentSlideIndex,
}: PresentationModeProps) => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const exitPresentationMode = useCallback(() => {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(false);
    navigate(`/presentation/${presentation._id}`);
  }, [navigate, presentation._id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (currentSlideIndex < presentation.slides.length - 1) {
          setCurrentSlideIndex(currentSlideIndex + 1);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentSlideIndex > 0) {
          setCurrentSlideIndex(currentSlideIndex - 1);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        exitPresentationMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentSlideIndex,
    presentation.slides.length,
    setCurrentSlideIndex,
    exitPresentationMode,
  ]);

  const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const currentSlide: Slide = presentation.slides[currentSlideIndex];

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 flex justify-between items-center">
        <div className="text-sm">
          Slide {currentSlideIndex + 1} of {presentation.slides.length}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={enterFullscreen}
            className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
          <button
            onClick={exitPresentationMode}
            className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700"
          >
            Exit Presentation
          </button>
        </div>
      </div>

      <div className="h-full flex items-center justify-center p-8">
        <div
          className="bg-white shadow-2xl relative"
          style={{
            width: "90vw",
            height: "80vh",
            maxWidth: "1200px",
            maxHeight: "800px",
          }}
        >
          {currentSlide.elements.map((element) => (
            <div
              key={element._id}
              className="absolute"
              style={{
                left: `${element.position.x}px`,
                top: `${element.position.y}px`,
                width: element.size?.width ? `${element.size.width}px` : "auto",
                height: element.size?.height
                  ? `${element.size.height}px`
                  : "auto",
                ...element.style,
              }}
            >
              {element.type === "text" && (
                <div className="w-full h-full overflow-hidden">
                  {element.content}
                </div>
              )}
              {element.type === "image" && (
                <img
                  src={element.content || "https://via.placeholder.com/150"}
                  alt="Presentation element"
                  className="w-full h-full object-contain"
                />
              )}
              {element.type === "rectangle" && (
                <div className="w-full h-full"></div>
              )}
              {element.type === "circle" && (
                <div className="w-full h-full rounded-full"></div>
              )}
              {element.type === "arrow" && (
                <div className="w-full h-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 flex justify-center space-x-4">
        <button
          onClick={() =>
            currentSlideIndex > 0 && setCurrentSlideIndex(currentSlideIndex - 1)
          }
          disabled={currentSlideIndex === 0}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          ← Previous
        </button>
        <button
          onClick={() =>
            currentSlideIndex < presentation.slides.length - 1 &&
            setCurrentSlideIndex(currentSlideIndex + 1)
          }
          disabled={currentSlideIndex === presentation.slides.length - 1}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

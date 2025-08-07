import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Presentation, Slide } from "../types/index";

interface PresentationModeProps {
  presentation: Presentation;
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
  onExit?: () => void;
  initialSlideIndex?: number;
}

export const PresentationMode = ({
  presentation,
  onExit,
  initialSlideIndex = 0,
}: PresentationModeProps) => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSlideIndex, setLocalSlideIndex] = useState(initialSlideIndex);

  const checkFullscreen = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  const handleExitPresentation = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error("Error exiting fullscreen:", err);
      });
    }

    if (onExit) {
      onExit();
    } else {
      navigate(`/presentation/${presentation._id}`);
    }
  }, [onExit, navigate, presentation._id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setLocalSlideIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < presentation.slides.length) {
            return nextIndex;
          }
          return prevIndex;
        });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setLocalSlideIndex((prevIndex) => {
          const prevIndexValue = prevIndex - 1;
          if (prevIndexValue >= 0) {
            return prevIndexValue;
          }
          return prevIndex;
        });
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleExitPresentation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [presentation.slides.length, handleExitPresentation]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      checkFullscreen();
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, [checkFullscreen]);

  const handleEnterFullscreen = async () => {
    const element = document.documentElement;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ("webkitRequestFullscreen" in element) {
        await (
          element as HTMLElement & {
            webkitRequestFullscreen: () => Promise<void>;
          }
        ).webkitRequestFullscreen();
      } else if ("mozRequestFullScreen" in element) {
        await (
          element as HTMLElement & { mozRequestFullScreen: () => Promise<void> }
        ).mozRequestFullScreen();
      } else if ("msRequestFullscreen" in element) {
        await (
          element as HTMLElement & { msRequestFullscreen: () => Promise<void> }
        ).msRequestFullscreen();
      }
    } catch (err) {
      let message = "Unknown error";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      }
      console.error("Error entering fullscreen:", err);
      setError(`Failed to enter fullscreen: ${message}`);
    }
  };

  const handleExitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ("webkitExitFullscreen" in document) {
        await (
          document as Document & { webkitExitFullscreen: () => Promise<void> }
        ).webkitExitFullscreen();
      } else if ("mozCancelFullScreen" in document) {
        await (
          document as Document & { mozCancelFullScreen: () => Promise<void> }
        ).mozCancelFullScreen();
      } else if ("msExitFullscreen" in document) {
        await (
          document as Document & { msExitFullscreen: () => Promise<void> }
        ).msExitFullscreen();
      }
    } catch (err) {
      let message = "Unknown error";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      }
      console.error("Error exiting fullscreen:", err);
      setError(`Failed to exit fullscreen: ${message}`);
    }
  };

  const renderSlideContent = (slide: Slide) => {
    return (
      <div className="relative w-full h-full">
        {slide.elements.map((element) => (
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
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 flex justify-between items-center">
        <div className="text-sm">
          Slide {localSlideIndex + 1} of {presentation.slides.length}
        </div>
        <div className="flex space-x-2">
          {!isFullscreen ? (
            <button
              onClick={handleEnterFullscreen}
              className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
            >
              Fullscreen
            </button>
          ) : (
            <button
              onClick={handleExitFullscreen}
              className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
            >
              Exit Fullscreen
            </button>
          )}
          <button
            onClick={handleExitPresentation}
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
          {renderSlideContent(presentation.slides[localSlideIndex])}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 flex justify-center space-x-4">
        <button
          onClick={() =>
            localSlideIndex > 0 && setLocalSlideIndex(localSlideIndex - 1)
          }
          disabled={localSlideIndex === 0}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          ← Previous
        </button>
        <button
          onClick={() =>
            localSlideIndex < presentation.slides.length - 1 &&
            setLocalSlideIndex(localSlideIndex + 1)
          }
          disabled={localSlideIndex === presentation.slides.length - 1}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Next →
        </button>
      </div>
      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white p-2 rounded text-sm">
          Error: {error}
        </div>
      )}
    </div>
  );
};

import type { Slide } from "../types/index";

interface SlidesListProps {
  slides: Slide[];
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
  isCreator: boolean;
}

export const SlidesList = ({
  slides,
  currentSlideIndex,
  setCurrentSlideIndex,
}: SlidesListProps) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Slides ({slides.length})</h2>
      <div className="space-y-2">
        {slides.map((slide, index) => (
          <div
            key={slide._id || index}
            className={`p-3 border rounded cursor-pointer transition-colors ${
              currentSlideIndex === index
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => setCurrentSlideIndex(index)}
          >
            <div className="text-sm font-medium">Slide {index + 1}</div>
            <div className="text-xs text-gray-500 mt-1">
              {slide.elements.length} elements
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

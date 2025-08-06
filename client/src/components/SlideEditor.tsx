import React, { useState, useRef } from "react";
import MarkdownIt from "markdown-it";
import type { Slide, PresentationElement } from "../types/index";

const md = new MarkdownIt();

interface SlideEditorProps {
  slide: Slide;
  isEditor: boolean;
  onUpdateSlide: (elements: PresentationElement[]) => void;
}

export const SlideEditor = ({
  slide,
  isEditor,
  onUpdateSlide,
}: SlideEditorProps) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [draggingElementId, setDraggingElementId] = useState<string | null>(
    null
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [zoom, setZoom] = useState(100);
  const slideRef = useRef<HTMLDivElement>(null);

  console.log("Rendering SlideEditor with slide:", slide);

  if (!slide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Select a slide to edit</div>
      </div>
    );
  }

  const handleElementClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditor) {
      setSelectedElementId(elementId);
      setShowStylePanel(true);
    }
  };

  const handleSlideClick = () => {
    setSelectedElementId(null);
    setShowStylePanel(false);
  };

  const handleDragStart = (elementId: string, e: React.MouseEvent) => {
    if (!isEditor) return;

    const element = slide.elements.find((el) => el._id === elementId);
    if (!element) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDraggingElementId(elementId);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!draggingElementId || !isEditor || !slideRef.current) return;

    e.preventDefault();
    const slideRect = slideRef.current.getBoundingClientRect();
    const newX = e.clientX - slideRect.left - dragOffset.x;
    const newY = e.clientY - slideRect.top - dragOffset.y;

    updateElement(draggingElementId, {
      position: { x: Math.max(0, newX), y: Math.max(0, newY) },
    });
  };

  const handleDragEnd = () => {
    setDraggingElementId(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const addTextElement = () => {
    if (!isEditor) return;

    const newTextElement: PresentationElement = {
      _id: `element_${Date.now()}`,
      type: "text",
      content: "New text",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 50 },
      style: {
        border: "1px dashed #ccc",
        padding: "8px",
        borderRadius: "4px",
        backgroundColor: "#ffffff",
        fontSize: "16px",
        fontFamily: "Arial, sans-serif",
      },
    };

    const newElements = [...slide.elements, newTextElement];
    onUpdateSlide(newElements);
  };

  const addRectangleElement = () => {
    if (!isEditor) return;

    const newElement: PresentationElement = {
      _id: `element_${Date.now()}`,
      type: "rectangle",
      position: { x: 150, y: 150 },
      size: { width: 150, height: 100 },
      style: {
        backgroundColor: "#3b82f6",
        border: "2px solid #1d4ed8",
        borderRadius: "8px",
      },
    };

    const newElements = [...slide.elements, newElement];
    onUpdateSlide(newElements);
  };

  const addCircleElement = () => {
    if (!isEditor) return;

    const newElement: PresentationElement = {
      _id: `element_${Date.now()}`,
      type: "circle",
      position: { x: 200, y: 200 },
      size: { width: 120, height: 120 },
      style: {
        backgroundColor: "#ef4444",
        borderRadius: "50%",
      },
    };

    const newElements = [...slide.elements, newElement];
    onUpdateSlide(newElements);
  };

  const addArrowElement = () => {
    if (!isEditor) return;

    const newElement: PresentationElement = {
      _id: `element_${Date.now()}`,
      type: "arrow",
      position: { x: 250, y: 250 },
      size: { width: 100, height: 20 },
      style: {
        backgroundColor: "#10b981",
        clipPath:
          "polygon(0 50%, 80% 50%, 80% 30%, 100% 50%, 80% 70%, 80% 50%)",
      },
    };

    const newElements = [...slide.elements, newElement];
    onUpdateSlide(newElements);
  };

  const addImageElement = () => {
    if (!isEditor) return;

    const newElement: PresentationElement = {
      _id: `element_${Date.now()}`,
      type: "image",
      content: "https://via.placeholder.com/150",
      position: { x: 300, y: 150 },
      size: { width: 150, height: 150 },
      style: {
        border: "2px solid #9ca3af",
        borderRadius: "4px",
      },
    };

    const newElements = [...slide.elements, newElement];
    onUpdateSlide(newElements);
  };

  const updateElement = (
    elementId: string,
    updates: Partial<PresentationElement>
  ) => {
    if (!isEditor) return;

    const newElements = slide.elements.map((el) =>
      el._id === elementId ? { ...el, ...updates } : el
    );
    onUpdateSlide(newElements);
  };

  const deleteElement = (elementId: string) => {
    if (!isEditor) return;

    const newElements = slide.elements.filter((el) => el._id !== elementId);
    onUpdateSlide(newElements);
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
      setShowStylePanel(false);
    }
  };

  const updateElementText = (elementId: string, content: string) => {
    if (!isEditor) return;
    updateElement(elementId, { content });
  };

  const updateElementStyle = (
    elementId: string,
    styleUpdates: Record<string, string>
  ) => {
    const element = slide.elements.find((el) => el._id === elementId);
    if (!element || !isEditor) return;

    const newStyle = { ...element.style, ...styleUpdates };
    updateElement(elementId, { style: newStyle });
  };

  const formatText = (format: "bold" | "italic") => {
    if (!selectedElementId || !isEditor) return;

    const element = slide.elements.find((el) => el._id === selectedElementId);
    if (!element || element.type !== "text") return;

    const textarea = document.createElement("textarea");
    textarea.value = element.content || "";
    document.body.appendChild(textarea);
    textarea.select();

    let markdownWrapper = "";
    if (format === "bold") markdownWrapper = "**";
    if (format === "italic") markdownWrapper = "*";

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    const newText =
      textarea.value.substring(0, start) +
      markdownWrapper +
      selectedText +
      markdownWrapper +
      textarea.value.substring(end);

    document.body.removeChild(textarea);
    updateElementText(selectedElementId, newText);
  };

  const renderMarkdown = (content: string = ""): { __html: string } => {
    try {
      return { __html: md.render(content) };
    } catch (e) {
      console.warn("Markdown render error:", e);
      return { __html: content };
    }
  };

  const selectedElement = slide.elements.find(
    (el) => el._id === selectedElementId
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center space-x-2 flex-wrap">
        {isEditor && (
          <>
            <button
              onClick={addTextElement}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center"
              title="Add Text"
            >
              <span>+T</span>
            </button>
            <button
              onClick={addRectangleElement}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
              title="Add Rectangle"
            >
              <span>▭</span>
            </button>
            <button
              onClick={addCircleElement}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center"
              title="Add Circle"
            >
              <span>○</span>
            </button>
            <button
              onClick={addArrowElement}
              className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 flex items-center"
              title="Add Arrow"
            >
              <span>→</span>
            </button>
            <button
              onClick={addImageElement}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 flex items-center"
              title="Add Image"
            >
              <span>🖼️</span>
            </button>
            {selectedElementId && (
              <button
                onClick={() => deleteElement(selectedElementId)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                title="Delete Element"
              >
                🗑️
              </button>
            )}

            {selectedElementId && selectedElement?.type === "text" && (
              <div className="flex space-x-1 border-l border-gray-300 pl-2 ml-2">
                <button
                  onClick={() => formatText("bold")}
                  className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 font-bold"
                  title="Bold"
                >
                  B
                </button>
                <button
                  onClick={() => formatText("italic")}
                  className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 italic"
                  title="Italic"
                >
                  I
                </button>
              </div>
            )}

            <div className="flex items-center space-x-1 border-l border-gray-300 pl-2 ml-2">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                disabled={zoom <= 50}
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-sm px-2">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                disabled={zoom >= 200}
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => setZoom(100)}
                className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                title="Reset Zoom"
              >
                100%
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          ref={slideRef}
          className="flex-1 overflow-auto bg-gray-50 relative"
          onClick={handleSlideClick}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          <div
            className="bg-white shadow-lg mx-auto my-8 relative origin-top-left"
            style={{
              width: "90%",
              height: "80%",
              minWidth: "800px",
              minHeight: "600px",
              transform: `scale(${zoom / 100})`,
              cursor: isEditor ? "default" : "default",
            }}
          >
            {slide.elements.map((element) => (
              <div
                key={element._id}
                className={`absolute ${
                  selectedElementId === element._id
                    ? "ring-2 ring-blue-500 ring-offset-1"
                    : ""
                } ${isEditor ? "cursor-move" : ""}`}
                style={{
                  left: `${element.position.x}px`,
                  top: `${element.position.y}px`,
                  width: element.size?.width
                    ? `${element.size.width}px`
                    : "auto",
                  height: element.size?.height
                    ? `${element.size.height}px`
                    : "auto",
                  ...element.style,
                  userSelect: "none",
                }}
                onClick={(e) => handleElementClick(element._id!, e)}
                onMouseDown={(e) => handleDragStart(element._id!, e)}
              >
                {element.type === "text" && !isEditor && (
                  <div
                    dangerouslySetInnerHTML={renderMarkdown(element.content)}
                    className="w-full h-full overflow-hidden"
                    style={{
                      pointerEvents: "none",
                    }}
                  />
                )}
                {element.type === "text" && isEditor && (
                  <div
                    contentEditable={
                      isEditor && selectedElementId === element._id
                    }
                    suppressContentEditableWarning={true}
                    onBlur={(e) => {
                      if (isEditor) {
                        updateElementText(element._id!, e.target.innerText);
                      }
                    }}
                    className="outline-none w-full h-full overflow-hidden"
                    style={{
                      pointerEvents: isEditor ? "auto" : "none",
                    }}
                  >
                    {element.content}
                  </div>
                )}
                {element.type === "image" && (
                  <img
                    src={element.content || "https://via.placeholder.com/150"}
                    alt="Presentation element"
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {showStylePanel && selectedElement && isEditor && (
          <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3">Element Styles</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <input
                  type="color"
                  value={selectedElement.style?.backgroundColor || "#ffffff"}
                  onChange={(e) =>
                    updateElementStyle(selectedElementId!, {
                      backgroundColor: e.target.value,
                    })
                  }
                  className="w-full h-8 rounded border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Border Color
                </label>
                <input
                  type="color"
                  value={selectedElement.style?.borderColor || "#000000"}
                  onChange={(e) =>
                    updateElementStyle(selectedElementId!, {
                      borderColor: e.target.value,
                    })
                  }
                  className="w-full h-8 rounded border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Border Width
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={
                    parseInt(selectedElement.style?.borderWidth || "0") || 0
                  }
                  onChange={(e) =>
                    updateElementStyle(selectedElementId!, {
                      borderWidth: `${e.target.value}px`,
                    })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Border Radius
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={
                    parseInt(selectedElement.style?.borderRadius || "0") || 0
                  }
                  onChange={(e) =>
                    updateElementStyle(selectedElementId!, {
                      borderRadius: `${e.target.value}px`,
                    })
                  }
                  className="w-full"
                />
              </div>

              {selectedElement.type === "text" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Size
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="72"
                      value={
                        parseInt(selectedElement.style?.fontSize || "16") || 16
                      }
                      onChange={(e) =>
                        updateElementStyle(selectedElementId!, {
                          fontSize: `${e.target.value}px`,
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Family
                    </label>
                    <select
                      value={
                        selectedElement.style?.fontFamily || "Arial, sans-serif"
                      }
                      onChange={(e) =>
                        updateElementStyle(selectedElementId!, {
                          fontFamily: e.target.value,
                        })
                      }
                      className="w-full p-1 border border-gray-300 rounded"
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="'Times New Roman', serif">
                        Times New Roman
                      </option>
                      <option value="'Courier New', monospace">
                        Courier New
                      </option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="Verdana, sans-serif">Verdana</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

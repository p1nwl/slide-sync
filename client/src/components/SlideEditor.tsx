import React, { useState, useRef, useCallback, useMemo } from "react";
import MarkdownIt from "markdown-it";
import type { Slide, PresentationElement } from "../types/index";

const md = new MarkdownIt();

type ClientPresentationElement = PresentationElement & { clientId?: string };

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

  const generateClientId = useCallback(() => {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const getStableElementId = useCallback(
    (element: ClientPresentationElement, index: number): string => {
      if (
        element._id &&
        typeof element._id === "string" &&
        element._id.length === 24 &&
        /^[0-9a-fA-F]+$/.test(element._id)
      ) {
        return element._id;
      }
      if (element.clientId) {
        return element.clientId;
      }
      if (element._id) {
        return element._id;
      }
      return `fallback-${index}-${element.type}-${element.position?.x || 0}-${
        element.position?.y || 0
      }`;
    },
    []
  );

  const findElementIndexByStableId = useCallback(
    (stableId: string): number => {
      if (stableId.length === 24 && /^[0-9a-fA-F]{24}$/.test(stableId)) {
        const indexById = slide.elements.findIndex(
          (el) => (el as ClientPresentationElement)._id === stableId
        );
        if (indexById !== -1) return indexById;
      }

      const indexByClientId = slide.elements.findIndex(
        (el) => (el as ClientPresentationElement).clientId === stableId
      );
      if (indexByClientId !== -1) return indexByClientId;

      const indexByTempId = slide.elements.findIndex(
        (el) => (el as ClientPresentationElement)._id === stableId
      );
      if (indexByTempId !== -1) return indexByTempId;

      for (let i = 0; i < slide.elements.length; i++) {
        const element = slide.elements[i] as ClientPresentationElement;
        const calculatedStableId = getStableElementId(element, i);
        if (calculatedStableId === stableId) {
          return i;
        }
      }

      return -1;
    },
    [slide.elements, getStableElementId]
  );

  const handleElementClick = useCallback(
    (stableElementId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (isEditor) {
        setSelectedElementId(stableElementId);
        setShowStylePanel(true);
      }
    },
    [isEditor]
  );

  const handleSlideClick = useCallback(() => {
    setSelectedElementId(null);
    setShowStylePanel(false);
  }, []);

  const handleDragStart = (stableElementId: string, e: React.MouseEvent) => {
    if (!isEditor) return;

    const elementDomNode = e.currentTarget as HTMLElement;
    const rect = elementDomNode.getBoundingClientRect();

    setDraggingElementId(stableElementId);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingElementId || !isEditor || !slideRef.current) return;

      e.preventDefault();
      const slideRect = slideRef.current.getBoundingClientRect();

      const newX = e.clientX - dragOffset.x - slideRect.left;
      const newY = e.clientY - dragOffset.y - slideRect.top;

      const elementIndex = findElementIndexByStableId(draggingElementId);
      if (elementIndex === -1) {
        console.warn(
          `Dragging element with stable ID ${draggingElementId} not found`
        );
        return;
      }

      const newElements = [...slide.elements];
      newElements[elementIndex] = {
        ...newElements[elementIndex],
        position: { x: Math.max(0, newX), y: Math.max(0, newY) },
      };
      onUpdateSlide(newElements);
    },
    [
      draggingElementId,
      dragOffset,
      isEditor,
      slide.elements,
      onUpdateSlide,
      findElementIndexByStableId,
    ]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingElementId(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const addTextElement = useCallback(() => {
    if (!isEditor) return;

    const newTextElement: ClientPresentationElement = {
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
      clientId: generateClientId(),
    };

    const newElements = [...slide.elements, newTextElement];
    onUpdateSlide(newElements);
  }, [isEditor, slide.elements, onUpdateSlide, generateClientId]);

  const addRectangleElement = useCallback(() => {
    if (!isEditor) return;

    const newElement: ClientPresentationElement = {
      type: "rectangle",
      position: { x: 150, y: 150 },
      size: { width: 150, height: 100 },
      style: {
        backgroundColor: "#3b82f6",
        border: "2px solid #1d4ed8",
        borderRadius: "8px",
      },
      clientId: generateClientId(),
    };

    const newElements = [...slide.elements, newElement];
    onUpdateSlide(newElements);
  }, [isEditor, slide.elements, onUpdateSlide, generateClientId]);

  const addCircleElement = useCallback(() => {
    if (!isEditor) return;

    const newElement: ClientPresentationElement = {
      type: "circle",
      position: { x: 200, y: 200 },
      size: { width: 120, height: 120 },
      style: {
        backgroundColor: "#ef4444",
        borderRadius: "50%",
      },
      clientId: generateClientId(),
    };

    const newElements = [...slide.elements, newElement];
    onUpdateSlide(newElements);
  }, [isEditor, slide.elements, onUpdateSlide, generateClientId]);

  const addArrowElement = useCallback(() => {
    if (!isEditor) return;

    const newElement: ClientPresentationElement = {
      type: "arrow",
      position: { x: 250, y: 250 },
      size: { width: 100, height: 20 },
      style: {
        backgroundColor: "#10b981",
        clipPath:
          "polygon(0 50%, 80% 50%, 80% 30%, 100% 50%, 80% 70%, 80% 50%)",
      },
      clientId: generateClientId(),
    };

    const newElements = [...slide.elements, newElement];
    onUpdateSlide(newElements);
  }, [isEditor, slide.elements, onUpdateSlide, generateClientId]);

  const addImageElement = useCallback(() => {
    if (!isEditor) return;

    const newElement: ClientPresentationElement = {
      type: "image",
      content: "https://via.placeholder.com/150",
      position: { x: 300, y: 150 },
      size: { width: 150, height: 150 },
      style: {
        border: "2px solid #9ca3af",
        borderRadius: "4px",
      },
      clientId: generateClientId(),
    };

    const newElements = [...slide.elements, newElement];
    onUpdateSlide(newElements);
  }, [isEditor, slide.elements, onUpdateSlide, generateClientId]);

  const updateElement = useCallback(
    (stableElementId: string, updates: Partial<PresentationElement>) => {
      if (!isEditor) return;

      const elementIndex = findElementIndexByStableId(stableElementId);
      if (elementIndex === -1) {
        console.warn(
          `Element with stable ID ${stableElementId} not found for update`
        );
        return;
      }

      const newElements = [...slide.elements];
      newElements[elementIndex] = { ...newElements[elementIndex], ...updates };
      onUpdateSlide(newElements);
    },
    [isEditor, slide.elements, onUpdateSlide, findElementIndexByStableId]
  );

  const deleteElement = useCallback(
    (stableElementId: string) => {
      if (!isEditor) return;

      const elementIndex = findElementIndexByStableId(stableElementId);
      if (elementIndex === -1) {
        console.warn(
          `Element with stable ID ${stableElementId} not found for deletion`
        );
        return;
      }

      const newElements = [...slide.elements];
      newElements.splice(elementIndex, 1);
      onUpdateSlide(newElements);

      if (selectedElementId === stableElementId) {
        setSelectedElementId(null);
        setShowStylePanel(false);
      }
    },
    [
      isEditor,
      slide.elements,
      selectedElementId,
      onUpdateSlide,
      findElementIndexByStableId,
    ]
  );

  const updateElementText = useCallback(
    (stableElementId: string, content: string) => {
      if (!isEditor) return;
      updateElement(stableElementId, { content });
    },
    [isEditor, updateElement]
  );

  const updateElementStyle = useCallback(
    (stableElementId: string, styleUpdates: Record<string, string>) => {
      const elementIndex = findElementIndexByStableId(stableElementId);
      if (elementIndex === -1 || !isEditor) {
        if (elementIndex === -1) {
          console.warn(
            `Element with stable ID ${stableElementId} not found for style update`
          );
        }
        return;
      }

      const element = slide.elements[elementIndex];
      const newStyle = { ...element.style, ...styleUpdates };
      updateElement(stableElementId, { style: newStyle });
    },
    [isEditor, slide.elements, updateElement, findElementIndexByStableId]
  );

  const formatText = useCallback(
    (format: "bold" | "italic") => {
      if (!selectedElementId || !isEditor) return;

      const elementIndex = findElementIndexByStableId(selectedElementId);
      const element = slide.elements[elementIndex];
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
    },
    [
      selectedElementId,
      isEditor,
      slide.elements,
      updateElementText,
      findElementIndexByStableId,
    ]
  );

  const renderMarkdown = useCallback(
    (content: string = ""): { __html: string } => {
      try {
        return { __html: md.render(content) };
      } catch (error) {
        console.warn("Markdown render error:", error);
        return { __html: content };
      }
    },
    []
  );

  const selectedElement = useMemo(() => {
    if (!selectedElementId) return null;
    const index = findElementIndexByStableId(selectedElementId);
    return index !== -1 ? slide.elements[index] : null;
  }, [selectedElementId, slide.elements, findElementIndexByStableId]);

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
            }}
          >
            {slide.elements.map((element, index) => {
              const clientElement = element as ClientPresentationElement;
              const stableElementId = getStableElementId(clientElement, index);

              return (
                <div
                  key={stableElementId}
                  className={`absolute ${
                    selectedElementId === stableElementId
                      ? "ring-2 ring-blue-500 ring-offset-1"
                      : ""
                  } ${isEditor ? "cursor-move" : ""}`}
                  style={{
                    left: `calc(${element.position.x}px - 5%)`,
                    top: `calc(${element.position.y}px - 5%)`,
                    width: element.size?.width
                      ? `${element.size.width}px`
                      : "auto",
                    height: element.size?.height
                      ? `${element.size.height}px`
                      : "auto",
                    ...element.style,
                    userSelect: "none",
                  }}
                  onClick={(e) => handleElementClick(stableElementId, e)}
                  onMouseDown={(e) => handleDragStart(stableElementId, e)}
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
                        isEditor && selectedElementId === stableElementId
                      }
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        if (isEditor) {
                          updateElementText(
                            stableElementId,
                            e.target.innerText
                          );
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
              );
            })}
          </div>
        </div>

        {selectedElement && isEditor && (
          <div
            className={`absolute right-70 top-30 h-vh w-64 bg-white border border-gray-200 p-4 overflow-y-auto transform transition-transform duration-300 z-50 ${
              showStylePanel ? "translate-x-0" : "translate-x-full"
            }`}
          >
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

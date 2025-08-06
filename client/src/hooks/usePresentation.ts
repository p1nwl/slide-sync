import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { useSocket } from "./useSocket";
import type { Presentation, User, PresentationElement } from "../types/index";

export const usePresentation = (presentationId?: string) => {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const { socket, updateSlide, addSlide, removeSlide, changeUserRole } =
    useSocket();

  useEffect(() => {
    if (!presentationId) return;

    const handleUsersUpdated = (users: User[]) => {
      console.log("WebSocket: users_updated received (RAW)", users);
      setPresentation((prev) => (prev ? { ...prev, users } : null));
    };

    const handlePresentationUpdated = (updatedPresentation: Presentation) => {
      setPresentation(updatedPresentation);
    };

    const handleSlideUpdated = ({
      slideIndex,
      elements,
    }: {
      slideIndex: number;
      elements: PresentationElement[];
    }) => {
      setPresentation((prev) => {
        if (!prev) return null;
        const newSlides = [...prev.slides];
        if (newSlides[slideIndex]) {
          newSlides[slideIndex] = { ...newSlides[slideIndex], elements };
        }
        return { ...prev, slides: newSlides };
      });
    };

    socket.on("users_updated", handleUsersUpdated);
    socket.on("presentation_updated", handlePresentationUpdated);
    socket.on("slide_updated", handleSlideUpdated);

    return () => {
      socket.off("users_updated", handleUsersUpdated);
      socket.off("presentation_updated", handlePresentationUpdated);
      socket.off("slide_updated", handleSlideUpdated);
    };
  }, [presentationId, socket]);

  const loadPresentation = useCallback(async () => {
    if (!presentationId) return;
    try {
      setLoading(true);
      console.log("Loading presentation with ID:", presentationId);
      const data = await api.getPresentation(presentationId);
      console.log("Loaded presentation data:", data);
      setPresentation(data);
    } catch (err) {
      setError("Failed to load presentation");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [presentationId]);

  useEffect(() => {
    loadPresentation();
  }, [loadPresentation]);

  const updateCurrentSlide = (elements: PresentationElement[]) => {
    if (!presentation || !presentationId) return;
    updateSlide(presentationId, currentSlideIndex, elements);
  };

  const handleAddSlide = (userId: string) => {
    if (!presentationId) return;
    addSlide(presentationId, userId);
  };

  const handleRemoveSlide = (slideIndex: number, userId: string) => {
    if (!presentationId) return;
    removeSlide(presentationId, slideIndex, userId);
  };

  const handleChangeUserRole = (userId: string, role: "editor" | "viewer") => {
    if (!presentationId) return;
    changeUserRole(presentationId, userId, role);
  };

  return {
    presentation,
    loading,
    error,
    currentSlideIndex,
    setCurrentSlideIndex,
    loadPresentation,
    updateCurrentSlide,
    handleAddSlide,
    handleRemoveSlide,
    handleChangeUserRole,
  };
};

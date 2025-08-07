import { useEffect, useRef, useCallback } from "react";
import { socket } from "../services/sockets";
import type { PresentationElement } from "../types/index";

export const useSocket = () => {
  const socketRef = useRef(socket);

  useEffect(() => {
    const currentSocket = socketRef.current;
    currentSocket.connect();

    return () => {
      currentSocket.disconnect();
    };
  }, []);

  const joinPresentation = useCallback(
    (presentationId: string, userId: string, nickname: string) => {
      socketRef.current.emit("join_presentation", {
        presentationId,
        userId,
        nickname,
      });
    },
    []
  );

  const leavePresentation = useCallback(
    (presentationId: string, userId: string) => {
      socketRef.current.emit("leave_presentation", { presentationId, userId });
    },
    []
  );

  const changeUserRole = useCallback(
    (presentationId: string, userId: string, role: "editor" | "viewer") => {
      socketRef.current.emit("change_user_role", {
        presentationId,
        userId,
        role,
      });
    },
    []
  );

  const updateSlide = useCallback(
    (
      presentationId: string,
      slideIndex: number,
      elements: PresentationElement[]
    ) => {
      socketRef.current.emit("update_slide", {
        presentationId,
        slideIndex,
        elements,
      });
    },
    []
  );

  const addSlide = useCallback((presentationId: string, userId: string) => {
    socketRef.current.emit("add_slide", { presentationId, userId });
  }, []);

  const removeSlide = useCallback(
    (presentationId: string, slideIndex: number, userId: string) => {
      socketRef.current.emit("remove_slide", {
        presentationId,
        slideIndex,
        userId,
      });
    },
    []
  );

  return {
    socket: socketRef.current,
    joinPresentation,
    leavePresentation,
    changeUserRole,
    updateSlide,
    addSlide,
    removeSlide,
  };
};

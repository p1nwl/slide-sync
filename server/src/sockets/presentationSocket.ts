import { Server, Socket } from "socket.io";
import Presentation from "../models/Presentation";
import mongoose from "mongoose";

export interface JoinPresentationData {
  presentationId: string;
  userId: string;
  nickname: string;
}

export interface UserUpdateData {
  presentationId: string;
  userId: string;
  role: "editor" | "viewer";
}

const { VersionError } = mongoose.Error;

async function saveWithRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error instanceof VersionError) {
        console.warn(
          `VersionError on attempt ${i + 1}/${retries}:`,
          error.message
        );
        if (i < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 100)
          );
          continue;
        }
      }
      throw error;
    }
  }
  throw new Error("Unreachable code in saveWithRetry");
}

export const setupSocketHandlers = (io: Server, socket: Socket) => {
  socket.on("join_presentation", async (data: JoinPresentationData) => {
    try {
      const { presentationId, userId, nickname } = data;

      socket.join(presentationId);

      const presentation = await Presentation.findById(presentationId);
      if (!presentation) {
        socket.emit("error", { message: "Presentation not found" });
        return;
      }

      const existingUserIndex = presentation.users.findIndex(
        (u) => u.id === userId
      );

      if (existingUserIndex > -1) {
        const existingUser = presentation.users[existingUserIndex];
        if (existingUser.nickname !== nickname) {
          presentation.users[existingUserIndex].nickname = nickname;
          await presentation.save();
        }
      } else {
        presentation.users.push({
          id: userId,
          nickname,
          role: "viewer",
        });

        await presentation.save();
      }

      const updatedPresentation = await Presentation.findById(presentationId);
      if (updatedPresentation) {
        io.to(presentationId).emit("users_updated", updatedPresentation.users);
        socket.emit("presentation_updated", updatedPresentation);
      } else {
        console.error(
          `[JOIN] Failed to reload presentation ${presentationId} after update`
        );
        socket.emit("error", { message: "Presentation data inconsistency" });
      }
    } catch (error) {
      console.error("[JOIN] Error in join_presentation handler:", error);
      socket.emit("error", { message: "Failed to join presentation" });
    }
  });

  socket.on(
    "leave_presentation",
    async (data: { presentationId: string; userId: string }) => {
      try {
        const { presentationId, userId } = data;

        socket.leave(presentationId);
      } catch (error) {
        console.error("[LEAVE] Error in leave_presentation handler:", error);
      }
    }
  );

  socket.on("change_user_role", async (data: UserUpdateData) => {
    try {
      const { presentationId, userId, role } = data;

      const setResult = await Presentation.updateOne(
        { _id: presentationId, "users.id": userId },
        { $set: { "users.$.role": role } }
      );

      if (setResult.matchedCount > 0) {
        if (setResult.modifiedCount > 0) {
          const updatedPresentation = await Presentation.findById(
            presentationId
          );
          if (updatedPresentation) {
            io.to(presentationId).emit(
              "users_updated",
              updatedPresentation.users
            );
          }
        } else {
        }
      } else {
        console.warn(
          `User ${userId} not found in presentation ${presentationId} for role change`
        );
      }
    } catch (error) {
      console.error("Error changing user role:", error);
    }
  });

  socket.on(
    "update_slide",
    async (data: {
      presentationId: string;
      slideIndex: number;
      elements: any[];
    }) => {
      try {
        const { presentationId, slideIndex, elements } = data;

        const setResult = await Presentation.updateOne(
          { _id: presentationId, [`slides.${slideIndex}`]: { $exists: true } },
          { $set: { [`slides.${slideIndex}.elements`]: elements } }
        );

        if (setResult.matchedCount > 0) {
          io.to(presentationId).emit("slide_updated", {
            slideIndex,
            elements,
          });
        } else {
          console.warn(
            `Slide ${slideIndex} not found or out of bounds in presentation ${presentationId}`
          );
        }
      } catch (error) {
        console.error("Error updating slide:", error);
      }
    }
  );

  socket.on(
    "add_slide",
    async (data: { presentationId: string; userId: string }) => {
      try {
        const { presentationId, userId } = data;

        const presentation = await Presentation.findOne({
          _id: presentationId,
          "users.id": userId,
          "users.role": "creator",
        });

        if (presentation) {
          const newSlide = {
            elements: [],
            order: presentation.slides.length,
          };

          const pushResult = await Presentation.updateOne(
            { _id: presentationId },
            { $push: { slides: newSlide } }
          );

          if (pushResult.modifiedCount > 0) {
            const updatedPresentation = await Presentation.findById(
              presentationId
            );
            if (updatedPresentation) {
              io.to(presentationId).emit(
                "presentation_updated",
                updatedPresentation
              );
            }
          } else {
            console.warn(
              `Slide was not added to presentation ${presentationId}. Update operation returned 0 modifiedCount.`
            );
          }
        } else {
          console.warn(
            `User ${userId} is not creator or not found in presentation ${presentationId} (or presentation not found)`
          );
        }
      } catch (error) {
        console.error("Error adding slide:", error);
      }
    }
  );

  socket.on(
    "remove_slide",
    async (data: {
      presentationId: string;
      slideIndex: number;
      userId: string;
    }) => {
      try {
        const { presentationId, slideIndex, userId } = data;

        const presentation = await Presentation.findOne({
          _id: presentationId,
          "users.id": userId,
          "users.role": "creator",
        });

        if (presentation && presentation.slides.length > 1) {
          const pullResult = await Presentation.updateOne(
            { _id: presentationId },
            { $unset: { [`slides.${slideIndex}`]: 1 } }
          );

          if (pullResult.modifiedCount > 0) {
            await saveWithRetry(async () => {
              const pres = await Presentation.findById(presentationId);
              if (pres) {
                pres.slides = pres.slides.filter((s) => s != null);
                pres.slides.forEach((slide, index) => {
                  slide.order = index;
                });
                await pres.save();
                io.to(presentationId).emit("presentation_updated", pres);
              }
            });
          } else {
            console.warn(
              `Slide ${slideIndex} was not marked for removal in presentation ${presentationId}.`
            );
          }
        } else {
          console.warn(
            `Cannot remove slide: presentation not found, user not creator, or only one slide left in ${presentationId}`
          );
        }
      } catch (error) {
        console.error("Error removing slide:", error);
      }
    }
  );
};

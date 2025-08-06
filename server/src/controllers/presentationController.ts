import { Request, Response } from "express";
import Presentation, { IPresentation } from "../models/Presentation";

export const presentationController = {
  getAllPresentations: async (req: Request, res: Response) => {
    try {
      const presentations = await Presentation.find({}, "title createdAt");
      res.json(presentations);
    } catch (error) {
      console.error("Error fetching presentations:", error);
      res.status(500).json({ error: "Failed to fetch presentations" });
    }
  },

  createPresentation: async (req: Request, res: Response) => {
    try {
      const { title, creatorNickname, creatorUserId } = req.body;
      if (!title || !creatorNickname || !creatorUserId) {
        return res
          .status(400)
          .json({
            error: "Title, creatorNickname, and creatorUserId are required",
          });
      }

      const newPresentation: IPresentation = new Presentation({
        title,
        slides: [
          {
            elements: [],
            order: 0,
          },
        ],
        users: [
          {
            id: creatorUserId,
            nickname: creatorNickname,
            role: "creator",
          },
        ],
      });

      const savedPresentation = await newPresentation.save();
      console.log(
        `Created new presentation with ID: ${savedPresentation._id} for creator ${creatorUserId}`
      );
      res.status(201).json(savedPresentation);
    } catch (error) {
      console.error("Error creating presentation:", error);
      res.status(500).json({ error: "Failed to create presentation" });
    }
  },

  getPresentationById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const presentation = await Presentation.findById(id);

      if (!presentation) {
        console.warn(`Presentation with ID ${id} not found`);
        return res.status(404).json({ error: "Presentation not found" });
      }
      res.json(presentation);
    } catch (error) {
      console.error(
        `Error fetching presentation with ID ${req.params.id}:`,
        error
      );
      res.status(500).json({
        error: "Failed to fetch presentation",
      });
    }
  },

  updatePresentation: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedPresentation = await Presentation.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!updatedPresentation) {
        console.warn(`Presentation with ID ${id} not found for update`);
        return res.status(404).json({ error: "Presentation not found" });
      }

      res.json(updatedPresentation);
    } catch (error) {
      console.error(
        `Error updating presentation with ID ${req.params.id}:`,
        error
      );
      res.status(500).json({ error: "Failed to update presentation" });
    }
  },
};

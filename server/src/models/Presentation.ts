import mongoose, { Schema, Document } from "mongoose";

export interface IUser {
  id: string;
  nickname: string;
  role: "creator" | "editor" | "viewer";
}

export interface IPresentationElement {
  _id?: string;
  type: string;
  content?: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  style?: any;
}

export interface ISlide {
  _id?: string;
  elements: IPresentationElement[];
  order: number;
}

export interface IPresentation extends Document {
  title: string;
  slides: ISlide[];
  users: IUser[];
  createdAt: Date;
}

const ElementSchema = new Schema({
  type: String,
  content: String,
  position: {
    x: Number,
    y: Number,
  },
  size: {
    width: Number,
    height: Number,
  },
  style: Schema.Types.Mixed,
});

const SlideSchema = new Schema({
  elements: [ElementSchema],
  order: Number,
});

const UserSchema = new Schema({
  id: String,
  nickname: String,
  role: {
    type: String,
    enum: ["creator", "editor", "viewer"],
  },
});

const PresentationSchema = new Schema({
  title: String,
  slides: [SlideSchema],
  users: [UserSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IPresentation>(
  "Presentation",
  PresentationSchema
);

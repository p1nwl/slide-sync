export interface User {
  id: string;
  nickname: string;
  role: "creator" | "editor" | "viewer";
}

export interface PresentationElement {
  _id?: string;
  type: string;
  content?: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  style?: Record<string, string>;
}

export interface Slide {
  _id?: string;
  elements: PresentationElement[];
  order: number;
}

export interface Presentation {
  _id?: string;
  title: string;
  slides: Slide[];
  users: User[];
  createdAt: Date;
}

import type { Presentation } from "../types/index";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const api = {
  getPresentations: async (): Promise<Presentation[]> => {
    const response = await fetch(`${API_BASE_URL}/presentations`);
    return response.json();
  },

  createPresentation: async (
    title: string,
    creatorNickname: string,
    creatorUserId: string
  ): Promise<Presentation> => {
    const response = await fetch(`${API_BASE_URL}/presentations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, creatorNickname, creatorUserId }),
    });
    return response.json();
  },

  async getPresentation(presentationId: string): Promise<Presentation> {
    const response = await fetch(
      `${API_BASE_URL}/presentations/${presentationId}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  updatePresentation: async (
    id: string,
    data: Partial<Presentation>
  ): Promise<Presentation> => {
    const response = await fetch(`${API_BASE_URL}/presentations/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

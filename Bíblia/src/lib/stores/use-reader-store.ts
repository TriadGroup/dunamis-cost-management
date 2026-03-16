"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Bookmark {
  reference: string;
  translation: string;
}

interface PersonalNote {
  reference: string;
  body: string;
}

interface ReaderStore {
  bookmarks: Bookmark[];
  notes: PersonalNote[];
  recentReferences: string[];
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (reference: string) => void;
  saveNote: (note: PersonalNote) => void;
  rememberReference: (reference: string) => void;
}

export const useReaderStore = create<ReaderStore>()(
  persist(
    (set) => ({
      bookmarks: [],
      notes: [],
      recentReferences: [],
      addBookmark: (bookmark) =>
        set((state) => ({
          bookmarks: state.bookmarks.some((item) => item.reference === bookmark.reference)
            ? state.bookmarks
            : [bookmark, ...state.bookmarks]
        })),
      removeBookmark: (reference) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((item) => item.reference !== reference)
        })),
      saveNote: (note) =>
        set((state) => ({
          notes: [...state.notes.filter((item) => item.reference !== note.reference), note]
        })),
      rememberReference: (reference) =>
        set((state) => ({
          recentReferences: [reference, ...state.recentReferences.filter((item) => item !== reference)].slice(0, 8)
        }))
    }),
    {
      name: "biblia-reader-store"
    }
  )
);

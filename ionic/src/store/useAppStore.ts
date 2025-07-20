import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Note {
  id: string;
  title: string;
  content: string;
  transcription?: string;
  aiAnalysis?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export enum AIMode {
  REMOTE = 'remote',
  ON_DEVICE = 'on-device'
}

export interface AppSettings {
  aiMode: AIMode;
  remoteEndpoint?: string;
  apiKey?: string;
  model?: string;
  transcriptionMode: 'remote' | 'local';
  transcriptionEndpoint?: string;
  autoSave: boolean;
  theme: 'light' | 'dark' | 'auto';
}

interface AppState {
  // Notes
  notes: Note[];
  currentNote: Note | null;
  
  // Settings
  settings: AppSettings;
  
  // UI State
  isRecording: boolean;
  isProcessing: boolean;
  isTranscribing: boolean;
  
  // Actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setCurrentNote: (note: Note | null) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // UI actions
  setRecording: (recording: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setTranscribing: (transcribing: boolean) => void;
}

const defaultSettings: AppSettings = {
  aiMode: AIMode.REMOTE,
  transcriptionMode: 'local',
  autoSave: true,
  theme: 'auto'
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: [],
      currentNote: null,
      settings: defaultSettings,
      isRecording: false,
      isProcessing: false,
      isTranscribing: false,

      // Note actions
      addNote: (noteData) => {
        const newNote: Note = {
          ...noteData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          notes: [newNote, ...state.notes],
          currentNote: newNote
        }));
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map(note =>
            note.id === id
              ? { ...note, ...updates, updatedAt: new Date() }
              : note
          ),
          currentNote: state.currentNote?.id === id
            ? { ...state.currentNote, ...updates, updatedAt: new Date() }
            : state.currentNote
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter(note => note.id !== id),
          currentNote: state.currentNote?.id === id ? null : state.currentNote
        }));
      },

      setCurrentNote: (note) => {
        set({ currentNote: note });
      },

      // Settings actions
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },

      // UI actions
      setRecording: (recording) => set({ isRecording: recording }),
      setProcessing: (processing) => set({ isProcessing: processing }),
      setTranscribing: (transcribing) => set({ isTranscribing: transcribing })
    }),
    {
      name: 'ai-voice-notes-storage',
      partialize: (state) => ({
        notes: state.notes,
        settings: state.settings
      })
    }
  )
);
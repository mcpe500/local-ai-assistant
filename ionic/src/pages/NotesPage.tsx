import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonModal,
  IonButtons,
  IonTextarea,
  IonInput,
  IonActionSheet,
  IonAlert,
  IonSpinner,
  IonChip,
  IonNote
} from '@ionic/react';
import {
  add,
  close,
  checkmark,
  ellipsisVertical,
  trash,
  bulb,
  list,
  analytics
} from 'ionicons/icons';
import { useForm, Controller } from 'react-hook-form';
import { useAppStore, Note } from '../store/useAppStore';
import { useAI } from '../hooks/useAI';

interface NoteFormData {
  title: string;
  content: string;
  tags: string;
}

const NotesPage: React.FC = () => {
  const {
    notes,
    currentNote,
    setCurrentNote,
    addNote,
    updateNote,
    deleteNote,
    isProcessing
  } = useAppStore();

  const { summarizeMeeting, extractActionItems, analyzeNotes } = useAI();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const { control, handleSubmit, reset, setValue } = useForm<NoteFormData>({
    defaultValues: {
      title: '',
      content: '',
      tags: ''
    }
  });

  const openNoteModal = (note?: Note) => {
    if (note) {
      setValue('title', note.title);
      setValue('content', note.content);
      setValue('tags', note.tags.join(', '));
      setCurrentNote(note);
    } else {
      reset();
      setCurrentNote(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentNote(null);
    reset();
  };

  const onSubmit = (data: NoteFormData) => {
    const tags = data.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (currentNote) {
      updateNote(currentNote.id, {
        title: data.title,
        content: data.content,
        tags
      });
    } else {
      addNote({
        title: data.title,
        content: data.content,
        tags
      });
    }
    closeModal();
  };

  const handleNoteAction = (note: Note, action: string) => {
    setSelectedNote(note);
    setIsActionSheetOpen(false);

    switch (action) {
      case 'summarize':
        handleAIAction(note, summarizeMeeting);
        break;
      case 'extract':
        handleAIAction(note, extractActionItems);
        break;
      case 'analyze':
        handleAIAction(note, analyzeNotes);
        break;
      case 'delete':
        setIsDeleteAlertOpen(true);
        break;
    }
  };

  const handleAIAction = async (note: Note, aiFunction: (text: string) => Promise<any>) => {
    try {
      const result = await aiFunction(note.content);
      if (result.success) {
        updateNote(note.id, {
          aiAnalysis: result.result
        });
      }
    } catch (error) {
      console.error('AI processing failed:', error);
    }
  };

  const confirmDelete = () => {
    if (selectedNote) {
      deleteNote(selectedNote.id);
      setSelectedNote(null);
    }
    setIsDeleteAlertOpen(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Notes</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonList>
          {notes.map((note) => (
            <IonItem key={note.id} button onClick={() => openNoteModal(note)}>
              <IonLabel>
                <h2>{note.title || 'Untitled Note'}</h2>
                <p>{note.content.substring(0, 100)}...</p>
                <IonNote color="medium">
                  {formatDate(note.updatedAt)}
                </IonNote>
                {note.tags.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    {note.tags.map((tag, index) => (
                      <IonChip key={index} color="primary" style={{ marginRight: '4px' }}>
                        {tag}
                      </IonChip>
                    ))}
                  </div>
                )}
                {note.aiAnalysis && (
                  <IonNote color="success">
                    ✨ AI Analysis Available
                  </IonNote>
                )}
              </IonLabel>
              <IonButton
                fill="clear"
                slot="end"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNote(note);
                  setIsActionSheetOpen(true);
                }}
              >
                <IonIcon icon={ellipsisVertical} />
              </IonButton>
            </IonItem>
          ))}
        </IonList>

        {notes.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
            <p>No notes yet. Tap the + button to create your first note!</p>
          </div>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => openNoteModal()}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Note Modal */}
        <IonModal isOpen={isModalOpen} onDidDismiss={closeModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{currentNote ? 'Edit Note' : 'New Note'}</IonTitle>
              <IonButtons slot="start">
                <IonButton onClick={closeModal}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
              <IonButtons slot="end">
                <IonButton onClick={handleSubmit(onSubmit)}>
                  <IonIcon icon={checkmark} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          
          <IonContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <IonInput
                    {...field}
                    placeholder="Note title"
                    style={{ padding: '16px' }}
                  />
                )}
              />
              
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <IonTextarea
                    {...field}
                    placeholder="Start typing your note..."
                    rows={10}
                    style={{ padding: '16px' }}
                  />
                )}
              />
              
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <IonInput
                    {...field}
                    placeholder="Tags (comma separated)"
                    style={{ padding: '16px' }}
                  />
                )}
              />

              {currentNote?.aiAnalysis && (
                <div style={{ padding: '16px', backgroundColor: '#f8f9fa', margin: '16px' }}>
                  <h3>AI Analysis</h3>
                  <p>{currentNote.aiAnalysis}</p>
                </div>
              )}
            </form>
          </IonContent>
        </IonModal>

        {/* Action Sheet */}
        <IonActionSheet
          isOpen={isActionSheetOpen}
          onDidDismiss={() => setIsActionSheetOpen(false)}
          buttons={[
            {
              text: 'Summarize Meeting',
              icon: bulb,
              handler: () => selectedNote && handleNoteAction(selectedNote, 'summarize')
            },
            {
              text: 'Extract Action Items',
              icon: list,
              handler: () => selectedNote && handleNoteAction(selectedNote, 'extract')
            },
            {
              text: 'Analyze Notes',
              icon: analytics,
              handler: () => selectedNote && handleNoteAction(selectedNote, 'analyze')
            },
            {
              text: 'Delete',
              role: 'destructive',
              icon: trash,
              handler: () => selectedNote && handleNoteAction(selectedNote, 'delete')
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />

        {/* Delete Confirmation */}
        <IonAlert
          isOpen={isDeleteAlertOpen}
          onDidDismiss={() => setIsDeleteAlertOpen(false)}
          header="Delete Note"
          message="Are you sure you want to delete this note? This action cannot be undone."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: confirmDelete
            }
          ]}
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '20px',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center'
          }}>
            <IonSpinner />
            <p style={{ marginTop: '10px' }}>Processing with AI...</p>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default NotesPage;
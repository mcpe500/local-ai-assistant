import React, { useState, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonTextarea,
  IonSpinner,
  IonAlert,
  IonProgressBar,
  IonItem,
  IonLabel,
  IonToggle
} from '@ionic/react';
import {
  mic,
  micOff,
  save,
  refresh
} from 'ionicons/icons';
import { useForm, Controller } from 'react-hook-form';
import { useAppStore } from '../store/useAppStore';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useTranscription } from '../hooks/useTranscription';

interface RecordFormData {
  title: string;
  transcription: string;
}

const RecordPage: React.FC = () => {
  const {
    addNote,
    isRecording,
    isTranscribing,
    settings
  } = useAppStore();

  const {
    startRecording,
    stopRecording,
    audioBlob,
    recordingTime,
    error: recordingError
  } = useVoiceRecording();

  const {
    transcribeAudio,
    error: transcriptionError
  } = useTranscription();

  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [autoTranscribe, setAutoTranscribe] = useState(true);

  const { control, handleSubmit, setValue, reset } = useForm<RecordFormData>({
    defaultValues: {
      title: '',
      transcription: ''
    }
  });

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      setAlertMessage(`Failed to start recording: ${error}`);
      setShowAlert(true);
    }
  };

  const handleStopRecording = async () => {
    try {
      const blob = await stopRecording();
      
      if (autoTranscribe && blob) {
        await handleTranscription(blob);
      }
    } catch (error) {
      setAlertMessage(`Failed to stop recording: ${error}`);
      setShowAlert(true);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setIsProcessing(true);
    
    try {
      const result = await transcribeAudio(blob);
      
      if (result.success && result.transcription) {
        setTranscription(result.transcription);
        setValue('transcription', result.transcription);
        
        // Auto-generate title from first few words
        const words = result.transcription.split(' ').slice(0, 5).join(' ');
        setValue('title', `Meeting - ${words}...`);
      } else {
        setAlertMessage(result.error || 'Transcription failed');
        setShowAlert(true);
      }
    } catch (error) {
      setAlertMessage(`Transcription error: ${error}`);
      setShowAlert(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualTranscription = () => {
    if (audioBlob) {
      handleTranscription(audioBlob);
    }
  };

  const onSubmit = (data: RecordFormData) => {
    if (!data.transcription.trim()) {
      setAlertMessage('Please add some content before saving');
      setShowAlert(true);
      return;
    }

    addNote({
      title: data.title || 'Voice Note',
      content: data.transcription,
      transcription: data.transcription,
      tags: ['voice-note']
    });

    // Reset form
    reset();
    setTranscription('');
    setAlertMessage('Note saved successfully!');
    setShowAlert(true);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Voice Recording</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        {/* Recording Controls */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Voice Recording</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              {/* Recording Button */}
              <IonButton
                size="large"
                shape="round"
                color={isRecording ? 'danger' : 'primary'}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isProcessing}
                style={{
                  width: '120px',
                  height: '120px',
                  fontSize: '48px'
                }}
              >
                <IonIcon icon={isRecording ? micOff : mic} />
              </IonButton>

              {/* Recording Time */}
              {isRecording && (
                <div style={{ marginTop: '16px' }}>
                  <h2 style={{ color: '#d32f2f' }}>
                    {formatTime(recordingTime)}
                  </h2>
                  <IonProgressBar type="indeterminate" color="danger" />
                </div>
              )}

              {/* Status Messages */}
              {isProcessing && (
                <div style={{ marginTop: '16px' }}>
                  <IonSpinner />
                  <p>Processing audio...</p>
                </div>
              )}

              {audioBlob && !isRecording && (
                <div style={{ marginTop: '16px' }}>
                  <p>Recording completed!</p>
                  {!autoTranscribe && (
                    <IonButton
                      fill="outline"
                      onClick={handleManualTranscription}
                      disabled={isProcessing}
                    >
                      <IonIcon icon={refresh} slot="start" />
                      Transcribe
                    </IonButton>
                  )}
                </div>
              )}
            </div>

            {/* Settings */}
            <IonItem>
              <IonLabel>Auto-transcribe after recording</IonLabel>
              <IonToggle
                checked={autoTranscribe}
                onIonToggle={(e) => setAutoTranscribe(e.detail.checked)}
              />
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Transcription Form */}
        {(transcription || audioBlob) && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Transcription</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <IonItem>
                      <IonLabel position="stacked">Title</IonLabel>
                      <IonTextarea
                        {...field}
                        placeholder="Enter note title"
                        rows={1}
                      />
                    </IonItem>
                  )}
                />

                <Controller
                  name="transcription"
                  control={control}
                  render={({ field }) => (
                    <IonItem>
                      <IonLabel position="stacked">Content</IonLabel>
                      <IonTextarea
                        {...field}
                        placeholder="Transcription will appear here..."
                        rows={8}
                        value={transcription}
                        onIonInput={(e) => {
                          const value = e.detail.value!;
                          setTranscription(value);
                          field.onChange(value);
                        }}
                      />
                    </IonItem>
                  )}
                />

                <div style={{ padding: '16px 0' }}>
                  <IonButton
                    expand="block"
                    type="submit"
                    disabled={!transcription.trim() || isProcessing}
                  >
                    <IonIcon icon={save} slot="start" />
                    Save Note
                  </IonButton>
                </div>
              </form>
            </IonCardContent>
          </IonCard>
        )}

        {/* Instructions */}
        {!audioBlob && !isRecording && (
          <IonCard>
            <IonCardContent>
              <h3>How to use:</h3>
              <ol>
                <li>Tap the microphone button to start recording</li>
                <li>Speak clearly into your device</li>
                <li>Tap the stop button when finished</li>
                <li>Review and edit the transcription</li>
                <li>Save your note</li>
              </ol>
              
              <p style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
                <strong>Transcription Mode:</strong> {settings.transcriptionMode === 'local' ? 'On-device' : 'Remote'}
              </p>
            </IonCardContent>
          </IonCard>
        )}

        {/* Error Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Notice"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default RecordPage;
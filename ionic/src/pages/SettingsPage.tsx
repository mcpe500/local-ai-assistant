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
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonToggle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAlert,
  IonNote,
  IonChip,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import {
  save,
  refresh,
  warning,
  checkmark,
  close,
  cloud,
  phone,
  speedometer
} from 'ionicons/icons';
import { useForm, Controller } from 'react-hook-form';
import { useAppStore, AIMode } from '../store/useAppStore';
import { useOnDeviceAI } from '../hooks/useOnDeviceAI';

interface SettingsFormData {
  aiMode: AIMode;
  remoteEndpoint: string;
  apiKey: string;
  model: string;
  transcriptionMode: 'remote' | 'local';
  transcriptionEndpoint: string;
  autoSave: boolean;
  theme: 'light' | 'dark' | 'auto';
}

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useAppStore();
  const { getMemoryUsage, isMemoryConstrained, modelLoaded } = useOnDeviceAI();
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const { control, handleSubmit, watch, setValue } = useForm<SettingsFormData>({
    defaultValues: {
      aiMode: settings.aiMode,
      remoteEndpoint: settings.remoteEndpoint || '',
      apiKey: settings.apiKey || '',
      model: settings.model || 'llama2',
      transcriptionMode: settings.transcriptionMode,
      transcriptionEndpoint: settings.transcriptionEndpoint || '',
      autoSave: settings.autoSave,
      theme: settings.theme
    }
  });

  const watchedAIMode = watch('aiMode');
  const watchedTranscriptionMode = watch('transcriptionMode');

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await updateSettings(data);
      setAlertMessage('Settings saved successfully!');
      setShowAlert(true);
    } catch (error) {
      setAlertMessage(`Failed to save settings: ${error}`);
      setShowAlert(true);
    }
  };

  const testConnection = async () => {
    const endpoint = watch('remoteEndpoint');
    const apiKey = watch('apiKey');

    if (!endpoint) {
      setAlertMessage('Please enter an endpoint URL first');
      setShowAlert(true);
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: watch('model'),
          prompt: 'Test connection',
          stream: false,
          options: { max_tokens: 10 }
        })
      });

      if (response.ok) {
        setAlertMessage('✅ Connection successful!');
      } else {
        setAlertMessage(`❌ Connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setAlertMessage(`❌ Connection failed: ${error}`);
    }
    
    setShowAlert(true);
  };

  const resetSettings = () => {
    setValue('aiMode', AIMode.REMOTE);
    setValue('remoteEndpoint', '');
    setValue('apiKey', '');
    setValue('model', 'llama2');
    setValue('transcriptionMode', 'local');
    setValue('transcriptionEndpoint', '');
    setValue('autoSave', true);
    setValue('theme', 'auto');
  };

  const memoryUsage = getMemoryUsage();
  const memoryConstrained = isMemoryConstrained();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <form onSubmit={handleSubmit(onSubmit)}>
          
          {/* AI Configuration */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>AI Configuration</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel>AI Processing Mode</IonLabel>
                  <Controller
                    name="aiMode"
                    control={control}
                    render={({ field }) => (
                      <IonSelect
                        {...field}
                        interface="popover"
                        placeholder="Select mode"
                      >
                        <IonSelectOption value={AIMode.REMOTE}>
                          <IonIcon icon={cloud} style={{ marginRight: '8px' }} />
                          Remote/Self-Hosted
                        </IonSelectOption>
                        <IonSelectOption value={AIMode.ON_DEVICE}>
                          <IonIcon icon={phone} style={{ marginRight: '8px' }} />
                          On-Device
                        </IonSelectOption>
                      </IonSelect>
                    )}
                  />
                </IonItem>

                {watchedAIMode === AIMode.REMOTE && (
                  <>
                    <IonItem>
                      <IonLabel position="stacked">API Endpoint URL</IonLabel>
                      <Controller
                        name="remoteEndpoint"
                        control={control}
                        render={({ field }) => (
                          <IonInput
                            {...field}
                            type="url"
                            placeholder="http://localhost:11434/api/generate"
                          />
                        )}
                      />
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">API Key (Optional)</IonLabel>
                      <Controller
                        name="apiKey"
                        control={control}
                        render={({ field }) => (
                          <IonInput
                            {...field}
                            type={showApiKey ? 'text' : 'password'}
                            placeholder="Enter API key if required"
                          />
                        )}
                      />
                      <IonButton
                        fill="clear"
                        slot="end"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        <IonIcon icon={showApiKey ? close : checkmark} />
                      </IonButton>
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Model Name</IonLabel>
                      <Controller
                        name="model"
                        control={control}
                        render={({ field }) => (
                          <IonInput
                            {...field}
                            placeholder="llama2, mistral, etc."
                          />
                        )}
                      />
                    </IonItem>

                    <IonItem>
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={testConnection}
                      >
                        <IonIcon icon={refresh} slot="start" />
                        Test Connection
                      </IonButton>
                    </IonItem>
                  </>
                )}

                {watchedAIMode === AIMode.ON_DEVICE && (
                  <IonCard color="light">
                    <IonCardContent>
                      <IonGrid>
                        <IonRow>
                          <IonCol size="6">
                            <IonChip color={modelLoaded ? 'success' : 'medium'}>
                              <IonIcon icon={modelLoaded ? checkmark : warning} />
                              <IonLabel>Model: {modelLoaded ? 'Loaded' : 'Not Loaded'}</IonLabel>
                            </IonChip>
                          </IonCol>
                          <IonCol size="6">
                            <IonChip color={memoryConstrained ? 'danger' : 'success'}>
                              <IonIcon icon={speedometer} />
                              <IonLabel>Memory: {memoryUsage.toFixed(1)}MB</IonLabel>
                            </IonChip>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                      
                      <IonNote color="medium">
                        <p><strong>On-Device Mode:</strong></p>
                        <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                          <li>Fully offline processing</li>
                          <li>Enhanced privacy</li>
                          <li>Slower processing speed</li>
                          <li>Limited model capabilities</li>
                          <li>Optimized for 3GB RAM devices</li>
                        </ul>
                      </IonNote>
                      
                      {memoryConstrained && (
                        <IonNote color="danger">
                          <IonIcon icon={warning} style={{ marginRight: '4px' }} />
                          Memory usage is high. Consider using Remote mode for better performance.
                        </IonNote>
                      )}
                    </IonCardContent>
                  </IonCard>
                )}
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Transcription Settings */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Voice Transcription</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel>Transcription Mode</IonLabel>
                  <Controller
                    name="transcriptionMode"
                    control={control}
                    render={({ field }) => (
                      <IonSelect
                        {...field}
                        interface="popover"
                      >
                        <IonSelectOption value="local">Local (On-Device)</IonSelectOption>
                        <IonSelectOption value="remote">Remote API</IonSelectOption>
                      </IonSelect>
                    )}
                  />
                </IonItem>

                {watchedTranscriptionMode === 'remote' && (
                  <IonItem>
                    <IonLabel position="stacked">Transcription API Endpoint</IonLabel>
                    <Controller
                      name="transcriptionEndpoint"
                      control={control}
                      render={({ field }) => (
                        <IonInput
                          {...field}
                          type="url"
                          placeholder="https://api.openai.com/v1/audio/transcriptions"
                        />
                      )}
                    />
                  </IonItem>
                )}
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* App Settings */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>App Settings</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel>Auto-save notes</IonLabel>
                  <Controller
                    name="autoSave"
                    control={control}
                    render={({ field }) => (
                      <IonToggle
                        checked={field.value}
                        onIonToggle={(e) => field.onChange(e.detail.checked)}
                      />
                    )}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel>Theme</IonLabel>
                  <Controller
                    name="theme"
                    control={control}
                    render={({ field }) => (
                      <IonSelect
                        {...field}
                        interface="popover"
                      >
                        <IonSelectOption value="light">Light</IonSelectOption>
                        <IonSelectOption value="dark">Dark</IonSelectOption>
                        <IonSelectOption value="auto">Auto</IonSelectOption>
                      </IonSelect>
                    )}
                  />
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Action Buttons */}
          <div style={{ padding: '16px' }}>
            <IonButton
              expand="block"
              type="submit"
              style={{ marginBottom: '8px' }}
            >
              <IonIcon icon={save} slot="start" />
              Save Settings
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              color="medium"
              onClick={resetSettings}
            >
              <IonIcon icon={refresh} slot="start" />
              Reset to Defaults
            </IonButton>
          </div>
        </form>

        {/* Configuration Examples */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Configuration Examples</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonNote color="medium">
              <p><strong>Ollama (Local):</strong></p>
              <p>Endpoint: http://localhost:11434/api/generate</p>
              <p>Model: llama2, mistral, codellama</p>
              <br />
              <p><strong>OpenAI Compatible:</strong></p>
              <p>Endpoint: https://api.openai.com/v1/chat/completions</p>
              <p>API Key: Required</p>
              <p>Model: gpt-3.5-turbo, gpt-4</p>
            </IonNote>
          </IonCardContent>
        </IonCard>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Settings"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
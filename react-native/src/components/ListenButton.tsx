// src/components/ListenButton.tsx
import React,
{ useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  View,
  ActivityIndicator,
} from 'react-native';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
  SpeechStartEvent,
  SpeechEndEvent,
  SpeechRecognizedEvent,
} from '@react-native-voice/voice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ListenButtonProps {
  onSpeechEnd: (transcription: string) => void;
  onSpeechStart?: () => void;
  isProcessing: boolean; // To disable button when AI is thinking
}

const ListenButton: React.FC<ListenButtonProps> = ({
  onSpeechEnd,
  onSpeechStart,
  isProcessing,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');

  const requestRecordAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message:
              'This app needs access to your microphone to listen to your voice.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // For iOS, permission is typically handled by info.plist
  };

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStartHandler;
    Voice.onSpeechRecognized = onSpeechRecognizedHandler;
    Voice.onSpeechEnd = onSpeechEndHandler;
    Voice.onSpeechError = onSpeechErrorHandler;
    Voice.onSpeechResults = onSpeechResultsHandler;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStartHandler = (e: SpeechStartEvent) => {
    console.log('onSpeechStart: ', e);
    setIsListening(true);
    setInterimTranscript('');
    setError('');
    if (onSpeechStart) {
      onSpeechStart();
    }
  };

  const onSpeechRecognizedHandler = (e: SpeechRecognizedEvent) => {
    console.log('onSpeechRecognized: ', e);
  };

  const onSpeechEndHandler = (e: SpeechEndEvent) => {
    console.log('onSpeechEnd: ', e);
    setIsListening(false);
    // The final result is usually in onSpeechResults,
    // but we call onSpeechEnd from handleRelease as a fallback.
  };

  const onSpeechErrorHandler = (e: SpeechErrorEvent) => {
    console.log('onSpeechError: ', e);
    setError(JSON.stringify(e.error));
    setIsListening(false);
    // If there's an error, pass an empty string or handle appropriately
    onSpeechEnd('');
  };

  const onSpeechResultsHandler = (e: SpeechResultsEvent) => {
    console.log('onSpeechResults: ', e);
    if (e.value && e.value.length > 0) {
      setInterimTranscript(e.value[0]);
      // onSpeechEnd(e.value[0]); // This might be too early if user is still speaking
    }
  };

  const handlePressIn = async () => {
    if (isProcessing) return;

    const hasPermission = await requestRecordAudioPermission();
    if (!hasPermission) {
      setError('Microphone permission denied.');
      return;
    }

    try {
      await Voice.start('en-US'); // Start listening
    } catch (e) {
      console.error('Error starting voice recognition:', e);
      setError(String(e));
    }
  };

  const handlePressOut = async () => {
    if (isProcessing || !isListening) return;

    try {
      await Voice.stop(); // Stop listening
      setIsListening(false);
      onSpeechEnd(interimTranscript); // Send the last interim transcript as final
    } catch (e) {
      console.error('Error stopping voice recognition:', e);
      setError(String(e));
      onSpeechEnd(''); // Send empty if error
    }
  };

  const buttonStyle = isListening
    ? [styles.button, styles.buttonListening]
    : styles.button;
  const disabledStyle = isProcessing ? styles.buttonDisabled : {};

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[buttonStyle, disabledStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : isListening ? (
          <Icon name="microphone-off" size={50} color="#FFFFFF" />
        ) : (
          <Icon name="microphone" size={50} color="#FFFFFF" />
        )}
      </TouchableOpacity>
      {isListening && (
        <Text style={styles.listeningText}>Listening...</Text>
      )}
      {error && <Text style={styles.errorText}>Error: {error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonListening: {
    backgroundColor: '#FF3B30', // Red when listening
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listeningText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: 'red',
  },
});

export default ListenButton;

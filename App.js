import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startLocationUpdates, subscribeLocationUpdates } from './TrackLocationTask';

export default function App() {
  const [location, setLocation] = useState(null);
  const [username, setUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState(null);

  // Check for stored username on app load
  useEffect(() => {
    const checkUsername = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setSavedUsername(storedUsername);
        // Pass to TrackLocationTask to use in location sending
        startLocationUpdates(storedUsername);
        subscribeLocationUpdates(setLocation);
      }
    };
    checkUsername();
  }, []);

  // Handle signup and start tracking
  const handleSignUp = async () => {
    if (username.trim() !== '') {
      await AsyncStorage.setItem('username', username.trim());
      setSavedUsername(username.trim());
      startLocationUpdates(username.trim());
      subscribeLocationUpdates(setLocation);
    }
  };

  if (!savedUsername) {
    // Show sign-up page if first launch
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Sign Up to Start Tracking</Text>
        <TextInput
          placeholder="Enter Username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
        <Button title="Start Tracking" onPress={handleSignUp} />
      </View>
    );
  }

  // Main location tracker UI
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Background Location Tracker</Text>
      <Text style={styles.subheading}>User: {savedUsername}</Text>
      <Button title="Start Tracking" onPress={() => startLocationUpdates(savedUsername)} />
      {location ? (
        <View style={styles.locationContainer}>
          <Text>Latitude: {location.coords.latitude}</Text>
          <Text>Longitude: {location.coords.longitude}</Text>
        </View>
      ) : (
        <Text>Waiting for location...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  heading: { fontSize: 20, marginBottom: 20 },
  subheading: { fontSize: 16, marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, width: '100%', marginBottom: 20, borderRadius: 5 },
  locationContainer: { marginTop: 20, alignItems: 'center' },
});

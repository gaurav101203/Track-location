import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-location-task';

let locationCallback = null; // to send data live to App.js
let currentUsername = null;  // will hold the current username

// Background task definition
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data;
    if (locations.length > 0) {
      const location = locations[0];
      console.log('Received location:', location);

      if (locationCallback) {
        locationCallback(location);
      }

      // Retrieve username if not already cached
      if (!currentUsername) {
        currentUsername = await AsyncStorage.getItem('username');
      }

      // Send to server with username
      sendLocationToServer(
        location.coords.latitude,
        location.coords.longitude,
        currentUsername
      );
    }
  }
});

// Send location to your Flask server with username
async function sendLocationToServer(latitude, longitude, username) {
  try {
    const response = await fetch('http://192.168.0.102:5000/upload-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, latitude, longitude }),
    });

    const data = await response.json();
    console.log('Server response:', data);
  } catch (error) {
    console.error("Error sending location:", error);
  }
}

// Start location updates, with optional username override
export async function startLocationUpdates(username = null) {
  if (username) {
    currentUsername = username;
  } else {
    currentUsername = await AsyncStorage.getItem('username');
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.log('Foreground permission not granted');
    return;
  }

  const bgStatus = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus.status !== 'granted') {
    console.log('Background permission not granted');
    return;
  }

  const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (!isTaskRunning) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 1,
      timeInterval: 120000, // 2 minutes
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Tracking your location",
        notificationBody: "Your location is being tracked in the background",
      },
    });
    console.log("Started location updates");
  } else {
    console.log("Location updates already running");
  }
}

// Subscribe to location updates in App.js to display live coordinates
export function subscribeLocationUpdates(callback) {
  locationCallback = callback;
}

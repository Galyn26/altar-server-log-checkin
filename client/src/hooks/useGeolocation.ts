import { useState, useCallback } from "react";

interface GeolocationPosition {
  latitude: number;
  longitude: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

export function useGeolocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeolocationError | null>(null);

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = {
          code: 1,
          message: "Geolocation is not supported by this browser"
        };
        setError(error);
        reject(error);
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoading(false);
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          resolve(coords);
        },
        (err) => {
          setIsLoading(false);
          const error = {
            code: err.code,
            message: getGeolocationErrorMessage(err.code)
          };
          setError(error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  return {
    getCurrentPosition,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}

function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Location access denied. Please enable location services to clock in.";
    case 2:
      return "Location unavailable. Please check your device settings.";
    case 3:
      return "Location request timed out. Please try again.";
    default:
      return "Unable to retrieve location. Please try again.";
  }
}
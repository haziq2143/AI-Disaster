'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useGeolocation(options) {
  const [coords, setCoords] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('requesting'); // 'requesting', 'granted', 'denied', 'unavailable', 'timeout'
  const [errorMessage, setErrorMessage] = useState(null);
  const [accuracyText, setAccuracyText] = useState('Mengukur...');
  const [accuracyLevel, setAccuracyLevel] = useState('medium');
  const [lastUpdated, setLastUpdated] = useState(null);

  const watchIdRef = useRef(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB';
  };

  const handleSuccess = useCallback((position) => {
    const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
    const accRound = Math.round(accuracy);

    setCoords(prev => {
      if (
        prev &&
        prev.lat === latitude &&
        prev.lng === longitude &&
        prev.accuracy === accRound
      ) {
        return prev; // Same values, retain reference to prevent re-render loop
      }
      return {
        lat: latitude,
        lng: longitude,
        accuracy: accRound,
        altitude,
        heading,
        speed
      };
    });

    setPermissionStatus(prev => (prev === 'granted' ? prev : 'granted'));
    setErrorMessage(prev => (prev === null ? prev : null));
    setAccuracyText(`± ${accRound} m`);

    if (accRound <= 25) {
      setAccuracyLevel(prev => (prev === 'high' ? prev : 'high'));
    } else if (accRound <= 80) {
      setAccuracyLevel(prev => (prev === 'medium' ? prev : 'medium'));
    } else {
      setAccuracyLevel(prev => (prev === 'low' ? prev : 'low'));
    }

    setLastUpdated(formatTime(new Date(position.timestamp)));
  }, []);

  const handleError = useCallback((error) => {
    console.warn('Geolocation error:', error.code, error.message);
    let msg = 'Gagal mendeteksi lokasi GPS.';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        setPermissionStatus('denied');
        msg = 'Izin lokasi GPS ditolak oleh browser/perangkat. Aktifkan izin lokasi pada browser untuk melihat posisi Anda.';
        break;
      case error.POSITION_UNAVAILABLE:
        setPermissionStatus('unavailable');
        msg = 'Sinyal lokasi atau sensor GPS perangkat tidak tersedia saat ini.';
        break;
      case error.TIMEOUT:
        setPermissionStatus('timeout');
        msg = 'Waktu permintaan lokasi GPS habis (timeout). Silakan coba lagi.';
        break;
      default:
        setPermissionStatus('unavailable');
        msg = error.message || 'Terjadi kesalahan saat membaca koordinat GPS perangkat.';
        break;
    }

    setErrorMessage(msg);
  }, []);

  // Stable callback: never changes reference, uses optionsRef.current
  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setPermissionStatus('unavailable');
      setErrorMessage('Browser tidak mendukung Geolocation API.');
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      ...(optionsRef.current || {})
    };

    // Clean up previous watch if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Start watchPosition for continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geoOptions
    );
  }, [handleSuccess, handleError]);

  // Run exactly once on mount, cleanup on unmount
  useEffect(() => {
    requestLocation();

    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [requestLocation]);

  return {
    coords,
    permissionStatus,
    errorMessage,
    accuracyText,
    accuracyLevel,
    lastUpdated,
    retry: requestLocation
  };
}

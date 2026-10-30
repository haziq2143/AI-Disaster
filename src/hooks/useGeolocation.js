'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { evaluateLocationIntegrity } from '../lib/locationIntegrity';

export function useGeolocation(options) {
  const [coords, setCoords] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('requesting'); // 'requesting', 'granted', 'denied', 'unavailable', 'timeout'
  const [errorMessage, setErrorMessage] = useState(null);
  const [accuracyText, setAccuracyText] = useState('Mengukur...');
  const [accuracyLevel, setAccuracyLevel] = useState('medium');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [integrityStatus, setIntegrityStatus] = useState({
    status: 'clean',
    publicLabel: 'Lokasi belum diverifikasi secara menyeluruh',
    riskScore: 0,
    indicators: [],
    demoNotice: 'DATA DEMO — Hasil penilaian heuristik web prototipe (PRD 4.13)'
  });

  const watchIdRef = useRef(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const hasTriedFallbackRef = useRef(false);
  const prevPositionRef = useRef(null);

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

    const currentReading = {
      lat: latitude,
      lng: longitude,
      accuracy: accRound,
      altitude,
      heading,
      speed,
      timestamp: position.timestamp
    };

    const integrity = evaluateLocationIntegrity(currentReading, prevPositionRef.current);
    prevPositionRef.current = currentReading;
    setIntegrityStatus(integrity);

    setCoords(prev => {
      if (
        prev &&
        prev.lat === latitude &&
        prev.lng === longitude &&
        prev.accuracy === accRound
      ) {
        return prev;
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

    setPermissionStatus('granted');
    setErrorMessage(null);
    setAccuracyText(`± ${accRound} m`);

    if (accRound <= 25) {
      setAccuracyLevel('high');
    } else if (accRound <= 120) {
      setAccuracyLevel('medium');
    } else {
      setAccuracyLevel('low');
    }

    setLastUpdated(formatTime(new Date(position.timestamp)));
  }, []);

  const requestWithFallback = useCallback((useHighAccuracy = true) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setPermissionStatus('unavailable');
      setErrorMessage('Browser tidak mendukung Geolocation API.');
      return;
    }

    const geoOptions = {
      enableHighAccuracy: useHighAccuracy,
      timeout: useHighAccuracy ? 8000 : 12000,
      maximumAge: useHighAccuracy ? 5000 : 60000,
      ...(optionsRef.current || {})
    };

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Call getCurrentPosition first to trigger the permission prompt immediately in desktop browsers
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSuccess(pos);
        // Start watchPosition for continuous tracking
        if (watchIdRef.current === null) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            () => {},
            geoOptions
          );
        }
      },
      (error) => {
        console.warn('Geolocation initial attempt error:', error.code, error.message, 'highAccuracy:', useHighAccuracy);

        // If high accuracy failed on PC/laptop due to lack of satellite chip, fallback to Wi-Fi/IP location
        if (useHighAccuracy && !hasTriedFallbackRef.current && (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT)) {
          console.info('Switching to network/low-accuracy geolocation fallback for desktop compatibility...');
          hasTriedFallbackRef.current = true;
          requestWithFallback(false);
          return;
        }

        let msg = 'Gagal mendeteksi lokasi GPS.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setPermissionStatus('denied');
            msg = 'Izin lokasi GPS ditolak oleh browser/perangkat. Klik tombol "Use your location?" atau ikon di sebelah kiri URL browser, ubah menjadi "Allow/Izinkan", dan pastikan Location Services di Windows Settings aktif.';
            break;
          case error.POSITION_UNAVAILABLE:
            setPermissionStatus('unavailable');
            msg = 'Sensor lokasi perangkat tidak merespons. Pastikan "Location Services" aktif di Windows Settings (Privacy & Security -> Location).';
            break;
          case error.TIMEOUT:
            setPermissionStatus('timeout');
            msg = 'Permintaan lokasi GPS timeout. Coba klik "Perbarui GPS" atau izinkan akses lokasi.';
            break;
          default:
            setPermissionStatus('unavailable');
            msg = error.message || 'Terjadi kesalahan saat membaca koordinat GPS perangkat.';
            break;
        }
        setErrorMessage(msg);
      },
      geoOptions
    );
  }, [handleSuccess]);

  const requestLocation = useCallback(() => {
    hasTriedFallbackRef.current = false;
    setPermissionStatus('requesting');
    requestWithFallback(true);
  }, [requestWithFallback]);

  // Listen to browser permission state changes if supported
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.permissions || !navigator.permissions.query) return;

    let permissionObj = null;
    const updateStatus = () => {
      if (permissionObj) {
        if (permissionObj.state === 'granted') {
          setPermissionStatus('granted');
          requestLocation();
        } else if (permissionObj.state === 'denied') {
          setPermissionStatus('denied');
        }
      }
    };

    navigator.permissions.query({ name: 'geolocation' })
      .then(p => {
        permissionObj = p;
        permissionObj.addEventListener('change', updateStatus);
      })
      .catch(() => {});

    return () => {
      if (permissionObj) {
        permissionObj.removeEventListener('change', updateStatus);
      }
    };
  }, [requestLocation]);

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
    integrityStatus,
    retry: requestLocation
  };
}

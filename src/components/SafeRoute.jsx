'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  Info,
  Footprints,
  Compass,
  PhoneCall,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Users,
  ShieldAlert,
  ChevronRight,
  HeartHandshake,
  Layers,
  Map as MapIcon,
  Maximize2,
  RefreshCw,
  XCircle,
  Slash,
  Radio,
  Check,
  Building2,
  Share2,
  Sparkles
} from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import RouteMapCanvas from './RouteMapCanvas';
import VirtualRouteSchematic from './VirtualRouteSchematic';
import { api } from '../services/api';

// Accurate Haversine Distance Calculation (Meters)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = deg => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} meter`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatWalkTime(meters) {
  const minutes = Math.max(1, Math.round(meters / 75)); // ~4.5 km/h walking speed
  if (minutes <= 3) return '~2-3 menit jalan kaki';
  if (minutes <= 8) return `~${minutes - 1}-${minutes + 1} menit jalan kaki`;
  if (minutes < 45) return `~${minutes} menit jalan kaki`;
  const driveMin = Math.max(1, Math.round(meters / 600)); // driving / bus evakuasi
  return `~${driveMin} mnt berkendara (${minutes} mnt jalan kaki)`;
}

export default function SafeRoute({ 
  hazardData, 
  familyMembers = [],
  navigationTarget,
  setNavigationTarget,
  onBack, 
  onNavigateScreen 
}) {
  const { coords: gpsCoords, accuracyText, permissionStatus, errorMessage: gpsErrorMessage, retry: retryGps } = useGeolocation();
  
  // Real coordinates from device GPS or Cilegon default
  const userLat = gpsCoords?.lat ?? -5.9860;
  const userLng = gpsCoords?.lng ?? 106.0344;

  const mapSectionRef = useRef(null);

  // Category tabs: 'posko', 'medis', 'keluarga', 'darurat'
  const [activeTab, setActiveTab] = useState('posko');

  // Selected Target ID (default to Posko Induk Alun-Alun Serang as shown in image5.png)
  const [selectedPointId, setSelectedPointId] = useState('ev-serang');

  // Active selected route id (e.g. 'route-0' or 'route-1')
  const [activeRouteId, setActiveRouteId] = useState('route-0');

  // Turn-by-Turn Navigation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Map view switcher: 'leaflet' (real Leaflet + OSM + OSRM) or 'schematic'
  const [mapViewMode, setMapViewMode] = useState('leaflet');

  // Toast notification when route is activated or updated
  const [routeToastMessage, setRouteToastMessage] = useState(null);

  // Dynamic route data from smart routing API (contains candidate routes, roadblocks, collision analysis)
  const [dynamicRouteData, setDynamicRouteData] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Evaluator PRD testing scenario collapsible panel
  const [showEvaluatorPanel, setShowEvaluatorPanel] = useState(false);
  const [activeScenarioLabel, setActiveScenarioLabel] = useState('Skenario 1: Rute Tercepat OSRM');

  // Road disaster hazards list from database
  const [roadHazards, setRoadHazards] = useState([]);

  // Load road hazards from database
  const loadRoadHazards = useCallback(async () => {
    try {
      const hazards = await api.getRoadHazards();
      if (hazards) {
        setRoadHazards(hazards);
      }
    } catch (e) {
      console.warn('Gagal memuat status bahaya jalan:', e);
    }
  }, []);

  useEffect(() => {
    loadRoadHazards();
  }, [loadRoadHazards]);

  // 1. Destination Definitions: Posko Evakuasi
  const poskoPoints = useMemo(() => {
    const raw = [
      {
        id: 'ev-serang',
        dbId: 'posko-serang',
        name: 'Posko Terpadu Alun-Alun Serang & BPBD Banten (Utama)',
        category: 'posko',
        targetType: 'posko',
        lat: -6.1180,
        lng: 106.1550,
        address: 'Alun-Alun Serang, Kotabaru, Kec. Serang',
        summaryRoute: 'lewat Jl. Pantura / Jl. Raya Cilegon Drangong Serang - Banten',
        capacity: 'Kapasitas besar ~500 jiwa (Posko Induk Provinsi)',
        status: 'TERVERIFIKASI RESMI BPBD & SAR',
        verifiedAt: '10 menit lalu oleh Tim SAR Terpadu',
        elevation: 'Elevasi Tinggi (+32m mdpl)',
        notes: 'Pusat komando evakuasi terpadu Banten. Dilengkapi rumah sakit lapangan PMI, dapur umum BNPB, dan armada bus evakuasi.',
        isRecommended: true,
        travelMode: 'driving',
        navSteps: [
          {
            step: 1,
            title: 'Menuju Jalan Raya Cilegon (Jl. Pantura)',
            instruction: 'Mulai dari posisi GPS Anda di Cilegon, arahkan kendaraan / armada evakuasi menuju Jalan Raya Cilegon (Jl. Pantura arah timur).',
            danger: 'Arus lalu lintas padat armada evakuasi darurat'
          },
          {
            step: 2,
            title: 'Lintasi Jalur Arteri Drangong - Serang',
            instruction: 'Terus melaju menyusuri Jl. Raya Cilegon melintasi Drangong menuju perbatasan Kota Serang (jalur bebas genangan banjir).',
            danger: 'Waspada penyempitan jalan di persimpangan Drangong'
          },
          {
            step: 3,
            title: 'Masuki Kawasan Alun-Alun Serang (Kotabaru)',
            instruction: 'Tiba di Alun-Alun Serang, belok ke gerbang utama Kotabaru. Registrasi pengungsi dan tenda medis PMI berada di sayap barat alun-alun.',
            danger: 'Pemeriksaan identitas dan registrasi posko'
          }
        ]
      },
      {
        id: 'ev-1',
        dbId: 'posko-1',
        name: 'Balai Warga RW 04 Cilegon & Pos Pengungsian Mandiri',
        category: 'posko',
        targetType: 'posko',
        lat: userLat + 0.0035,
        lng: userLng + 0.0028,
        address: 'Jl. Ahmad Yani No. 142, Sukamaju, Cilegon',
        summaryRoute: 'lewat Jl. Ahmad Yani Cilegon',
        capacity: 'Kapasitas tersisa ~80 jiwa (Luas)',
        status: 'TERVERIFIKASI',
        verifiedAt: '12 menit lalu oleh BPBD Posko Wilayah',
        elevation: 'Elevasi tinggi (+18m mdpl)',
        notes: 'Akses melalui Jalan Ahmad Yani aman dari genangan air. Tersedia tenaga medis lapangan dan genset darurat.',
        isRecommended: false,
        travelMode: 'walking',
        navSteps: [
          {
            step: 1,
            title: 'Keluar Menuju Jalan Ahmad Yani',
            instruction: 'Melangkah keluar dari lokasi awal menuju Jalan Ahmad Yani arah utara (150 meter). Hindari sisi selokan yang tertutup genangan air.',
            danger: 'Potensi lubang selokan tak terlihat di genangan air'
          },
          {
            step: 2,
            title: 'Belok di Pertigaan Pos Kamling',
            instruction: 'Belok kanan di pertigaan Pos Kamling RW 04 (350 meter). Jalur terpantau kering, berpenerangan, dan bebas dari genangan.',
            danger: 'Arus warga evakuasi mandiri'
          },
          {
            step: 3,
            title: 'Tiba di Gerbang Balai Warga RW 04',
            instruction: 'Lurus terus sejauh 200 meter hingga tiba di pintu gerbang utama. Titik aman pengungsian dan posko medis P3K berada di lantai dasar.',
            danger: 'Kondisi tangga teras depan basah'
          }
        ]
      },
      {
        id: 'ev-2',
        dbId: 'posko-2',
        name: 'Gedung Serbaguna Kecamatan Utama Cilegon',
        category: 'posko',
        targetType: 'posko',
        lat: userLat - 0.0085,
        lng: userLng + 0.0075,
        address: 'Jl. Jenderal Sudirman, Ramanuju, Cilegon',
        summaryRoute: 'lewat Jl. Jenderal Sudirman',
        capacity: 'Kapasitas besar, dapur umum aktif',
        status: 'TERVERIFIKASI',
        verifiedAt: '25 menit lalu oleh Tim Reaksi Cepat',
        elevation: 'Elevasi tinggi (+24m mdpl)',
        notes: 'Jalur via Jalan Protokol padat armada evakuasi, disarankan menggunakan jembatan penyeberangan pejalan kaki.',
        isRecommended: false,
        travelMode: 'driving',
        navSteps: [
          {
            step: 1,
            title: 'Menuju Jalan Jenderal Sudirman',
            instruction: 'Bergerak ke selatan menuju trotoar Jalan Jenderal Sudirman (400 meter). Ikuti jalur pedestrian yang telah dibatasi pita pengaman.',
            danger: 'Jalan protokol padat merayap armada evakuasi'
          },
          {
            step: 2,
            title: 'Lintasi Jembatan Penyeberangan Kering',
            instruction: 'Gunakan jembatan penyeberangan pejalan kaki untuk menghindari genangan air setinggi 40 cm di persimpangan utama.',
            danger: 'Anak tangga jembatan licin terkena air hujan'
          },
          {
            step: 3,
            title: 'Masuki Kompleks Gedung Serbaguna',
            instruction: 'Pintu gerbang timur dibuka khusus pengungsi warga. Dapur umum BNPB dan pos medis utama berada di sayap kanan gedung.',
            danger: 'Antrean pemeriksaan posko pengungsian'
          }
        ]
      }
    ];

    return raw.map(p => {
      const dist = calculateDistance(userLat, userLng, p.lat, p.lng);
      return {
        ...p,
        distanceMeters: dist,
        distance: formatDistance(dist),
        estTime: formatWalkTime(dist)
      };
    });
  }, [userLat, userLng]);

  // 2. Rumah Sakit & Fasilitas Medis
  const medisPoints = useMemo(() => {
    const raw = [
      {
        id: 'med-1',
        name: 'RSUD Provinsi Banten & Pos Medis Bencana',
        category: 'medis',
        targetType: 'rumah_sakit',
        lat: -6.1150,
        lng: 106.1480,
        address: 'Jl. Syech Nawawi Al-Bantani, Cipocok Jaya, Serang',
        summaryRoute: 'lewat Tol Merak - Jakarta / Jl. Raya Serang',
        capacity: 'Kapasitas UGD 24 Jam Aktif, 4 Ambulans Siaga',
        status: 'TERVERIFIKASI RESMI DINKES',
        verifiedAt: '15 menit lalu oleh RSUD Banten',
        elevation: '+35m mdpl (Kawasan Aman Bebas Banjir)',
        notes: 'Fasilitas rujukan utama korban luka dan evakuasi kritis. IGD siaga tenaga medis darurat dan helipad darurat.',
        isRecommended: true,
        travelMode: 'driving',
        navSteps: [
          { step: 1, title: 'Menuju Jalur Arteri Utama', instruction: 'Gunakan ambulans atau armada evakuasi menuju jalan protokol bebas genangan.' },
          { step: 2, title: 'Lintasi Akses Masuk Kawasan Medis', instruction: 'Ikuti jalur prioritas ambulans menuju pintu masuk UGD darurat.' },
          { step: 3, title: 'Tiba di Ruang Triase UGD', instruction: 'Parkir armada di depan kanopi IGD untuk serah terima pasien.' }
        ]
      },
      {
        id: 'med-2',
        name: 'RSUD Kota Cilegon & Puskesmas Siaga',
        category: 'medis',
        targetType: 'rumah_sakit',
        lat: userLat - 0.0050,
        lng: userLng + 0.0060,
        address: 'Jl. Bojonegara No. 4, Cilegon',
        summaryRoute: 'lewat Jl. Bojonegara Cilegon',
        capacity: 'Kapasitas 80 bed darurat, 2 Ambulans',
        status: 'TERVERIFIKASI RESMI',
        verifiedAt: '30 menit lalu',
        elevation: '+20m mdpl',
        notes: 'Pusat perawatan luka ringan dan pos suplai obat-obatan darurat wilayah Cilegon.',
        isRecommended: false,
        travelMode: 'driving',
        navSteps: [
          { step: 1, title: 'Menuju Jalan Bojonegara', instruction: 'Melaju lurus ke arah timur menyusuri Jalan Bojonegara.' },
          { step: 2, title: 'Masuki Area RSUD Cilegon', instruction: 'Lapor ke petugas piket medis di tenda depan.' }
        ]
      }
    ];

    return raw.map(p => {
      const dist = calculateDistance(userLat, userLng, p.lat, p.lng);
      return {
        ...p,
        distanceMeters: dist,
        distance: formatDistance(dist),
        estTime: formatWalkTime(dist)
      };
    });
  }, [userLat, userLng]);

  // 3. Lokasi Keluarga
  const familyPoints = useMemo(() => {
    const raw = [
      {
        id: 'f2',
        name: 'Ibu Ratna (Orang Tua / Lansia)',
        category: 'keluarga',
        targetType: 'keluarga',
        relationship: 'Orang Tua / Lansia',
        lat: userLat + 0.0018,
        lng: userLng - 0.0015,
        address: 'Jl. Kenanga No. 8, Cilegon',
        summaryRoute: 'lewat Gang Kenanga Cilegon',
        status: 'BERSAMA DI RUMAH',
        urgency: 'PRIORITAS MOBILITAS',
        elevation: 'Rumah Tinggal (+15m mdpl)',
        notes: 'Kondisi stabil tetapi membutuhkan kursi roda atau dipapah dua orang. Obat hipertensi rutin harus selalu dibawa.',
        needs: 'Kursi roda, payung besar, dan pendampingan fisik',
        vulnerable: 'Lansia (64 tahun, butuh kursi roda)',
        travelMode: 'walking',
        navSteps: [
          { step: 1, title: 'Menuju Kamar Utama Lantai 1', instruction: 'Masuki kamar tidur utama untuk menjemput Ibu Ratna.' },
          { step: 2, title: 'Amankan Kursi Roda & Tas Obat', instruction: 'Bawa tas obat amlodipine dan dokumen KK/KTP.' },
          { step: 3, title: 'Evakuasi Menuju Jalan Aspal Kering', instruction: 'Bawa Ibu Ratna melewati pintu samping ke jalur kering.' }
        ]
      },
      {
        id: 'f3',
        name: 'Arka (Anak Balita - 5 Tahun)',
        category: 'keluarga',
        targetType: 'keluarga',
        relationship: 'Anak Balita',
        lat: userLat + 0.0038,
        lng: userLng + 0.0025,
        address: 'PAUD Mawar Ceria, Jl. Mawar No. 14, Cilegon',
        summaryRoute: 'lewat Jl. Mawar Cilegon',
        status: 'LOKASI PAUD RW 04',
        urgency: 'PRIORITAS EVAKUASI',
        elevation: 'Dataran aman (+17m mdpl)',
        notes: 'Berada di ruang PAUD Mawar Ceria bersama guru pendamping. Perlu segera dijemput dan digendong rapat agar tidak panik.',
        needs: 'Gendongan dada / pundak, jas hujan anak, susu formula',
        vulnerable: 'Balita (5 tahun)',
        travelMode: 'walking',
        navSteps: [
          { step: 1, title: 'Menyusuri Trotoar Jalan Mawar', instruction: 'Melangkah ke arah timur Jalan Mawar (200m).' },
          { step: 2, title: 'Tiba di Ruang Guru PAUD Mawar', instruction: 'Gendong Arka di pundak atau dada menggunakan kain pengaman.' }
        ]
      }
    ];

    return raw.map(p => {
      const dist = calculateDistance(userLat, userLng, p.lat, p.lng);
      return {
        ...p,
        distanceMeters: dist,
        distance: formatDistance(dist),
        estTime: formatWalkTime(dist)
      };
    });
  }, [userLat, userLng]);

  // 4. Orang Butuh Bantuan (Laporan Darurat)
  const emergencyPoints = useMemo(() => {
    const raw = [
      {
        id: 'rep-sos-1',
        name: 'Ibu Siti & Balita (Butuh Bantuan Segera)',
        category: 'darurat',
        targetType: 'laporan_darurat',
        lat: userLat - 0.0045,
        lng: userLng + 0.0038,
        address: 'Gang Melati No. 12, Cilegon',
        summaryRoute: 'lewat Gang Melati Cilegon',
        status: 'BUTUH BANTUAN SEGERA',
        urgency: 'KRITIS',
        elevation: 'Dataran rendah (+12m mdpl)',
        notes: 'Air genangan di rumah mencapai 60 cm dan terus mengalir deras. Ibu dan balita terjebak di atas meja tinggi. Butuh perahu karet segera!',
        needs: 'Perahu karet, pelampung balita, dan tandu lansia',
        contact: '0813-2233-4455 (Siti)',
        vulnerable: '1 Bayi/Balita (2 thn), 1 Lansia (68 thn)',
        travelMode: 'walking',
        navSteps: [
          { step: 1, title: 'Menuju Jalan Raya Selatan', instruction: 'Mulai dari titik GPS Anda, melangkah ke selatan menuju Jalan Raya.' },
          { step: 2, title: 'Masuki Gang Melati (Genangan Air 50cm)', instruction: 'Gunakan tongkat peraba parit. Ketinggian air meningkat hingga 50-60 cm.' },
          { step: 3, title: 'Tiba di Rumah Ibu Siti (No. 12)', instruction: 'Lokasi rumah nomor 12 di ujung gang kanan. Korban di atas meja tinggi.' }
        ]
      }
    ];

    return raw.map(p => {
      const dist = calculateDistance(userLat, userLng, p.lat, p.lng);
      return {
        ...p,
        distanceMeters: dist,
        distance: formatDistance(dist),
        estTime: formatWalkTime(dist)
      };
    });
  }, [userLat, userLng]);

  // Combined targets mapping
  const allTargets = useMemo(() => {
    return [...poskoPoints, ...medisPoints, ...familyPoints, ...emergencyPoints];
  }, [poskoPoints, medisPoints, familyPoints, emergencyPoints]);

  // Active selected target point
  const selectedPoint = useMemo(() => {
    return (
      allTargets.find(p => p.id === selectedPointId || p.dbId === selectedPointId) ||
      poskoPoints[0]
    );
  }, [allTargets, selectedPointId, poskoPoints]);

  // Fetch Smart Routes with Collision & Alternative Analysis
  const fetchSmartRoutes = useCallback(async (overridePoint = null) => {
    const pt = overridePoint || selectedPoint;
    if (!pt) return;
    setIsLoadingRoute(true);

    try {
      const mode = pt.travelMode || 'driving';
      const res = await api.getSmartRoutes(userLat, userLng, pt.lat, pt.lng, mode);
      if (res) {
        setDynamicRouteData(res);
        if (res.recommendedRouteId) {
          setActiveRouteId(res.recommendedRouteId);
        }
      }
    } catch (e) {
      console.warn('Error fetching smart routes:', e);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [userLat, userLng, selectedPoint]);

  useEffect(() => {
    fetchSmartRoutes();
  }, [fetchSmartRoutes]);

  // Candidate Routes: Guaranteed never empty so cards are ALWAYS visible!
  const candidateRoutes = useMemo(() => {
    if (dynamicRouteData?.routes && dynamicRouteData.routes.length > 0) {
      return dynamicRouteData.routes;
    }
    // Instant fallback candidate routes so cards are immediately visible with high contrast
    return [
      {
        id: 'route-0',
        routeNumber: 1,
        name: 'Rute 1 (Jalur Utama)',
        summary: selectedPoint?.summaryRoute || 'Jalur Jalan Raya Bebas Genangan',
        distanceFormatted: selectedPoint?.distance || '1.2 km',
        durationFormatted: selectedPoint?.estTime || '15 mnt',
        isRecommended: true,
        isBlocked: false,
        isImpacted: false,
        statusLabel: 'Bebas Hambatan Terlaporkan',
        steps: selectedPoint?.navSteps || []
      },
      {
        id: 'route-1',
        routeNumber: 2,
        name: 'Rute 2 (Jalur Alternatif)',
        summary: 'Jalur Alternatif Non-Tol / Lingkungan',
        distanceFormatted: selectedPoint?.distance ? `${(parseFloat(selectedPoint.distance) * 1.15).toFixed(1)} km` : '2.1 km',
        durationFormatted: '~25 mnt',
        isRecommended: false,
        isBlocked: false,
        isImpacted: false,
        statusLabel: 'Jalur Alternatif Siaga',
        steps: selectedPoint?.navSteps || []
      }
    ];
  }, [dynamicRouteData, selectedPoint]);

  // Active chosen route object
  const activeRoute = candidateRoutes.find(r => r.id === activeRouteId) || candidateRoutes[0] || null;

  // Active step and directions
  const navSteps = activeRoute?.steps?.length > 0 ? activeRoute.steps : selectedPoint?.navSteps || [];
  const currentNavStep = navSteps[currentStepIndex] || navSteps[0];
  const totalNavSteps = navSteps.length || 3;

  // Real-time distance and time
  const activeDistanceText = activeRoute?.distanceFormatted || selectedPoint.distance;
  const activeDurationText = activeRoute?.durationFormatted || selectedPoint.estTime;

  // Text-to-Speech Voice Guidance (Bahasa Indonesia)
  const speakInstruction = useCallback((text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  }, [isSpeaking]);

  // Core handler: Select a destination point
  const handleDirectRoute = useCallback((point, category) => {
    if (category) {
      setActiveTab(category);
    }
    setSelectedPointId(point.id);
    setCurrentStepIndex(0);
    setIsNavigating(false);

    setRouteToastMessage(`🧭 Mengarahkan rute navigasi ke ${point.name}...`);
    setTimeout(() => setRouteToastMessage(null), 3500);

    fetchSmartRoutes(point);

    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [fetchSmartRoutes]);

  const handleStartNavigation = () => {
    setIsNavigating(true);
    setCurrentStepIndex(0);
    const firstStepText = `Memulai navigasi rute ke ${selectedPoint.name}. Langkah 1: ${navSteps[0]?.instruction || ''}`;
    speakInstruction(firstStepText);
  };

  const handleNextStep = () => {
    if (currentStepIndex < totalNavSteps - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStep = navSteps[nextIdx];
      if (nextStep) {
        speakInstruction(`Langkah ${nextStep.step}: ${nextStep.instruction}`);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevStep = navSteps[prevIdx];
      if (prevStep) {
        speakInstruction(`Langkah ${prevStep.step}: ${prevStep.instruction}`);
      }
    }
  };

  // --- SCENARIO SIMULATION TOOLBAR HANDLERS (Section 6: Pengujian 5 Skenario) ---
  const handleScenario1Fastest = async () => {
    setActiveScenarioLabel('Skenario 1: Rute Tercepat OSRM');
    setSelectedPointId('ev-serang');
    setActiveTab('posko');
    await api.toggleRoadHazard('hazard-cilegon-drangong', false);
    await api.toggleRoadHazard('hazard-tol-merak-km74', false);
    await loadRoadHazards();
    await fetchSmartRoutes(poskoPoints[0]);
    setActiveRouteId('route-0');
    setRouteToastMessage('⚡ Skenario 1: Menghitung rute tercepat OSRM dari GPS Anda ke Posko.');
  };

  const handleScenario2Alternative = () => {
    setActiveScenarioLabel('Skenario 2: Pilih Rute Alternatif');
    const nextRouteId = activeRouteId === 'route-0' ? 'route-1' : 'route-0';
    setActiveRouteId(nextRouteId);
    setRouteToastMessage(`🔀 Skenario 2: Beralih ke ${nextRouteId === 'route-1' ? 'Rute 2 (Jalur Alternatif)' : 'Rute 1 (Jalur Utama)'}.`);
  };

  const handleScenario3RoadClosure = async () => {
    setActiveScenarioLabel('Skenario 3: Penutupan Jalan (Banjir 65cm)');
    setSelectedPointId('ev-serang');
    await api.toggleRoadHazard('hazard-cilegon-drangong', true);
    await api.toggleRoadHazard('hazard-tol-merak-km74', false);
    await loadRoadHazards();
    await fetchSmartRoutes(poskoPoints[0]);
    setRouteToastMessage('⛔ Skenario 3: Ruas Jl. Raya ditutup banjir 65cm. Smart routing otomatis mengalihkan rute.');
  };

  const handleScenario4AllBlocked = async () => {
    setActiveScenarioLabel('Skenario 4: Semua Rute Terhalang Bencana');
    setSelectedPointId('ev-serang');
    await api.toggleRoadHazard('hazard-cilegon-drangong', true);
    await api.toggleRoadHazard('hazard-tol-merak-km74', true);
    await loadRoadHazards();
    await fetchSmartRoutes(poskoPoints[0]);
    setRouteToastMessage('🚨 Skenario 4: Semua rute terhalang bencana terverifikasi. Peringatan darurat aktif.');
  };

  const handleScenario5OfflineGPS = () => {
    setActiveScenarioLabel('Skenario 5: Pengujian Sensor GPS & Routing');
    retryGps();
    fetchSmartRoutes();
    setRouteToastMessage('📡 Skenario 5: Memeriksa akurasi sensor GPS dan respons routing engine.');
  };

  const handleResetScenarios = async () => {
    setActiveScenarioLabel('Kondisi Standar Terverifikasi');
    await api.toggleRoadHazard('hazard-cilegon-drangong', true);
    await api.toggleRoadHazard('hazard-tol-merak-km74', false);
    await loadRoadHazards();
    await fetchSmartRoutes();
    setActiveRouteId('route-0');
    setRouteToastMessage('✓ Pengaturan skenario telah direset ke kondisi standar.');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-52 sm:pb-60">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D47A1] bg-[#E3F2FD] px-2.5 py-1 rounded-md">
            Screen 08: Smart Routing & Alternative Evacuation Routes
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            Rute Evakuasi Cerdas & Alternatif
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Navigasi berbasis GPS asli dan OSRM dengan deteksi penutupan jalan akibat bencana terverifikasi BPBD/SAR.
          </p>
        </div>
      </div>

      {/* Floating Active Route Notification Toast (High Contrast) */}
      {routeToastMessage && (
        <div className="p-3.5 bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-white font-extrabold">{routeToastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setRouteToastMessage(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Evaluator Scenario Quick Trigger Bar (Collapsible to keep Google Maps look clean) */}
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setShowEvaluatorPanel(!showEvaluatorPanel)}
          className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-extrabold hover:bg-slate-50 flex items-center gap-2 shadow-xs cursor-pointer transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Pengujian Skenario PRD</span>
          <span className="text-[10px] text-blue-600 font-bold">({showEvaluatorPanel ? 'Tutup ▲' : 'Buka ▼'})</span>
        </button>

        <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
          Gaya Tampilan: <strong className="text-emerald-700">Google Maps Navigation</strong>
        </span>
      </div>

      {showEvaluatorPanel && (
        <div className="p-4 rounded-3xl border-2 border-blue-300 bg-white shadow-md space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#0D47A1]">
                Pilih Skenario Pengujian PRD:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px]">
                {activeScenarioLabel}
              </span>
              <button
                type="button"
                onClick={handleResetScenarios}
                className="text-[11px] font-bold text-slate-500 hover:text-blue-700 underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={handleScenario1Fastest}
              className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 text-center shadow-xs cursor-pointer"
              title="Skenario 1: Mencari rute tercepat dari lokasi pengguna ke posko"
            >
              1. Rute Tercepat
            </button>
            <button
              type="button"
              onClick={handleScenario2Alternative}
              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 text-center shadow-xs cursor-pointer"
              title="Skenario 2: Menampilkan dan memilih rute alternatif"
            >
              2. Rute Alternatif
            </button>
            <button
              type="button"
              onClick={handleScenario3RoadClosure}
              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-center shadow-xs cursor-pointer"
              title="Skenario 3: Menutup ruas jalan akibat laporan terverifikasi dan hitung ulang"
            >
              3. Tutup Jalan (Banjir)
            </button>
            <button
              type="button"
              onClick={handleScenario4AllBlocked}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 text-center shadow-xs cursor-pointer"
              title="Skenario 4: Menangani kondisi ketika semua rute terhalang"
            >
              4. Semua Terhalang
            </button>
            <button
              type="button"
              onClick={handleScenario5OfflineGPS}
              className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-300 text-center shadow-xs cursor-pointer"
              title="Skenario 5: Menangani kegagalan GPS dan routing engine"
            >
              5. GPS & Offline
            </button>
          </div>
        </div>
      )}

      {/* Direct GPS Leaflet Map Callout Banner */}
      <div className="rounded-3xl border-2 border-blue-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0D47A1] text-white grid place-items-center shrink-0 shadow-sm">
            <Compass className="w-5 h-5 animate-spin text-[#90CAF9]" />
          </div>
          <div>
            <p className="font-extrabold text-[#0D47A1] text-sm">
              Sensor GPS Perangkat & Routing Engine ({dynamicRouteData?.routingEngine || 'OSRM'})
            </p>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Posisi GPS Anda: <code className="font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold text-blue-900">
                {gpsCoords ? `${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}` : `${userLat.toFixed(5)}, ${userLng.toFixed(5)}`}
              </code> ({accuracyText}).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchSmartRoutes()}
            disabled={isLoadingRoute}
            className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Hitung ulang rute"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRoute ? 'animate-spin text-blue-600' : ''}`} />
            <span>Hitung Ulang</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateScreen('safety_map')}
            className="primary-action text-xs shrink-0 py-2.5 px-3.5 cursor-pointer"
          >
            <span>Peta Global</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* GPS Permission Warning & Guide Banner (Jika diblokir browser) */}
      {permissionStatus === 'denied' && (
        <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs space-y-2 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2 font-extrabold text-amber-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Izin Lokasi GPS Diblokir oleh Browser</span>
          </div>
          <p className="leading-relaxed text-slate-700">
            Browser saat ini memblokir akses sensor GPS perangkat Anda. Untuk mengaktifkan koordinat asli:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1 font-medium">
            <li>Klik <strong>ikon gembok / setelan situs (tune icon)</strong> di bilah alamat URL browser (sebelah kiri alamat web).</li>
            <li>Ubah opsi <strong>Lokasi / Location</strong> dari <em>Blokir (Block)</em> menjadi <strong>Izinkan (Allow)</strong>.</li>
            <li>Klik tombol di bawah ini atau refresh halaman browser.</li>
          </ol>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => retryGps()}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Hubungkan GPS Lagi</span>
            </button>
          </div>
        </div>
      )}

      {/* MAP VIEWPORT SECTION */}
      <div ref={mapSectionRef} className="space-y-2">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Pilihan Tampilan Peta:</span>
          </span>

          <div className="flex items-center p-1 bg-slate-200/90 rounded-2xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setMapViewMode('leaflet')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                mapViewMode === 'leaflet'
                  ? 'bg-white text-blue-900 shadow-md border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Peta Jalan Raya (OSRM + GPS)</span>
            </button>
            <button
              type="button"
              onClick={() => setMapViewMode('schematic')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                mapViewMode === 'schematic'
                  ? 'bg-white text-blue-900 shadow-md border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Skema Virtual (Google Maps Style)</span>
            </button>
          </div>
        </div>

        {/* 1. REAL INTERACTIVE LEAFLET ROUTE MAP WITH MULTI-ROUTE & COLLISION RENDERING */}
        {mapViewMode === 'leaflet' && (
          <div className="relative animate-fadeIn space-y-2">
            <RouteMapCanvas
              userLat={userLat}
              userLng={userLng}
              accuracyText={accuracyText}
              target={selectedPoint}
              smartRoutes={candidateRoutes}
              activeRouteId={activeRouteId}
              onSelectRoute={(newRouteId) => {
                setActiveRouteId(newRouteId);
                setRouteToastMessage(`🔀 Beralih ke ${newRouteId === 'route-0' ? 'Rute 1' : 'Rute 2'}.`);
              }}
              hazards={roadHazards}
              allRoutesBlocked={Boolean(dynamicRouteData?.allRoutesBlocked)}
              currentStepIndex={currentStepIndex}
              isNavigating={isNavigating}
              onStepClick={(stepIdx) => {
                setCurrentStepIndex(stepIdx);
                const step = navSteps[stepIdx];
                if (step) {
                  speakInstruction(`Langkah ${step.step}: ${step.instruction}`);
                }
              }}
              onStartNavigation={handleStartNavigation}
            />
          </div>
        )}

        {/* 2. DYNAMIC GOOGLE MAPS-STYLE VIRTUAL ROUTE SCHEMATIC (Matches image5.png!) */}
        {mapViewMode === 'schematic' && (
          <VirtualRouteSchematic
            userLat={userLat}
            userLng={userLng}
            accuracyText={accuracyText}
            target={selectedPoint}
            smartRoutes={candidateRoutes}
            activeRouteId={activeRouteId}
            onSelectRoute={(newRouteId) => setActiveRouteId(newRouteId)}
            allRoutesBlocked={Boolean(dynamicRouteData?.allRoutesBlocked)}
            hazards={roadHazards}
            isNavigating={isNavigating}
            onStartNavigation={handleStartNavigation}
          />
        )}
      </div>

      {/* DETOUR ADVISORY BANNER: When a verified closure diverted the route */}
      {dynamicRouteData?.detourNotice && (
        <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-medium flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-amber-900 text-sm">Pengalihan Rute Otomatis Terdeteksi:</p>
            <p className="mt-0.5 leading-relaxed">{dynamicRouteData.detourNotice}</p>
          </div>
        </div>
      )}

      {/* EMERGENCY ALL ROUTES BLOCKED WARNING (Requirement 4) */}
      {dynamicRouteData?.allRoutesBlocked && (
        <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-500 text-rose-950 text-xs space-y-2.5 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
            <h4 className="font-extrabold text-rose-900 text-base">
              SELURUH AKSES JALAN DARAT TERHALANG BENCANA TERVERIFIKASI
            </h4>
          </div>
          <p className="leading-relaxed text-slate-700">
            Seluruh rute menuju lokasi tujuan terpotong oleh banjir/longsor terverifikasi. Jangan memaksakan melintas dengan kendaraan maupun berjalan kaki demi keselamatan jiwa.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <a
              href="tel:115"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Hubungi Tim SAR (115)</span>
            </a>
            <a
              href="tel:112"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Center BPBD (112)</span>
            </a>
          </div>
        </div>
      )}

      {/* PEMILIH RUTE UTAMA VS ALTERNATIF (ALWAYS VISIBLE & CRISP) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Pilihan Rute Perjalanan ({candidateRoutes.length} Opsi Tersedia):</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-bold">
            Klik kartu untuk mengganti rute
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {candidateRoutes.map((route) => {
            const isSelected = route.id === activeRouteId;
            const isBlocked = route.isBlocked;
            const isImpacted = route.isImpacted;

            return (
              <div
                key={route.id}
                onClick={() => {
                  setActiveRouteId(route.id);
                  setRouteToastMessage(`🔀 Memilih ${route.name} (${route.summary}).`);
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? isBlocked
                      ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-200 shadow-md'
                      : isImpacted
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-200 shadow-md'
                        : 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-300 shadow-md'
                    : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/70 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm truncate">
                        {route.name}
                      </span>
                      {route.isRecommended && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-extrabold text-[9px]">
                          REKOMENDASI TERBAIK
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 font-semibold truncate">
                      {route.summary}
                    </p>

                    <div className="flex items-center gap-2 text-xs pt-1">
                      <span className="font-extrabold text-blue-700 text-sm">{route.durationFormatted}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-bold text-slate-700">{route.distanceFormatted}</span>
                    </div>

                    {/* Alasan Sistem Memilih Rute Ini (Aturan 9) */}
                    {route.selectionReason && (
                      <div className={`mt-2 p-2 rounded-xl text-[11px] font-semibold leading-relaxed border ${
                        route.isRecommended
                          ? 'bg-emerald-50/90 text-emerald-950 border-emerald-200'
                          : route.isBlocked
                            ? 'bg-rose-50/90 text-rose-950 border-rose-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        <span className="font-extrabold block text-[10px] uppercase tracking-wider mb-0.5 ${
                          route.isRecommended ? 'text-emerald-800' : route.isBlocked ? 'text-rose-800' : 'text-slate-600'
                        }">
                          {route.isRecommended ? '💡 Alasan Pemilihan:' : route.isBlocked ? '⚠️ Catatan Keselamatan:' : 'ℹ️ Info Rute:'}
                        </span>
                        {route.selectionReason}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      isSelected ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-400 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className={`font-extrabold flex items-center gap-1 ${
                    isBlocked ? 'text-rose-600' : isImpacted ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                    {isBlocked ? '⛔' : isImpacted ? '⚠️' : '✓'}
                    <span>{route.statusLabel}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KARTU STATUS BAHAYA JALAN & VERIFIKASI BENCANA (Requirement 3 & 4) */}
      <div className="p-4 rounded-3xl border-2 border-slate-300 bg-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
              Status Bahaya Jalan Terdata ({roadHazards.filter(h => h.active).length} Titik Terpantau):
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500">Database Real-Time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {roadHazards.map((hazard) => {
            const isClosed = hazard.severity === 'closed';
            const isVerified = hazard.status === 'verified';

            return (
              <div
                key={hazard.id}
                className={`p-3 rounded-2xl border transition-all ${
                  hazard.active
                    ? isClosed
                      ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                      : 'bg-amber-50/70 border-amber-300 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="font-extrabold text-[11px] truncate">{hazard.road_name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                    hazard.active ? (isClosed ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white') : 'bg-slate-200 text-slate-600'
                  }`}>
                    {hazard.active ? (isClosed ? 'TUTUP' : 'GENANGAN') : 'NORMAL'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 mt-1 line-clamp-2 leading-tight">
                  {hazard.description}
                </p>
                <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[9px] text-slate-500">
                  <span>{isVerified ? '✓ Terverifikasi BPBD/SAR' : '⚠️ Laporan Warga'}</span>
                  <span>{hazard.active ? 'Aktif Menghalangi' : 'Aman Dilewati'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TURN-BY-TURN STEP-BY-STEP LIVE NAVIGATION CARD (Konsisten Light UI, Bebas Overflow) */}
      <div className={`p-4 sm:p-5 rounded-3xl border-2 transition-all shadow-xl bg-white overflow-hidden ${
        isNavigating
          ? 'border-blue-600 ring-4 ring-blue-100 shadow-blue-500/10'
          : 'border-slate-300'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                isNavigating ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-100 text-[#0D47A1]'
              }`}>
                {isNavigating ? 'NAVIGASI AKTIF' : 'PANDUAN JALUR TERPILIH'}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Langkah {currentStepIndex + 1} dari {totalNavSteps}
              </span>
            </div>

            <h3 className="font-black text-base sm:text-lg mt-1 text-slate-900 truncate">
              {currentNavStep?.title || 'Panduan Navigasi'}
            </h3>
          </div>

          {/* Voice Guidance Speaker Button */}
          <button
            type="button"
            onClick={() => speakInstruction(currentNavStep?.instruction || '')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer shrink-0 shadow-xs ${
              isSpeaking
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                : isNavigating
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title="Dengarkan instruksi suara"
          >
            {isSpeaking ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-current" />}
          </button>
        </div>

        {/* Step Instruction Text */}
        <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed font-bold border bg-blue-50/70 border-blue-200/80 text-slate-900">
          {currentNavStep?.instruction}
        </div>

        {/* Navigation Step Switcher Buttons (Mobile-Safe, Never Overflows) */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className={`px-2.5 sm:px-3 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1 shrink-0 transition-all ${
              currentStepIndex === 0
                ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer active:scale-95'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>

          {/* Pagination dots (with flexible shrink to avoid pushing buttons out) */}
          <div className="flex gap-1 shrink min-w-0 overflow-hidden items-center justify-center">
            {navSteps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentStepIndex(idx);
                  const step = navSteps[idx];
                  if (step) speakInstruction(`Langkah ${step.step}: ${step.instruction}`);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer shrink-0 ${
                  idx === currentStepIndex
                    ? 'w-5 sm:w-6 bg-blue-600'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Pilih langkah ${idx + 1}`}
              />
            ))}
          </div>

          {currentStepIndex < totalNavSteps - 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer transition-all active:scale-95"
            >
              <span><span className="hidden sm:inline">Langkah </span>Berikutnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                speakInstruction(`Selamat! Anda telah tiba di ${selectedPoint.name}. Laporkan keberadaan Anda kepada petugas atau konfirmasi kondisi aman.`);
                onNavigateScreen('confirm_safe');
              }}
              className="px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer animate-pulse active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tiba di Tujuan</span>
            </button>
          )}
        </div>
      </div>

      {/* CATEGORY TABS: Posko, Rumah Sakit, Keluarga, Orang Butuh Bantuan */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              Pilih Tujuan Rute Evakuasi & Penyelamatan:
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pilih posko, fasilitas medis, keluarga, atau warga yang butuh bantuan untuk memuat rute dan alternatifnya.
            </p>
          </div>
        </div>

        {/* 4 Categories Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-300 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('posko');
              handleDirectRoute(poskoPoints[0], 'posko');
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'posko'
                ? 'bg-white text-emerald-900 shadow-md border border-emerald-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Posko Evakuasi</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-[10px] text-emerald-800">{poskoPoints.length}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('medis');
              handleDirectRoute(medisPoints[0], 'medis');
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'medis'
                ? 'bg-white text-blue-900 shadow-md border border-blue-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Rumah Sakit</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-[10px] text-blue-800">{medisPoints.length}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('keluarga');
              handleDirectRoute(familyPoints[0], 'keluarga');
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'keluarga'
                ? 'bg-white text-indigo-900 shadow-md border border-indigo-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Keluarga</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-[10px] text-indigo-800">{familyPoints.length}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('darurat');
              handleDirectRoute(emergencyPoints[0], 'darurat');
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'darurat'
                ? 'bg-white text-rose-900 shadow-md border border-rose-300'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Butuh Bantuan</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-[10px] text-rose-800">{emergencyPoints.length}</span>
          </button>
        </div>

        {/* LIST OF TARGET CARDS (CRISP VISIBILITY & HIGH CONTRAST) */}
        <div className="space-y-3">
          {/* TAB 1: POSKO EVAKUASI */}
          {activeTab === 'posko' && poskoPoints.map((point) => {
            const isSelected = point.id === selectedPointId || point.dbId === selectedPointId;
            const isVerified = point.status.includes('TERVERIFIKASI');

            return (
              <div
                key={point.id}
                onClick={() => handleDirectRoute(point, 'posko')}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-blue-600 ring-2 ring-blue-300 shadow-md'
                    : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/70 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-base">{point.name}</h4>
                      {isVerified ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>TERVERIFIKASI RESMI</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          <span>STATUS RUTE BELUM TERVERIFIKASI</span>
                        </span>
                      )}

                      {isSelected && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 animate-pulse">
                          <span>✓ RUTE JALAN AKTIF</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 flex flex-wrap items-center gap-2 pt-1">
                      <span className="font-extrabold text-blue-700 text-sm">Jarak: {isSelected && activeRoute ? activeRoute.distanceFormatted : point.distance}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">{isSelected && activeRoute ? activeRoute.durationFormatted : point.estTime}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">{point.address}</span>
                    </p>
                  </div>

                  <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-400 bg-white'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </span>
                </div>

                <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <p className="font-bold text-slate-800">
                    Jalur Jalan: <strong className="text-blue-900">{point.summaryRoute}</strong>
                  </p>
                  <p className="text-slate-600 leading-relaxed">{point.notes}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200 mt-1.5">
                    <span>Sumber: {point.verifiedAt}</span>
                    <span>Kapasitas: {point.capacity}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectRoute(point, 'posko');
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-300'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{isSelected ? '✓ Rute Jalan Raya Sedang Ditampilkan (Pusatkan)' : '🧭 Arahkan Rute ke Posko Ini'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* TAB 2: RUMAH SAKIT & MEDIS */}
          {activeTab === 'medis' && medisPoints.map((point) => {
            const isSelected = point.id === selectedPointId;

            return (
              <div
                key={point.id}
                onClick={() => handleDirectRoute(point, 'medis')}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-blue-600 ring-2 ring-blue-300 shadow-md'
                    : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/70 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-base">{point.name}</h4>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-extrabold rounded-md">
                        {point.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 flex flex-wrap items-center gap-2 pt-1">
                      <span className="font-extrabold text-blue-700 text-sm">Jarak: {isSelected && activeRoute ? activeRoute.distanceFormatted : point.distance}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">{isSelected && activeRoute ? activeRoute.durationFormatted : point.estTime}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">{point.address}</span>
                    </p>
                  </div>

                  <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-400 bg-white'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </span>
                </div>

                <div className="mt-3 p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-1 text-xs">
                  <p className="font-bold text-blue-950">Fasilitas Darurat: {point.capacity}</p>
                  <p className="text-slate-700 leading-relaxed">{point.notes}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectRoute(point, 'medis');
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-300'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{isSelected ? '✓ Rute Rumah Sakit Aktif (Pusatkan)' : '🧭 Arahkan Rute ke Rumah Sakit'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* TAB 3: KELUARGA */}
          {activeTab === 'keluarga' && familyPoints.map((point) => {
            const isSelected = point.id === selectedPointId;

            return (
              <div
                key={point.id}
                onClick={() => handleDirectRoute(point, 'keluarga')}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-indigo-600 ring-2 ring-indigo-300 shadow-md'
                    : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/70 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-base">{point.name}</h4>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold rounded-md">
                        {point.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 flex flex-wrap items-center gap-2 pt-1">
                      <span className="font-extrabold text-indigo-700 text-sm">Jarak: {isSelected && activeRoute ? activeRoute.distanceFormatted : point.distance}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-bold">{isSelected && activeRoute ? activeRoute.durationFormatted : point.estTime}</span>
                      <span>•</span>
                      <span className="text-slate-600">{point.address}</span>
                    </p>
                  </div>

                  <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                    isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-400 bg-white'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </span>
                </div>

                <div className="mt-3 p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-1 text-xs text-indigo-950">
                  <p className="font-bold">Kondisi & Kebutuhan Khusus:</p>
                  <p className="leading-relaxed">{point.notes}</p>
                  <p className="font-semibold text-indigo-800 mt-1">Perlengkapan yang Disiapkan: {point.needs}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectRoute(point, 'keluarga');
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-300'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{isSelected ? '✓ Rute Sedang Ditampilkan (Pusatkan)' : '🧭 Arahkan Rute ke Anggota Keluarga'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* TAB 4: BUTUH BANTUAN */}
          {activeTab === 'darurat' && emergencyPoints.map((point) => {
            const isSelected = point.id === selectedPointId;

            return (
              <div
                key={point.id}
                onClick={() => handleDirectRoute(point, 'darurat')}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-50/50 border-rose-600 ring-2 ring-rose-300 shadow-md'
                    : 'bg-white border-slate-300 hover:border-rose-300 hover:bg-slate-50/70 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-base">{point.name}</h4>
                      <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-extrabold rounded-md animate-pulse">
                        {point.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 flex flex-wrap items-center gap-2 pt-1">
                      <span className="font-extrabold text-rose-700 text-sm">Jarak: {isSelected && activeRoute ? activeRoute.distanceFormatted : point.distance}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-bold">{isSelected && activeRoute ? activeRoute.durationFormatted : point.estTime}</span>
                      <span>•</span>
                      <span className="text-rose-900 font-bold">{point.vulnerable}</span>
                    </p>
                  </div>

                  <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                    isSelected ? 'bg-rose-600 text-white border-rose-600' : 'border-slate-400 bg-white'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </span>
                </div>

                <div className="mt-3 p-3.5 bg-rose-100/70 border border-rose-300 rounded-2xl space-y-1 text-xs text-rose-950">
                  <p className="font-bold">Kebutuhan Evakuasi Darurat:</p>
                  <p className="leading-relaxed">{point.notes}</p>
                  <p className="font-bold text-rose-800 mt-1">Kebutuhan Mendesak: {point.needs}</p>
                  <div className="pt-2 flex items-center justify-between">
                    <a
                      href={`tel:${point.contact}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Hubungi ({point.contact})</span>
                    </a>
                    <span className="text-[11px] text-slate-500 font-bold">Laporan GPS Terverifikasi</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectRoute(point, 'darurat');
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{isSelected ? '✓ Rute Penyelamatan Aktif (Pusatkan)' : '🧭 Arahkan Rute Penyelamatan'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Principle & Limitation Card (Requirement 4 & 5) */}
      <div className="p-4 bg-[#E3F2FD] rounded-3xl border border-[#90CAF9] text-xs text-[#0D47A1] space-y-1.5 shadow-sm">
        <div className="flex items-center gap-1.5 font-extrabold">
          <ShieldCheck className="w-4 h-4 text-[#2196F3]" />
          <span>Prinsip Keselamatan & Batasan Sistem Routing (PRD 4.6):</span>
        </div>
        <p className="leading-relaxed text-slate-700 font-medium">
          Sistem Smart Routing memadukan jaringan jalan OpenStreetMap via mesin OSRM dengan basis data laporan bencana terverifikasi. <strong>Kondisi lapangan dapat berubah sewaktu-waktu akibat luapan air mendadak atau pohon tumbang</strong>. Sistem tidak mengklaim rute aman secara absolut. Jika menemui rintangan tak terduga, ikuti arahan petugas patroli dan relawan setempat.
        </p>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="secondary-action text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateScreen('checklist')}
          className="primary-action text-xs"
        >
          <span>Lanjut ke Tas Siaga Checklist</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

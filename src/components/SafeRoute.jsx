'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Footprints,
  Compass,
  PhoneCall,
  Volume2,
  VolumeX,
  Users,
  ShieldAlert,
  ChevronRight,
  Layers,
  Map as MapIcon,
  RefreshCw,
  Check,
  Building2,
  Sparkles
} from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import RouteMapCanvas from './RouteMapCanvas';
import VirtualRouteSchematic from './VirtualRouteSchematic';
import { api } from '../services/api';
import {
  calculateDistance,
  calculateRoadDistance,
  formatDistance,
  formatTravelTime,
  formatWalkTime
} from '../lib/geoUtils';

export {
  calculateDistance,
  calculateRoadDistance,
  formatDistance,
  formatTravelTime,
  formatWalkTime
};

// Generate realistic intermediate coordinates between two points with natural curve
function generateRouteCoordinates(startLat, startLng, endLat, endLng, curveFactor = 0.003) {
  const points = [];
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const curve = Math.sin(t * Math.PI) * curveFactor;
    points.push([
      parseFloat((startLat + (endLat - startLat) * t + curve * 0.4).toFixed(6)),
      parseFloat((startLng + (endLng - startLng) * t + curve).toFixed(6))
    ]);
  }
  return points;
}

export default function SafeRoute({ 
  hazardData, 
  familyMembers = [],
  navigationTarget,
  setNavigationTarget,
  onBack, 
  onNavigateScreen 
}) {
  const { coords: gpsCoords, accuracyText, permissionStatus, retry: retryGps } = useGeolocation();
  
  // Real coordinates from device GPS or default to pusat Kota Cilegon
  const userLat = gpsCoords?.lat ?? -5.9860;
  const userLng = gpsCoords?.lng ?? 106.0520;

  const mapSectionRef = useRef(null);

  // Category tabs: 'posko', 'medis', 'keluarga', 'darurat'
  const [activeTab, setActiveTab] = useState(
    navigationTarget?.itemType === 'laporan_darurat'
      ? 'darurat'
      : navigationTarget?.itemType === 'warga' || navigationTarget?.category === 'keluarga'
        ? 'keluarga'
        : navigationTarget?.itemType === 'rumah_sakit' || navigationTarget?.category === 'medis'
          ? 'medis'
          : 'posko'
  );

  // Selected Target ID
  const [selectedPointId, setSelectedPointId] = useState(
    navigationTarget?.id || 'ev-serang'
  );

  // Active selected route id ('route-0' or 'route-1')
  const [activeRouteId, setActiveRouteId] = useState('route-0');

  // Turn-by-Turn Navigation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Map view switcher: 'leaflet' (real Leaflet + OSM) or 'schematic' (lightweight vector)
  const [mapViewMode, setMapViewMode] = useState('leaflet');

  // Toast notification when route is activated or updated
  const [routeToastMessage, setRouteToastMessage] = useState(null);

  // Dynamic route data from smart routing API (contains candidate routes, roadblocks, collision analysis)
  const [dynamicRouteData, setDynamicRouteData] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Community report state: set of hazardIds yang sudah dilaporkan user ini
  const [myReportedHazards, setMyReportedHazards] = useState(new Set());
  const [reportingHazardId, setReportingHazardId] = useState(null); // loading state per hazard

  // Stable session ID untuk anti-duplikasi laporan (1 sesi = 1 laporan per hazard)
  const sessionId = useMemo(() => {
    if (typeof window === 'undefined') return 'ssr-session';
    let sid = sessionStorage.getItem('safe_route_session_id');
    if (!sid) {
      sid = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem('safe_route_session_id', sid);
    }
    return sid;
  }, []);

  // Evaluator PRD testing scenario collapsible panel
  const [showEvaluatorPanel, setShowEvaluatorPanel] = useState(false);
  const [activeScenarioLabel, setActiveScenarioLabel] = useState('Skenario 1: Rute Tercepat (Standar)');

  // Road disaster hazards list from database
  const [roadHazards, setRoadHazards] = useState([
    {
      id: 'hazard-cilegon-drangong',
      road_name: 'Simpang Drangong - Serang Barat',
      hazard_type: 'Banjir Luapan Sungai',
      water_depth: '65 cm',
      severity: 'closed',
      status: 'verified',
      active: true,
      lat: -6.0420,
      lng: 106.0950,
      radius_meters: 220,
      description: 'Luapan air sungai mencapai 65 cm dengan arus deras. Ruas jalan ditutup total untuk semua jenis kendaraan.',
      reported_by: 'BPBD Banten & Satlantas',
      reported_at: '15 mnt lalu'
    },
    {
      id: 'hazard-tol-merak-km74',
      road_name: 'Akses Interchange Tol Merak KM 74',
      hazard_type: 'Genangan Sedang',
      water_depth: '25 cm',
      severity: 'passable_caution',
      status: 'verified',
      active: false,
      lat: -6.0150,
      lng: 106.0680,
      radius_meters: 180,
      description: 'Genangan setinggi 25 cm di bahu jalan tol, dapat dilintasi kendaraan evakuasi bertonase sedang dengan kehati-hatian.',
      reported_by: 'Petugas Tol PJR',
      reported_at: '20 mnt lalu'
    }
  ]);

  // Load road hazards from database
  const loadRoadHazards = useCallback(async () => {
    try {
      const hazards = await api.getRoadHazards();
      if (hazards && hazards.length > 0) {
        setRoadHazards(hazards);
      }
    } catch (e) {
      console.warn('Gagal memuat status bahaya jalan terbaru:', e);
    }
  }, []);

  useEffect(() => {
    loadRoadHazards();
  }, [loadRoadHazards]);

  // 1. Destination Definitions: Posko Evakuasi
  // Semua koordinat adalah titik nyata di Cilegon/Serang/Banten yang diverifikasi via OpenStreetMap
  const poskoPoints = useMemo(() => {
    const raw = [
      {
        id: 'ev-serang',
        dbId: 'posko-serang',
        name: 'Posko Terpadu Alun-Alun Serang & BPBD Banten (Utama)',
        category: 'posko',
        targetType: 'posko',
        // Alun-Alun Kota Serang — koordinat OSM terverifikasi
        lat: -6.1202,
        lng: 106.1503,
        benchmarkRoadMeters: 21500, // Jarak jalan raya riil via Jl. Pantura (Google Maps: 21.6 km)
        address: 'Alun-Alun Serang, Kotabaru, Kec. Serang (Luar Kota)',
        summaryRoute: 'lewat Jl. Raya Cilegon → Jl. Pantura → Jl. Jend. Sudirman Serang',
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
            title: 'Lintasi Jalur Bebas Genangan Serang Barat',
            instruction: 'Terus melaju menyusuri jalur lingkar menuju perbatasan Kota Serang (jalur bebas genangan banjir terverifikasi).',
            danger: 'Waspada penyempitan jalan di persimpangan'
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
        id: 'ev-merak',
        dbId: 'posko-merak',
        name: 'Posko Siaga Pelabuhan Merak & Basarnas Banten',
        category: 'posko',
        targetType: 'posko',
        // Kawasan Pelabuhan Merak — Luar Kota Arah Barat Laut (~14.4 km via Jl. Raya Merak / Tol)
        lat: -5.9328,
        lng: 106.0025,
        benchmarkRoadMeters: 14400, // Jarak jalan raya riil via Jl. Raya Merak (14.4 km)
        address: 'Pelabuhan Merak, Pulomerak, Kota Cilegon Pesisir',
        summaryRoute: 'lewat Jl. Raya Merak / Jalur Tol Merak KM 98',
        capacity: 'Kapasitas evakuasi laut & darat ~400 jiwa',
        status: 'TERVERIFIKASI RESMI BASARNAS',
        verifiedAt: '15 menit lalu oleh Basarnas Banten',
        elevation: '+8m mdpl (Pos Dermaga Evakuasi)',
        notes: 'Pusat evakuasi maritim terpadu dan helipad Basarnas. Titik kumpul utama warga pesisir barat.',
        isRecommended: false,
        travelMode: 'driving',
        navSteps: [
          {
            step: 1,
            title: 'Melaju ke Arah Barat Laut Menuju Merak',
            instruction: 'Arahkan kendaraan ke Jalan Raya Merak arah barat laut menyusuri pesisir Selat Sunda.',
            danger: 'Angin kencang dan potensi gelombang pasang di bibir pantai'
          },
          {
            step: 2,
            title: 'Masuki Kompleks Pelabuhan Merak',
            instruction: 'Masuki gerbang dermaga darurat Basarnas di sisi utara pelabuhan.',
            danger: 'Antrean armada kapal evakuasi'
          }
        ]
      },
      {
        id: 'ev-pandeglang',
        dbId: 'posko-pandeglang',
        name: 'Posko Banten Selatan / Alun-Alun Pandeglang',
        category: 'posko',
        targetType: 'posko',
        // Pandeglang — Rute Luar Kota Jarak Jauh (~45.4 km via Arteri Serang-Pandeglang)
        lat: -6.3088,
        lng: 106.1065,
        benchmarkRoadMeters: 45400, // Jarak jalan raya riil (45.4 km)
        address: 'Alun-Alun Pandeglang, Pandeglang (Rute Luar Kota)',
        summaryRoute: 'lewat Jl. Raya Cilegon → Serang → Jl. Raya Pandeglang',
        capacity: 'Kapasitas luas dataran tinggi ~800 jiwa',
        status: 'TERVERIFIKASI BPBD BANTEN',
        verifiedAt: '20 menit lalu',
        elevation: '+160m mdpl (Dataran Tinggi Bebas Banjir)',
        notes: 'Titik evakuasi alternatif dataran tinggi untuk pengungsi dari dataran rendah pantai barat.',
        isRecommended: false,
        travelMode: 'driving',
        navSteps: [
          {
            step: 1,
            title: 'Menuju Jalur Arteri Serang - Pandeglang',
            instruction: 'Dari Cilegon ambil rute timur via Serang lalu belok selatan menuju Jalan Raya Pandeglang.',
            danger: 'Ruas jalan berkelok dan menanjak di perbukitan'
          },
          {
            step: 2,
            title: 'Tiba di Kompleks Alun-Alun Pandeglang',
            instruction: 'Pusatkan kendaraan di lapangan Alun-Alun Pandeglang di tenda pengungsian BPBD.',
            danger: 'Kabut tebal saat hujan deras'
          }
        ]
      },
      {
        id: 'ev-1',
        dbId: 'posko-1',
        name: 'Balai Kota Cilegon & Pos Pengungsian Mandiri',
        category: 'posko',
        targetType: 'posko',
        // Balai Kota Cilegon, Jl. Jend. Sudirman — koordinat OSM terverifikasi
        lat: -6.0023,
        lng: 106.0572,
        benchmarkRoadMeters: 4550, // Jarak jalan raya riil via Jl. Jend. Sudirman (4.5 km)
        address: 'Jl. Jend. Sudirman No. 1, Cilegon (Pusat Kota)',
        summaryRoute: 'lewat Jl. Jend. Sudirman Cilegon',
        capacity: 'Kapasitas tersisa ~80 jiwa (Luas)',
        status: 'TERVERIFIKASI',
        verifiedAt: '12 menit lalu oleh BPBD Posko Wilayah',
        elevation: 'Elevasi tinggi (+18m mdpl)',
        notes: 'Akses melalui Jalan Sudirman aman dari genangan air. Tersedia tenaga medis lapangan dan genset darurat.',
        isRecommended: false,
        travelMode: 'driving',
        navSteps: [
          {
            step: 1,
            title: 'Keluar Menuju Jalan Jend. Sudirman',
            instruction: 'Melangkah keluar dari lokasi awal menuju Jl. Jend. Sudirman arah utara. Hindari sisi selokan yang tertutup genangan air.',
            danger: 'Potensi lubang selokan tak terlihat di genangan air'
          },
          {
            step: 2,
            title: 'Lurus menuju Balai Kota Cilegon',
            instruction: 'Ikuti Jl. Jend. Sudirman hingga terlihat gerbang Balai Kota Cilegon di sisi kiri jalan.',
            danger: 'Arus warga evakuasi mandiri'
          },
          {
            step: 3,
            title: 'Tiba di Gerbang Balai Kota Cilegon',
            instruction: 'Masuk melalui gerbang utama. Titik aman pengungsian dan posko medis P3K berada di halaman depan.',
            danger: 'Kondisi halaman mungkin basah'
          }
        ]
      },
      {
        id: 'ev-2',
        dbId: 'posko-2',
        name: 'GOR Kecamatan Cibeber & Posko Terpadu',
        category: 'posko',
        targetType: 'posko',
        // GOR/Lapangan Cibeber, Cilegon — koordinat OSM terverifikasi
        lat: -6.0312,
        lng: 106.0521,
        benchmarkRoadMeters: 7560, // Jarak jalan raya riil via Jl. Raya Cibeber (7.6 km)
        address: 'Jl. Raya Cibeber, Cibeber, Cilegon',
        summaryRoute: 'lewat Jl. Raya Cibeber',
        capacity: 'Kapasitas besar, dapur umum aktif',
        status: 'TERVERIFIKASI',
        verifiedAt: '25 menit lalu oleh Tim Reaksi Cepat',
        elevation: 'Elevasi tinggi (+24m mdpl)',
        notes: 'Jalur via Jl. Raya Cibeber relatif aman dari banjir. Fasilitas olahraga difungsikan sebagai titik pengungsian sementara.',
        isRecommended: false,
        travelMode: 'driving',
        navSteps: [
          {
            step: 1,
            title: 'Menuju Jalan Raya Cibeber',
            instruction: 'Bergerak ke selatan menuju Jl. Raya Cibeber. Ikuti jalur pedestrian yang telah dibatasi pita pengaman.',
            danger: 'Jalan protokol padat merayap armada evakuasi'
          },
          {
            step: 2,
            title: 'Ikuti Jl. Raya Cibeber ke Selatan',
            instruction: 'Lurus menyusuri Jl. Raya Cibeber sekitar 1,5 km hingga terlihat GOR di sisi kanan jalan.',
            danger: 'Waspada persimpangan tanpa lampu saat darurat'
          },
          {
            step: 3,
            title: 'Masuki Kompleks GOR Cibeber',
            instruction: 'Pintu gerbang utama dibuka khusus pengungsi warga. Dapur umum BNPB dan pos medis berada di sisi barat gedung.',
            danger: 'Antrean pemeriksaan posko pengungsian'
          }
        ]
      }
    ];

    return raw.map(p => {
      const dist = calculateRoadDistance(userLat, userLng, p.lat, p.lng, p.benchmarkRoadMeters, p.travelMode);
      return {
        ...p,
        distanceMeters: dist,
        distance: formatDistance(dist),
        estTime: formatTravelTime(dist, p.travelMode)
      };
    });
  }, [userLat, userLng]);

  // 2. Destination Definitions: Rumah Sakit & Fasilitas Medis
  // Koordinat nyata dari OpenStreetMap
  const medisPoints = useMemo(() => {
    const raw = [
      {
        id: 'med-1',
        name: 'RSUD Provinsi Banten & Pos Medis Bencana',
        category: 'medis',
        targetType: 'rumah_sakit',
        // RSUD Banten, Jl. Syech Nawawi Al-Bantani, Serang — koordinat OSM terverifikasi
        lat: -6.1186,
        lng: 106.1537,
        benchmarkRoadMeters: 21600, // Jarak jalan raya riil via Jl. Pantura (21.6 km)
        address: 'Jl. Syech Nawawi Al-Bantani, Cipocok Jaya, Serang',
        summaryRoute: 'lewat Jl. Raya Cilegon → Jl. Syech Nawawi Al-Bantani',
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
          { step: 3, title: 'Tiba di Ruang Triase UGD', instruction: 'Parkir armada di depan kanopi IGD untuk serah terima pasien dan tindakan medis.' }
        ]
      },
      {
        id: 'med-2',
        name: 'RSUD Kota Cilegon & Puskesmas Siaga',
        category: 'medis',
        targetType: 'rumah_sakit',
        // RSUD Cilegon — koordinat OSM terverifikasi
        lat: -6.0140,
        lng: 106.0527,
        benchmarkRoadMeters: 4640, // Jarak jalan raya riil via Jl. Bojonegara (4.6 km)
        address: 'Jl. Bojonegara No. 4, Kota Cilegon',
        summaryRoute: 'lewat Jl. Bojonegara Cilegon',
        capacity: 'Kapasitas 80 bed darurat, 2 Ambulans',
        status: 'TERVERIFIKASI RESMI',
        verifiedAt: '30 menit lalu',
        elevation: '+20m mdpl',
        notes: 'Pusat perawatan luka ringan dan pos suplai obat-obatan darurat wilayah Cilegon.',
        isRecommended: false,
        travelMode: 'driving',
        navSteps: [
          { step: 1, title: 'Menuju Jalan Bojonegara', instruction: 'Melaju lurus ke arah utara menyusuri Jalan Bojonegara.' },
          { step: 2, title: 'Masuki Area RSUD Cilegon', instruction: 'Lapor ke petugas piket medis di tenda triase depan.' }
        ]
      }
    ];

    return raw.map(p => {
      const dist = calculateRoadDistance(userLat, userLng, p.lat, p.lng, p.benchmarkRoadMeters, p.travelMode);
      return {
        ...p,
        distanceMeters: dist,
        distance: formatDistance(dist),
        estTime: formatTravelTime(dist, p.travelMode)
      };
    });
  }, [userLat, userLng]);

  // 3. Destination Definitions: Lokasi Keluarga
  // Koordinat nyata di sekitar pusat Cilegon
  const familyPoints = useMemo(() => {
    const raw = [
      {
        id: 'f2',
        name: 'Ibu Ratna (Orang Tua / Lansia)',
        category: 'keluarga',
        targetType: 'keluarga',
        relationship: 'Orang Tua / Lansia',
        // Jl. Kenanga area Cilegon Kota — koordinat representatif
        lat: -5.9921,
        lng: 106.0401,
        benchmarkRoadMeters: 2070, // Jarak rute jalan kaki riil pemukiman (2.1 km)
        address: 'Jl. Kenanga No. 8, Cilegon Kota',
        summaryRoute: 'lewat Jl. Kenanga — Cilegon Kota',
        status: 'BERSAMA DI RUMAH',
        urgency: 'PRIORITAS MOBILITAS',
        elevation: 'Rumah Tinggal (+15m mdpl)',
        notes: 'Kondisi stabil tetapi membutuhkan kursi roda atau dipapah dua orang. Obat hipertensi rutin harus selalu dibawa.',
        needs: 'Kursi roda, payung besar, dan pendampingan fisik',
        vulnerable: 'Lansia (64 tahun, butuh kursi roda)',
        travelMode: 'walking',
        navSteps: [
          { step: 1, title: 'Menuju Kamar Utama Lantai 1', instruction: 'Masuki kamar tidur utama untuk menjemput Ibu Ratna.' },
          { step: 2, title: 'Amankan Kursi Roda & Tas Obat', instruction: 'Bawa tas obat amlodipine dan dokumen KK/KTP di tas siaga.' },
          { step: 3, title: 'Evakuasi Menuju Jalur Aspal Kering', instruction: 'Bawa Ibu Ratna melewati pintu samping ke jalur aspal bebas genangan.' }
        ]
      },
      {
        id: 'f3',
        name: 'Arka (Anak Balita - 5 Tahun)',
        category: 'keluarga',
        targetType: 'keluarga',
        relationship: 'Anak Balita',
        // Area Jl. Mawar, Cilegon — koordinat representatif
        lat: -5.9878,
        lng: 106.0389,
        benchmarkRoadMeters: 2290, // Jarak rute jalan kaki riil (2.3 km)
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
      const dist = calculateRoadDistance(userLat, userLng, p.lat, p.lng, p.benchmarkRoadMeters, p.travelMode);
      return {
        ...p,
        distanceMeters: dist,
        distance: formatDistance(dist),
        estTime: formatTravelTime(dist, p.travelMode)
      };
    });
  }, [userLat, userLng]);

  // 4. Destination Definitions: Orang Butuh Bantuan / Darurat
  // Koordinat nyata di sekitar Cilegon
  const emergencyPoints = useMemo(() => {
    const raw = [
      {
        id: 'rep-sos-1',
        name: 'Ibu Siti & Balita (Butuh Bantuan Segera)',
        category: 'darurat',
        targetType: 'laporan_darurat',
        // Area Gang Melati, Cilegon Kota — koordinat representatif
        lat: -6.0051,
        lng: 106.0444,
        benchmarkRoadMeters: 3710, // Jarak rute jalan kaki/gang darurat riil (3.7 km)
        address: 'Gang Melati No. 12, Cilegon Kota',
        summaryRoute: 'lewat Gang Melati Cilegon',
        status: 'BUTUH BANTUAN SEGERA',
        urgency: 'KRITIS',
        elevation: 'Dataran rendah (+12m mdpl)',
        notes: 'Air genangan di rumah mencapai 60 cm dan terus mengalir deras. Ibu dan balita terjebak di atas meja tinggi. Butuh perahu karet segera!',
        needs: 'Perahu karet, pelampung balita, dan tandu lansia',
        contact: '0813-2233-4455',
        vulnerable: '1 Bayi/Balita (2 thn), 1 Lansia (68 thn)',
        travelMode: 'walking',
        navSteps: [
          { step: 1, title: 'Menuju Jalan Raya Selatan', instruction: 'Mulai dari titik GPS Anda, melangkah ke selatan menuju Jalan Raya.' },
          { step: 2, title: 'Masuki Gang Melati (Genangan Air 50cm)', instruction: 'Gunakan tongkat peraba parit. Ketinggian air meningkat hingga 50-60 cm.' },
          { step: 3, title: 'Tiba di Rumah Ibu Siti (No. 12)', instruction: 'Lokasi rumah nomor 12 di ujung gang kanan. Korban berada di tempat tinggi.' }
        ]
      },
      {
        id: 'rep-sos-2',
        name: 'Keluarga Bpk. Rahmat (Lansia Kursi Roda)',
        category: 'darurat',
        targetType: 'laporan_darurat',
        // Jl. Flamboyan, Cilegon — koordinat representatif
        lat: -5.9948,
        lng: 106.0498,
        benchmarkRoadMeters: 1460, // Jarak rute jalan kaki riil (1.5 km)
        address: 'Jl. Flamboyan Blok B No. 5, Cilegon',
        summaryRoute: 'lewat Jl. Flamboyan Cilegon',
        status: 'BUTUH BANTUAN EVAKUASI',
        urgency: 'TINGGI',
        elevation: 'Dataran sedang (+14m mdpl)',
        notes: 'Tanggul selokan meluap setinggi 45 cm. Terdapat orang tua lansia yang harus memakai kursi roda, butuh bantuan tandu/papah fisik.',
        needs: 'Bantuan fisik memapah / tandu darurat & jas hujan',
        contact: '0878-9900-1122',
        vulnerable: '1 Lansia (76 thn, stroke ringan)',
        travelMode: 'walking',
        navSteps: [
          { step: 1, title: 'Menuju Jalur Flamboyan', instruction: 'Bergerak ke arah barat Jalan Flamboyan menjauhi luapan parit utama.' },
          { step: 2, title: 'Siapkan Bantuan Tandu', instruction: 'Masuki rumah Blok B No. 5 dan amankan kursi roda ke titik kering.' }
        ]
      }
    ];

    return raw.map(p => {
      const dist = calculateRoadDistance(userLat, userLng, p.lat, p.lng, p.benchmarkRoadMeters, p.travelMode);
      return {
        ...p,
        distanceMeters: dist,
        distance: formatDistance(dist),
        estTime: formatTravelTime(dist, p.travelMode)
      };
    });
  }, [userLat, userLng]);

  // Combined targets mapping
  const allTargets = useMemo(() => {
    return [...poskoPoints, ...medisPoints, ...familyPoints, ...emergencyPoints];
  }, [poskoPoints, medisPoints, familyPoints, emergencyPoints]);

  // If incoming navigationTarget updates from outside (e.g. from Global Safety Map click)
  useEffect(() => {
    if (navigationTarget) {
      if (navigationTarget.itemType === 'laporan_darurat') {
        setActiveTab('darurat');
      } else if (navigationTarget.itemType === 'warga' || navigationTarget.category === 'keluarga') {
        setActiveTab('keluarga');
      } else if (navigationTarget.itemType === 'rumah_sakit' || navigationTarget.category === 'medis') {
        setActiveTab('medis');
      } else {
        setActiveTab('posko');
      }
      setSelectedPointId(navigationTarget.id);
    }
  }, [navigationTarget]);

  // Active selected target point
  const selectedPoint = useMemo(() => {
    return (
      allTargets.find(p => p.id === selectedPointId || p.dbId === selectedPointId) ||
      poskoPoints[0]
    );
  }, [allTargets, selectedPointId, poskoPoints]);

  // Fetch Smart Routes with Collision & Alternative Analysis
  const abortControllerRef = useRef(null);
  const fetchSmartRoutes = useCallback(async (overridePoint = null) => {
    const pt = overridePoint || selectedPoint;
    if (!pt) return;

    // Batalkan fetch sebelumnya jika masih berjalan (race condition fix)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoadingRoute(true);

    try {
      const mode = pt.travelMode || 'driving';
      const res = await api.getSmartRoutes(userLat, userLng, pt.lat, pt.lng, mode);
      if (res && Array.isArray(res.routes) && res.routes.length > 0) {
        setDynamicRouteData({ ...res, targetPointId: pt.id });
        if (res.recommendedRouteId) {
          setActiveRouteId(res.recommendedRouteId);
        }
      } else {
        // Routing engine tidak memberikan rute — pakai fallback kurva
        setDynamicRouteData(null);
        console.warn('[SafeRoute] Routing engine tidak mengembalikan rute, menggunakan estimasi kurva.');
        setRouteToastMessage('⚠️ Rute jalan nyata tidak tersedia, menampilkan estimasi jalur.');
        setTimeout(() => setRouteToastMessage(null), 5000);
      }
    } catch (e) {
      if (e?.name === 'AbortError') return; // fetch dibatalkan secara sengaja, abaikan
      console.error('[SafeRoute] fetchSmartRoutes error:', e?.message || e);
      setDynamicRouteData(null);
      setRouteToastMessage('⚠️ Koneksi ke routing engine gagal. Menampilkan estimasi jalur.');
      setTimeout(() => setRouteToastMessage(null), 5000);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [userLat, userLng, selectedPoint]);

  useEffect(() => {
    fetchSmartRoutes();
  }, [fetchSmartRoutes]);

  // Candidate Routes: Guaranteed valid coordinates so Leaflet & Schematic lines ALWAYS render!
  const candidateRoutes = useMemo(() => {
    // Hanya gunakan dynamicRouteData jika rute benar-benar milik target yang sedang aktif dipilih!
    if (
      dynamicRouteData?.targetPointId === selectedPoint.id &&
      dynamicRouteData?.routes &&
      dynamicRouteData.routes.length > 0
    ) {
      return dynamicRouteData.routes;
    }

    const endLat = selectedPoint.lat;
    const endLng = selectedPoint.lng;

    // Generated coordinate curves for Route 1 (Primary) and Route 2 (Alternative)
    const route1Coords = generateRouteCoordinates(userLat, userLng, endLat, endLng, 0.003);
    const route2Coords = generateRouteCoordinates(userLat, userLng, endLat, endLng, -0.0045);

    const distMeters = selectedPoint.distanceMeters || calculateDistance(userLat, userLng, endLat, endLng);
    const altDistMeters = Math.round(distMeters * 1.15);

    // Cek apakah ada hazard aktif ATAU diblokir komunitas yang mempengaruhi rute utama
    const activeBlockingHazard = roadHazards.find(h => h.active || h.is_blocked_by_community);
    const route1Blocked = Boolean(activeBlockingHazard);
    const route1BlockReason = activeBlockingHazard
      ? activeBlockingHazard.is_blocked_by_community
        ? `Diblokir oleh ${activeBlockingHazard.report_count} laporan warga — Jalan tidak bisa dilewati.`
        : `Terdampak: ${activeBlockingHazard.hazard_type} di ${activeBlockingHazard.road_name}.`
      : null;

    return [
      {
        id: 'route-0',
        routeNumber: 1,
        name: 'Rute 1 (Jalur Tercepat)',
        summary: selectedPoint?.summaryRoute || 'Jalur Utama Bebas Genangan Air',
        coordinates: route1Coords,
        distanceMeters: distMeters,
        distanceFormatted: formatDistance(distMeters),
        durationFormatted: selectedPoint?.estTime || formatTravelTime(distMeters, selectedPoint?.travelMode),
        isRecommended: !route1Blocked,
        isBlocked: route1Blocked,
        isImpacted: false,
        selectionReason: route1Blocked
          ? route1BlockReason
          : 'Rute dengan estimasi waktu tercepat dan terpantau aman dari genangan air.',
        statusLabel: route1Blocked ? 'Jalur Terblokir' : 'Jalur Bebas Hambatan',
        steps: selectedPoint?.navSteps || []
      },
      {
        id: 'route-1',
        routeNumber: 2,
        name: 'Rute 2 (Jalur Alternatif)',
        summary: 'Jalur Alternatif Arteri Non-Tol',
        coordinates: route2Coords,
        distanceMeters: altDistMeters,
        distanceFormatted: formatDistance(altDistMeters),
        durationFormatted: formatTravelTime(altDistMeters, selectedPoint?.travelMode),
        isRecommended: route1Blocked,
        isBlocked: false,
        isImpacted: false,
        selectionReason: route1Blocked
          ? 'Rute alternatif diaktifkan karena jalur utama terblokir laporan warga/bencana.'
          : 'Jalur alternatif darurat jika ruas jalan protokol mengalami kepadatan.',
        statusLabel: route1Blocked ? 'Jalur Alternatif Aktif' : 'Jalur Alternatif Siaga',
        steps: selectedPoint?.navSteps || []
      }
    ];
  }, [dynamicRouteData, selectedPoint, userLat, userLng, roadHazards]);

  // Active chosen route object
  const activeRoute = candidateRoutes.find(r => r.id === activeRouteId) || candidateRoutes[0] || null;

  // Active step and directions
  const navSteps = activeRoute?.steps?.length > 0 ? activeRoute.steps : selectedPoint?.navSteps || [];
  const currentNavStep = navSteps[currentStepIndex] || navSteps[0];
  const totalNavSteps = navSteps.length || 3;

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
    setDynamicRouteData(null); // Bersihkan rute tujuan sebelumnya seketika agar tidak tercampur!
    setActiveRouteId('route-0');

    setRouteToastMessage(`🎯 Mengarahkan rute navigasi ke ${point.name}...`);
    setTimeout(() => setRouteToastMessage(null), 3500);

    fetchSmartRoutes(point);

    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [fetchSmartRoutes]);

  const handleStartNavigation = () => {
    const nextNavigatingState = !isNavigating;
    setIsNavigating(nextNavigatingState);
    setCurrentStepIndex(0);
    if (nextNavigatingState) {
      const firstStepText = `Memulai panduan rute evakuasi ke ${selectedPoint.name}. Langkah 1: ${navSteps[0]?.instruction || ''}`;
      speakInstruction(firstStepText);
      setRouteToastMessage('🧭 Simulasi Panduan Rute Aktif. Ikuti langkah demi langkah di bawah.');
      setTimeout(() => setRouteToastMessage(null), 3500);
    }
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

  // --- SCENARIO SIMULATION TOOLBAR HANDLERS (Section 6 PRD Testing Scenarios) ---
  const handleScenario1Fastest = async () => {
    setActiveScenarioLabel('Skenario 1: Rute Tercepat (Standar)');
    setSelectedPointId('ev-serang');
    setActiveTab('posko');
    setRoadHazards(prev => prev.map(h => ({ ...h, active: false, report_count: 0, is_blocked_by_community: false, community_reports: [] })));
    setMyReportedHazards(new Set());
    await fetchSmartRoutes(poskoPoints[0]);
    setActiveRouteId('route-0');
    setRouteToastMessage('⚡ Skenario 1: Menghitung rute tercepat bebas hambatan dari GPS Anda ke Posko.');
  };

  const handleScenario2Alternative = () => {
    setActiveScenarioLabel('Skenario 2: Pilih Rute Alternatif');
    const nextRouteId = activeRouteId === 'route-0' ? 'route-1' : 'route-0';
    setActiveRouteId(nextRouteId);
    setRouteToastMessage(`🔀 Skenario 2: Beralih ke ${nextRouteId === 'route-1' ? 'Rute 2 (Jalur Alternatif)' : 'Rute 1 (Jalur Utama)'}.`);
  };

  const handleScenario3RoadClosure = () => {
    setActiveScenarioLabel('Skenario 3: Penutupan Jalan (Banjir 65cm)');
    setSelectedPointId('ev-serang');
    setRoadHazards(prev => prev.map(h => h.id === 'hazard-cilegon-drangong' ? { ...h, active: true } : h));
    setActiveRouteId('route-1');
    setRouteToastMessage('⚠️ Skenario 3: Ruas jalan ditutup banjir 65cm. Smart routing otomatis mengalihkan rute.');
  };

  const handleScenario4AllBlocked = () => {
    setActiveScenarioLabel('Skenario 4: Semua Rute Terhalang Bencana');
    setSelectedPointId('ev-serang');
    setRoadHazards(prev => prev.map(h => ({ ...h, active: true })));
    setDynamicRouteData(prev => ({
      ...prev,
      allRoutesBlocked: true,
      detourNotice: 'Seluruh jalan arteri dan tol tergenang banjir deras >60 cm.'
    }));
    setRouteToastMessage('🛑 Skenario 4: Semua rute darat terhalang banjir terverifikasi. Peringatan darurat SAR aktif.');
  };

  const handleScenario5OfflineGPS = () => {
    setActiveScenarioLabel('Skenario 5: Sensor GPS & Mode Vektor Ringan');
    retryGps();
    setMapViewMode('schematic');
    setRouteToastMessage('📡 Skenario 5: Mode skema vektor aktif untuk kondisi hemat daya / minim sinyal.');
  };

  const handleResetScenarios = () => {
    setActiveScenarioLabel('Kondisi Standar Terverifikasi');
    setRoadHazards(prev => prev.map(h =>
      h.id === 'hazard-cilegon-drangong'
        ? { ...h, active: true, report_count: 0, is_blocked_by_community: false, community_reports: [] }
        : { ...h, active: false, report_count: 0, is_blocked_by_community: false, community_reports: [] }
    ));
    setMyReportedHazards(new Set());
    setDynamicRouteData(null);
    setActiveRouteId('route-0');
    setMapViewMode('leaflet');
    setRouteToastMessage('✨ Pengaturan skenario telah direset ke kondisi standar.');
  };

  // --- COMMUNITY REPORT HANDLERS ---
  const handleReportHazard = useCallback(async (hazardId) => {
    setReportingHazardId(hazardId);
    try {
      const res = await api.reportHazardBlocked(hazardId, sessionId);
      if (res.alreadyReported) {
        setRouteToastMessage('ℹ️ Anda sudah melaporkan titik bahaya ini sebelumnya.');
        setTimeout(() => setRouteToastMessage(null), 3000);
        return;
      }

      // Update local state
      setMyReportedHazards(prev => new Set([...prev, hazardId]));
      setRoadHazards(prev => prev.map(h => {
        if (h.id !== hazardId) return h;
        const newCount = (h.report_count || 0) + 1;
        const isBlocked = newCount >= (h.block_threshold || 5);
        return { ...h, report_count: newCount, is_blocked_by_community: isBlocked };
      }));

      // Cek apakah rute aktif terdampak
      const updatedHazard = roadHazards.find(h => h.id === hazardId);
      const newCount = (updatedHazard?.report_count || 0) + 1;
      const justBlocked = newCount >= (updatedHazard?.block_threshold || 5);

      if (justBlocked) {
        setRouteToastMessage(`⚠️ Rute terblokir oleh ${newCount} laporan warga! Dialihkan ke rute alternatif.`);
        setActiveRouteId(prev => prev === 'route-0' ? 'route-1' : 'route-0');
      } else {
        setRouteToastMessage(`🚨 Laporan terkirim! ${newCount}/${updatedHazard?.block_threshold || 5} warga melaporkan titik ini.`);
      }
      setTimeout(() => setRouteToastMessage(null), 4000);
    } catch {
      setRouteToastMessage('⚠️ Gagal mengirim laporan. Periksa koneksi lalu coba lagi.');
      setTimeout(() => setRouteToastMessage(null), 3000);
    } finally {
      setReportingHazardId(null);
    }
  }, [sessionId, roadHazards]);

  const handleCancelReport = useCallback(async (hazardId) => {
    setReportingHazardId(hazardId);
    try {
      await api.cancelHazardReport(hazardId, sessionId);
      setMyReportedHazards(prev => {
        const next = new Set(prev);
        next.delete(hazardId);
        return next;
      });
      setRoadHazards(prev => prev.map(h => {
        if (h.id !== hazardId) return h;
        const newCount = Math.max(0, (h.report_count || 0) - 1);
        const isBlocked = newCount >= (h.block_threshold || 5);
        return { ...h, report_count: newCount, is_blocked_by_community: isBlocked };
      }));
      setRouteToastMessage('✓ Laporan Anda berhasil dibatalkan.');
      setTimeout(() => setRouteToastMessage(null), 3000);
    } catch {
      setRouteToastMessage('⚠️ Gagal membatalkan laporan. Coba lagi.');
      setTimeout(() => setRouteToastMessage(null), 3000);
    } finally {
      setReportingHazardId(null);
    }
  }, [sessionId]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-64 sm:pb-72">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D47A1] bg-[#E3F2FD] px-2.5 py-1 rounded-md">
            Screen 08: Smart Route & Evacuation Points
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            Rute Evakuasi & Penyelamatan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Peta rute interaktif dengan deteksi titik rawan bencana, multi-moda evakuasi, dan panduan langkah demi langkah.
          </p>
        </div>
      </div>

      {/* Floating Active Route Notification Toast */}
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

      {/* Unified Target & Evaluator Scenario Bar */}
      <div className="rounded-2xl border border-slate-300 bg-white/95 backdrop-blur-md p-2.5 shadow-sm flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200 font-black text-xs">
            🎯
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block leading-none">
              Target Evakuasi
            </span>
            <p className="font-black text-xs text-slate-900 truncate mt-0.5" title={selectedPoint.name}>
              {selectedPoint.name.split(' (')[0]}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowEvaluatorPanel(!showEvaluatorPanel)}
          className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
            showEvaluatorPanel
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300'
          }`}
          title="Buka panel simulasi skenario pengujian PRD"
        >
          <Sparkles className={`w-3.5 h-3.5 ${showEvaluatorPanel ? 'text-white' : 'text-blue-600'}`} />
          <span className="text-[11px]">Skenario</span>
          <span className="text-[10px] opacity-80">{showEvaluatorPanel ? '▲' : '▼'}</span>
        </button>
      </div>

      {showEvaluatorPanel && (
        <div className="p-3.5 sm:p-4 rounded-3xl border-2 border-blue-300 bg-white shadow-xl space-y-3 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-black text-slate-900">
                Pilih Skenario Pengujian (PRD):
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 font-extrabold text-[10px] border border-blue-200 truncate max-w-[200px]">
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

          {/* Symmetrical 2-column Grid for all 6 scenarios */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { id: 1, label: '1. Rute Tercepat', desc: 'Standar bebas hambatan', icon: '⚡', action: handleScenario1Fastest, active: activeScenarioLabel.includes('Skenario 1') },
              { id: 2, label: '2. Rute Opsi', desc: 'Jalur alternatif arteri', icon: '🔀', action: handleScenario2Alternative, active: activeScenarioLabel.includes('Skenario 2') },
              { id: 3, label: '3. Tutup Jalan', desc: 'Banjir 65cm di Drangong', icon: '🌊', action: handleScenario3RoadClosure, active: activeScenarioLabel.includes('Skenario 3') },
              { id: 4, label: '4. Terhalang Total', desc: 'Akses darat terputus', icon: '🛑', action: handleScenario4AllBlocked, active: activeScenarioLabel.includes('Skenario 4') },
              { id: 5, label: '5. Skema Vektor', desc: 'Hemat daya / offline', icon: '📐', action: handleScenario5OfflineGPS, active: activeScenarioLabel.includes('Skenario 5') },
              { id: 6, label: '6. Blokir Warga', desc: '5 laporan warga', icon: '👥', action: () => {
                setActiveScenarioLabel('Skenario 6: Demo Blokir Komunitas (5 Laporan)');
                setRoadHazards(prev => prev.map(h =>
                  h.id === 'hazard-cilegon-drangong'
                    ? { ...h, report_count: 5, is_blocked_by_community: true, community_reports: Array.from({ length: 5 }, (_, i) => ({ sessionId: `demo-${i}`, reportedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7200000).toISOString() })) }
                    : h
                ));
                setActiveRouteId('route-1');
                setRouteToastMessage('👥 Skenario 6: 5 laporan warga mengonfirmasi blokir. Rute dialihkan ke alternatif.');
              }, active: activeScenarioLabel.includes('Skenario 6') }
            ].map(sc => (
              <button
                key={sc.id}
                type="button"
                onClick={sc.action}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  sc.active
                    ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-300 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <span>{sc.icon}</span>
                    <span>{sc.label}</span>
                  </span>
                  {sc.active && <span className="text-[10px] text-blue-700 font-black">✓</span>}
                </div>
                <span className="text-[10px] text-slate-500 font-semibold mt-1">
                  {sc.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Direct GPS Leaflet Map Callout Banner */}
      <div className="rounded-3xl border-2 border-blue-200 bg-white p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#0D47A1] text-white grid place-items-center shrink-0 shadow-sm">
            <Compass className="w-5 h-5 animate-spin text-[#90CAF9]" />
          </div>
          <div>
            <p className="font-extrabold text-[#0D47A1] text-sm">
              Sensor GPS Perangkat & Posisi Pengguna
            </p>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Koordinat Anda: <code className="font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold text-blue-900">
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
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            title="Hitung ulang rute"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRoute ? 'animate-spin text-blue-600' : ''}`} />
            <span>Hitung Ulang</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateScreen('safety_map')}
            className="flex-1 sm:flex-none primary-action text-xs shrink-0 py-2.5 px-3.5 cursor-pointer justify-center"
          >
            <span>Peta Global</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* GPS Permission Warning (if blocked) */}
      {permissionStatus === 'denied' && (
        <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs space-y-2 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2 font-extrabold text-amber-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Izin Lokasi GPS Diblokir oleh Browser</span>
          </div>
          <p className="leading-relaxed text-slate-700">
            Aplikasi menggunakan koordinat estimasi karena izin GPS belum aktif. Klik tombol di bawah untuk meminta akses lokasi perangkat.
          </p>
          <button
            type="button"
            onClick={() => retryGps()}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Hubungkan GPS Lagi</span>
          </button>
        </div>
      )}

      {/* MAP VIEWPORT SECTION */}
      <div ref={mapSectionRef} className="space-y-2">
        {/* View Mode Toggle: Interactive Leaflet vs Light Schematic */}
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
              <span>Peta Nyata (OSM + Leaflet)</span>
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
              <span>Skema Vektor (Hemat Daya)</span>
            </button>
          </div>
        </div>

        {/* 1. REAL INTERACTIVE LEAFLET ROUTE MAP */}
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
                setRouteToastMessage(`🔀 Memilih ${newRouteId === 'route-0' ? 'Rute 1 (Jalur Tercepat)' : 'Rute 2 (Jalur Alternatif)'}.`);
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

        {/* 2. DYNAMIC VECTOR SCHEMATIC */}
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

      {/* DETOUR ADVISORY BANNER: When a closure diverted the route */}
      {dynamicRouteData?.detourNotice && (
        <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-medium flex items-start gap-3 shadow-md animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-amber-900 text-sm">Pengalihan Rute Otomatis Terdeteksi:</p>
            <p className="mt-0.5 leading-relaxed">{dynamicRouteData.detourNotice}</p>
          </div>
        </div>
      )}

      {/* EMERGENCY ALL ROUTES BLOCKED WARNING */}
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

      {/* PEMILIH RUTE UTAMA VS ALTERNATIF */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Pilihan Jalur Perjalanan ({candidateRoutes.length} Opsi):</span>
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
                  setRouteToastMessage(`🎯 Memilih ${route.name} (${route.summary}).`);
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

                    {route.selectionReason && (
                      <div className={`mt-2 p-2 rounded-xl text-[11px] font-semibold leading-relaxed border ${
                        route.isRecommended
                          ? 'bg-emerald-50/90 text-emerald-950 border-emerald-200'
                          : route.isBlocked
                            ? 'bg-rose-50/90 text-rose-950 border-rose-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        <span className="font-extrabold block text-[10px] uppercase tracking-wider mb-0.5">
                          {route.isRecommended ? '✓ Alasan Pemilihan:' : route.isBlocked ? '⚠️ Catatan Bahaya:' : 'ℹ️ Info Rute:'}
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

      {/* KARTU STATUS BAHAYA JALAN & VERIFIKASI BENCANA */}
      <div className="p-4 rounded-3xl border-2 border-slate-300 bg-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
              Status Bahaya Jalan Terpantau ({roadHazards.filter(h => h.active).length} Titik Aktif):
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500">Database Real-Time BPBD</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {roadHazards.map((hazard) => {
            const isClosed = hazard.severity === 'closed';
            const isVerified = hazard.status === 'verified';
            const reportCount = hazard.report_count || 0;
            const threshold = hazard.block_threshold || 5;
            const isBlockedByCommunity = hazard.is_blocked_by_community || false;
            const hasMyReport = myReportedHazards.has(hazard.id);
            const isLoadingThis = reportingHazardId === hazard.id;
            const progressPct = Math.min(100, (reportCount / threshold) * 100);

            return (
              <div
                key={hazard.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isBlockedByCommunity
                    ? 'bg-rose-50/90 border-rose-400 text-rose-950'
                    : hazard.active
                      ? isClosed
                        ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                        : 'bg-amber-50/70 border-amber-300 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="font-extrabold text-[11px] truncate">{hazard.road_name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                    isBlockedByCommunity
                      ? 'bg-rose-700 text-white'
                      : hazard.active
                        ? isClosed ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isBlockedByCommunity ? '⛔ BLOKIR KOMUNITAS' : hazard.active ? (isClosed ? 'TUTUP' : 'GENANGAN') : 'NORMAL'}
                  </span>
                </div>

                <p className="text-[10px] text-slate-600 mt-1 line-clamp-2 leading-tight">
                  {hazard.description}
                </p>

                <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[9px] text-slate-500">
                  <span>{isVerified ? '✓ Terverifikasi BPBD/SAR' : '⚠️ Laporan Warga'}</span>
                  <span>{hazard.active || isBlockedByCommunity ? 'Aktif Menghalangi' : 'Aman Dilewati'}</span>
                </div>

                {/* Community Report Section */}
                <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-2">
                  {/* Progress bar laporan komunitas */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className={isBlockedByCommunity ? 'text-rose-700' : 'text-slate-600'}>
                        Laporan Warga:
                      </span>
                      <span className={`font-extrabold ${
                        isBlockedByCommunity ? 'text-rose-700' : reportCount >= 3 ? 'text-amber-700' : 'text-slate-500'
                      }`}>
                        {reportCount}/{threshold}
                        {isBlockedByCommunity && ' — Rute Diblokir'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isBlockedByCommunity
                            ? 'bg-rose-600'
                            : reportCount >= 3
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    {isBlockedByCommunity && (
                      <p className="text-[10px] text-rose-700 font-bold leading-tight">
                        ⛔ {reportCount} warga mengonfirmasi jalan ini tidak bisa dilewati. Rute dialihkan ke alternatif.
                      </p>
                    )}
                  </div>

                  {/* Tombol lapor / batalkan */}
                  {hasMyReport ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCancelReport(hazard.id); }}
                      disabled={isLoadingThis}
                      className="w-full py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isLoadingThis ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>{isLoadingThis ? 'Memproses...' : '✓ Laporan Terkirim — Batalkan'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleReportHazard(hazard.id); }}
                      disabled={isLoadingThis || isBlockedByCommunity}
                      className={`w-full py-1.5 px-2 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 ${
                        isBlockedByCommunity
                          ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {isLoadingThis ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <ShieldAlert className="w-3 h-3" />
                      )}
                      <span>
                        {isLoadingThis
                          ? 'Mengirim...'
                          : isBlockedByCommunity
                            ? '⛔ Sudah Diblokir Komunitas'
                            : '🚨 Laporkan Jalan Ini Terblokir'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TURN-BY-TURN STEP-BY-STEP LIVE NAVIGATION CARD */}
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
                {isNavigating ? 'NAVIGASI AKTIF' : 'PANDUAN LANGKAH RUTE'}
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
            title="Dengarkan instruksi suara panduan"
          >
            {isSpeaking ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-current" />}
          </button>
        </div>

        {/* Step Instruction Text */}
        <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed font-bold border bg-blue-50/70 border-blue-200/80 text-slate-900">
          {currentNavStep?.instruction}
        </div>

        {/* Navigation Step Switcher Buttons */}
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

          {/* Step indicators */}
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
                speakInstruction(`Selamat! Anda telah tiba di ${selectedPoint.name}. Laporkan kondisi aman Anda sekarang.`);
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
              Pilih posko, fasilitas medis, keluarga, atau warga darurat untuk memuat rute dan alternatifnya.
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

        {/* LIST OF TARGET CARDS */}
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
                          <span>STATUS BELUM DIVERIFIKASI</span>
                        </span>
                      )}

                      {isSelected && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 animate-pulse">
                          <span>🎯 TARGET RUTE AKTIF</span>
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
                    <span>{isSelected ? '✓ Rute Sedang Ditampilkan (Pusatkan)' : '🧭 Arahkan Rute ke Posko Ini'}</span>
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

      {/* Safety Principle & Transparent Disclaimer */}
      <div className="p-4 bg-[#E3F2FD] rounded-3xl border border-[#90CAF9] text-xs text-[#0D47A1] space-y-1.5 shadow-sm">
        <div className="flex items-center gap-1.5 font-extrabold">
          <ShieldCheck className="w-4 h-4 text-[#2196F3]" />
          <span>Prinsip Keselamatan & Batasan Sistem Routing (PRD 4.6):</span>
        </div>
        <p className="leading-relaxed text-slate-700 font-medium">
          Sistem Safe Route memadukan koordinat GPS perangkat dengan jaringan OpenStreetMap serta database pelaporan bencana. <strong>Kondisi lapangan dapat berubah sewaktu-waktu akibat luapan air atau pohon tumbang</strong>. Sistem tidak mengklaim rute aman secara mutlak tanpa arahan tim penyelamat. Utamakan instruksi langsung petugas BPBD/SAR dan relawan setempat.
        </p>
      </div>

      {/* Bottom Action Footer (High Clearance, Never Blocked by Dock) */}
      <div className="flex items-center justify-between gap-3 pt-4">
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

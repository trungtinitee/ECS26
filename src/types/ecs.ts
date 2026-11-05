/**
 * ECS - Environmental Calculation System
 * Core Types & Data Contracts
 */

export interface ProjectInfo {
  name: string;
  owner: string;
  contact: string;
  location: string;
  designCompany: string;
  designCompanyAddress: string;
  capacity?: string;
  description: string;
  designFields: string[]; // 'water' | 'wastewater' | 'air' | 'solidwaste'
  projectType: string;
  otherWastewaterType?: string;
  designBasis: string;
}

export interface WastewaterInputs {
  ph: number;
  qavg: number;
  kpeak: number;
  hours: number;
  qmanual: number | null;
  bod: number;
  cod: number;
  tss: number;
  tn: number;
  nh4: number;
  tp: number;
  alkalinity: number;
  oilgrease: number | null;
  temperature: number | null;
}

export interface WastewaterCalculationResults {
  q: number;
  qHour: number;
  qMinute: number;
  qh: number;
  qPeakMinute: number;
  alkalinityLoad: number;
  bodCodRatio: number | null;
  loads: {
    bod: number;
    cod: number;
    tss: number;
    tn: number;
    nh4: number;
    tp: number;
    oilgrease: number;
  };
}

export type UnitGeometry = 'square' | 'rectangle' | 'circle';

export interface PumpWellData {
  qmaxh: number | null;
  qmaxhOverride: boolean;
  storageMinutes: number;
  waterDepth: number;
  freeboard: number;
  geometry: UnitGeometry;
  width: number;
  length: number;
  diameter: number;
  dimensionsOverride: boolean;
}

export type MixingMethod = 'mixer' | 'aeration';

export interface EqualizationTankData {
  qHour: number | null;
  qHourOverride: boolean;
  hrtHours: number;
  waterDepth: number;
  freeboard: number;
  geometry: UnitGeometry;
  width: number;
  length: number;
  dimensionsOverride: boolean;
  mixingMethod: MixingMethod;
  mixingPowerRate: number; // W/m3 (e.g. 10 - 15 W/m3)
  airSupplyRate: number; // m3 khí / m3 bể / giờ (e.g. 0.6 - 1.0 m3/m3.h)
  pumpHead: number; // Cột áp bơm nước thải (m, e.g. 10 - 15m)
  pumpEfficiency: number; // Hiệu suất bơm (0.65 - 0.75)
  numMixers: number; // Số lượng máy khuấy chìm
  numPumpsWork: number; // Số bơm hoạt động
  numPumpsStandby: number; // Số bơm dự phòng
}

export interface AerotankData {
  q: number | null;
  qOverride: boolean;
  bodIn: number;
  bodOut: number;
  mlss: number;
  mlvssRatio: number;
  fmRatio: number;
  srtDays: number;
  waterDepth: number;
  freeboard: number;
  length: number;
  width: number;
  dimensionsOverride: boolean;
  diffuserCapacity: number; // m3/h per diffuser (e.g. 2.0 - 3.0)
  diffuserType: string;
  blowerEfficiency: number; // 0.7 - 0.8
  numBlowersWork: number;
  numBlowersStandby: number;
  // Xử lý Amoni & Nitrat hóa (Nitrification)
  includeNitrification?: boolean;
  nh4In?: number; // N-NH4+ vào (mg/L)
  nh4Out?: number; // N-NH4+ mục tiêu ra (mg/L)
  temperatureC?: number; // Nhiệt độ nước thải (°C)
  targetDo?: number; // Nồng độ DO duy trì (mg/L)
  alkalinityIn?: number; // Độ kiềm vào bể (mg/L CaCO3)
}

export interface SecondaryClarifierData {
  qh: number | null;
  qhOverride: boolean;
  surfaceOverflowRate: number; // m3/m2.h (e.g. 0.8 - 1.2 m3/m2.h)
  solidsLoadingRate: number; // kg/m2.h (e.g. 3.0 - 5.0 kg/m2.h)
  mlss: number; // mg/L
  waterDepth: number;
  freeboard: number;
  geometry: UnitGeometry;
  diameter: number;
  length: number;
  width: number;
  dimensionsOverride: boolean;
  sludgeRecycleRatio: number; // % (50 - 100%)
  weirType: string;
  numRasPumpsWork: number;
  numRasPumpsStandby: number;
}

export interface DisinfectionTankData {
  qh: number | null;
  qhOverride: boolean;
  contactMinutes: number; // 15 - 30 min
  chlorineDose: number; // mg/L (3 - 5 mg/L)
  naoclConcentration: number; // % NaOCl (default 10%)
  waterDepth: number;
  freeboard: number;
  channels: number;
  width: number;
  length: number;
  dimensionsOverride: boolean;
  storageDays: number; // chemical storage reserve days
  chemicalPumpWork: number;
  chemicalPumpStandby: number;
}

export interface AnoxicTankData {
  qHour: number | null;
  qHourOverride: boolean;
  hrtHours: number; // 2.0 - 4.0 h
  recycleRatio: number; // 1.5 - 3.0 (150% - 300%)
  mixingPowerRate: number; // W/m3 (8 - 12 W/m3)
  waterDepth: number;
  freeboard: number;
  length: number;
  width: number;
  dimensionsOverride: boolean;
  numMixers: number;
  numRecyclePumpsWork: number;
  numRecyclePumpsStandby: number;
  // Cân bằng khử Nitrat
  bodIn?: number; // mg/L
  tknIn?: number; // mg/L
  no3In?: number; // mg/L NO3 từ dòng tuần hoàn
}

export interface SludgeTankData {
  sludgeVolumePerDay: number | null;
  sludgeVolumeOverride: boolean;
  storageDays: number; // 2 - 5 days
  moistureIn: number; // % (99.0 - 99.5%)
  moistureOut: number; // % (96.0 - 97.5%)
  waterDepth: number;
  freeboard: number;
  hopperDepth: number; // conical bottom depth (m)
  length: number;
  width: number;
  geometry: UnitGeometry;
  diameter: number;
  dimensionsOverride: boolean;
  aerationRate: number; // m3 air/m3 sludge.h (1.0 - 1.5)
  numScrewPumpsWork: number;
  numScrewPumpsStandby: number;
}

export interface BarScreenData {
  qh: number | null;
  qhOverride: boolean;
  velocity: number; // m/s (0.6 - 1.0 m/s)
  barSpacingMm: number; // mm (10 - 25 mm)
  barWidthMm: number; // mm (5 - 10 mm)
  angleDeg: number; // 60 - 75 deg
  channelWidth: number;
  waterDepth: number;
  freeboard: number;
  dimensionsOverride: boolean;
}

export interface GritChamberData {
  qh: number | null;
  qhOverride: boolean;
  settlingVelocityMmS: number; // mm/s (18 - 24 mm/s for 0.2mm grit)
  horizontalVelocity: number; // m/s (0.25 - 0.30 m/s)
  retentionSeconds: number; // s (45 - 90s)
  length: number;
  width: number;
  waterDepth: number;
  freeboard: number;
  dimensionsOverride: boolean;
}

export interface GreaseTrapData {
  qh: number | null;
  qhOverride: boolean;
  retentionMinutes: number; // min (15 - 30 min)
  surfaceOverflowRate: number; // m3/m2.h (3.0 - 4.5 m3/m2.h)
  length: number;
  width: number;
  waterDepth: number;
  freeboard: number;
  dimensionsOverride: boolean;
}

export interface CoagulationTankData {
  qh: number | null;
  qhOverride: boolean;
  retentionSeconds: number; // s (30 - 60s)
  velocityGradientG: number; // s-1 (700 - 1000 s-1)
  length: number;
  width: number;
  waterDepth: number;
  freeboard: number;
  dimensionsOverride: boolean;
}

export interface FlocculationTankData {
  qh: number | null;
  qhOverride: boolean;
  retentionMinutes: number; // min (20 - 30 min)
  stages: number; // 2 - 3 compartments
  length: number;
  width: number;
  waterDepth: number;
  freeboard: number;
  dimensionsOverride: boolean;
}

export interface DafData {
  qh: number | null;
  qhOverride: boolean;
  recycleRatio: number; // % (20 - 40%)
  surfaceLoadingRate: number; // m3/m2.h (4.0 - 8.0 m3/m2.h)
  saturationPressureBar: number; // bar (4.0 - 6.0 bar)
  length: number;
  width: number;
  waterDepth: number;
  freeboard: number;
  dimensionsOverride: boolean;
}

export interface SbrData {
  q: number | null;
  qOverride: boolean;
  cycleHours: number; // 4 - 8 h
  exchangeRatio: number; // 0.25 - 0.35 (25% - 35%)
  bodIn: number;
  bodOut: number;
  mlss: number;
  numTanks: number;
  length: number;
  width: number;
  waterDepth: number;
  freeboard: number;
  dimensionsOverride: boolean;
}

export interface MbrData {
  qh: number | null;
  qhOverride: boolean;
  membraneFluxLmh: number; // LMH (L/m2.h, 15 - 25 LMH)
  mlss: number; // mg/L (8,000 - 12,000 mg/L)
  hrtHours: number; // h (3 - 6 h)
  length: number;
  width: number;
  waterDepth: number;
  freeboard: number;
  dimensionsOverride: boolean;
}

export interface MbbrData {
  qh: number | null;
  qhOverride: boolean;
  fillingFraction: number; // % (40 - 60%)
  mediaSpecificSurface: number; // m2/m3 (500 - 800 m2/m3)
  salr: number; // g BOD/m2.d (10 - 20 g/m2.d)
  bodIn: number;
  bodOut: number;
  length: number;
  width: number;
  waterDepth: number;
  freeboard: number;
  dimensionsOverride: boolean;
}

export interface UasbData {
  q: number | null;
  qOverride: boolean;
  codIn: number;
  volumetricLoadingCod: number; // kg COD/m3.d (4.0 - 10.0 kg COD/m3.d)
  upflowVelocity: number; // m/h (0.6 - 1.0 m/h)
  length: number;
  width: number;
  waterDepth: number;
  freeboard: number;
  dimensionsOverride: boolean;
}

export interface ChemicalClarifierData {
  qh: number | null;
  qhOverride: boolean;
  surfaceOverflowRate: number; // m3/m2.h (1.0 - 1.5 m3/m2.h)
  waterDepth: number;
  freeboard: number;
  geometry: UnitGeometry;
  diameter: number;
  length: number;
  width: number;
  dimensionsOverride: boolean;
}

export interface SandFilterData {
  qh: number | null;
  qhOverride: boolean;
  filtrationVelocity: number; // m/h (8 - 12 m/h for sand, 6 - 10 m/h for carbon)
  mediaDepth: number; // m (1.0 - 1.5m)
  numColumns: number;
  diameter: number;
  height: number;
  dimensionsOverride: boolean;
  filterType: 'sand' | 'carbon';
}

export interface FilterPressData {
  sludgeVolumePerDay: number | null;
  sludgeVolumeOverride: boolean;
  operatingHoursPerDay: number; // h/d (4 - 8 h/d)
  feedMoisture: number; // % (96 - 98%)
  cakeMoisture: number; // % (75 - 80%)
  dimensionsOverride: boolean;
  capacityM3H: number;
}

export interface GenericUnitData {
  flowRate: number | null;
  flowOverride: boolean;
  retentionValue: number;
  retentionUnit: 'phút' | 'giờ';
  waterDepth: number;
  freeboard: number;
  length: number;
  width: number;
  geometry: UnitGeometry;
  diameter: number;
  dimensionsOverride: boolean;
  designCriteria: string;
  equipmentSummary: string;
  powerKw: number;
}

export interface TechnologyUnit {
  id: string;
  catalogName: string;
  name: string;
  status: 'pending' | 'done';
  data: {
    pumpWell?: PumpWellData;
    equalizationTank?: EqualizationTankData;
    aerotank?: AerotankData;
    secondaryClarifier?: SecondaryClarifierData;
    disinfectionTank?: DisinfectionTankData;
    anoxicTank?: AnoxicTankData;
    sludgeTank?: SludgeTankData;
    barScreen?: BarScreenData;
    gritChamber?: GritChamberData;
    greaseTrap?: GreaseTrapData;
    coagulation?: CoagulationTankData;
    flocculation?: FlocculationTankData;
    daf?: DafData;
    sbr?: SbrData;
    mbr?: MbrData;
    mbbr?: MbbrData;
    uasb?: UasbData;
    chemicalClarifier?: ChemicalClarifierData;
    sandFilter?: SandFilterData;
    filterPress?: FilterPressData;
    genericUnit?: GenericUnitData;
    [key: string]: any;
  };
}

export interface ProjectSnapshot {
  id: string;
  schemaVersion: number;
  app: string;
  project: ProjectInfo;
  module: string;
  inputs: WastewaterInputs;
  technology: {
    units: TechnologyUnit[];
  };
  savedAt: string;
  updatedAt: string;
}

export type ActiveDomain = 'water' | 'wastewater' | 'air' | 'solidwaste';
export type WastewaterTool = 'load' | 'technology' | 'units' | 'reports' | 'tools';
export type UnitTab = 'input' | 'calc' | 'dimensions' | 'equipment';

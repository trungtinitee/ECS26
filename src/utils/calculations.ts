/**
 * ECS - Environmental Calculation System
 * Engineering Calculation Engine
 */

import {
  WastewaterInputs,
  WastewaterCalculationResults,
  PumpWellData,
  EqualizationTankData,
  AerotankData,
  SecondaryClarifierData,
  DisinfectionTankData,
  AnoxicTankData,
  SludgeTankData,
  BarScreenData,
  GritChamberData,
  GreaseTrapData,
  CoagulationTankData,
  FlocculationTankData,
  DafData,
  SbrData,
  MbrData,
  MbbrData,
  UasbData,
  ChemicalClarifierData,
  SandFilterData,
  FilterPressData,
  GenericUnitData,
} from '../types/ecs';

export const SCHEMA_DEFAULTS: WastewaterInputs = {
  ph: 7,
  qavg: 100,
  kpeak: 2.5,
  hours: 24,
  qmanual: null,
  bod: 250,
  cod: 500,
  tss: 250,
  tn: 40,
  nh4: 30,
  tp: 8,
  alkalinity: 150,
  oilgrease: 50,
  temperature: 28,
};

export const POLLUTANTS = [
  { key: 'bod', label: 'BOD₅', unit: 'mg/L', qcvn40_A: 30, qcvn40_B: 50, qcvn14_A: 30, qcvn14_B: 50 },
  { key: 'cod', label: 'COD', unit: 'mg/L', qcvn40_A: 75, qcvn40_B: 150, qcvn14_A: null, qcvn14_B: null },
  { key: 'tss', label: 'TSS', unit: 'mg/L', qcvn40_A: 50, qcvn40_B: 100, qcvn14_A: 50, qcvn14_B: 100 },
  { key: 'tn', label: 'Tổng Nitơ (TN)', unit: 'mg/L', qcvn40_A: 20, qcvn40_B: 40, qcvn14_A: null, qcvn14_B: null },
  { key: 'nh4', label: 'Amoni (tính theo N)', unit: 'mg/L', qcvn40_A: 5, qcvn40_B: 10, qcvn14_A: 5, qcvn14_B: 10 },
  { key: 'tp', label: 'Tổng Phốt pho (TP)', unit: 'mg/L', qcvn40_A: 4, qcvn40_B: 6, qcvn14_A: null, qcvn14_B: null },
  { key: 'oilgrease', label: 'Dầu mỡ', unit: 'mg/L', qcvn40_A: 5, qcvn40_B: 10, qcvn14_A: 10, qcvn14_B: 20 },
] as const;

let currentDecimalDigits = 2;

export function getDecimalDigits(): number {
  try {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('ecs_decimal_digits');
      if (val) {
        const parsed = parseInt(val, 10);
        if ([1, 2].includes(parsed)) return parsed;
      }
    }
  } catch {
    // fallback
  }
  return [1, 2].includes(currentDecimalDigits) ? currentDecimalDigits : 2;
}

export function setDecimalDigits(digits: number): void {
  const safeDigits = digits === 1 ? 1 : 2;
  currentDecimalDigits = safeDigits;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecs_decimal_digits', String(safeDigits));
      window.dispatchEvent(new CustomEvent('ecs-decimal-precision-changed', { detail: { digits: safeDigits } }));
    }
  } catch {
    // fallback
  }
}

/**
 * Thống nhất chuẩn làm tròn số liệu tính toán theo TCVN (hệ vi-VN):
 * Dấu phẩy (,) phân cách thập phân, dấu chấm (.) phân cách hàng nghìn.
 * Mặc định cố định 2 chữ số sau dấu thập phân (fixed = true) cho mọi số liệu tính toán.
 * Ví dụ: 100 -> "100,00", 12.5 -> "12,50", 4.1667 -> "4,17".
 */
export function formatNumber(
  val: number | null | undefined,
  digits: number = getDecimalDigits(),
  fixed: boolean = true
): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  return val.toLocaleString('vi-VN', {
    minimumFractionDigits: fixed ? digits : 0,
    maximumFractionDigits: digits,
  });
}

/**
 * Làm tròn số học chuẩn kỹ thuật (tránh lỗi dấu phẩy động 4.166666666666667 hoặc 4.700000000000001)
 */
export function roundTo(val: number | null | undefined, digits: number = 2): number {
  if (val === null || val === undefined || !Number.isFinite(val)) return 0;
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) + Number.EPSILON) * factor) / factor;
}

/**
 * Định dạng số nguyên (không lấy phần thập phân), dùng cho số lượng máy móc, đơn nguyên...
 */
export function formatInteger(val: number | null | undefined): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  return Math.round(val).toLocaleString('vi-VN');
}

export function validateWastewaterInputs(v: WastewaterInputs): string[] {
  const errors: string[] = [];
  if (v.qavg < 0) errors.push('Lưu lượng trung bình ngày phải ≥ 0');
  if (v.kpeak < 1) errors.push('Hệ số không điều hòa K thường ≥ 1.0');
  if (v.hours <= 0 || v.hours > 24) errors.push('Thời gian hoạt động từ 0.1 đến 24 giờ/ngày');
  if (v.ph < 0 || v.ph > 14) errors.push('pH phải nằm trong dải 0 – 14');
  if (v.bod < 0) errors.push('Nồng độ BOD₅ không được âm');
  if (v.cod < 0) errors.push('Nồng độ COD không được âm');
  if (v.tss < 0) errors.push('Nồng độ TSS không được âm');
  if (v.tn < 0) errors.push('Tổng Nitơ không được âm');
  if (v.nh4 < 0) errors.push('Amoni không được âm');
  if (v.tp < 0) errors.push('Tổng Phốt pho không được âm');
  if (v.alkalinity < 0) errors.push('Độ kiềm không được âm');
  return errors;
}

export function calculateWastewaterLoads(v: WastewaterInputs): WastewaterCalculationResults {
  const q = v.qmanual !== null && v.qmanual > 0 ? v.qmanual : v.qavg;
  const hours = v.hours > 0 ? v.hours : 24;
  const qHour = roundTo(q / hours, 2);
  const qMinute = roundTo(qHour / 60, 2);
  const qPeakHour = roundTo((q * (v.kpeak || 1)) / hours, 2);
  const qPeakMinute = roundTo(qPeakHour / 60, 2);
  const alkalinityLoad = roundTo((q * (v.alkalinity || 0)) / 1000, 2);
  const bodCodRatio = v.cod > 0 ? roundTo(v.bod / v.cod, 2) : null;

  return {
    q: roundTo(q, 2),
    qHour,
    qMinute,
    qh: qPeakHour,
    qPeakMinute,
    alkalinityLoad,
    bodCodRatio,
    loads: {
      bod: roundTo((q * (v.bod || 0)) / 1000, 2),
      cod: roundTo((q * (v.cod || 0)) / 1000, 2),
      tss: roundTo((q * (v.tss || 0)) / 1000, 2),
      tn: roundTo((q * (v.tn || 0)) / 1000, 2),
      nh4: roundTo((q * (v.nh4 || 0)) / 1000, 2),
      tp: roundTo((q * (v.tp || 0)) / 1000, 2),
      oilgrease: roundTo((q * (v.oilgrease || 0)) / 1000, 2),
    },
  };
}

// ----------------- PUMP WELL CALCULATION -----------------
export function defaultPumpWellData(qh: number | null): PumpWellData {
  return {
    qmaxh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qmaxhOverride: false,
    storageMinutes: 30,
    waterDepth: 2.0,
    freeboard: 0.3,
    geometry: 'square',
    width: 1.5,
    length: 1.5,
    diameter: 1.5,
    dimensionsOverride: false,
  };
}

export function updateAutoPumpDimensions(d: PumpWellData): PumpWellData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qmaxh);
  const t = Number(d.storageMinutes);
  const h = Number(d.waterDepth);
  if (!(q > 0 && t > 0 && h > 0)) return d;

  const volume = (q * t) / 60;
  const copy = { ...d };
  if (copy.geometry === 'square') {
    const side = roundTo(Math.sqrt(volume / h), 2);
    copy.width = Math.max(1, side);
    copy.length = Math.max(1, side);
  } else if (copy.geometry === 'rectangle' && copy.width > 0) {
    copy.length = Math.max(1, roundTo(volume / (copy.width * h), 2));
  } else if (copy.geometry === 'circle') {
    copy.diameter = Math.max(1, roundTo(Math.sqrt((4 * volume) / (Math.PI * h)), 2));
  }
  return copy;
}

export interface PumpWellCalcResult {
  valid: boolean;
  required: number;
  actual: number;
  length: number;
  width: number;
  diameter: number;
  totalHeight: number;
  ratio: number;
  pass: boolean;
  deficit: number;
}

export function calculatePumpWell(d: PumpWellData): PumpWellCalcResult {
  const q = Number(d.qmaxh);
  const t = Number(d.storageMinutes);
  const h = Number(d.waterDepth);
  const free = Number(d.freeboard);

  const valid = [q, t, h, free].every(Number.isFinite) && q > 0 && t > 0 && h > 0 && free >= 0;
  if (!valid) {
    return {
      valid: false,
      required: 0,
      actual: 0,
      length: 0,
      width: 0,
      diameter: 0,
      totalHeight: 0,
      ratio: 0,
      pass: false,
      deficit: 0,
    };
  }

  const required = roundTo((q * t) / 60, 2);
  let actual = 0;
  if (d.geometry === 'square') {
    const side = d.width;
    actual = side * side * h;
  } else if (d.geometry === 'rectangle') {
    actual = d.length * d.width * h;
  } else {
    actual = (Math.PI * d.diameter * d.diameter * h) / 4;
  }
  actual = roundTo(actual, 2);

  const totalHeight = roundTo(h + free, 2);
  const ratio = required > 0 ? roundTo(actual / required, 2) : 0;
  const pass = actual + 1e-4 >= required;
  const deficit = roundTo(Math.max(0, required - actual), 2);

  return {
    valid: true,
    required,
    actual,
    length: roundTo(d.length, 2),
    width: roundTo(d.width, 2),
    diameter: roundTo(d.diameter, 2),
    totalHeight,
    ratio,
    pass,
    deficit,
  };
}

// ----------------- EQUALIZATION TANK CALCULATION -----------------
export function defaultEqualizationData(qHour: number | null): EqualizationTankData {
  const qh = qHour && qHour > 0 ? roundTo(qHour, 2) : 5;
  const hrt = 8;
  const vReq = roundTo(qh * hrt, 2);
  const depth = 3.5;
  const freeboard = 0.5;
  const area = vReq / depth;
  const width = Math.max(2, roundTo(Math.sqrt(area / 2), 2));
  const length = Math.max(3, roundTo(area / width, 2));

  return {
    qHour: qHour !== null && qHour !== undefined ? roundTo(qHour, 2) : null,
    qHourOverride: false,
    hrtHours: 8,
    waterDepth: depth,
    freeboard: freeboard,
    geometry: 'rectangle',
    width: width,
    length: length,
    dimensionsOverride: false,
    mixingMethod: 'mixer',
    mixingPowerRate: 12, // 12 W/m3
    airSupplyRate: 0.75, // 0.75 m3 khí / m3 bể.giờ
    pumpHead: 12, // 12 m
    pumpEfficiency: 0.7,
    numMixers: vReq > 160 ? 2 : 1,
    numPumpsWork: 1,
    numPumpsStandby: 1,
  };
}

export function updateAutoEqualizationDimensions(d: EqualizationTankData): EqualizationTankData {
  if (d.dimensionsOverride) return d;
  const qh = Number(d.qHour);
  const hrt = Number(d.hrtHours);
  const h = Number(d.waterDepth);
  if (!(qh > 0 && hrt > 0 && h > 0)) return d;

  const vReq = qh * hrt;
  const area = vReq / h;
  const copy = { ...d };

  if (copy.geometry === 'rectangle') {
    // Standard L/B approx 2.0
    const w = Math.max(1.5, roundTo(Math.sqrt(area / 2), 2));
    const l = Math.max(2, roundTo(area / w, 2));
    copy.width = w;
    copy.length = l;
  } else if (copy.geometry === 'square') {
    const side = Math.max(1.5, roundTo(Math.sqrt(area), 2));
    copy.width = side;
    copy.length = side;
  } else if (copy.geometry === 'circle') {
    const dia = Math.max(2, roundTo(Math.sqrt((4 * area) / Math.PI), 2));
    copy.width = dia; // diameter stored in width
  }
  return copy;
}

export interface EqualizationCalcResult {
  valid: boolean;
  required: number;
  actual: number;
  actualHrt: number;
  totalHeight: number;
  ratio: number;
  pass: boolean;
  deficit: number;
  aspectRatio: number;
  surfaceArea: number;
  powerKwTotal: number;
  powerPerMixer: number;
  airFlowTotalM3h: number;
  airFlowTotalM3min: number;
  pumpFlowRate: number;
  pumpPowerMotor: number;
}

export function calculateEqualization(d: EqualizationTankData): EqualizationCalcResult {
  const qh = Number(d.qHour);
  const hrt = Number(d.hrtHours);
  const h = Number(d.waterDepth);
  const free = Number(d.freeboard);
  const rate = Number(d.mixingPowerRate) || 12;
  const airRate = Number(d.airSupplyRate) || 0.75;
  const head = Number(d.pumpHead) || 12;
  const eff = Number(d.pumpEfficiency) || 0.7;
  const numPumpsWork = Math.max(1, Number(d.numPumpsWork) || 1);
  const numMixers = Math.max(1, Number(d.numMixers) || 1);

  const valid = qh > 0 && hrt > 0 && h > 0 && free >= 0 && d.width > 0;
  if (!valid) {
    return {
      valid: false,
      required: 0,
      actual: 0,
      actualHrt: 0,
      totalHeight: 0,
      ratio: 0,
      pass: false,
      deficit: 0,
      aspectRatio: 0,
      surfaceArea: 0,
      powerKwTotal: 0,
      powerPerMixer: 0,
      airFlowTotalM3h: 0,
      airFlowTotalM3min: 0,
      pumpFlowRate: 0,
      pumpPowerMotor: 0,
    };
  }

  const required = roundTo(qh * hrt, 2);
  let surfaceArea = 0;
  if (d.geometry === 'circle') {
    surfaceArea = (Math.PI * d.width * d.width) / 4;
  } else if (d.geometry === 'square') {
    surfaceArea = d.width * d.width;
  } else {
    surfaceArea = d.width * d.length;
  }
  surfaceArea = roundTo(surfaceArea, 2);

  const actual = roundTo(surfaceArea * h, 2);
  const actualHrt = qh > 0 ? roundTo(actual / qh, 2) : 0;
  const totalHeight = roundTo(h + free, 2);
  const pass = actual + 1e-4 >= required;
  const deficit = roundTo(Math.max(0, required - actual), 2);
  const ratio = required > 0 ? roundTo(actual / required, 2) : 0;
  const aspectRatio = d.width > 0 ? (d.geometry === 'rectangle' ? roundTo(d.length / d.width, 2) : 1) : 1;

  // Mixing Power
  const powerKwTotal = roundTo((actual * rate) / 1000, 2);
  const powerPerMixer = roundTo(powerKwTotal / numMixers, 2);

  // Aeration airflow
  const airFlowTotalM3h = roundTo(actual * airRate, 2);
  const airFlowTotalM3min = roundTo(airFlowTotalM3h / 60, 2);

  // Feed pump calculation
  const pumpFlowRate = roundTo(qh / numPumpsWork, 2); // m3/h
  const qM3s = pumpFlowRate / 3600;
  const hydPowerKw = (1000 * 9.81 * qM3s * head) / 1000;
  const pumpPowerMotor = eff > 0 ? roundTo((hydPowerKw / eff) * 1.25, 2) : 0;

  return {
    valid: true,
    required,
    actual,
    actualHrt,
    totalHeight,
    ratio,
    pass,
    deficit,
    aspectRatio,
    surfaceArea,
    powerKwTotal,
    powerPerMixer,
    airFlowTotalM3h,
    airFlowTotalM3min,
    pumpFlowRate,
    pumpPowerMotor,
  };
}

// ----------------- AEROTANK CALCULATION -----------------
export function defaultAerotankData(qavg: number | null, bod: number = 250): AerotankData {
  const q = qavg && qavg > 0 ? roundTo(qavg, 2) : 100;
  const bodIn = bod > 0 ? bod : 250;
  const fm = 0.3;
  const mlss = 3000;
  const xv = mlss * 0.8;
  const vReq = roundTo((q * bodIn) / (fm * xv), 2);
  const depth = 4.0;
  const area = vReq / depth;
  const width = Math.max(3, roundTo(Math.sqrt(area / 2), 2));
  const length = Math.max(4, roundTo(area / width, 2));

  return {
    q: qavg !== null && qavg !== undefined ? roundTo(qavg, 2) : null,
    qOverride: false,
    bodIn: bodIn,
    bodOut: 20,
    mlss: 3000,
    mlvssRatio: 0.8,
    fmRatio: 0.3,
    srtDays: 12, // Khuyến cáo 10 - 15 ngày cho nitrat hóa hoàn toàn ở 25°C
    waterDepth: depth,
    freeboard: 0.5,
    length: length,
    width: width,
    dimensionsOverride: false,
    diffuserCapacity: 2.5, // 2.5 m3/h per diffuser
    diffuserType: 'Đĩa bọt mịn D270mm màng EPDM',
    blowerEfficiency: 0.75,
    numBlowersWork: 1,
    numBlowersStandby: 1,
    // Thông số quá trình Nitrat hóa (Nitrification)
    includeNitrification: true,
    nh4In: 30, // N-NH4+ vào 30 mg/L (nước thải sinh hoạt điển hình)
    nh4Out: 5, // N-NH4+ ra mục tiêu (QCVN 40-A: 5 mg/L, QCVN 14-A: 5 mg/L)
    temperatureC: 25, // Nhiệt độ trung bình nước thải 25°C
    targetDo: 2.0, // Nồng độ DO tối ưu cho nitrat hóa 2.0 mg/L
    alkalinityIn: 220, // Độ kiềm nước thải ban đầu (mg/L CaCO3)
  };
}

export function updateAutoAerotankDimensions(d: AerotankData): AerotankData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.q);
  const s0 = Number(d.bodIn);
  const fm = Number(d.fmRatio) || 0.3;
  const mlss = Number(d.mlss) || 3000;
  const ratio = Number(d.mlvssRatio) || 0.8;
  const h = Number(d.waterDepth) || 4.0;

  if (!(q > 0 && s0 > 0 && fm > 0 && mlss > 0 && h > 0)) return d;

  const xv = mlss * ratio;
  const vReq = (q * s0) / (fm * xv);
  const area = vReq / h;

  const copy = { ...d };
  const w = Math.max(2.5, roundTo(Math.sqrt(area / 2), 2));
  const l = Math.max(3.5, roundTo(area / w, 2));
  copy.width = w;
  copy.length = l;
  return copy;
}

export interface AerotankCalcResult {
  valid: boolean;
  required: number;
  actual: number;
  totalHeight: number;
  pass: boolean;
  deficit: number;
  ratio: number;
  actualHrt: number;
  bodLoadKg: number;
  bodRemovalPercent: number;
  // Nhu cầu oxy phân hủy BOD (CBOD)
  o2CbodDaily: number;
  // Thông số Nitrat hóa & Amoni
  includeNitrification: boolean;
  nh4In: number;
  nh4Out: number;
  temperatureC: number;
  targetDo: number;
  alkalinityIn: number;
  nSynthesisMgL: number;
  nSynthesisKgDay: number;
  nOxidizedMgL: number;
  nOxidizedKgDay: number;
  o2NitrificationDaily: number; // NOD = 4.57 * nOxidizedKgDay
  // Tổng nhu cầu oxy & cấp khí
  o2Daily: number; // Tổng O2 = O2_CBOD + O2_Nitrification
  o2PeakHour: number;
  airFlowM3h: number;
  airFlowM3min: number;
  diffuserCount: number;
  blowerPressureKpa: number;
  blowerPowerKw: number;
  excessSludgeKgDay: number;
  excessSludgeM3Day: number;
  // Động học vi khuẩn nitrat hóa & Tuổi bùn tới hạn (Metcalf & Eddy)
  muMaxNitrifier: number; // d^-1
  knNitrogen: number; // mg/L
  bnEndogenous: number; // d^-1
  muNetNitrifier: number; // d^-1
  minSrtDays: number; // theta_c^min (ngày)
  designSrtDays: number;
  srtSafetyFactor: number;
  srtPass: boolean;
  // Cân bằng độ kiềm & châm NaHCO3
  alkalinityConsumedMgL: number; // 7.14 * nOxidizedMgL
  alkalinityConsumedKgDay: number;
  residualAlkalinityMgL: number;
  alkalinitySufficient: boolean; // residual >= 70 mg/L
  alkalinityDeficitKgDay: number;
  nahco3DosingKgDay: number;
}

export function calculateAerotank(d: AerotankData): AerotankCalcResult {
  const q = Number(d.q);
  const s0 = Number(d.bodIn);
  const s = Number(d.bodOut);
  const x = Number(d.mlss);
  const xvRatio = Number(d.mlvssRatio) || 0.8;
  const fm = Number(d.fmRatio) || 0.3;
  const depth = Number(d.waterDepth) || 4.0;
  const free = Number(d.freeboard) || 0.5;
  const diffuserCap = Number(d.diffuserCapacity) || 2.5;
  const blowerEff = Number(d.blowerEfficiency) || 0.75;

  const includeNitrification = d.includeNitrification ?? true;
  const nh4In = d.nh4In !== undefined && d.nh4In !== null ? Number(d.nh4In) : 30;
  const nh4Out = d.nh4Out !== undefined && d.nh4Out !== null ? Number(d.nh4Out) : 5;
  const temperatureC = d.temperatureC !== undefined && d.temperatureC !== null ? Number(d.temperatureC) : 25;
  const targetDo = d.targetDo !== undefined && d.targetDo !== null ? Number(d.targetDo) : 2.0;
  const alkalinityIn = d.alkalinityIn !== undefined && d.alkalinityIn !== null ? Number(d.alkalinityIn) : 220;
  const designSrtDays = d.srtDays ? Number(d.srtDays) : 12;

  const valid = q > 0 && s0 > s && x > 0 && fm > 0 && depth > 0 && d.length > 0 && d.width > 0;
  if (!valid) {
    return {
      valid: false,
      required: 0,
      actual: 0,
      totalHeight: 0,
      pass: false,
      deficit: 0,
      ratio: 0,
      actualHrt: 0,
      bodLoadKg: 0,
      bodRemovalPercent: 0,
      o2CbodDaily: 0,
      includeNitrification,
      nh4In,
      nh4Out,
      temperatureC,
      targetDo,
      alkalinityIn,
      nSynthesisMgL: 0,
      nSynthesisKgDay: 0,
      nOxidizedMgL: 0,
      nOxidizedKgDay: 0,
      o2NitrificationDaily: 0,
      o2Daily: 0,
      o2PeakHour: 0,
      airFlowM3h: 0,
      airFlowM3min: 0,
      diffuserCount: 0,
      blowerPressureKpa: 0,
      blowerPowerKw: 0,
      excessSludgeKgDay: 0,
      excessSludgeM3Day: 0,
      muMaxNitrifier: 0,
      knNitrogen: 0,
      bnEndogenous: 0,
      muNetNitrifier: 0,
      minSrtDays: 0,
      designSrtDays,
      srtSafetyFactor: 0,
      srtPass: false,
      alkalinityConsumedMgL: 0,
      alkalinityConsumedKgDay: 0,
      residualAlkalinityMgL: 0,
      alkalinitySufficient: false,
      alkalinityDeficitKgDay: 0,
      nahco3DosingKgDay: 0,
    };
  }

  const xv = x * xvRatio;
  const bodLoadKg = roundTo((q * s0) / 1000, 2);
  const required = roundTo((q * s0) / (fm * xv), 2);
  const actual = roundTo(d.length * d.width * depth, 2);
  const totalHeight = roundTo(depth + free, 2);
  const pass = actual + 1e-4 >= required;
  const deficit = roundTo(Math.max(0, required - actual), 2);
  const ratio = required > 0 ? roundTo(actual / required, 2) : 0;
  const actualHrt = q > 0 ? roundTo((actual / q) * 24, 2) : 0;

  const bodRemovalPercent = s0 > 0 ? roundTo(((s0 - s) / s0) * 100, 2) : 0;

  // 1. Carbonaceous Oxygen Demand (CBOD)
  // O2_CBOD = 0.55 * (S0 - S)*Q/1000 + 0.075 * Xv * V / 1000
  const o2CbodDaily = roundTo(0.55 * (((s0 - s) * q) / 1000) + (0.075 * xv * actual) / 1000, 2);

  // 2. Nitrification Stoichiometry & Nitrogenous Oxygen Demand (NOD)
  // Nitrogen synthesized into heterotrophic biomass ~ 5% of removed BOD5 (Metcalf & Eddy)
  const nSynthesisMgL = roundTo(0.05 * Math.max(0, s0 - s), 2);
  const nSynthesisKgDay = roundTo((nSynthesisMgL * q) / 1000, 2);

  let nOxidizedMgL = 0;
  let nOxidizedKgDay = 0;
  let o2NitrificationDaily = 0;

  if (includeNitrification) {
    nOxidizedMgL = roundTo(Math.max(0, nh4In - nSynthesisMgL - nh4Out), 2);
    nOxidizedKgDay = roundTo((nOxidizedMgL * q) / 1000, 2);
    // Stoichiometric oxygen: NH4+ + 2 O2 -> NO3- + 2 H+ + H2O (4.57 kg O2 / kg N oxidized)
    o2NitrificationDaily = roundTo(4.57 * nOxidizedKgDay, 2);
  }

  // Total daily oxygen required
  const o2Daily = roundTo(o2CbodDaily + o2NitrificationDaily, 2);
  const o2PeakHour = roundTo((o2Daily * 1.4) / 24, 2);

  // Airflow calculation: standard oxygen transfer efficiency in wastewater ~ 10%
  // 1 m3 air at 20°C contains ~ 0.28 kg O2 => Effective O2 delivery = 0.28 * 0.10 = 0.028 kg O2/m3 air
  const airFlowM3h = roundTo(o2PeakHour / (0.28 * 0.10), 2);
  const airFlowM3min = roundTo(airFlowM3h / 60, 2);
  const diffuserCount = Math.ceil(airFlowM3h / (diffuserCap > 0 ? diffuserCap : 2.5));

  // Blower pressure: (water depth + piping friction & diffuser losses ~ 0.8m) * 9.81 kPa
  const blowerPressureKpa = roundTo((depth + 0.8) * 9.81, 2);
  // Power: N = (Q_air * DeltaP) / (3600 * 102 * eff) * 1.25 safety factor
  const hydKw = (airFlowM3h * blowerPressureKpa) / 3600;
  const blowerPowerKw = roundTo((hydKw / (blowerEff > 0 ? blowerEff : 0.75)) * 1.2, 2);

  // Excess sludge: Px_hetero = 0.55 * BOD_removed, plus autotrophs yield ~ 0.15 * N_ox
  const excessSludgeHetero = 0.55 * (((s0 - s) * q) / 1000);
  const excessSludgeAuto = includeNitrification ? 0.15 * nOxidizedKgDay : 0;
  const excessSludgeKgDay = roundTo(excessSludgeHetero + excessSludgeAuto, 2);
  // At 99.2% moisture, 1 m3 sludge contains ~ 8 kg dry solids
  const excessSludgeM3Day = roundTo(excessSludgeKgDay / 8, 2);

  // 3. Nitrification Kinetics & Critical SRT Check (Metcalf & Eddy 5th Edition)
  // mu_nm(T) = 0.75 * 1.098^(T - 20)
  const muMaxNitrifier = roundTo(0.75 * Math.pow(1.098, temperatureC - 20), 3);
  // K_N(T) = 10^(0.051 * T - 1.158)
  const knNitrogen = roundTo(Math.pow(10, 0.051 * temperatureC - 1.158), 3);
  // b_n(T) = 0.04 * 1.04^(T - 20)
  const bnEndogenous = roundTo(0.04 * Math.pow(1.04, temperatureC - 20), 3);

  // mu_n = mu_nm * [N / (K_n + N)] * [DO / (K_o + DO)] - b_n (with K_o = 0.5 mg/L)
  const doTerm = targetDo / (0.5 + targetDo);
  const nTerm = nh4Out / (knNitrogen + nh4Out);
  const muNet = muMaxNitrifier * nTerm * doTerm - bnEndogenous;
  const muNetNitrifier = roundTo(Math.max(0.001, muNet), 4);

  // Critical washout SRT: theta_c^min = 1 / mu_net
  const minSrtDays = roundTo(1 / muNetNitrifier, 2);
  const srtSafetyFactor = minSrtDays > 0 ? roundTo(designSrtDays / minSrtDays, 2) : 0;
  // Safety factor should be >= 1.5 (Metcalf & Eddy recommended 1.5 - 2.5 to avoid washout)
  const srtPass = !includeNitrification || srtSafetyFactor >= 1.5;

  // 4. Alkalinity Balance & Chemical Neutralization
  // Nitrification destroys 7.14 kg CaCO3 / kg N oxidized
  const alkalinityConsumedMgL = includeNitrification ? roundTo(7.14 * nOxidizedMgL, 2) : 0;
  const alkalinityConsumedKgDay = includeNitrification ? roundTo(7.14 * nOxidizedKgDay, 2) : 0;
  const residualAlkalinityMgL = roundTo(alkalinityIn - alkalinityConsumedMgL, 2);
  // Residual alkalinity must be >= 70 mg/L CaCO3 to maintain pH 6.8 - 7.2
  const alkalinitySufficient = residualAlkalinityMgL >= 70;
  const deficitMgL = Math.max(0, 70 - residualAlkalinityMgL);
  const alkalinityDeficitKgDay = roundTo((deficitMgL * q) / 1000, 2);
  // Dosing sodium bicarbonate NaHCO3 (MW ratio 84 / 50 = 1.68 kg NaHCO3 per kg CaCO3 deficit)
  const nahco3DosingKgDay = roundTo(alkalinityDeficitKgDay * 1.68, 2);

  return {
    valid: true,
    required,
    actual,
    totalHeight,
    pass,
    deficit,
    ratio,
    actualHrt,
    bodLoadKg,
    bodRemovalPercent,
    o2CbodDaily,
    includeNitrification,
    nh4In,
    nh4Out,
    temperatureC,
    targetDo,
    alkalinityIn,
    nSynthesisMgL,
    nSynthesisKgDay,
    nOxidizedMgL,
    nOxidizedKgDay,
    o2NitrificationDaily,
    o2Daily,
    o2PeakHour,
    airFlowM3h,
    airFlowM3min,
    diffuserCount,
    blowerPressureKpa,
    blowerPowerKw,
    excessSludgeKgDay,
    excessSludgeM3Day,
    muMaxNitrifier,
    knNitrogen,
    bnEndogenous,
    muNetNitrifier,
    minSrtDays,
    designSrtDays,
    srtSafetyFactor,
    srtPass,
    alkalinityConsumedMgL,
    alkalinityConsumedKgDay,
    residualAlkalinityMgL,
    alkalinitySufficient,
    alkalinityDeficitKgDay,
    nahco3DosingKgDay,
  };
}

// ----------------- SECONDARY CLARIFIER CALCULATION -----------------
export function defaultSecondaryClarifierData(qh: number | null, mlss: number = 3000): SecondaryClarifierData {
  const qPeak = qh && qh > 0 ? roundTo(qh, 2) : 5;
  const q0 = 1.0; // 1.0 m3/m2.h
  const reqArea = qPeak / q0;
  const dia = Math.max(2.5, roundTo(Math.sqrt((4 * reqArea) / Math.PI), 2));
  const depth = 3.5;
  const free = 0.5;

  return {
    qh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qhOverride: false,
    surfaceOverflowRate: 1.0,
    solidsLoadingRate: 4.0,
    mlss: mlss || 3000,
    waterDepth: depth,
    freeboard: free,
    geometry: 'circle',
    diameter: dia,
    length: dia,
    width: dia,
    dimensionsOverride: false,
    sludgeRecycleRatio: 75,
    weirType: 'Máng Inox 304 răng cưa V-notch 90°',
    numRasPumpsWork: 1,
    numRasPumpsStandby: 1,
  };
}

export function updateAutoClarifierDimensions(d: SecondaryClarifierData): SecondaryClarifierData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qh);
  const q0 = Number(d.surfaceOverflowRate) || 1.0;
  if (!(q > 0 && q0 > 0)) return d;

  const reqArea = q / q0;
  const copy = { ...d };

  if (copy.geometry === 'circle') {
    copy.diameter = Math.max(2.0, roundTo(Math.sqrt((4 * reqArea) / Math.PI), 2));
    copy.length = copy.diameter;
    copy.width = copy.diameter;
  } else if (copy.geometry === 'square') {
    const side = Math.max(2.0, roundTo(Math.sqrt(reqArea), 2));
    copy.width = side;
    copy.length = side;
  } else {
    const w = Math.max(2.0, roundTo(Math.sqrt(reqArea / 2), 2));
    copy.width = w;
    copy.length = Math.max(3.0, roundTo(reqArea / w, 2));
  }
  return copy;
}

export interface SecondaryClarifierCalcResult {
  valid: boolean;
  requiredArea: number;
  actualArea: number;
  requiredVolume: number;
  actualVolume: number;
  totalHeight: number;
  pass: boolean;
  deficitArea: number;
  actualQ0: number;
  solidsLoadingRateActual: number;
  retentionHours: number;
  weirLength: number;
  weirLoadingRate: number;
  weirPass: boolean;
  rasFlowRate: number;
  centralWellDiameter: number;
}

export function calculateSecondaryClarifier(d: SecondaryClarifierData): SecondaryClarifierCalcResult {
  const q = Number(d.qh);
  const q0 = Number(d.surfaceOverflowRate) || 1.0;
  const mlss = Number(d.mlss) || 3000;
  const h = Number(d.waterDepth) || 3.5;
  const free = Number(d.freeboard) || 0.5;
  const rRatio = (Number(d.sludgeRecycleRatio) || 75) / 100;

  const valid = q > 0 && q0 > 0 && h > 0 && (d.geometry === 'circle' ? d.diameter > 0 : d.width > 0 && d.length > 0);
  if (!valid) {
    return {
      valid: false,
      requiredArea: 0,
      actualArea: 0,
      requiredVolume: 0,
      actualVolume: 0,
      totalHeight: 0,
      pass: false,
      deficitArea: 0,
      actualQ0: 0,
      solidsLoadingRateActual: 0,
      retentionHours: 0,
      weirLength: 0,
      weirLoadingRate: 0,
      weirPass: false,
      rasFlowRate: 0,
      centralWellDiameter: 0,
    };
  }

  const requiredArea = roundTo(q / q0, 2);
  let actualArea = 0;
  let weirLength = 0;
  let centralWellDiameter = 0;

  if (d.geometry === 'circle') {
    actualArea = roundTo((Math.PI * d.diameter * d.diameter) / 4, 2);
    weirLength = roundTo(Math.PI * d.diameter, 2);
    centralWellDiameter = roundTo(0.2 * d.diameter, 2);
  } else if (d.geometry === 'square') {
    actualArea = roundTo(d.width * d.width, 2);
    weirLength = roundTo(4 * d.width, 2);
    centralWellDiameter = roundTo(0.2 * d.width, 2);
  } else {
    actualArea = roundTo(d.length * d.width, 2);
    weirLength = roundTo(2 * (d.length + d.width), 2);
    centralWellDiameter = roundTo(0.2 * Math.min(d.length, d.width), 2);
  }

  const actualVolume = roundTo(actualArea * h, 2);
  const requiredVolume = roundTo(requiredArea * h, 2);
  const totalHeight = roundTo(h + free, 2);

  const pass = actualArea + 1e-4 >= requiredArea;
  const deficitArea = roundTo(Math.max(0, requiredArea - actualArea), 2);

  const actualQ0 = actualArea > 0 ? roundTo(q / actualArea, 2) : 0;
  // Solids loading rate: (Q * (1 + R) * MLSS) / (Area * 1000) (kg/m2.h)
  const solidsLoadingRateActual = actualArea > 0 ? roundTo((q * (1 + rRatio) * mlss) / (actualArea * 1000), 2) : 0;
  const retentionHours = q > 0 ? roundTo(actualVolume / q, 2) : 0;

  // Weir loading rate (m3/m.h) - Standard < 10 m3/m.h
  const weirLoadingRate = weirLength > 0 ? roundTo(q / weirLength, 2) : 0;
  const weirPass = weirLoadingRate <= 10.0;

  // Return sludge flow
  const rasFlowRate = roundTo(q * rRatio, 2);

  return {
    valid: true,
    requiredArea,
    actualArea,
    requiredVolume,
    actualVolume,
    totalHeight,
    pass,
    deficitArea,
    actualQ0,
    solidsLoadingRateActual,
    retentionHours,
    weirLength,
    weirLoadingRate,
    weirPass,
    rasFlowRate,
    centralWellDiameter,
  };
}

// ----------------- DISINFECTION TANK CALCULATION -----------------
export function defaultDisinfectionData(qh: number | null): DisinfectionTankData {
  const qPeak = qh && qh > 0 ? roundTo(qh, 2) : 5;
  const contact = 20; // 20 min
  const vReq = (qPeak * contact) / 60;
  const depth = 2.0;
  const free = 0.4;
  const area = vReq / depth;
  const width = Math.max(1.2, roundTo(Math.sqrt(area / 3), 2));
  const length = Math.max(2.5, roundTo(area / width, 2));

  return {
    qh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qhOverride: false,
    contactMinutes: 20,
    chlorineDose: 4.0, // 4 mg/L
    naoclConcentration: 10, // 10% Javel
    waterDepth: depth,
    freeboard: free,
    channels: 2,
    width: width,
    length: length,
    dimensionsOverride: false,
    storageDays: 15,
    chemicalPumpWork: 1,
    chemicalPumpStandby: 1,
  };
}

export function updateAutoDisinfectionDimensions(d: DisinfectionTankData): DisinfectionTankData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qh);
  const t = Number(d.contactMinutes) || 20;
  const h = Number(d.waterDepth) || 2.0;
  if (!(q > 0 && t > 0 && h > 0)) return d;

  const vReq = (q * t) / 60;
  const area = vReq / h;
  const copy = { ...d };
  const w = Math.max(1.2, roundTo(Math.sqrt(area / 3), 2));
  const l = Math.max(2.5, roundTo(area / w, 2));
  copy.width = w;
  copy.length = l;
  return copy;
}

export interface DisinfectionCalcResult {
  valid: boolean;
  requiredVolume: number;
  actualVolume: number;
  actualContactTime: number;
  totalHeight: number;
  pass: boolean;
  deficitVolume: number;
  channelWidth: number;
  lengthWidthRatio: number;
  chlorineKgDay: number;
  javelLitersDay: number;
  dosingPumpLitersHour: number;
  storageLitersRequired: number;
}

export function calculateDisinfection(d: DisinfectionTankData): DisinfectionCalcResult {
  const q = Number(d.qh);
  const t = Number(d.contactMinutes) || 20;
  const dose = Number(d.chlorineDose) || 4.0;
  const naoclPct = Number(d.naoclConcentration) || 10;
  const h = Number(d.waterDepth) || 2.0;
  const free = Number(d.freeboard) || 0.4;
  const channels = Math.max(1, Number(d.channels) || 2);
  const storageDays = Math.max(1, Number(d.storageDays) || 15);

  const valid = q > 0 && t > 0 && dose > 0 && h > 0 && d.length > 0 && d.width > 0;
  if (!valid) {
    return {
      valid: false,
      requiredVolume: 0,
      actualVolume: 0,
      actualContactTime: 0,
      totalHeight: 0,
      pass: false,
      deficitVolume: 0,
      channelWidth: 0,
      lengthWidthRatio: 0,
      chlorineKgDay: 0,
      javelLitersDay: 0,
      dosingPumpLitersHour: 0,
      storageLitersRequired: 0,
    };
  }

  const requiredVolume = roundTo((q * t) / 60, 2);
  const actualVolume = roundTo(d.length * d.width * h, 2);
  const totalHeight = roundTo(h + free, 2);
  const actualContactTime = q > 0 ? roundTo((actualVolume / q) * 60, 2) : 0;
  const pass = actualVolume + 1e-4 >= requiredVolume;
  const deficitVolume = roundTo(Math.max(0, requiredVolume - actualVolume), 2);

  const channelWidth = roundTo(d.width / channels, 2);
  const lengthWidthRatio = channelWidth > 0 ? roundTo((d.length * channels) / channelWidth, 2) : 0;

  // Active chlorine per day: Q_day * dose / 1000
  const qDay = q * 24;
  const chlorineKgDay = roundTo((qDay * dose) / 1000, 2);

  // Javel 10% (density ~ 1.18 kg/L, 10% active chlorine => 1L has 0.118 kg Cl2)
  const javelLitersDay = roundTo(chlorineKgDay / ((naoclPct / 100) * 1.18), 2);
  const dosingPumpLitersHour = roundTo(javelLitersDay / 24, 2);
  const storageLitersRequired = roundTo(javelLitersDay * storageDays, 2);

  return {
    valid: true,
    requiredVolume,
    actualVolume,
    actualContactTime,
    totalHeight,
    pass,
    deficitVolume,
    channelWidth,
    lengthWidthRatio,
    chlorineKgDay,
    javelLitersDay,
    dosingPumpLitersHour,
    storageLitersRequired,
  };
}

// ----------------- ANOXIC TANK CALCULATION -----------------
export function defaultAnoxicData(qHour: number | null): AnoxicTankData {
  const qh = qHour && qHour > 0 ? roundTo(qHour, 2) : 5;
  const hrt = 3.0; // 3.0 h
  const vReq = qh * hrt;
  const depth = 4.0;
  const free = 0.5;
  const area = vReq / depth;
  const width = Math.max(2.0, roundTo(Math.sqrt(area / 1.5), 2));
  const length = Math.max(2.5, roundTo(area / width, 2));

  return {
    qHour: qHour !== null && qHour !== undefined ? roundTo(qHour, 2) : null,
    qHourOverride: false,
    hrtHours: 3.0,
    recycleRatio: 2.0, // 200% (R = 2.0)
    mixingPowerRate: 10, // 10 W/m3
    waterDepth: depth,
    freeboard: free,
    length: length,
    width: width,
    dimensionsOverride: false,
    numMixers: 1,
    numRecyclePumpsWork: 1,
    numRecyclePumpsStandby: 1,
    bodIn: 250,
    tknIn: 40,
    no3In: 25,
  };
}

export function updateAutoAnoxicDimensions(d: AnoxicTankData): AnoxicTankData {
  if (d.dimensionsOverride) return d;
  const qh = Number(d.qHour);
  const hrt = Number(d.hrtHours) || 3.0;
  const h = Number(d.waterDepth) || 4.0;
  if (!(qh > 0 && hrt > 0 && h > 0)) return d;

  const vReq = qh * hrt;
  const area = vReq / h;
  const copy = { ...d };
  const w = Math.max(2.0, roundTo(Math.sqrt(area / 1.5), 2));
  const l = Math.max(2.5, roundTo(area / w, 2));
  copy.width = w;
  copy.length = l;
  return copy;
}

export interface AnoxicCalcResult {
  valid: boolean;
  requiredVolume: number;
  actualVolume: number;
  actualHrt: number;
  totalHeight: number;
  pass: boolean;
  deficitVolume: number;
  denitEfficiency: number;
  recycleFlowRate: number;
  mixingPowerKwTotal: number;
  mixingPowerPerMixer: number;
  // Cân bằng khử Nitrat nâng cao (Metcalf & Eddy)
  bodIn: number;
  tknIn: number;
  no3In: number;
  dailyFlowM3: number;
  nitrateRecycledKgDay: number;
  nitrateRemovedKgDay: number;
  o2CreditKgDay: number; // 2.86 kg O2 hồi phục / kg NO3-N khử
  alkalinityRecoveredKgDay: number; // 3.57 kg CaCO3 hồi phục / kg NO3-N khử
  sdnrRequired: number; // kg NO3-N / kg MLVSS.d
  bodToTknRatio: number;
  carbonAdequate: boolean; // BOD/TKN >= 3.8
  externalCarbonNeededKgDay: number; // Methanol/Rỉ đường nếu thiếu carbon
}

export function calculateAnoxic(d: AnoxicTankData): AnoxicCalcResult {
  const qh = Number(d.qHour);
  const hrt = Number(d.hrtHours) || 3.0;
  const r = Number(d.recycleRatio) || 2.0;
  const rate = Number(d.mixingPowerRate) || 10;
  const h = Number(d.waterDepth) || 4.0;
  const free = Number(d.freeboard) || 0.5;
  const numMixers = Math.max(1, Number(d.numMixers) || 1);

  const bodIn = d.bodIn !== undefined && d.bodIn !== null ? Number(d.bodIn) : 250;
  const tknIn = d.tknIn !== undefined && d.tknIn !== null ? Number(d.tknIn) : 40;
  const no3In = d.no3In !== undefined && d.no3In !== null ? Number(d.no3In) : 25;

  const valid = qh > 0 && hrt > 0 && h > 0 && d.length > 0 && d.width > 0;
  if (!valid) {
    return {
      valid: false,
      requiredVolume: 0,
      actualVolume: 0,
      actualHrt: 0,
      totalHeight: 0,
      pass: false,
      deficitVolume: 0,
      denitEfficiency: 0,
      recycleFlowRate: 0,
      mixingPowerKwTotal: 0,
      mixingPowerPerMixer: 0,
      bodIn,
      tknIn,
      no3In,
      dailyFlowM3: 0,
      nitrateRecycledKgDay: 0,
      nitrateRemovedKgDay: 0,
      o2CreditKgDay: 0,
      alkalinityRecoveredKgDay: 0,
      sdnrRequired: 0,
      bodToTknRatio: 0,
      carbonAdequate: false,
      externalCarbonNeededKgDay: 0,
    };
  }

  const requiredVolume = roundTo(qh * hrt, 2);
  const actualVolume = roundTo(d.length * d.width * h, 2);
  const totalHeight = roundTo(h + free, 2);
  const actualHrt = qh > 0 ? roundTo(actualVolume / qh, 2) : 0;
  const pass = actualVolume + 1e-4 >= requiredVolume;
  const deficitVolume = roundTo(Math.max(0, requiredVolume - actualVolume), 2);

  // Denitrification efficiency: R / (R + 1)
  const denitEfficiency = roundTo((r / (r + 1)) * 100, 2);
  // Recycle flow: R * Qh
  const recycleFlowRate = roundTo(r * qh, 2);

  // Mixing power
  const mixingPowerKwTotal = roundTo((actualVolume * rate) / 1000, 2);
  const mixingPowerPerMixer = roundTo(mixingPowerKwTotal / numMixers, 2);

  // Denitrification Balance
  const dailyFlowM3 = roundTo(qh * 24, 2);
  // Nitrate load entering via internal recycle
  const recycleFraction = r / (1 + r);
  const nitrateRecycledKgDay = roundTo((dailyFlowM3 * no3In * recycleFraction) / 1000, 2);
  const nitrateRemovedKgDay = roundTo(nitrateRecycledKgDay * (denitEfficiency / 100), 2);

  // Oxygen credit: 2.86 kg O2 equivalent recovered per kg NO3-N reduced
  const o2CreditKgDay = roundTo(2.86 * nitrateRemovedKgDay, 2);

  // Alkalinity recovered: 3.57 kg CaCO3 produced per kg NO3-N reduced
  const alkalinityRecoveredKgDay = roundTo(3.57 * nitrateRemovedKgDay, 2);

  // Specific Denitrification Rate (SDNR) ~ 0.035 - 0.045 at 25°C
  const sdnrRequired = roundTo(0.03 * Math.pow(1.08, 25 - 20), 3);

  // Carbon source adequacy: BOD5 / TKN >= 3.8 guarantees sufficient endogenous carbon
  const bodToTknRatio = tknIn > 0 ? roundTo(bodIn / tknIn, 2) : 0;
  const carbonAdequate = bodToTknRatio >= 3.8;

  // External carbon demand (if BOD/TKN < 3.8, e.g. using commercial methanol or molasses)
  let externalCarbonNeededKgDay = 0;
  if (!carbonAdequate && tknIn > 0) {
    const bodDeficitMgL = (3.8 - bodToTknRatio) * tknIn;
    // 2.86 kg COD needed per kg N, methanol equivalent
    externalCarbonNeededKgDay = roundTo((bodDeficitMgL * dailyFlowM3) / 1000 * 1.5, 2);
  }

  return {
    valid: true,
    requiredVolume,
    actualVolume,
    actualHrt,
    totalHeight,
    pass,
    deficitVolume,
    denitEfficiency,
    recycleFlowRate,
    mixingPowerKwTotal,
    mixingPowerPerMixer,
    bodIn,
    tknIn,
    no3In,
    dailyFlowM3,
    nitrateRecycledKgDay,
    nitrateRemovedKgDay,
    o2CreditKgDay,
    alkalinityRecoveredKgDay,
    sdnrRequired,
    bodToTknRatio,
    carbonAdequate,
    externalCarbonNeededKgDay,
  };
}

// ----------------- SLUDGE TANK CALCULATION -----------------
export function defaultSludgeTankData(sludgeVolume: number | null = null): SludgeTankData {
  const vPerDay = sludgeVolume && sludgeVolume > 0 ? roundTo(sludgeVolume, 2) : 2.5;
  const days = 3;
  const vReq = vPerDay * days;
  const depth = 3.5;
  const free = 0.5;
  const hopper = 0.8;
  const area = vReq / depth;
  const side = Math.max(1.8, roundTo(Math.sqrt(area), 2));

  return {
    sludgeVolumePerDay: sludgeVolume !== null && sludgeVolume !== undefined ? roundTo(sludgeVolume, 2) : null,
    sludgeVolumeOverride: false,
    storageDays: 3,
    moistureIn: 99.2,
    moistureOut: 96.5,
    waterDepth: depth,
    freeboard: free,
    hopperDepth: hopper,
    geometry: 'square',
    diameter: side,
    length: side,
    width: side,
    dimensionsOverride: false,
    aerationRate: 1.2, // 1.2 m3 khí / m3 bùn.giờ
    numScrewPumpsWork: 1,
    numScrewPumpsStandby: 1,
  };
}

export function updateAutoSludgeTankDimensions(d: SludgeTankData): SludgeTankData {
  if (d.dimensionsOverride) return d;
  const v = Number(d.sludgeVolumePerDay) || 2.5;
  const days = Number(d.storageDays) || 3;
  const h = Number(d.waterDepth) || 3.5;
  if (!(v > 0 && days > 0 && h > 0)) return d;

  const vReq = v * days;
  const area = vReq / h;
  const copy = { ...d };

  if (copy.geometry === 'circle') {
    const dia = Math.max(1.8, roundTo(Math.sqrt((4 * area) / Math.PI), 2));
    copy.diameter = dia;
    copy.width = dia;
    copy.length = dia;
  } else {
    const side = Math.max(1.8, roundTo(Math.sqrt(area), 2));
    copy.width = side;
    copy.length = side;
  }
  return copy;
}

export interface SludgeTankCalcResult {
  valid: boolean;
  requiredVolume: number;
  actualVolume: number;
  totalHeight: number;
  pass: boolean;
  deficitVolume: number;
  thickenedSludgePerDay: number;
  airFlowM3h: number;
  screwPumpFlowRate: number;
  drySolidsKgDay: number;
}

export function calculateSludgeTank(d: SludgeTankData): SludgeTankCalcResult {
  const v = Number(d.sludgeVolumePerDay) || 2.5;
  const days = Number(d.storageDays) || 3;
  const p0 = Number(d.moistureIn) || 99.2;
  const p1 = Number(d.moistureOut) || 96.5;
  const h = Number(d.waterDepth) || 3.5;
  const free = Number(d.freeboard) || 0.5;
  const hopper = Number(d.hopperDepth) || 0.8;
  const airRate = Number(d.aerationRate) || 1.2;

  const valid = v > 0 && days > 0 && h > 0 && d.width > 0 && p0 > p1;
  if (!valid) {
    return {
      valid: false,
      requiredVolume: 0,
      actualVolume: 0,
      totalHeight: 0,
      pass: false,
      deficitVolume: 0,
      thickenedSludgePerDay: 0,
      airFlowM3h: 0,
      screwPumpFlowRate: 0,
      drySolidsKgDay: 0,
    };
  }

  const requiredVolume = roundTo(v * days, 2);
  let surfaceArea = 0;
  if (d.geometry === 'circle') {
    surfaceArea = (Math.PI * d.diameter * d.diameter) / 4;
  } else {
    surfaceArea = d.width * d.length;
  }
  surfaceArea = roundTo(surfaceArea, 2);

  // Cylinder/cube volume + hopper bottom volume (approx 1/3 area * hopper)
  const actualVolume = roundTo(surfaceArea * h + (surfaceArea * hopper) / 3, 2);
  const totalHeight = roundTo(h + free + hopper, 2);
  const pass = actualVolume + 1e-4 >= requiredVolume;
  const deficitVolume = roundTo(Math.max(0, requiredVolume - actualVolume), 2);

  // Thickened volume: V1 = V0 * (100 - P0) / (100 - P1)
  const thickenedSludgePerDay = roundTo(v * ((100 - p0) / (100 - p1)), 2);
  // Dry solids kg/day
  const drySolidsKgDay = roundTo(v * 1000 * ((100 - p0) / 100), 2);

  // Aeration airflow: V_actual * airRate
  const airFlowM3h = roundTo(actualVolume * airRate, 2);

  // Dewatering pump flow rate (assuming 4 hours filter press batch per day)
  const screwPumpFlowRate = roundTo(thickenedSludgePerDay / 4, 2);

  return {
    valid: true,
    requiredVolume,
    actualVolume,
    totalHeight,
    pass,
    deficitVolume,
    thickenedSludgePerDay,
    airFlowM3h,
    screwPumpFlowRate,
    drySolidsKgDay,
  };
}

// ----------------- GENERIC UNIT CALCULATION -----------------
export function defaultGenericUnitData(
  catalogName: string,
  qh: number | null,
  qavg: number | null
): GenericUnitData {
  const isDaily = ['Bể UASB', 'Bể SBR'].includes(catalogName);
  const flow = isDaily ? (qavg && qavg > 0 ? roundTo(qavg, 2) : 100) : (qh && qh > 0 ? roundTo(qh, 2) : 5);
  const isMinutes = ['Song chắn rác', 'Bể lắng cát', 'Bể phản ứng', 'Bể keo tụ', 'Bể tạo bông', 'Bể tuyển nổi DAF'].includes(catalogName);
  const retVal = isMinutes ? 15 : 4;
  const retUnit = isMinutes ? 'phút' : 'giờ';
  const vReq = isMinutes ? (flow * retVal) / 60 : (flow / (isDaily ? 24 : 1)) * retVal;
  const depth = 2.5;
  const area = Math.max(1, vReq / depth);
  const side = Math.max(1.5, roundTo(Math.sqrt(area), 2));

  return {
    flowRate: flow,
    flowOverride: false,
    retentionValue: retVal,
    retentionUnit: retUnit,
    waterDepth: depth,
    freeboard: 0.5,
    length: side,
    width: side,
    geometry: 'rectangle',
    diameter: side,
    dimensionsOverride: false,
    designCriteria: `Tiêu chuẩn thiết kế điển hình cho ${catalogName}`,
    equipmentSummary: `Hệ thống thiết bị công nghệ chuyên dụng cho ${catalogName}`,
    powerKw: 1.5,
  };
}

export interface GenericUnitCalcResult {
  valid: boolean;
  requiredVolume: number;
  actualVolume: number;
  actualRetention: number;
  totalHeight: number;
  pass: boolean;
  deficit: number;
}

export function calculateGenericUnit(d: GenericUnitData): GenericUnitCalcResult {
  const flow = Number(d.flowRate);
  const ret = Number(d.retentionValue);
  const h = Number(d.waterDepth);
  const free = Number(d.freeboard);

  const valid = flow > 0 && ret > 0 && h > 0 && d.width > 0 && d.length > 0;
  if (!valid) {
    return {
      valid: false,
      requiredVolume: 0,
      actualVolume: 0,
      actualRetention: 0,
      totalHeight: 0,
      pass: false,
      deficit: 0,
    };
  }

  const flowPerHour = d.retentionUnit === 'phút' ? flow : flow;
  const requiredVolume =
    d.retentionUnit === 'phút'
      ? roundTo((flowPerHour * ret) / 60, 2)
      : roundTo(flowPerHour * ret, 2);

  const actualVolume = roundTo(d.length * d.width * h, 2);
  const totalHeight = roundTo(h + free, 2);
  const actualRetention =
    d.retentionUnit === 'phút'
      ? flowPerHour > 0 ? roundTo((actualVolume / flowPerHour) * 60, 2) : 0
      : flowPerHour > 0 ? roundTo(actualVolume / flowPerHour, 2) : 0;

  const pass = actualVolume + 1e-4 >= requiredVolume;
  const deficit = roundTo(Math.max(0, requiredVolume - actualVolume), 2);

  return {
    valid: true,
    requiredVolume,
    actualVolume,
    actualRetention,
    totalHeight,
    pass,
    deficit,
  };
}

// ----------------- 1. SONG CHẮN RÁC (BAR SCREEN) -----------------
export function defaultBarScreenData(qh: number | null): BarScreenData {
  const qPeak = qh && qh > 0 ? roundTo(qh, 2) : 5;
  const qM3s = qPeak / 3600;
  const v = 0.8; // 0.8 m/s
  const b = 15; // 15 mm
  const s = 6; // 6 mm
  const k = b / (b + s);
  const wetArea = (qM3s / v) / k;
  const depth = 0.35;
  const width = Math.max(0.3, roundTo(wetArea / depth, 2));

  return {
    qh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qhOverride: false,
    velocity: 0.8,
    barSpacingMm: 15,
    barWidthMm: 6,
    angleDeg: 60,
    channelWidth: width,
    waterDepth: depth,
    freeboard: 0.25,
    dimensionsOverride: false,
  };
}

export function updateAutoBarScreenDimensions(d: BarScreenData): BarScreenData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qh);
  const v = Number(d.velocity) || 0.8;
  const b = Number(d.barSpacingMm) || 15;
  const s = Number(d.barWidthMm) || 6;
  const h = Number(d.waterDepth) || 0.35;
  if (!(q > 0 && v > 0 && h > 0)) return d;

  const qM3s = q / 3600;
  const k = b / (b + s);
  const wetArea = (qM3s / v) / k;
  const width = Math.max(0.3, roundTo(wetArea / h, 2));

  return { ...d, channelWidth: width };
}

export interface BarScreenCalcResult {
  valid: boolean;
  qM3s: number;
  openAreaReq: number;
  channelAreaActual: number;
  actualVelocity: number;
  headLossMm: number;
  numBars: number;
  totalHeight: number;
  pass: boolean;
}

export function calculateBarScreen(d: BarScreenData): BarScreenCalcResult {
  const q = Number(d.qh);
  const vDes = Number(d.velocity) || 0.8;
  const b = Number(d.barSpacingMm) || 15;
  const s = Number(d.barWidthMm) || 6;
  const angle = Number(d.angleDeg) || 60;
  const w = Number(d.channelWidth) || 0.4;
  const h = Number(d.waterDepth) || 0.35;
  const free = Number(d.freeboard) || 0.25;

  const valid = q > 0 && vDes > 0 && b > 0 && s > 0 && w > 0 && h > 0;
  if (!valid) {
    return {
      valid: false,
      qM3s: 0,
      openAreaReq: 0,
      channelAreaActual: 0,
      actualVelocity: 0,
      headLossMm: 0,
      numBars: 0,
      totalHeight: 0,
      pass: false,
    };
  }

  const qM3s = q / 3600;
  const openAreaReq = roundTo(qM3s / vDes, 4);
  const k = b / (b + s);
  const channelAreaActual = roundTo(w * h, 3);
  const actualOpenArea = channelAreaActual * k;
  const actualVelocity = actualOpenArea > 0 ? roundTo(qM3s / actualOpenArea, 2) : 0;

  // Head loss (Kirschmer formula): hL = beta * (s/b)^(4/3) * (v^2 / 2g) * sin(angle)
  const beta = 2.42; // rectangular bars
  const rad = (angle * Math.PI) / 180;
  const headLossM = beta * Math.pow(s / b, 4 / 3) * ((actualVelocity * actualVelocity) / (2 * 9.81)) * Math.sin(rad);
  const headLossMm = roundTo(headLossM * 1000, 1);

  const numBars = Math.max(1, Math.floor((w * 1000 - b) / (s + b)));
  const totalHeight = roundTo(h + free, 2);
  const pass = actualVelocity >= 0.5 && actualVelocity <= 1.2;

  return {
    valid: true,
    qM3s: roundTo(qM3s, 4),
    openAreaReq,
    channelAreaActual,
    actualVelocity,
    headLossMm,
    numBars,
    totalHeight,
    pass,
  };
}

// ----------------- 2. BỂ LẮNG CÁT (GRIT CHAMBER) -----------------
export function defaultGritChamberData(qh: number | null): GritChamberData {
  const qPeak = qh && qh > 0 ? roundTo(qh, 2) : 5;
  const qM3s = qPeak / 3600;
  const vh = 0.3; // 0.3 m/s
  const u0 = 0.02; // 20 mm/s
  const h = 0.4;
  const w = Math.max(0.3, roundTo(qM3s / (vh * h), 2));
  const l = Math.max(1.5, roundTo((vh * h) / u0, 2));

  return {
    qh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qhOverride: false,
    settlingVelocityMmS: 20, // 20 mm/s
    horizontalVelocity: 0.3, // 0.3 m/s
    retentionSeconds: 60, // 60s
    length: l,
    width: w,
    waterDepth: h,
    freeboard: 0.3,
    dimensionsOverride: false,
  };
}

export function updateAutoGritChamberDimensions(d: GritChamberData): GritChamberData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qh);
  const vh = Number(d.horizontalVelocity) || 0.3;
  const u0 = (Number(d.settlingVelocityMmS) || 20) / 1000;
  const h = Number(d.waterDepth) || 0.4;
  if (!(q > 0 && vh > 0 && u0 > 0 && h > 0)) return d;

  const qM3s = q / 3600;
  const w = Math.max(0.3, roundTo(qM3s / (vh * h), 2));
  const l = Math.max(1.5, roundTo((vh * h) / u0, 2));

  return { ...d, width: w, length: l };
}

export interface GritChamberCalcResult {
  valid: boolean;
  actualVh: number;
  actualVelocity: number;
  actualRetentionSeconds: number;
  requiredVolume: number;
  actualVolume: number;
  volumeM3: number;
  totalHeight: number;
  pass: boolean;
  gritYieldLitersDay: number;
  gritYieldPerDayLiters: number;
}

export function calculateGritChamber(d: GritChamberData): GritChamberCalcResult {
  const q = Number(d.qh);
  const vh = Number(d.horizontalVelocity) || 0.3;
  const tReq = Number(d.retentionSeconds) || 60;
  const l = Number(d.length);
  const w = Number(d.width);
  const h = Number(d.waterDepth);
  const free = Number(d.freeboard) || 0.3;

  const valid = q > 0 && vh > 0 && l > 0 && w > 0 && h > 0;
  if (!valid) {
    return {
      valid: false,
      actualVh: 0,
      actualVelocity: 0,
      actualRetentionSeconds: 0,
      requiredVolume: 0,
      actualVolume: 0,
      volumeM3: 0,
      totalHeight: 0,
      pass: false,
      gritYieldLitersDay: 0,
      gritYieldPerDayLiters: 0,
    };
  }

  const qM3s = q / 3600;
  const wetArea = w * h;
  const actualVh = wetArea > 0 ? roundTo(qM3s / wetArea, 2) : 0;
  const actualRetentionSeconds = actualVh > 0 ? roundTo(l / actualVh, 1) : 0;
  const requiredVolume = roundTo((qM3s * tReq), 2);
  const volumeM3 = roundTo(l * w * h, 2);
  const totalHeight = roundTo(h + free, 2);
  const pass = actualVh >= 0.20 && actualVh <= 0.40 && actualRetentionSeconds >= 40;
  // Typical grit generation: 0.03 L grit per m3 wastewater
  const gritYieldLitersDay = roundTo((q * 24) * 0.03, 1);

  return {
    valid: true,
    actualVh,
    actualVelocity: actualVh,
    actualRetentionSeconds,
    requiredVolume,
    actualVolume: volumeM3,
    volumeM3,
    totalHeight,
    pass,
    gritYieldLitersDay,
    gritYieldPerDayLiters: gritYieldLitersDay,
  };
}

// ----------------- 3. BỂ TÁCH DẦU MỠ (GREASE TRAP) -----------------
export function defaultGreaseTrapData(qh: number | null): GreaseTrapData {
  const qPeak = qh && qh > 0 ? roundTo(qh, 2) : 5;
  const tMin = 20; // 20 min
  const vReq = (qPeak * tMin) / 60;
  const depth = 1.8;
  const area = vReq / depth;
  const w = Math.max(1.0, roundTo(Math.sqrt(area / 3), 2));
  const l = Math.max(2.5, roundTo(area / w, 2));

  return {
    qh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qhOverride: false,
    retentionMinutes: 20,
    surfaceOverflowRate: 3.5, // 3.5 m3/m2.h
    length: l,
    width: w,
    waterDepth: depth,
    freeboard: 0.4,
    dimensionsOverride: false,
  };
}

export function updateAutoGreaseTrapDimensions(d: GreaseTrapData): GreaseTrapData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qh);
  const t = Number(d.retentionMinutes) || 20;
  const h = Number(d.waterDepth) || 1.8;
  if (!(q > 0 && t > 0 && h > 0)) return d;

  const vReq = (q * t) / 60;
  const area = vReq / h;
  const w = Math.max(1.0, roundTo(Math.sqrt(area / 3), 2));
  const l = Math.max(2.5, roundTo(area / w, 2));

  return { ...d, width: w, length: l };
}

export interface GreaseTrapCalcResult {
  valid: boolean;
  requiredVolume: number;
  actualVolume: number;
  actualRetentionMin: number;
  actualQ0: number;
  lengthWidthRatio: number;
  totalHeight: number;
  pass: boolean;
}

export function calculateGreaseTrap(d: GreaseTrapData): GreaseTrapCalcResult {
  const q = Number(d.qh);
  const t = Number(d.retentionMinutes) || 20;
  const l = Number(d.length);
  const w = Number(d.width);
  const h = Number(d.waterDepth);
  const free = Number(d.freeboard) || 0.4;

  const valid = q > 0 && t > 0 && l > 0 && w > 0 && h > 0;
  if (!valid) {
    return {
      valid: false,
      requiredVolume: 0,
      actualVolume: 0,
      actualRetentionMin: 0,
      actualQ0: 0,
      lengthWidthRatio: 0,
      totalHeight: 0,
      pass: false,
    };
  }

  const requiredVolume = roundTo((q * t) / 60, 2);
  const actualVolume = roundTo(l * w * h, 2);
  const actualRetentionMin = q > 0 ? roundTo((actualVolume / q) * 60, 1) : 0;
  const surfaceArea = l * w;
  const actualQ0 = surfaceArea > 0 ? roundTo(q / surfaceArea, 2) : 0;
  const lengthWidthRatio = w > 0 ? roundTo(l / w, 2) : 0;
  const totalHeight = roundTo(h + free, 2);
  const pass = actualVolume + 1e-4 >= requiredVolume && actualQ0 <= 4.5;

  return {
    valid: true,
    requiredVolume,
    actualVolume,
    actualRetentionMin,
    actualQ0,
    lengthWidthRatio,
    totalHeight,
    pass,
  };
}

// ----------------- 4. BỂ KEO TỤ (COAGULATION TANK) -----------------
export function defaultCoagulationData(qh: number | null): CoagulationTankData {
  const qPeak = qh && qh > 0 ? roundTo(qh, 2) : 5;
  const tSec = 45; // 45s
  const vReq = (qPeak * tSec) / 3600;
  const depth = 1.5;
  const area = vReq / depth;
  const side = Math.max(0.8, roundTo(Math.sqrt(area), 2));

  return {
    qh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qhOverride: false,
    retentionSeconds: 45,
    velocityGradientG: 800, // 800 s-1
    length: side,
    width: side,
    waterDepth: depth,
    freeboard: 0.3,
    dimensionsOverride: false,
  };
}

export function updateAutoCoagulationDimensions(d: CoagulationTankData): CoagulationTankData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qh);
  const t = Number(d.retentionSeconds) || 45;
  const h = Number(d.waterDepth) || 1.5;
  if (!(q > 0 && t > 0 && h > 0)) return d;

  const vReq = (q * t) / 3600;
  const area = vReq / h;
  const side = Math.max(0.8, roundTo(Math.sqrt(area), 2));

  return { ...d, width: side, length: side };
}

export interface CoagulationCalcResult {
  valid: boolean;
  requiredVolume: number;
  actualVolume: number;
  actualRetentionSec: number;
  mixingPowerKw: number;
  totalHeight: number;
  pass: boolean;
}

export function calculateCoagulation(d: CoagulationTankData): CoagulationCalcResult {
  const q = Number(d.qh);
  const t = Number(d.retentionSeconds) || 45;
  const g = Number(d.velocityGradientG) || 800;
  const l = Number(d.length);
  const w = Number(d.width);
  const h = Number(d.waterDepth);
  const free = Number(d.freeboard) || 0.3;

  const valid = q > 0 && t > 0 && g > 0 && l > 0 && w > 0 && h > 0;
  if (!valid) {
    return {
      valid: false,
      requiredVolume: 0,
      actualVolume: 0,
      actualRetentionSec: 0,
      mixingPowerKw: 0,
      totalHeight: 0,
      pass: false,
    };
  }

  const requiredVolume = roundTo((q * t) / 3600, 3);
  const actualVolume = roundTo(l * w * h, 3);
  const actualRetentionSec = q > 0 ? roundTo((actualVolume / q) * 3600, 1) : 0;
  // P = G^2 * mu * V (mu ~ 0.001 Pa.s at 20°C)
  const powerW = g * g * 0.001 * actualVolume;
  const mixingPowerKw = roundTo((powerW / 1000) * 1.3, 2); // safety factor 1.3
  const totalHeight = roundTo(h + free, 2);
  const pass = actualVolume + 1e-4 >= requiredVolume;

  return {
    valid: true,
    requiredVolume,
    actualVolume,
    actualRetentionSec,
    mixingPowerKw,
    totalHeight,
    pass,
  };
}

// ----------------- 5. BỂ TẠO BÔNG (FLOCCULATION TANK) -----------------
export function defaultFlocculationData(qh: number | null): FlocculationTankData {
  const qPeak = qh && qh > 0 ? roundTo(qh, 2) : 5;
  const tMin = 25; // 25 min
  const vReq = (qPeak * tMin) / 60;
  const depth = 2.0;
  const area = vReq / depth;
  const w = Math.max(1.0, roundTo(Math.sqrt(area / 2), 2));
  const l = Math.max(2.0, roundTo(area / w, 2));

  return {
    qh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qhOverride: false,
    retentionMinutes: 25,
    stages: 3,
    length: l,
    width: w,
    waterDepth: depth,
    freeboard: 0.4,
    dimensionsOverride: false,
  };
}

export function updateAutoFlocculationDimensions(d: FlocculationTankData): FlocculationTankData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qh);
  const t = Number(d.retentionMinutes) || 25;
  const h = Number(d.waterDepth) || 2.0;
  if (!(q > 0 && t > 0 && h > 0)) return d;

  const vReq = (q * t) / 60;
  const area = vReq / h;
  const w = Math.max(1.0, roundTo(Math.sqrt(area / 2), 2));
  const l = Math.max(2.0, roundTo(area / w, 2));

  return { ...d, width: w, length: l };
}

export interface FlocculationCalcResult {
  valid: boolean;
  requiredVolume: number;
  actualVolume: number;
  actualRetentionMin: number;
  compartmentVolume: number;
  totalHeight: number;
  pass: boolean;
}

export function calculateFlocculation(d: FlocculationTankData): FlocculationCalcResult {
  const q = Number(d.qh);
  const t = Number(d.retentionMinutes) || 25;
  const stages = Math.max(1, Number(d.stages) || 3);
  const l = Number(d.length);
  const w = Number(d.width);
  const h = Number(d.waterDepth);
  const free = Number(d.freeboard) || 0.4;

  const valid = q > 0 && t > 0 && l > 0 && w > 0 && h > 0;
  if (!valid) {
    return {
      valid: false,
      requiredVolume: 0,
      actualVolume: 0,
      actualRetentionMin: 0,
      compartmentVolume: 0,
      totalHeight: 0,
      pass: false,
    };
  }

  const requiredVolume = roundTo((q * t) / 60, 2);
  const actualVolume = roundTo(l * w * h, 2);
  const actualRetentionMin = q > 0 ? roundTo((actualVolume / q) * 60, 1) : 0;
  const compartmentVolume = roundTo(actualVolume / stages, 2);
  const totalHeight = roundTo(h + free, 2);
  const pass = actualVolume + 1e-4 >= requiredVolume;

  return {
    valid: true,
    requiredVolume,
    actualVolume,
    actualRetentionMin,
    compartmentVolume,
    totalHeight,
    pass,
  };
}

// ----------------- 6. BỂ TUYỂN NỔI DAF (DAF FLOTATION) -----------------
export function defaultDafData(qh: number | null): DafData {
  const qPeak = qh && qh > 0 ? roundTo(qh, 2) : 5;
  const rRatio = 0.3; // 30%
  const qTotal = qPeak * (1 + rRatio);
  const slr = 5.0; // 5.0 m3/m2.h
  const reqArea = qTotal / slr;
  const depth = 2.0;
  const w = Math.max(1.2, roundTo(Math.sqrt(reqArea / 2.5), 2));
  const l = Math.max(2.5, roundTo(reqArea / w, 2));

  return {
    qh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qhOverride: false,
    recycleRatio: 30, // 30%
    surfaceLoadingRate: 5.0, // 5.0 m3/m2.h
    saturationPressureBar: 5.0, // 5.0 bar
    length: l,
    width: w,
    waterDepth: depth,
    freeboard: 0.5,
    dimensionsOverride: false,
  };
}

export function updateAutoDafDimensions(d: DafData): DafData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qh);
  const r = (Number(d.recycleRatio) || 30) / 100;
  const slr = Number(d.surfaceLoadingRate) || 5.0;
  if (!(q > 0 && slr > 0)) return d;

  const qTotal = q * (1 + r);
  const reqArea = qTotal / slr;
  const w = Math.max(1.2, roundTo(Math.sqrt(reqArea / 2.5), 2));
  const l = Math.max(2.5, roundTo(reqArea / w, 2));

  return { ...d, width: w, length: l };
}

export interface DafCalcResult {
  valid: boolean;
  totalFlowM3h: number;
  recycleFlowM3h: number;
  requiredArea: number;
  actualArea: number;
  actualSlr: number;
  volumeM3: number;
  totalHeight: number;
  pass: boolean;
}

export function calculateDaf(d: DafData): DafCalcResult {
  const q = Number(d.qh);
  const r = (Number(d.recycleRatio) || 30) / 100;
  const slr = Number(d.surfaceLoadingRate) || 5.0;
  const l = Number(d.length);
  const w = Number(d.width);
  const h = Number(d.waterDepth);
  const free = Number(d.freeboard) || 0.5;

  const valid = q > 0 && slr > 0 && l > 0 && w > 0 && h > 0;
  if (!valid) {
    return {
      valid: false,
      totalFlowM3h: 0,
      recycleFlowM3h: 0,
      requiredArea: 0,
      actualArea: 0,
      actualSlr: 0,
      volumeM3: 0,
      totalHeight: 0,
      pass: false,
    };
  }

  const recycleFlowM3h = roundTo(q * r, 2);
  const totalFlowM3h = roundTo(q + recycleFlowM3h, 2);
  const requiredArea = roundTo(totalFlowM3h / slr, 2);
  const actualArea = roundTo(l * w, 2);
  const actualSlr = actualArea > 0 ? roundTo(totalFlowM3h / actualArea, 2) : 0;
  const volumeM3 = roundTo(actualArea * h, 2);
  const totalHeight = roundTo(h + free, 2);
  const pass = actualArea + 1e-4 >= requiredArea;

  return {
    valid: true,
    totalFlowM3h,
    recycleFlowM3h,
    requiredArea,
    actualArea,
    actualSlr,
    volumeM3,
    totalHeight,
    pass,
  };
}

// ----------------- 7. BỂ SBR (SEQUENCING BATCH REACTOR) -----------------
export function defaultSbrData(q: number | null, bod: number = 250): SbrData {
  const qDaily = q && q > 0 ? roundTo(q, 2) : 100;
  const cycles = 4; // 4 cycles/day (6h/cycle)
  const numTanks = 2;
  const er = 0.3; // 30%
  const vFill = qDaily / (numTanks * cycles);
  const vTank = vFill / er;
  const depth = 4.0;
  const area = vTank / depth;
  const w = Math.max(2.5, roundTo(Math.sqrt(area / 1.5), 2));
  const l = Math.max(3.0, roundTo(area / w, 2));

  return {
    q: q !== null && q !== undefined ? roundTo(q, 2) : null,
    qOverride: false,
    cycleHours: 6,
    exchangeRatio: 0.3,
    bodIn: bod || 250,
    bodOut: 20,
    mlss: 3500,
    numTanks: 2,
    length: l,
    width: w,
    waterDepth: depth,
    freeboard: 0.6,
    dimensionsOverride: false,
  };
}

export function updateAutoSbrDimensions(d: SbrData): SbrData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.q);
  const cycles = 24 / (Number(d.cycleHours) || 6);
  const numTanks = Math.max(1, Number(d.numTanks) || 2);
  const er = Number(d.exchangeRatio) || 0.3;
  const h = Number(d.waterDepth) || 4.0;
  if (!(q > 0 && er > 0 && h > 0)) return d;

  const vFill = q / (numTanks * cycles);
  const vTank = vFill / er;
  const area = vTank / h;
  const w = Math.max(2.5, roundTo(Math.sqrt(area / 1.5), 2));
  const l = Math.max(3.0, roundTo(area / w, 2));

  return { ...d, width: w, length: l };
}

export interface SbrCalcResult {
  valid: boolean;
  cyclesPerDay: number;
  vFillPerCycle: number;
  requiredVolumePerTank: number;
  actualVolumePerTank: number;
  totalVolumeAllTanks: number;
  waterHighLevel: number;
  waterLowLevel: number;
  totalHeight: number;
  pass: boolean;
}

export function calculateSbr(d: SbrData): SbrCalcResult {
  const q = Number(d.q);
  const cHours = Number(d.cycleHours) || 6;
  const er = Number(d.exchangeRatio) || 0.3;
  const numTanks = Math.max(1, Number(d.numTanks) || 2);
  const l = Number(d.length);
  const w = Number(d.width);
  const h = Number(d.waterDepth);
  const free = Number(d.freeboard) || 0.6;

  const valid = q > 0 && cHours > 0 && er > 0 && l > 0 && w > 0 && h > 0;
  if (!valid) {
    return {
      valid: false,
      cyclesPerDay: 0,
      vFillPerCycle: 0,
      requiredVolumePerTank: 0,
      actualVolumePerTank: 0,
      totalVolumeAllTanks: 0,
      waterHighLevel: 0,
      waterLowLevel: 0,
      totalHeight: 0,
      pass: false,
    };
  }

  const cyclesPerDay = roundTo(24 / cHours, 1);
  const vFillPerCycle = roundTo(q / (numTanks * cyclesPerDay), 2);
  const requiredVolumePerTank = roundTo(vFillPerCycle / er, 2);
  const actualVolumePerTank = roundTo(l * w * h, 2);
  const totalVolumeAllTanks = roundTo(actualVolumePerTank * numTanks, 2);
  const waterHighLevel = h;
  const waterLowLevel = roundTo(h * (1 - er), 2);
  const totalHeight = roundTo(h + free, 2);
  const pass = actualVolumePerTank + 1e-4 >= requiredVolumePerTank;

  return {
    valid: true,
    cyclesPerDay,
    vFillPerCycle,
    requiredVolumePerTank,
    actualVolumePerTank,
    totalVolumeAllTanks,
    waterHighLevel,
    waterLowLevel,
    totalHeight,
    pass,
  };
}

// ----------------- 8. BỂ MBR (MEMBRANE BIOREACTOR) -----------------
export function defaultMbrData(qh: number | null): MbrData {
  const qPeak = qh && qh > 0 ? roundTo(qh, 2) : 5;
  const flux = 20; // 20 LMH
  const areaM2 = (qPeak * 1000) / flux;
  const hrt = 4.0; // 4.0 h
  const vReq = qPeak * hrt;
  const depth = 3.5;
  const tankArea = vReq / depth;
  const w = Math.max(2.0, roundTo(Math.sqrt(tankArea / 2), 2));
  const l = Math.max(3.0, roundTo(tankArea / w, 2));

  return {
    qh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qhOverride: false,
    membraneFluxLmh: 20, // 20 L/m2.h
    mlss: 9000, // 9,000 mg/L
    hrtHours: 4.0,
    length: l,
    width: w,
    waterDepth: depth,
    freeboard: 0.5,
    dimensionsOverride: false,
  };
}

export function updateAutoMbrDimensions(d: MbrData): MbrData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qh);
  const hrt = Number(d.hrtHours) || 4.0;
  const h = Number(d.waterDepth) || 3.5;
  if (!(q > 0 && hrt > 0 && h > 0)) return d;

  const vReq = q * hrt;
  const tankArea = vReq / h;
  const w = Math.max(2.0, roundTo(Math.sqrt(tankArea / 2), 2));
  const l = Math.max(3.0, roundTo(tankArea / w, 2));

  return { ...d, width: w, length: l };
}

export interface MbrCalcResult {
  valid: boolean;
  requiredMembraneAreaM2: number;
  requiredVolume: number;
  actualVolume: number;
  actualHrt: number;
  totalHeight: number;
  pass: boolean;
}

export function calculateMbr(d: MbrData): MbrCalcResult {
  const q = Number(d.qh);
  const flux = Number(d.membraneFluxLmh) || 20;
  const hrt = Number(d.hrtHours) || 4.0;
  const l = Number(d.length);
  const w = Number(d.width);
  const h = Number(d.waterDepth);
  const free = Number(d.freeboard) || 0.5;

  const valid = q > 0 && flux > 0 && hrt > 0 && l > 0 && w > 0 && h > 0;
  if (!valid) {
    return {
      valid: false,
      requiredMembraneAreaM2: 0,
      requiredVolume: 0,
      actualVolume: 0,
      actualHrt: 0,
      totalHeight: 0,
      pass: false,
    };
  }

  const requiredMembraneAreaM2 = roundTo((q * 1000) / flux, 1);
  const requiredVolume = roundTo(q * hrt, 2);
  const actualVolume = roundTo(l * w * h, 2);
  const actualHrt = q > 0 ? roundTo(actualVolume / q, 2) : 0;
  const totalHeight = roundTo(h + free, 2);
  const pass = actualVolume + 1e-4 >= requiredVolume;

  return {
    valid: true,
    requiredMembraneAreaM2,
    requiredVolume,
    actualVolume,
    actualHrt,
    totalHeight,
    pass,
  };
}

// ----------------- 9. BỂ MBBR (MOVING BED BIOFILM REACTOR) -----------------
export function defaultMbbrData(qh: number | null, bod: number = 250): MbbrData {
  const qPeak = qh && qh > 0 ? roundTo(qh, 2) : 5;
  const qDay = qPeak * 24;
  const bodIn = bod || 250;
  const bodOut = 20;
  const salr = 15; // 15 g BOD/m2.d
  const bodRemovedG = qDay * (bodIn - bodOut);
  const mediaAreaReq = bodRemovedG / salr;
  const ssa = 600; // 600 m2/m3
  const vMedia = mediaAreaReq / ssa;
  const ff = 0.5; // 50%
  const vTank = vMedia / ff;
  const depth = 4.0;
  const area = vTank / depth;
  const w = Math.max(2.0, roundTo(Math.sqrt(area / 1.5), 2));
  const l = Math.max(2.5, roundTo(area / w, 2));

  return {
    qh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qhOverride: false,
    fillingFraction: 50,
    mediaSpecificSurface: 600,
    salr: 15,
    bodIn,
    bodOut,
    length: l,
    width: w,
    waterDepth: depth,
    freeboard: 0.5,
    dimensionsOverride: false,
  };
}

export function updateAutoMbbrDimensions(d: MbbrData): MbbrData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qh);
  const s0 = Number(d.bodIn) || 250;
  const s = Number(d.bodOut) || 20;
  const salr = Number(d.salr) || 15;
  const ssa = Number(d.mediaSpecificSurface) || 600;
  const ff = (Number(d.fillingFraction) || 50) / 100;
  const h = Number(d.waterDepth) || 4.0;
  if (!(q > 0 && salr > 0 && ssa > 0 && ff > 0 && h > 0)) return d;

  const qDay = q * 24;
  const bodRemovedG = qDay * (s0 - s);
  const mediaAreaReq = bodRemovedG / salr;
  const vMedia = mediaAreaReq / ssa;
  const vTank = vMedia / ff;
  const area = vTank / h;
  const w = Math.max(2.0, roundTo(Math.sqrt(area / 1.5), 2));
  const l = Math.max(2.5, roundTo(area / w, 2));

  return { ...d, width: w, length: l };
}

export interface MbbrCalcResult {
  valid: boolean;
  requiredMediaVolumeM3: number;
  requiredTankVolumeM3: number;
  actualTankVolumeM3: number;
  actualHrt: number;
  totalHeight: number;
  pass: boolean;
}

export function calculateMbbr(d: MbbrData): MbbrCalcResult {
  const q = Number(d.qh);
  const s0 = Number(d.bodIn) || 250;
  const s = Number(d.bodOut) || 20;
  const salr = Number(d.salr) || 15;
  const ssa = Number(d.mediaSpecificSurface) || 600;
  const ff = (Number(d.fillingFraction) || 50) / 100;
  const l = Number(d.length);
  const w = Number(d.width);
  const h = Number(d.waterDepth);
  const free = Number(d.freeboard) || 0.5;

  const valid = q > 0 && salr > 0 && ssa > 0 && ff > 0 && l > 0 && w > 0 && h > 0;
  if (!valid) {
    return {
      valid: false,
      requiredMediaVolumeM3: 0,
      requiredTankVolumeM3: 0,
      actualTankVolumeM3: 0,
      actualHrt: 0,
      totalHeight: 0,
      pass: false,
    };
  }

  const qDay = q * 24;
  const bodRemovedG = qDay * (s0 - s);
  const mediaAreaReq = bodRemovedG / salr;
  const requiredMediaVolumeM3 = roundTo(mediaAreaReq / ssa, 2);
  const requiredTankVolumeM3 = roundTo(requiredMediaVolumeM3 / ff, 2);
  const actualTankVolumeM3 = roundTo(l * w * h, 2);
  const actualHrt = q > 0 ? roundTo(actualTankVolumeM3 / q, 2) : 0;
  const totalHeight = roundTo(h + free, 2);
  const pass = actualTankVolumeM3 + 1e-4 >= requiredTankVolumeM3;

  return {
    valid: true,
    requiredMediaVolumeM3,
    requiredTankVolumeM3,
    actualTankVolumeM3,
    actualHrt,
    totalHeight,
    pass,
  };
}

// ----------------- 10. BỂ KỴ KHÍ UASB -----------------
export function defaultUasbData(q: number | null, cod: number = 2000): UasbData {
  const qDay = q && q > 0 ? roundTo(q, 2) : 100;
  const codIn = cod || 2000;
  const vlr = 6.0; // 6.0 kg COD/m3.d
  const codLoadKg = (qDay * codIn) / 1000;
  const vReq = codLoadKg / vlr;
  const depth = 5.0;
  const area = vReq / depth;
  const w = Math.max(2.5, roundTo(Math.sqrt(area / 1.5), 2));
  const l = Math.max(3.0, roundTo(area / w, 2));

  return {
    q: q !== null && q !== undefined ? roundTo(q, 2) : null,
    qOverride: false,
    codIn,
    volumetricLoadingCod: 6.0,
    upflowVelocity: 0.8, // 0.8 m/h
    length: l,
    width: w,
    waterDepth: depth,
    freeboard: 0.8,
    dimensionsOverride: false,
  };
}

export function updateAutoUasbDimensions(d: UasbData): UasbData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.q);
  const codIn = Number(d.codIn) || 2000;
  const vlr = Number(d.volumetricLoadingCod) || 6.0;
  const h = Number(d.waterDepth) || 5.0;
  if (!(q > 0 && vlr > 0 && h > 0)) return d;

  const codLoadKg = (q * codIn) / 1000;
  const vReq = codLoadKg / vlr;
  const area = vReq / h;
  const w = Math.max(2.5, roundTo(Math.sqrt(area / 1.5), 2));
  const l = Math.max(3.0, roundTo(area / w, 2));

  return { ...d, width: w, length: l };
}

export interface UasbCalcResult {
  valid: boolean;
  codLoadKgDay: number;
  requiredVolume: number;
  actualVolume: number;
  actualUpflowVelocity: number;
  biogasYieldM3Day: number;
  totalHeight: number;
  pass: boolean;
}

export function calculateUasb(d: UasbData): UasbCalcResult {
  const q = Number(d.q);
  const codIn = Number(d.codIn) || 2000;
  const vlr = Number(d.volumetricLoadingCod) || 6.0;
  const l = Number(d.length);
  const w = Number(d.width);
  const h = Number(d.waterDepth);
  const free = Number(d.freeboard) || 0.8;

  const valid = q > 0 && vlr > 0 && l > 0 && w > 0 && h > 0;
  if (!valid) {
    return {
      valid: false,
      codLoadKgDay: 0,
      requiredVolume: 0,
      actualVolume: 0,
      actualUpflowVelocity: 0,
      biogasYieldM3Day: 0,
      totalHeight: 0,
      pass: false,
    };
  }

  const codLoadKgDay = roundTo((q * codIn) / 1000, 2);
  const requiredVolume = roundTo(codLoadKgDay / vlr, 2);
  const actualVolume = roundTo(l * w * h, 2);
  const area = l * w;
  const actualUpflowVelocity = area > 0 ? roundTo((q / 24) / area, 2) : 0;
  // Biogas estimation: ~ 0.35 m3 CH4 per kg COD removed (assuming 80% COD removal)
  const biogasYieldM3Day = roundTo(codLoadKgDay * 0.8 * 0.5, 1);
  const totalHeight = roundTo(h + free, 2);
  const pass = actualVolume + 1e-4 >= requiredVolume && actualUpflowVelocity <= 1.0;

  return {
    valid: true,
    codLoadKgDay,
    requiredVolume,
    actualVolume,
    actualUpflowVelocity,
    biogasYieldM3Day,
    totalHeight,
    pass,
  };
}

// ----------------- 11. BỂ LẮNG HÓA LÝ (CHEMICAL CLARIFIER) -----------------
export function defaultChemicalClarifierData(qh: number | null): ChemicalClarifierData {
  const qPeak = qh && qh > 0 ? roundTo(qh, 2) : 5;
  const q0 = 1.2; // 1.2 m3/m2.h
  const reqArea = qPeak / q0;
  const dia = Math.max(2.0, roundTo(Math.sqrt((4 * reqArea) / Math.PI), 2));
  const depth = 3.2;

  return {
    qh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qhOverride: false,
    surfaceOverflowRate: 1.2,
    waterDepth: depth,
    freeboard: 0.5,
    geometry: 'circle',
    diameter: dia,
    length: dia,
    width: dia,
    dimensionsOverride: false,
  };
}

export function updateAutoChemicalClarifierDimensions(d: ChemicalClarifierData): ChemicalClarifierData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qh);
  const q0 = Number(d.surfaceOverflowRate) || 1.2;
  if (!(q > 0 && q0 > 0)) return d;

  const reqArea = q / q0;
  const copy = { ...d };
  if (copy.geometry === 'circle') {
    copy.diameter = Math.max(2.0, roundTo(Math.sqrt((4 * reqArea) / Math.PI), 2));
    copy.length = copy.diameter;
    copy.width = copy.diameter;
  } else {
    const w = Math.max(1.5, roundTo(Math.sqrt(reqArea / 2), 2));
    copy.width = w;
    copy.length = Math.max(2.5, roundTo(reqArea / w, 2));
  }
  return copy;
}

export interface ChemicalClarifierCalcResult {
  valid: boolean;
  requiredArea: number;
  actualArea: number;
  actualQ0: number;
  retentionHours: number;
  actualVolume: number;
  weirLength: number;
  weirLoadingRate: number;
  totalHeight: number;
  pass: boolean;
}

export function calculateChemicalClarifier(d: ChemicalClarifierData): ChemicalClarifierCalcResult {
  const q = Number(d.qh);
  const q0 = Number(d.surfaceOverflowRate) || 1.2;
  const h = Number(d.waterDepth) || 3.2;
  const free = Number(d.freeboard) || 0.5;

  const valid = q > 0 && q0 > 0 && h > 0 && (d.geometry === 'circle' ? d.diameter > 0 : d.width > 0 && d.length > 0);
  if (!valid) {
    return {
      valid: false,
      requiredArea: 0,
      actualArea: 0,
      actualQ0: 0,
      retentionHours: 0,
      actualVolume: 0,
      weirLength: 0,
      weirLoadingRate: 0,
      totalHeight: 0,
      pass: false,
    };
  }

  const requiredArea = roundTo(q / q0, 2);
  let actualArea = 0;
  let weirLength = 0;
  if (d.geometry === 'circle') {
    actualArea = roundTo((Math.PI * d.diameter * d.diameter) / 4, 2);
    weirLength = roundTo(Math.PI * d.diameter, 2);
  } else {
    actualArea = roundTo(d.length * d.width, 2);
    weirLength = roundTo(2 * (d.length + d.width), 2);
  }

  const actualVolume = roundTo(actualArea * h, 2);
  const actualQ0 = actualArea > 0 ? roundTo(q / actualArea, 2) : 0;
  const retentionHours = q > 0 ? roundTo(actualVolume / q, 2) : 0;
  const weirLoadingRate = weirLength > 0 ? roundTo(q / weirLength, 2) : 0;
  const totalHeight = roundTo(h + free, 2);
  const pass = actualArea + 1e-4 >= requiredArea && weirLoadingRate <= 10.0;

  return {
    valid: true,
    requiredArea,
    actualArea,
    actualQ0,
    retentionHours,
    actualVolume,
    weirLength,
    weirLoadingRate,
    totalHeight,
    pass,
  };
}

// ----------------- 12. BỂ LỌC ÁP LỰC / THAN HOẠT TÍNH (SAND / CARBON FILTER) -----------------
export function defaultSandFilterData(qh: number | null, type: 'sand' | 'carbon' = 'sand'): SandFilterData {
  const qPeak = qh && qh > 0 ? roundTo(qh, 2) : 5;
  const v = type === 'sand' ? 10.0 : 8.0; // 10 m/h for sand, 8 m/h for carbon
  const reqArea = qPeak / v;
  const numCols = 1;
  const dia = Math.max(0.6, roundTo(Math.sqrt((4 * reqArea) / (Math.PI * numCols)), 2));

  return {
    qh: qh !== null && qh !== undefined ? roundTo(qh, 2) : null,
    qhOverride: false,
    filtrationVelocity: v,
    mediaDepth: 1.2,
    numColumns: numCols,
    diameter: dia,
    height: 2.2,
    dimensionsOverride: false,
    filterType: type,
  };
}

export function updateAutoSandFilterDimensions(d: SandFilterData): SandFilterData {
  if (d.dimensionsOverride) return d;
  const q = Number(d.qh);
  const v = Number(d.filtrationVelocity) || (d.filterType === 'sand' ? 10 : 8);
  const num = Math.max(1, Number(d.numColumns) || 1);
  if (!(q > 0 && v > 0)) return d;

  const reqArea = q / v;
  const dia = Math.max(0.6, roundTo(Math.sqrt((4 * reqArea) / (Math.PI * num)), 2));

  return { ...d, diameter: dia };
}

export interface SandFilterCalcResult {
  valid: boolean;
  requiredAreaM2: number;
  actualAreaM2: number;
  actualVelocity: number;
  ebctMinutes: number;
  pass: boolean;
}

export function calculateSandFilter(d: SandFilterData): SandFilterCalcResult {
  const q = Number(d.qh);
  const v = Number(d.filtrationVelocity) || (d.filterType === 'sand' ? 10 : 8);
  const num = Math.max(1, Number(d.numColumns) || 1);
  const dia = Number(d.diameter);
  const mediaDepth = Number(d.mediaDepth) || 1.2;

  const valid = q > 0 && v > 0 && dia > 0 && num > 0;
  if (!valid) {
    return {
      valid: false,
      requiredAreaM2: 0,
      actualAreaM2: 0,
      actualVelocity: 0,
      ebctMinutes: 0,
      pass: false,
    };
  }

  const requiredAreaM2 = roundTo(q / v, 2);
  const singleColArea = (Math.PI * dia * dia) / 4;
  const actualAreaM2 = roundTo(singleColArea * num, 2);
  const actualVelocity = actualAreaM2 > 0 ? roundTo(q / actualAreaM2, 2) : 0;
  // Empty Bed Contact Time (EBCT)
  const mediaVolume = actualAreaM2 * mediaDepth;
  const ebctMinutes = q > 0 ? roundTo((mediaVolume / q) * 60, 1) : 0;
  const pass = actualAreaM2 + 1e-4 >= requiredAreaM2;

  return {
    valid: true,
    requiredAreaM2,
    actualAreaM2,
    actualVelocity,
    ebctMinutes,
    pass,
  };
}

// ----------------- 13. MÁY ÉP BÙN (FILTER PRESS) -----------------
export function defaultFilterPressData(sludgePerDay: number | null = null): FilterPressData {
  const sPerDay = sludgePerDay && sludgePerDay > 0 ? roundTo(sludgePerDay, 2) : 2.5;
  const opHours = 4.0; // 4 hours/day
  const cap = roundTo(sPerDay / opHours, 2);

  return {
    sludgeVolumePerDay: sludgePerDay !== null && sludgePerDay !== undefined ? roundTo(sludgePerDay, 2) : null,
    sludgeVolumeOverride: false,
    operatingHoursPerDay: 4.0,
    feedMoisture: 97.0, // 97%
    cakeMoisture: 75.0, // 75%
    dimensionsOverride: false,
    capacityM3H: Math.max(0.5, cap),
  };
}

export interface FilterPressCalcResult {
  valid: boolean;
  requiredCapacityM3H: number;
  drySolidsKgDay: number;
  sludgeCakeKgDay: number;
  sludgeCakeM3Day: number;
  polymerConsumptionKgDay: number;
  pass: boolean;
}

export function calculateFilterPress(d: FilterPressData): FilterPressCalcResult {
  const v = Number(d.sludgeVolumePerDay) || 2.5;
  const t = Number(d.operatingHoursPerDay) || 4.0;
  const pFeed = Number(d.feedMoisture) || 97.0;
  const pCake = Number(d.cakeMoisture) || 75.0;
  const cap = Number(d.capacityM3H);

  const valid = v > 0 && t > 0 && pFeed > pCake && cap > 0;
  if (!valid) {
    return {
      valid: false,
      requiredCapacityM3H: 0,
      drySolidsKgDay: 0,
      sludgeCakeKgDay: 0,
      sludgeCakeM3Day: 0,
      polymerConsumptionKgDay: 0,
      pass: false,
    };
  }

  const requiredCapacityM3H = roundTo(v / t, 2);
  // Dry solids: V * 1000 * (100 - pFeed) / 100
  const drySolidsKgDay = roundTo(v * 1000 * ((100 - pFeed) / 100), 1);
  // Sludge cake weight (kg/day): drySolids / ((100 - pCake)/100)
  const sludgeCakeKgDay = roundTo(drySolidsKgDay / ((100 - pCake) / 100), 1);
  // Cake volume (m3/day, bulk density ~ 1.05 t/m3)
  const sludgeCakeM3Day = roundTo(sludgeCakeKgDay / 1050, 2);
  // Polymer consumption: ~ 3 kg polymer per ton dry solids
  const polymerConsumptionKgDay = roundTo((drySolidsKgDay / 1000) * 3.0, 2);
  const pass = cap + 1e-4 >= requiredCapacityM3H;

  return {
    valid: true,
    requiredCapacityM3H,
    drySolidsKgDay,
    sludgeCakeKgDay,
    sludgeCakeM3Day,
    polymerConsumptionKgDay,
    pass,
  };
}


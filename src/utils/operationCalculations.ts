/**
 * ECS - Environmental Calculation System
 * OPERATION & MONITORING CALCULATION ENGINES
 * Phân hệ tính toán vận hành công trình môi trường
 */

import { formatNumber } from './calculations';

// ----------------------------------------------------
// 1. TÍNH DINH DƯỠNG BỔ SUNG (NUTRIENT DOSING)
// ----------------------------------------------------
export interface NutrientDosingInputs {
  flowM3Day: number; // Lưu lượng Q (m3/ngày)
  bodMgL: number; // BOD5 đầu vào (mg/L)
  tnMgL: number; // TN hoặc N-NH4 đầu vào (mg/L)
  tpMgL: number; // TP hoặc P-PO4 đầu vào (mg/L)
  targetRatioBOD: number; // Mặc định 100
  targetRatioN: number; // Mặc định 5 (hiếu khí) hoặc 2 (kỵ khí)
  targetRatioP: number; // Mặc định 1 (hiếu khí) hoặc 0.5 (kỵ khí)
  nitrogenChem: 'urea' | 'dap' | 'nh4cl' | 'ammonium_sulfate';
  phosphorusChem: 'h3po4' | 'dap' | 'superphosphate' | 'kh2po4';
  ureaPurityPercent: number; // Thường 98-99%
  h3po4ConcentrationPercent: number; // Thường 85%
  solutionTankVolumeM3: number; // Thể tích bồn pha (m3)
  operatingHoursPerDay: number; // Giờ chạy bơm định lượng (h/ngày)
}

export interface NutrientDosingResults {
  nRequiredKgDay: number;
  nAvailableKgDay: number;
  nDeficitKgDay: number; // Thiếu hụt N (kg/ngày)
  pRequiredKgDay: number;
  pAvailableKgDay: number;
  pDeficitKgDay: number; // Thiếu hụt P (kg/ngày)
  nitrogenChemName: string;
  nitrogenChemKgDay: number; // Lượng hóa chất N thương phẩm cần châm
  nitrogenChemPumpLh: number; // Lưu lượng bơm định lượng hóa chất N (L/h)
  phosphorusChemName: string;
  phosphorusChemKgDay: number; // Lượng hóa chất P thương phẩm cần châm
  phosphorusChemPumpLh: number; // Lưu lượng bơm định lượng hóa chất P (L/h)
  dapContributionPKgDay?: number; // Lượng P được bù đắp từ DAP nếu dùng DAP cho N
  recommendation: string;
}

export function calculateNutrientDosing(inputs: NutrientDosingInputs): NutrientDosingResults {
  const q = Math.max(0, inputs.flowM3Day);
  const bod = Math.max(0, inputs.bodMgL);
  const tn = Math.max(0, inputs.tnMgL);
  const tp = Math.max(0, inputs.tpMgL);
  const opHours = Math.max(1, Math.min(24, inputs.operatingHoursPerDay || 24));

  // Tỷ lệ BOD:N:P
  const rBOD = inputs.targetRatioBOD || 100;
  const rN = inputs.targetRatioN || 5;
  const rP = inputs.targetRatioP || 1;

  // Nhu cầu theo tải lượng (kg/ngày)
  const nRequiredKgDay = (q * bod * (rN / rBOD)) / 1000;
  const nAvailableKgDay = (q * tn) / 1000;
  const nDeficitKgDay = Math.max(0, nRequiredKgDay - nAvailableKgDay);

  const pRequiredKgDay = (q * bod * (rP / rBOD)) / 1000;
  const pAvailableKgDay = (q * tp) / 1000;
  let pDeficitKgDay = Math.max(0, pRequiredKgDay - pAvailableKgDay);

  // Hóa chất Nitơ
  let nChemKgDay = 0;
  let nChemName = '';
  let dapContributionPKgDay = 0;

  if (inputs.nitrogenChem === 'urea') {
    nChemName = 'Phân Urê (NH2)2CO (46% N)';
    const purity = (inputs.ureaPurityPercent || 98) / 100;
    const nFraction = 0.46 * purity;
    nChemKgDay = nDeficitKgDay > 0 ? nDeficitKgDay / nFraction : 0;
  } else if (inputs.nitrogenChem === 'dap') {
    nChemName = 'Phân DAP (18% N, 46% P2O5 ~ 20.0% P)';
    nChemKgDay = nDeficitKgDay > 0 ? nDeficitKgDay / 0.18 : 0;
    // DAP cung cấp thêm P: 20% P
    dapContributionPKgDay = nChemKgDay * 0.2;
    pDeficitKgDay = Math.max(0, pDeficitKgDay - dapContributionPKgDay);
  } else if (inputs.nitrogenChem === 'nh4cl') {
    nChemName = 'Amoni Clorua NH4Cl (26.2% N)';
    nChemKgDay = nDeficitKgDay > 0 ? nDeficitKgDay / 0.262 : 0;
  } else {
    nChemName = 'Amoni Sunfat (NH4)2SO4 (21.2% N)';
    nChemKgDay = nDeficitKgDay > 0 ? nDeficitKgDay / 0.212 : 0;
  }

  // Hóa chất Phốt pho
  let pChemKgDay = 0;
  let pChemName = '';

  if (inputs.phosphorusChem === 'h3po4') {
    const conc = (inputs.h3po4ConcentrationPercent || 85) / 100;
    // M H3PO4 = 98 g/mol, P = 31 g/mol => 31/98 = 31.63% P nguyên chất trong H3PO4 tinh khiết
    const pFraction = 0.3163 * conc;
    pChemName = `Axit Photphoric H3PO4 (${inputs.h3po4ConcentrationPercent || 85}%)`;
    pChemKgDay = pDeficitKgDay > 0 ? pDeficitKgDay / pFraction : 0;
  } else if (inputs.phosphorusChem === 'dap') {
    pChemName = 'Phân DAP (46% P2O5 ~ 20.0% P)';
    pChemKgDay = pDeficitKgDay > 0 ? pDeficitKgDay / 0.2 : 0;
  } else if (inputs.phosphorusChem === 'superphosphate') {
    pChemName = 'Supe lân đơn (16% P2O5 ~ 7.0% P)';
    pChemKgDay = pDeficitKgDay > 0 ? pDeficitKgDay / 0.07 : 0;
  } else {
    pChemName = 'KH2PO4 (22.8% P)';
    pChemKgDay = pDeficitKgDay > 0 ? pDeficitKgDay / 0.228 : 0;
  }

  // Lưu lượng bơm định lượng giả định nồng độ dung dịch pha 5% (50 g/L) trong bồn
  const solConcFraction = 0.05;
  const nChemPumpLh = nChemKgDay > 0 ? (nChemKgDay / (solConcFraction * 1.0)) / opHours : 0;
  const pChemPumpLh = pChemKgDay > 0 ? (pChemKgDay / (solConcFraction * 1.0)) / opHours : 0;

  let recommendation = '';
  if (nDeficitKgDay <= 0 && pDeficitKgDay <= 0) {
    recommendation = 'Nước thải đầu vào đã đủ tỷ lệ dinh dưỡng (BOD:N:P), không cần châm bổ sung hóa chất.';
  } else if (nDeficitKgDay > 0 && pDeficitKgDay <= 0) {
    recommendation = `Thiếu Nitơ (${formatNumber(nDeficitKgDay)} kg N/ngày). Cần châm ${formatNumber(nChemKgDay)} kg ${nChemName}/ngày. Phốt pho đã đủ.`;
  } else if (nDeficitKgDay <= 0 && pDeficitKgDay > 0) {
    recommendation = `Thiếu Phốt pho (${formatNumber(pDeficitKgDay)} kg P/ngày). Cần châm ${formatNumber(pChemKgDay)} kg ${pChemName}/ngày. Nitơ đã đủ.`;
  } else {
    recommendation = `Thiếu cả Nitơ (${formatNumber(nDeficitKgDay)} kg N/ngày) và Phốt pho (${formatNumber(pDeficitKgDay)} kg P/ngày). Cần bổ sung cả 2 loại hóa chất theo liều lượng trên.`;
  }

  return {
    nRequiredKgDay,
    nAvailableKgDay,
    nDeficitKgDay,
    pRequiredKgDay,
    pAvailableKgDay,
    pDeficitKgDay,
    nitrogenChemName: nChemName,
    nitrogenChemKgDay: nChemKgDay,
    nitrogenChemPumpLh: nChemPumpLh,
    phosphorusChemName: pChemName,
    phosphorusChemKgDay: pChemKgDay,
    phosphorusChemPumpLh: pChemPumpLh,
    dapContributionPKgDay: dapContributionPKgDay > 0 ? dapContributionPKgDay : undefined,
    recommendation,
  };
}

// ----------------------------------------------------
// 2. TÍNH KIỀM BỔ SUNG (ALKALINITY DOSING)
// ----------------------------------------------------
export interface AlkalinityDosingInputs {
  flowM3Day: number;
  influentAlkalinityMgL: number; // Kiềm đầu vào (mg CaCO3/L)
  nh4NToOxidizeMgL: number; // Lượng NH4-N cần nitrat hóa (mg/L)
  targetResidualAlkalinityMgL: number; // Kiềm đệm tối thiểu cần giữ (thường 80-100 mg CaCO3/L)
  denitrificationRecoveryEnabled: boolean; // Bật thu hồi kiềm từ khử nitrat (3.57 mg CaCO3/mg N)
  no3NDenitrifiedMgL: number; // Lượng NO3-N được khử (mg/L)
  alkalinityChemical: 'nahco3' | 'na2co3' | 'naoh' | 'caoh2' | 'cao';
  chemicalPurityPercent: number; // % độ tinh khiết hoặc nồng độ
  solutionBatchM3: number; // Dung tích bồn pha dung dịch (m3)
  operatingHoursPerDay: number; // Thời gian chạy bơm châm (h/ngày)
}

export interface AlkalinityDosingResults {
  alkalinityConsumedMgL: number; // Tiêu hao do nitrat hóa (mg/L)
  alkalinityRecoveredMgL: number; // Thu hồi do khử nitrat (mg/L)
  alkalinityDeficitMgL: number; // Thiếu hụt nồng độ kiềm (mg CaCO3/L)
  pureCaCO3RequiredKgDay: number; // Khối lượng tương đương CaCO3 (kg/ngày)
  chemicalName: string;
  chemicalEquivRatio: number; // Tỷ lệ đương lượng g hóa chất / g CaCO3
  commercialChemicalKgDay: number; // Khối lượng hóa chất thương phẩm cần dùng (kg/ngày)
  chemicalPumpLh: number; // Lưu lượng bơm định lượng (L/h)
  phImpactNote: string;
}

export function calculateAlkalinityDosing(inputs: AlkalinityDosingInputs): AlkalinityDosingResults {
  const q = Math.max(0, inputs.flowM3Day);
  const alkIn = Math.max(0, inputs.influentAlkalinityMgL);
  const nh4Ox = Math.max(0, inputs.nh4NToOxidizeMgL);
  const targetResidual = Math.max(50, inputs.targetResidualAlkalinityMgL || 80);
  const opHours = Math.max(1, Math.min(24, inputs.operatingHoursPerDay || 24));

  // Tiêu thụ kiềm: 7.14 mg CaCO3 / mg NH4-N
  const alkConsumedMgL = nh4Ox * 7.14;

  // Thu hồi kiềm (nếu khử nitrat): 3.57 mg CaCO3 / mg NO3-N
  const alkRecoveredMgL = inputs.denitrificationRecoveryEnabled
    ? Math.max(0, inputs.no3NDenitrifiedMgL) * 3.57
    : 0;

  // Cân bằng kiềm: Alk_cần = Alk_tiêu_thụ + Alk_đệm_dư - Alk_đầu_vào - Alk_thu_hồi
  const netRequiredMgL = alkConsumedMgL + targetResidual - alkIn - alkRecoveredMgL;
  const alkDeficitMgL = Math.max(0, netRequiredMgL);

  const pureCaCO3RequiredKgDay = (q * alkDeficitMgL) / 1000;

  let chemName = '';
  let ratio = 1.68;
  let phNote = '';

  switch (inputs.alkalinityChemical) {
    case 'nahco3':
      chemName = 'Natri Bicacbonat NaHCO3 (Baking soda)';
      ratio = 1.68; // 84 / 50
      phNote = 'An toàn nhất, có tính đệm pH tuyệt vời, không làm sốc pH hệ vi sinh ngay cả khi châm quá liều.';
      break;
    case 'na2co3':
      chemName = 'Soda Ash Na2CO3 (Natri cacbonat)';
      ratio = 1.06; // 53 / 50
      phNote = 'Hiệu quả cao, hòa tan tốt, có thể làm tăng pH nhanh nếu châm tập trung cục bộ.';
      break;
    case 'naoh':
      chemName = 'Xút ăn da NaOH lỏng';
      ratio = 0.80; // 40 / 50
      phNote = 'Hóa chất mạnh, nâng pH cực nhanh. Cần châm phân tán tại điểm xáo trộn tốt tránh gây sốc pH vi sinh vật.';
      break;
    case 'caoh2':
      chemName = 'Vôi tôi Ca(OH)2 (Hydrated Lime)';
      ratio = 0.74; // 37.05 / 50
      phNote = 'Chi phí hóa chất rẻ nhất, tuy nhiên sinh thêm lượng cặn bùn vô cơ và dễ gây đóng cặn đường ống châm.';
      break;
    case 'cao':
      chemName = 'Vôi sống CaO (Quicklime)';
      ratio = 0.56; // 28 / 50
      phNote = 'Tỏa nhiệt mạnh khi tôi vôi hòa tan. Sinh nhiều bùn cặn vô cơ.';
      break;
  }

  const purity = (inputs.chemicalPurityPercent || 95) / 100;
  const commercialChemicalKgDay = pureCaCO3RequiredKgDay > 0
    ? (pureCaCO3RequiredKgDay * ratio) / purity
    : 0;

  // Dung dịch pha khoảng 5% (hoặc NaOH pha loãng)
  const solConc = 0.05;
  const chemicalPumpLh = commercialChemicalKgDay > 0
    ? (commercialChemicalKgDay / (solConc * 1.0)) / opHours
    : 0;

  return {
    alkalinityConsumedMgL: alkConsumedMgL,
    alkalinityRecoveredMgL: alkRecoveredMgL,
    alkalinityDeficitMgL: alkDeficitMgL,
    pureCaCO3RequiredKgDay,
    chemicalName: chemName,
    chemicalEquivRatio: ratio,
    commercialChemicalKgDay,
    chemicalPumpLh,
    phImpactNote: phNote,
  };
}

// ----------------------------------------------------
// 3. TÍNH COD BỔ SUNG (CARBON DOSING FOR DENITRIFICATION)
// ----------------------------------------------------
export interface CarbonDosingInputs {
  flowM3Day: number;
  no3NToDenitrifyMgL: number; // Lượng NO3-N cần khử trong bể Anoxic (mg/L)
  availableRbCodMgL: number; // COD dễ phân hủy (rbCOD) sẵn có trong nước cấp (mg/L)
  targetCodToNRatio: number; // Thường 4.0 - 5.0 kg COD / kg NO3-N
  carbonSource: 'methanol' | 'ethanol' | 'molasses' | 'sodium_acetate' | 'acetic_acid' | 'glucose';
  purityOrConcentrationPercent: number; // Nồng độ thương mại (%)
  operatingHoursPerDay: number;
}

export interface CarbonDosingResults {
  codRequiredTotalKgDay: number;
  codAvailableKgDay: number;
  codDeficitKgDay: number; // Nhu cầu COD cần bổ sung (kg COD/ngày)
  carbonSourceName: string;
  codEquivalentKgCodPerKg: number; // Hệ số kg COD / kg hóa chất tinh khiết
  densityKgL: number; // Khối lượng riêng (kg/L)
  commercialWeightKgDay: number; // Khối lượng thương phẩm (kg/ngày)
  commercialVolumeLDay: number; // Thể tích thương phẩm (Lít/ngày)
  dosingPumpRateLh: number; // Lưu lượng bơm định lượng (L/h)
  practicalNotes: string;
}

export function calculateCarbonDosing(inputs: CarbonDosingInputs): CarbonDosingResults {
  const q = Math.max(0, inputs.flowM3Day);
  const no3 = Math.max(0, inputs.no3NToDenitrifyMgL);
  const rbCod = Math.max(0, inputs.availableRbCodMgL);
  const ratio = Math.max(2.86, inputs.targetCodToNRatio || 4.5);
  const opHours = Math.max(1, Math.min(24, inputs.operatingHoursPerDay || 24));

  // Tải lượng COD cần cho khử nitrat
  const codRequiredTotalKgDay = (q * no3 * ratio) / 1000;
  const codAvailableKgDay = (q * rbCod) / 1000;
  const codDeficitKgDay = Math.max(0, codRequiredTotalKgDay - codAvailableKgDay);

  let name = '';
  let codPerKg = 1.07;
  let density = 1.0;
  let note = '';

  switch (inputs.carbonSource) {
    case 'methanol':
      name = 'Methanol (CH3OH)';
      codPerKg = 1.07; // 1 mol CH3OH (32g) cần 1.5 mol O2 (48g) => 48/32 = 1.5 kg COD/kg lý thuyết; thực tế sinh khối ~ 1.07 kg COD/kg
      density = 0.792;
      note = 'Hiệu suất khử Nitrat rất cao, bùn sinh ra ít, nhưng vi sinh khử nitrat bằng Methanol cần 2-3 tuần để thích nghi (Methylotrophs). Cháy nổ nguy hiểm.';
      break;
    case 'ethanol':
      name = 'Ethanol (C2H5OH - Cồn thực phẩm/công nghiệp)';
      codPerKg = 2.09;
      density = 0.789;
      note = 'Tốc độ khử nitrat cực nhanh, vi sinh thích nghi ngay lập tức (1-2 ngày), an toàn hơn Methanol.';
      break;
    case 'molasses':
      name = 'Mật rỉ đường (Rỉ mật mía)';
      codPerKg = 0.85; // Commercial molasses ~ 75-85% dry matter, ~0.8-0.9 kg COD/kg
      density = 1.38;
      note = 'Chi phí rẻ, dễ mua. Tuy nhiên làm nước có màu nâu sẫm khó tẩy, sinh nhiều bùn dư hơn và cần hòa tan kỹ tránh nghẹt bơm.';
      break;
    case 'sodium_acetate':
      name = 'Natri Axetat (CH3COONa)';
      codPerKg = 0.78;
      density = 1.25;
      note = 'Tốc độ khử nitrat nhanh nhất trong các nguồn carbon, không độc hại, thích hợp cho hệ thống cần kiểm soát nghiêm ngặt.';
      break;
    case 'acetic_acid':
      name = 'Axit Axetic (CH3COOH)';
      codPerKg = 1.07;
      density = 1.05;
      note = 'Cung cấp carbon tức thời, nhưng tính axit mạnh sẽ tiêu hao kiềm và làm giảm pH bể Anoxic.';
      break;
    case 'glucose':
      name = 'Đường Glucose / Dextrose';
      codPerKg = 1.07;
      density = 1.15;
      note = 'Dễ hòa tan, vi sinh hấp thụ nhanh, không độc hại.';
      break;
  }

  const conc = (inputs.purityOrConcentrationPercent || 100) / 100;
  const activeCodPerCommercialKg = codPerKg * conc;

  const commercialWeightKgDay = codDeficitKgDay > 0
    ? codDeficitKgDay / activeCodPerCommercialKg
    : 0;

  const commercialVolumeLDay = density > 0
    ? commercialWeightKgDay / density
    : commercialWeightKgDay;

  const dosingPumpRateLh = commercialVolumeLDay / opHours;

  return {
    codRequiredTotalKgDay,
    codAvailableKgDay,
    codDeficitKgDay,
    carbonSourceName: name,
    codEquivalentKgCodPerKg: codPerKg,
    densityKgL: density,
    commercialWeightKgDay,
    commercialVolumeLDay,
    dosingPumpRateLh,
    practicalNotes: note,
  };
}

// ----------------------------------------------------
// 4. VẬN HÀNH RỬA MÀNG MBR (MBR MEMBRANE CLEANING)
// ----------------------------------------------------
export interface MbrCleaningInputs {
  membraneAreaM2: number; // Tổng diện tích màng MBR (m2)
  cleaningType: 'maintenance' | 'recovery'; // Rửa duy trì (MC) hay Phục hồi (RC)
  chemicalAgent: 'naocl' | 'citric_acid' | 'oxalic_acid';
  chemicalStockConcentrationPercent: number; // Nồng độ hóa chất gốc dự trữ (vd Javel 10%, Citric acid 99%)
  specificSolutionVolumeLM2: number; // Suất thể tích dung dịch ngâm (thường 2.0 - 2.5 L/m2 màng)
  targetSolutionConcentrationPpm: number; // Nồng độ hóa chất cần pha trong bồn (mg/L hoặc ppm)
  currentTmpKpa: number; // Áp suất xuyên màng thực tế (kPa)
  soakingDurationMinutes: number; // Thời gian ngâm (phút)
}

export interface MbrCleaningResults {
  totalSolutionVolumeM3: number; // Tổng thể tích dung dịch rửa cần pha (m3)
  totalSolutionVolumeLiters: number;
  pureChemicalRequiredKg: number; // Khối lượng hóa chất nguyên chất cần dùng (kg)
  stockChemicalRequiredKg: number; // Khối lượng hóa chất gốc (kg)
  stockChemicalRequiredLiters: number; // Thể tích hóa chất gốc (Lít)
  waterVolumeM3: number; // Lượng nước sạch cần nạp vào bồn pha (m3)
  backwashFlowRateM3H: number; // Lưu lượng bơm châm rửa ngược màng (m3/h)
  foulingStatus: 'normal' | 'moderate' | 'severe';
  foulingStatusText: string;
  cleaningProcedure: string[];
}

export function calculateMbrCleaning(inputs: MbrCleaningInputs): MbrCleaningResults {
  const area = Math.max(1, inputs.membraneAreaM2 || 100);
  const specVol = Math.max(1.0, inputs.specificSolutionVolumeLM2 || 2.5); // L/m2
  const totalLiters = area * specVol;
  const totalM3 = totalLiters / 1000;

  // Nồng độ mục tiêu (mg/L)
  let targetPpm = inputs.targetSolutionConcentrationPpm;
  if (!targetPpm || targetPpm <= 0) {
    if (inputs.cleaningType === 'maintenance') {
      targetPpm = inputs.chemicalAgent === 'naocl' ? 400 : 1500;
    } else {
      targetPpm = inputs.chemicalAgent === 'naocl' ? 2000 : 3000;
    }
  }

  // Khối lượng hóa chất nguyên chất (kg) = (V (Lít) * C (mg/L)) / 1,000,000
  const pureChemKg = (totalLiters * targetPpm) / 1000000;

  // Khối lượng hóa chất gốc thương phẩm
  const stockConc = (inputs.chemicalStockConcentrationPercent || (inputs.chemicalAgent === 'naocl' ? 10 : 99)) / 100;
  const stockChemKg = pureChemKg / stockConc;

  // Khối lượng riêng hóa chất gốc
  const stockDensity = inputs.chemicalAgent === 'naocl' ? 1.15 : 1.54; // Javel ~ 1.15 kg/L, Citric ~ 1.54
  const stockChemLiters = inputs.chemicalAgent === 'naocl' ? stockChemKg / stockDensity : stockChemKg;

  // Lượng nước sạch cần pha
  const waterM3 = Math.max(0, totalM3 - (inputs.chemicalAgent === 'naocl' ? stockChemLiters / 1000 : 0));

  // Bơm rửa ngược thường bơm trong 15-30 phút
  const pumpDurationHours = 0.5; // 30 phút bơm hóa chất vào màng
  const backwashFlowM3H = totalM3 / pumpDurationHours;

  // Đánh giá áp suất xuyên màng TMP
  const tmp = inputs.currentTmpKpa || 15;
  let foulingStatus: 'normal' | 'moderate' | 'severe' = 'normal';
  let foulingStatusText = '';

  if (tmp < 18) {
    foulingStatus = 'normal';
    foulingStatusText = `TMP hiện tại (${tmp} kPa): Màng hoạt động ổn định, độ thấm hút tốt. Thích hợp duy trì rửa MC định kỳ.`;
  } else if (tmp <= 30) {
    foulingStatus = 'moderate';
    foulingStatusText = `TMP hiện tại (${tmp} kPa): Màng bắt đầu nghẹt cặn bẩn sinh học/khoáng. Cần tiến hành rửa bảo trì (MC) với NaOCl hoặc Axit Citric.`;
  } else {
    foulingStatus = 'severe';
    foulingStatusText = `TMP hiện tại (${tmp} kPa) vượt ngưỡng báo động (> 30 kPa): Màng bị nghẽn nghiêm trọng (Fouling). Bắt buộc thực hiện Quy trình Rửa phục hồi ngâm sâu (Recovery Cleaning) tối thiểu 2-4 giờ.`;
  }

  const procedure = [
    'Bước 1: Tắt bơm hút lọc MBR. Mở sục khí cường độ cao trong 5-10 phút để xói sạch lớp bánh bùn bám mặt ngoài sợi màng.',
    `Bước 2: Xả cạn bùn trong ngăn màng (đối với rửa phục hồi RC) hoặc để nguyên mức nước (nếu rửa MC ngâm màng inline).`,
    `Bước 3: Chuẩn bị bồn pha dung dịch: Nạp ${formatNumber(waterM3)} m³ nước sạch, bổ sung ${formatNumber(stockChemLiters)} Lít (${formatNumber(stockChemKg)} kg) hóa chất gốc, khuấy đều đạt nồng độ ${formatNumber(targetPpm)} ppm.`,
    `Bước 4: Bật bơm rửa ngược với lưu lượng ${formatNumber(backwashFlowM3H)} m³/h để đẩy dung dịch hóa chất thẩm thấu từ trong lòng sợi màng ra ngoài (thời gian bơm khoảng 15-30 phút).`,
    `Bước 5: Đóng van, giữ ngâm tĩnh dung dịch trong sợi màng khoảng ${inputs.soakingDurationMinutes || (inputs.cleaningType === 'maintenance' ? 60 : 180)} phút để hóa chất phân hủy triệt để cáu cặn.`,
    'Bước 6: Xả rửa dung dịch hóa chất, hút bỏ nước rửa ra bể điều hòa hoặc trung hòa trước khi cho hệ thống chạy lọc lại. Ghi nhận TMP sau rửa.',
  ];

  return {
    totalSolutionVolumeM3: totalM3,
    totalSolutionVolumeLiters: totalLiters,
    pureChemicalRequiredKg: pureChemKg,
    stockChemicalRequiredKg: stockChemKg,
    stockChemicalRequiredLiters: stockChemLiters,
    waterVolumeM3: waterM3,
    backwashFlowRateM3H: backwashFlowM3H,
    foulingStatus,
    foulingStatusText,
    cleaningProcedure: procedure,
  };
}

// ----------------------------------------------------
// 5. NHẬT KÝ VẬN HÀNH (OPERATION LOGBOOK DATA & SVI)
// ----------------------------------------------------
export interface OperationLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  shift: string; // Ca 1, Ca 2, Ca 3, Hành chính
  operator: string;
  flowM3Day: number;
  inletPh: number;
  aerotankPh: number;
  doMgL: number;
  mlssMgL: number;
  sv30MlL: number; // Thể tích bùn sau 30 phút (mL/L)
  sviMlG: number; // Chỉ số SVI tự động tính = (SV30 * 1000) / MLSS
  sviStatus: 'low_ash' | 'optimal' | 'normal' | 'bulking';
  sviStatusText: string;
  clarityCm: number;
  codInMgL: number;
  codOutMgL: number;
  codEfficiencyPercent: number;
  nh4InMgL: number;
  nh4OutMgL: number;
  nh4EfficiencyPercent: number;
  sludgeWastedM3Day: number; // Bùn xả Qw (m3/ngày)
  powerKwh: number;
  chemicalNotes: string;
  maintenanceNotes: string;
}

export function evaluateSVI(sv30: number, mlss: number): { svi: number; status: 'low_ash' | 'optimal' | 'normal' | 'bulking'; text: string } {
  if (mlss <= 0 || sv30 <= 0) {
    return { svi: 0, status: 'normal', text: 'Chưa đủ số liệu tính SVI' };
  }
  const svi = Math.round((sv30 * 1000) / mlss);

  if (svi < 70) {
    return {
      svi,
      status: 'low_ash',
      text: `SVI = ${svi} mL/g: Bùn già, nhiều tro vô cơ, lắng quá nhanh, nước sau xử lý dễ bị đục bụi bùn li ti lơ lửng. Cần tăng xả bùn dư hoặc bổ sung cơ chất dinh dưỡng.`,
    };
  } else if (svi <= 120) {
    return {
      svi,
      status: 'optimal',
      text: `SVI = ${svi} mL/g: Bông bùn hoạt tính tối ưu, kết tụ keo đặc chắc, lắng nhanh và nước sau lắng trong vắt (Chuẩn lý tưởng).`,
    };
  } else if (svi <= 150) {
    return {
      svi,
      status: 'normal',
      text: `SVI = ${svi} mL/g: Khả năng lắng ở mức khá. Cần theo dõi lượng oxy hòa tan DO và tải trọng bùn F/M để phòng ngừa nở bùn.`,
    };
  } else {
    return {
      svi,
      status: 'bulking',
      text: `SVI = ${svi} mL/g (CẢNH BÁO NỞ BÙN - Sludge Bulking): Bùn xốp nhẹ, vi khuẩn dạng sợi phát triển quá mức, bùn không lắng được và tràn máng răng cưa bể lắng. Khẩn trương kiểm tra tăng DO, sục khí bổ sung, hoặc clo hóa liều nhẹ bùn tuần hoàn.`,
    };
  }
}

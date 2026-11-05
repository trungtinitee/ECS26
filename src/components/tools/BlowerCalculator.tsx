import React, { useState } from 'react';
import { RotateCcw, Copy, Check, Wind, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatNumber } from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface BlowerCalculatorProps {
  initialQ?: number; // m3/day
  initialBod?: number; // mg/L
  initialTn?: number; // mg/L
}

export const BlowerCalculator: React.FC<BlowerCalculatorProps> = ({
  initialQ = 100,
  initialBod = 250,
  initialTn = 40,
}) => {
  // 1. Biological Loads
  const [flowM3Day, setFlowM3Day] = useState<number>(initialQ > 0 ? initialQ : 100);
  const [bodInMgL, setBodInMgL] = useState<number>(initialBod > 0 ? initialBod : 250);
  const [bodOutMgL, setBodOutMgL] = useState<number>(20);
  const [nh4InMgL, setNh4InMgL] = useState<number>(initialTn > 0 ? initialTn * 0.75 : 30);
  const [nh4OutMgL, setNh4OutMgL] = useState<number>(3);

  // Coefficients (Metcalf & Eddy)
  const [aPrime, setAPrime] = useState<number>(0.55); // kg O2 / kg BOD removed
  const [bPrime, setBPrime] = useState<number>(4.57); // kg O2 / kg NH4 oxidized
  const [tankWaterDepthM, setTankWaterDepthM] = useState<number>(4.0); // Water depth (m)
  const [diffuserSubmergenceM, setDiffuserSubmergenceM] = useState<number>(3.8); // Submergence (m)

  // Environmental conditions
  const [tempC, setTempC] = useState<number>(28); // Temperature (°C)
  const [alphaCoeff, setAlphaCoeff] = useState<number>(0.85); // Transfer ratio wastewater/clean water
  const [betaCoeff, setBetaCoeff] = useState<number>(0.95); // Salinity/TDS correction
  const [targetDoMgL, setTargetDoMgL] = useState<number>(2.0); // Target DO in tank (mg/L)
  const [operatingHoursPerDay, setOperatingHoursPerDay] = useState<number>(24); // h/day

  // Aeration System
  const [sotePerMeter, setSotePerMeter] = useState<number>(6.5); // % SOTE per meter depth
  const [diffuserCapacityM3H, setDiffuserCapacityM3H] = useState<number>(2.0); // m3/h per diffuser disk
  const [pipeLossKpa, setPipeLossKpa] = useState<number>(5.0); // Piping loss (kPa)
  const [diffuserLossKpa, setDiffuserLossKpa] = useState<number>(3.5); // Diffuser loss (kPa)
  const [safetyLossKpa, setSafetyLossKpa] = useState<number>(2.0); // Safety margin (kPa)
  const [blowerEfficiency, setBlowerEfficiency] = useState<number>(70); // %

  const [copied, setCopied] = useState(false);

  // --- CALCULATION ---
  // 1. Oxygen Demands
  const deltaBodKgDay = (Math.max(0, flowM3Day) * Math.max(0, bodInMgL - bodOutMgL)) / 1000;
  const deltaNh4KgDay = (Math.max(0, flowM3Day) * Math.max(0, nh4InMgL - nh4OutMgL)) / 1000;

  // Actual Oxygen Requirement (AOR)
  const aorBodKgDay = deltaBodKgDay * aPrime;
  const aorNitrificationKgDay = deltaNh4KgDay * bPrime;
  const aorTotalKgDay = aorBodKgDay + aorNitrificationKgDay;
  const aorKgH = operatingHoursPerDay > 0 ? aorTotalKgDay / operatingHoursPerDay : 0;

  // 2. Standard Oxygen Requirement (SOR)
  // Cs20 = 9.09 mg/L (clean water 20°C, 1 atm)
  // CsT = saturation at operating temperature
  const csT = 14.652 - 0.41022 * tempC + 0.007991 * Math.pow(tempC, 2) - 0.000077774 * Math.pow(tempC, 3);
  // Mid-depth saturation adjustment
  const pbRatio = 1 + (diffuserSubmergenceM / 10.33) * 0.5;
  const csTank = csT * pbRatio;
  const cs20 = 9.09 * (1 + (diffuserSubmergenceM / 10.33) * 0.5);

  const thetaFactor = Math.pow(1.024, tempC - 20);
  const transferRatio =
    (alphaCoeff * (betaCoeff * csTank - targetDoMgL) * thetaFactor) / cs20;
  const sorKgH = transferRatio > 0 ? aorKgH / transferRatio : aorKgH * 1.5;

  // 3. Air Flow Rate
  // Density of air at 20°C = 1.204 kg/m3, 21% O2 by volume, 23.2% O2 by weight -> 0.279 kg O2 / m3 air
  const o2DensityAir = 0.279; // kg O2 / m3 air
  const soteTotalPercent = Math.min(60, diffuserSubmergenceM * sotePerMeter);
  const soteDecimal = Math.max(0.05, soteTotalPercent / 100);

  const requiredAirM3H = soteDecimal > 0 ? sorKgH / (o2DensityAir * soteDecimal) : 0;
  const requiredAirM3Min = requiredAirM3H / 60;

  // 4. Blower Pressure
  // Hydrostatic pressure (kPa): rho * g * h = 9.81 * h
  const staticHeadKpa = diffuserSubmergenceM * 9.81;
  const totalPressureKpa = staticHeadKpa + pipeLossKpa + diffuserLossKpa + safetyLossKpa;
  const totalPressureBar = totalPressureKpa / 100;

  // 5. Blower Power (Adiabatic compression)
  // P1 = 101.3 kPa, P2 = P1 + totalPressureKpa
  // P = (w * R * T1) / (29.7 * n * e) * [ (P2/P1)^0.283 - 1 ]
  // Practical formula: Power (kW) = (Q_m3_min * P_kPa) / (60 * eta_blower) * 1.25 safety
  const effDec = Math.max(0.3, blowerEfficiency / 100);
  const blowerShaftPowerKw = effDec > 0 ? (requiredAirM3Min * totalPressureKpa) / (60 * effDec) : 0;
  const motorSafety = 1.2;
  const blowerMotorPowerKw = blowerShaftPowerKw * motorSafety;

  // Standard Blower Motors
  const standardMotors = [1.5, 2.2, 3.7, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110];
  const suggestedBlowerKw = standardMotors.find((m) => m >= blowerMotorPowerKw) || Math.ceil(blowerMotorPowerKw);

  // 6. Number of Diffusers (D270 / D300)
  const numDiffusers = Math.ceil(requiredAirM3H / Math.max(0.5, diffuserCapacityM3H));

  const handleCopySummary = () => {
    const text = `KẾT QUẢ TÍNH NHU CẦU OXY & MÁY THỔI KHÍ:
- Lưu lượng nước thải: ${formatNumber(flowM3Day)} m³/ngày
- Nhu cầu oxy thực tế AOR: ${formatNumber(aorTotalKgDay, 1)} kg O₂/ngày (${formatNumber(aorKgH, 2)} kg O₂/h)
- Nhu cầu oxy tiêu chuẩn SOR: ${formatNumber(sorKgH, 2)} kg O₂/h
- Hiệu suất truyền oxy SOTE: ${formatNumber(soteTotalPercent, 1)}% (ở độ sâu ${diffuserSubmergenceM}m)
- Lưu lượng khí nén yêu cầu: ${formatNumber(requiredAirM3H, 1)} m³/h (${formatNumber(requiredAirM3Min, 2)} m³/phút)
- Áp lực thổi khí: ${formatNumber(totalPressureKpa, 1)} kPa (~${formatNumber(totalPressureKpa / 9.81, 2)} m cột nước)
- Công suất động cơ máy thổi khí đề xuất: ${suggestedBlowerKw} kW (Số lượng: 1 chạy + 1 dự phòng)
- Số lượng đĩa phân phối khí D270 (2 m³/h·đĩa): ${numDiffusers} đĩa`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#18392b] flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#e7f3ec] text-[#176b45] flex items-center justify-center text-sm font-bold">
              💨
            </span>
            <span>Tiện ích Tính Nhu cầu Oxy & Máy thổi khí (Blower Sizing)</span>
          </h2>
          <p className="text-xs text-[#62776c] mt-0.5">
            Cân bằng oxy sinh học AOR/SOR theo Metcalf & Eddy, tính lưu lượng khí m³/phút, cột áp và chọn đĩa sục khí
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopySummary}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f0f6f2] hover:bg-[#e2ede6] text-[#176b45] text-xs font-bold border border-[#c4d7cc] transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Đã sao chép kết quả' : 'Sao chép kết quả'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card 1: Biological parameters */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-4">
            <label className="block text-xs font-bold text-[#234333] uppercase tracking-wider">
              1. Tải lượng ô nhiễm cần cấp khí
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Lưu lượng thiết kế Q (m³/ngày)
                </label>
                <NumericInput
                  step={10}
                  min={1}
                  value={flowM3Day}
                  fallbackValue={100}
                  onChange={(val) => setFlowM3Day(val ?? 100)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-sm text-[#183929] bg-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Thời gian sục khí (giờ/ngày)
                </label>
                <NumericInput
                  step={1}
                  min={1}
                  max={24}
                  value={operatingHoursPerDay}
                  fallbackValue={24}
                  onChange={(val) => setOperatingHoursPerDay(val ?? 24)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-sm text-[#183929] bg-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">BOD₅ vào bể (mg/L)</label>
                <NumericInput
                  step={10}
                  min={10}
                  value={bodInMgL}
                  fallbackValue={250}
                  onChange={(val) => setBodInMgL(val ?? 250)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">BOD₅ mục tiêu ra (mg/L)</label>
                <NumericInput
                  step={5}
                  min={5}
                  value={bodOutMgL}
                  fallbackValue={20}
                  onChange={(val) => setBodOutMgL(val ?? 20)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">NH₄⁺-N vào bể (mg/L)</label>
                <NumericInput
                  step={2}
                  min={0}
                  value={nh4InMgL}
                  fallbackValue={30}
                  onChange={(val) => setNh4InMgL(val ?? 30)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Khử Nitrat hóa tiêu tốn 4.57 kg O₂/kg N</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">NH₄⁺-N mục tiêu ra (mg/L)</label>
                <NumericInput
                  step={1}
                  min={0}
                  value={nh4OutMgL}
                  fallbackValue={3}
                  onChange={(val) => setNh4OutMgL(val ?? 3)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Tank Depth & Environment */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-4">
            <label className="block text-xs font-bold text-[#234333] uppercase tracking-wider">
              2. Kích thước bể & Điều kiện sục khí
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Độ sâu nước hữu dụng H (m)</label>
                <NumericInput
                  step={0.1}
                  min={1.5}
                  value={tankWaterDepthM}
                  fallbackValue={4.0}
                  onChange={(val) => setTankWaterDepthM(val ?? 4.0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Độ sâu ngập đĩa sục khí (m)</label>
                <NumericInput
                  step={0.1}
                  min={1.0}
                  value={diffuserSubmergenceM}
                  fallbackValue={3.8}
                  onChange={(val) => setDiffuserSubmergenceM(val ?? 3.8)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Cách đáy bể 0.15 – 0.25 m</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Nhiệt độ nước thải (°C)</label>
                <NumericInput
                  step={1}
                  min={10}
                  max={45}
                  value={tempC}
                  fallbackValue={28}
                  onChange={(val) => setTempC(val ?? 28)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">DO mục tiêu duy trì (mg/L)</label>
                <NumericInput
                  step={0.2}
                  min={1.0}
                  max={4.0}
                  value={targetDoMgL}
                  fallbackValue={2.0}
                  onChange={(val) => setTargetDoMgL(val ?? 2.0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Khuyến nghị: 1.5 – 2.0 mg/L</span>
              </div>
            </div>
          </div>

          {/* Card 3: Diffuser & Losses */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-4">
            <label className="block text-xs font-bold text-[#234333] uppercase tracking-wider">
              3. Thiết bị phân phối khí & Áp lực
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">SOTE (%/m sâu)</label>
                <NumericInput
                  step={0.5}
                  min={3}
                  max={10}
                  value={sotePerMeter}
                  fallbackValue={6.5}
                  onChange={(val) => setSotePerMeter(val ?? 6.5)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Đĩa bọt mịn: 6.0 – 7.5%/m</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Lưu lượng đĩa (m³/h·đĩa)</label>
                <NumericInput
                  step={0.2}
                  min={0.5}
                  max={6.0}
                  value={diffuserCapacityM3H}
                  fallbackValue={2.0}
                  onChange={(val) => setDiffuserCapacityM3H(val ?? 2.0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
                <span className="text-[10px] text-[#708477]">D270: 1.5 – 2.5 m³/h</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Hiệu suất máy khí (%)</label>
                <NumericInput
                  step={1}
                  min={50}
                  max={90}
                  value={blowerEfficiency}
                  fallbackValue={70}
                  onChange={(val) => setBlowerEfficiency(val ?? 70)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Roots blower: 65 – 75%</span>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-6 space-y-5">
          {/* Main Air Flow Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#125838] to-[#0d3f28] text-white shadow-md space-y-4">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-200 block">
              Lưu lượng khí nén yêu cầu cấp vào bể
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {formatNumber(requiredAirM3Min, 2)}
              </span>
              <span className="text-xl font-bold text-emerald-200">m³/phút</span>
              <span className="text-sm font-semibold text-emerald-300 ml-2">
                (~{formatNumber(requiredAirM3H, 1)} m³/h)
              </span>
            </div>

            <div className="pt-3 border-t border-white/20 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-emerald-200 block text-[11px]">Áp lực máy thổi khí P:</span>
                <span className="text-lg font-bold font-mono text-white">
                  {formatNumber(totalPressureKpa, 1)} kPa
                </span>
                <span className="text-[10px] text-emerald-300 block">
                  (~{formatNumber(totalPressureKpa / 9.81, 2)} m cột nước)
                </span>
              </div>
              <div>
                <span className="text-emerald-200 block text-[11px]">Động cơ đề xuất:</span>
                <span className="text-xl font-bold font-mono text-white">
                  {suggestedBlowerKw} kW
                </span>
                <span className="text-[10px] text-emerald-300 block">
                  (1 hoạt động + 1 dự phòng)
                </span>
              </div>
            </div>
          </div>

          {/* Diffuser Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-[#1e3e2f] uppercase tracking-wider flex items-center justify-between">
              <span>Số lượng đĩa phân phối khí (Diffuser)</span>
              <span className="text-[#176b45] font-extrabold text-sm">{numDiffusers} đĩa</span>
            </h3>

            <div className="p-3 bg-[#f5faf7] border border-[#d2e6da] rounded-xl text-xs space-y-2">
              <div className="flex justify-between text-[#405649]">
                <span>Chủng loại đĩa đề xuất:</span>
                <strong className="text-[#183929]">Đĩa bọt mịn màng EPDM Ø270mm / Ø300mm</strong>
              </div>
              <div className="flex justify-between text-[#405649]">
                <span>Cường độ cấp khí mỗi đĩa:</span>
                <strong className="text-[#183929]">{formatNumber(diffuserCapacityM3H, 1)} m³/h·đĩa</strong>
              </div>
              <div className="flex justify-between text-[#405649]">
                <span>Hiệu suất truyền oxy tổng SOTE:</span>
                <strong className="text-[#176b45] font-bold">{formatNumber(soteTotalPercent, 1)}%</strong>
              </div>
            </div>
          </div>

          {/* Oxygen Breakdown Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-[#1e3e2f] uppercase tracking-wider">
              Cân bằng nhu cầu Oxy sinh học
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Oxy khử BOD hữu cơ (a' = {aPrime})</span>
                <span className="font-mono font-bold text-[#183929]">{formatNumber(aorBodKgDay, 1)} kg O₂/ngày</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Oxy Nitrat hóa Amoni (b' = {bPrime})</span>
                <span className="font-mono font-bold text-[#183929]">{formatNumber(aorNitrificationKgDay, 1)} kg O₂/ngày</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#d8e6dd] bg-[#f7faf8] px-2 rounded-lg font-bold">
                <span className="text-[#176b45]">Tổng oxy thực tế AOR</span>
                <span className="font-mono text-[#176b45] text-sm">
                  {formatNumber(aorTotalKgDay, 1)} kg O₂/ngày ({formatNumber(aorKgH, 2)} kg/h)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Tổng oxy tiêu chuẩn SOR</span>
                <span className="font-mono font-bold text-[#183929]">{formatNumber(sorKgH, 2)} kg O₂/h</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Công suất trục máy thổi khí tính toán</span>
                <span className="font-mono font-bold text-[#183929]">{formatNumber(blowerShaftPowerKw, 2)} kW</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

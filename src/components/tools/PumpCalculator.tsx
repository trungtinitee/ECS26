import React, { useState } from 'react';
import { RotateCcw, Copy, Check, Info, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatNumber } from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface PumpCalculatorProps {
  initialQ?: number; // m3/h
}

export const PumpCalculator: React.FC<PumpCalculatorProps> = ({ initialQ = 10 }) => {
  // 1. Flow & Application
  const [appType, setAppType] = useState<'raw' | 'sludge' | 'effluent' | 'custom'>('raw');
  const [flowM3H, setFlowM3H] = useState<number>(initialQ > 0 ? initialQ : 10);
  const [geoHeadM, setGeoHeadM] = useState<number>(5); // H geo (m)
  const [pipeLengthM, setPipeLengthM] = useState<number>(50); // L (m)
  const [pipeDiameterMm, setPipeDiameterMm] = useState<number>(80); // D (mm)
  const [pipeMaterialC, setPipeMaterialC] = useState<number>(140); // Hazen-Williams C
  const [minorLossPercent, setMinorLossPercent] = useState<number>(20); // 20% of friction loss
  const [safetyHeadM, setSafetyHeadM] = useState<number>(1.0); // Safety margin (m)
  const [liquidDensity, setLiquidDensity] = useState<number>(1000); // kg/m3

  // Efficiencies
  const [pumpEfficiency, setPumpEfficiency] = useState<number>(70); // %
  const [motorEfficiency, setMotorEfficiency] = useState<number>(90); // %
  const [motorSafetyFactor, setMotorSafetyFactor] = useState<number>(1.2); // k_dt

  const [copied, setCopied] = useState(false);

  // Auto preset adjustments
  const handleAppTypeChange = (type: 'raw' | 'sludge' | 'effluent' | 'custom') => {
    setAppType(type);
    if (type === 'raw') {
      setGeoHeadM(6);
      setPipeMaterialC(140);
      setLiquidDensity(1000);
      setPumpEfficiency(68);
    } else if (type === 'sludge') {
      setGeoHeadM(4);
      setPipeMaterialC(120);
      setLiquidDensity(1025);
      setPumpEfficiency(60);
      setMotorSafetyFactor(1.25);
    } else if (type === 'effluent') {
      setGeoHeadM(8);
      setPipeMaterialC(150);
      setLiquidDensity(1000);
      setPumpEfficiency(75);
    }
  };

  // --- CALCULATION ---
  const qM3S = Math.max(0, flowM3H) / 3600;
  const dM = Math.max(10, pipeDiameterMm) / 1000;
  const areaM2 = (Math.PI * Math.pow(dM, 2)) / 4;
  const velocityMs = areaM2 > 0 ? qM3S / areaM2 : 0;

  // Hazen-Williams friction loss: h_f = 10.67 * L * Q^1.852 / (C^1.852 * D^4.87)
  let frictionLossM = 0;
  if (qM3S > 0 && dM > 0 && pipeMaterialC > 0) {
    frictionLossM =
      (10.67 * pipeLengthM * Math.pow(qM3S, 1.852)) /
      (Math.pow(pipeMaterialC, 1.852) * Math.pow(dM, 4.87));
  }

  const minorLossM = (frictionLossM * Math.max(0, minorLossPercent)) / 100;
  const totalHeadM = Math.max(0, geoHeadM) + frictionLossM + minorLossM + Math.max(0, safetyHeadM);

  // Hydraulic power (kW) = (rho * g * Q * H) / 1000
  const g = 9.81;
  const hydraulicPowerKw = (liquidDensity * g * qM3S * totalHeadM) / 1000;

  // Shaft power (kW)
  const pumpEffDec = Math.max(10, Math.min(99, pumpEfficiency)) / 100;
  const shaftPowerKw = pumpEffDec > 0 ? hydraulicPowerKw / pumpEffDec : 0;

  // Motor power (kW)
  const motorEffDec = Math.max(10, Math.min(99, motorEfficiency)) / 100;
  const motorPowerKw = motorEffDec > 0 ? (shaftPowerKw * motorSafetyFactor) / motorEffDec : 0;

  // Standard commercial motor steps
  const standardMotors = [0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3.0, 3.7, 4.0, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110];
  const suggestedMotorKw = standardMotors.find((m) => m >= motorPowerKw) || Math.ceil(motorPowerKw);

  // Estimated full load current (3-phase 380V, cos phi = 0.85)
  const fullLoadCurrentAmp = suggestedMotorKw > 0 ? (suggestedMotorKw * 1000) / (Math.sqrt(3) * 380 * 0.85 * motorEffDec) : 0;

  // Velocity evaluation according to TCVN 7957:2008
  let velocityStatus: 'ok' | 'low' | 'high' = 'ok';
  let velocityMsg = 'Vận tốc trong dải kinh tế tối ưu (0.8 – 1.8 m/s)';
  if (velocityMs < 0.7) {
    velocityStatus = 'low';
    velocityMsg = 'Vận tốc quá thấp (< 0.7 m/s) — Dễ bị lắng cặn bẩn trong đường ống!';
  } else if (velocityMs > 2.2) {
    velocityStatus = 'high';
    velocityMsg = 'Vận tốc quá cao (> 2.2 m/s) — Tổn thất cột áp lớn và nguy cơ búa nước!';
  }

  const handleCopySummary = () => {
    const text = `KẾT QUẢ TÍNH CHỌN BƠM:
- Ứng dụng: ${appType === 'raw' ? 'Bơm nước thải thô' : appType === 'sludge' ? 'Bơm bùn vi sinh/tuần hoàn' : appType === 'effluent' ? 'Bơm nước sau xử lý' : 'Tùy biến'}
- Lưu lượng thiết kế Q: ${formatNumber(flowM3H)} m³/h (${formatNumber(flowM3H / 3.6, 2)} L/s)
- Đường kính ống D: Ø${pipeDiameterMm} mm | Vận tốc v: ${formatNumber(velocityMs, 2)} m/s
- Chiều cao địa hình Hgeo: ${formatNumber(geoHeadM)} m
- Tổn thất áp lực (ma sát + cục bộ): ${formatNumber(frictionLossM + minorLossM, 2)} m
- Tổng cột áp bơm H: ${formatNumber(totalHeadM, 2)} m cột nước
- Công suất thủy lực: ${formatNumber(hydraulicPowerKw, 2)} kW
- Công suất trục bơm: ${formatNumber(shaftPowerKw, 2)} kW
- Công suất động cơ yêu cầu: ${formatNumber(motorPowerKw, 2)} kW
- Đề xuất động cơ tiêu chuẩn: ${suggestedMotorKw} kW (3 pha 380V, ~${formatNumber(fullLoadCurrentAmp, 1)} A)`;
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
              💧
            </span>
            <span>Tiện ích Tính chọn Bơm & Cột áp Đường ống</span>
          </h2>
          <p className="text-xs text-[#62776c] mt-0.5">
            Tính toán thủy lực Hazen-Williams, chọn đường kính ống kinh tế, tổng cột áp H và công suất động cơ điện
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
          {/* Preset Selection */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-4">
            <label className="block text-xs font-bold text-[#234333] uppercase tracking-wider">
              1. Chủng loại bơm & Ứng dụng
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleAppTypeChange('raw')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                  appType === 'raw'
                    ? 'bg-[#176b45] text-white border-[#176b45] shadow-sm'
                    : 'bg-[#f7faf8] text-[#334e40] border-[#d4e1d9] hover:bg-[#eef5f1]'
                }`}
              >
                Bơm hố thu
                <span className="block text-[10px] font-normal opacity-80">Nước thô</span>
              </button>
              <button
                type="button"
                onClick={() => handleAppTypeChange('sludge')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                  appType === 'sludge'
                    ? 'bg-[#176b45] text-white border-[#176b45] shadow-sm'
                    : 'bg-[#f7faf8] text-[#334e40] border-[#d4e1d9] hover:bg-[#eef5f1]'
                }`}
              >
                Bơm bùn
                <span className="block text-[10px] font-normal opacity-80">RAS / WAS</span>
              </button>
              <button
                type="button"
                onClick={() => handleAppTypeChange('effluent')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                  appType === 'effluent'
                    ? 'bg-[#176b45] text-white border-[#176b45] shadow-sm'
                    : 'bg-[#f7faf8] text-[#334e40] border-[#d4e1d9] hover:bg-[#eef5f1]'
                }`}
              >
                Bơm nước trong
                <span className="block text-[10px] font-normal opacity-80">Bể khử trùng</span>
              </button>
              <button
                type="button"
                onClick={() => handleAppTypeChange('custom')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                  appType === 'custom'
                    ? 'bg-[#176b45] text-white border-[#176b45] shadow-sm'
                    : 'bg-[#f7faf8] text-[#334e40] border-[#d4e1d9] hover:bg-[#eef5f1]'
                }`}
              >
                Tùy biến
                <span className="block text-[10px] font-normal opacity-80">Chỉnh tay</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Lưu lượng thiết kế Q (m³/h)
                </label>
                <NumericInput
                  step={0.5}
                  min={0.1}
                  value={flowM3H}
                  fallbackValue={10}
                  onChange={(val) => setFlowM3H(val ?? 10)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-sm text-[#183929] bg-white font-bold"
                />
                <span className="text-[10px] text-[#708477]">
                  Tương đương: {formatNumber(flowM3H / 3.6, 2)} L/giây
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Chiều cao hình học H<sub>geo</sub> (m)
                </label>
                <NumericInput
                  step={0.5}
                  min={0}
                  value={geoHeadM}
                  fallbackValue={5}
                  onChange={(val) => setGeoHeadM(val ?? 5)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-sm text-[#183929] bg-white font-bold"
                />
                <span className="text-[10px] text-[#708477]">Chênh lệch mực nước hút và điểm xả</span>
              </div>
            </div>
          </div>

          {/* Pipe & Losses */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-4">
            <label className="block text-xs font-bold text-[#234333] uppercase tracking-wider">
              2. Đường ống đẩy & Tổn thất thủy lực
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Đường kính ống D (mm)</label>
                <div className="flex gap-2">
                  <select
                    value={pipeDiameterMm}
                    onChange={(e) => setPipeDiameterMm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-bold text-[#183929] bg-white"
                  >
                    {[25, 32, 40, 50, 65, 80, 90, 100, 125, 150, 200, 250, 300].map((d) => (
                      <option key={d} value={d}>
                        Ø{d} mm (DN{d})
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-[#708477]">Quy cách ống tiêu chuẩn</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều dài ống đẩy L (m)</label>
                <NumericInput
                  step={5}
                  min={1}
                  value={pipeLengthM}
                  fallbackValue={50}
                  onChange={(val) => setPipeLengthM(val ?? 50)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Vật liệu ống (Hệ số C)</label>
                <select
                  value={pipeMaterialC}
                  onChange={(e) => setPipeMaterialC(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold text-[#183929] bg-white"
                >
                  <option value={150}>Nhựa uPVC / HDPE mới (C = 150)</option>
                  <option value={140}>Nhựa PVC chuẩn thiết kế (C = 140)</option>
                  <option value={130}>Ống Thép không gỉ Inox (C = 130)</option>
                  <option value={120}>Ống Gang dẻo DI (C = 120)</option>
                  <option value={100}>Ống Thép hàn cũ / gỉ (C = 100)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Tổn thất cục bộ van/co/tê (%)
                </label>
                <NumericInput
                  step={5}
                  min={5}
                  max={50}
                  value={minorLossPercent}
                  fallbackValue={20}
                  onChange={(val) => setMinorLossPercent(val ?? 20)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Thường lấy 15 – 25% tổn thất dọc đường</span>
              </div>
            </div>
          </div>

          {/* Efficiency & Motor */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-4">
            <label className="block text-xs font-bold text-[#234333] uppercase tracking-wider">
              3. Hiệu suất & Hệ số an toàn
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Hiệu suất bơm η (%)</label>
                <NumericInput
                  step={1}
                  min={30}
                  max={90}
                  value={pumpEfficiency}
                  fallbackValue={70}
                  onChange={(val) => setPumpEfficiency(val ?? 70)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white font-semibold"
                />
                <span className="text-[10px] text-[#708477]">60 – 75% cho bơm nước thải</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Hiệu suất motor (%)</label>
                <NumericInput
                  step={1}
                  min={70}
                  max={98}
                  value={motorEfficiency}
                  fallbackValue={90}
                  onChange={(val) => setMotorEfficiency(val ?? 90)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white font-semibold"
                />
                <span className="text-[10px] text-[#708477]">IE2/IE3: 88 – 93%</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Hệ số dự phòng k<sub>dt</sub></label>
                <NumericInput
                  step={0.05}
                  min={1.1}
                  max={1.5}
                  value={motorSafetyFactor}
                  fallbackValue={1.2}
                  onChange={(val) => setMotorSafetyFactor(val ?? 1.2)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 1.15 – 1.25</span>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-6 space-y-5">
          {/* Main Motor Badge Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#16603e] to-[#0f462c] text-white shadow-md space-y-4">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-200 block">
              Đề xuất công suất động cơ tiêu chuẩn
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {suggestedMotorKw}
              </span>
              <span className="text-2xl font-bold text-emerald-200">kW</span>
              <span className="text-sm font-semibold text-emerald-300 ml-2">
                (~{formatNumber(suggestedMotorKw * 1.341, 1)} HP)
              </span>
            </div>

            <div className="pt-3 border-t border-white/20 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-emerald-200 block text-[11px]">Tổng cột áp bơm H:</span>
                <span className="text-lg font-bold font-mono text-white">
                  {formatNumber(totalHeadM, 2)} m
                </span>
              </div>
              <div>
                <span className="text-emerald-200 block text-[11px]">Dòng điện định mức (380V):</span>
                <span className="text-lg font-bold font-mono text-white">
                  ~{formatNumber(fullLoadCurrentAmp, 1)} A
                </span>
              </div>
            </div>
          </div>

          {/* Velocity Inspection Card */}
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
              velocityStatus === 'ok'
                ? 'bg-[#f2faf5] border-[#b9dec8] text-[#1a5135]'
                : velocityStatus === 'low'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {velocityStatus === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 text-[#176b45]" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
            </div>
            <div className="space-y-0.5">
              <div className="font-bold flex items-center gap-2">
                <span>Vận tốc dòng chảy trong ống v = {formatNumber(velocityMs, 2)} m/s</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">{velocityMsg}</p>
            </div>
          </div>

          {/* Breakdown calculation table */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-[#1e3e2f] uppercase tracking-wider">
              Chi tiết thành phần cột áp & Công suất
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">1. Chiều cao hình học H<sub>geo</sub></span>
                <span className="font-mono font-bold text-[#183929]">{formatNumber(geoHeadM, 2)} m</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">2. Tổn thất ma sát dọc đường h<sub>f</sub></span>
                <span className="font-mono font-bold text-[#183929]">{formatNumber(frictionLossM, 2)} m</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">3. Tổn thất cục bộ van, co, tê h<sub>c</sub></span>
                <span className="font-mono font-bold text-[#183929]">{formatNumber(minorLossM, 2)} m</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">4. Cột áp an toàn dự phòng</span>
                <span className="font-mono font-bold text-[#183929]">{formatNumber(safetyHeadM, 2)} m</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#d8e6dd] bg-[#f7faf8] px-2 rounded-lg font-bold">
                <span className="text-[#176b45]">Tổng cột áp yêu cầu H</span>
                <span className="font-mono text-[#176b45] text-sm">{formatNumber(totalHeadM, 2)} m</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#edf3ef] pt-2">
                <span className="text-[#556c5e]">Công suất thủy lực dòng chảy N<sub>hyd</sub></span>
                <span className="font-mono font-bold text-[#183929]">{formatNumber(hydraulicPowerKw, 2)} kW</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Công suất trục bơm (η={pumpEfficiency}%)</span>
                <span className="font-mono font-bold text-[#183929]">{formatNumber(shaftPowerKw, 2)} kW</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Công suất động cơ tính toán (k<sub>dt</sub>={motorSafetyFactor})</span>
                <span className="font-mono font-bold text-[#183929]">{formatNumber(motorPowerKw, 2)} kW</span>
              </div>
            </div>
          </div>

          {/* Reference standards */}
          <div className="p-4 bg-[#fbfdfc] border border-[#d6e3db] rounded-2xl text-[11px] text-[#556c5e] space-y-1">
            <span className="font-bold text-[#18392b] block">Quy chuẩn áp dụng:</span>
            <p>• TCVN 7957:2008: Vận tốc nước thải áp lực trong ống tự làm sạch tối thiểu 0.7 m/s, dải kinh tế 0.8 – 1.8 m/s.</p>
            <p>• Công thức Hazen-Williams: Hệ số C = 140 cho ống nhựa uPVC/HDPE cấp thoát nước.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

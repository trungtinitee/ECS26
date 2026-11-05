import React, { useState } from 'react';
import { Copy, Check, Waves, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatNumber } from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface HydraulicCalculatorProps {
  initialQ?: number; // m3/h
}

export const HydraulicCalculator: React.FC<HydraulicCalculatorProps> = ({ initialQ = 10 }) => {
  const [activeSubTab, setActiveSubTab] = useState<'pipe' | 'channel' | 'weir'>('pipe');
  const [copied, setCopied] = useState(false);

  // --- 1. PIPE HYDRAULICS STATE ---
  const [pipeFlowM3H, setPipeFlowM3H] = useState<number>(initialQ > 0 ? initialQ : 10);
  const [pipeDiameterMm, setPipeDiameterMm] = useState<number>(80);
  const [pipeLengthM, setPipeLengthM] = useState<number>(100);
  const [pipeC, setPipeC] = useState<number>(140); // Hazen-Williams C

  // Pipe Calculations
  const pipeQM3S = Math.max(0, pipeFlowM3H) / 3600;
  const pipeDM = Math.max(10, pipeDiameterMm) / 1000;
  const pipeAreaM2 = (Math.PI * Math.pow(pipeDM, 2)) / 4;
  const pipeVelocityMs = pipeAreaM2 > 0 ? pipeQM3S / pipeAreaM2 : 0;
  const pipeHfM =
    pipeQM3S > 0 && pipeDM > 0
      ? (10.67 * pipeLengthM * Math.pow(pipeQM3S, 1.852)) /
        (Math.pow(pipeC, 1.852) * Math.pow(pipeDM, 4.87))
      : 0;
  const pipeSlopePerThousand = pipeLengthM > 0 ? (pipeHfM / pipeLengthM) * 1000 : 0;

  // --- 2. OPEN CHANNEL STATE (Manning) ---
  const [channelFlowM3H, setChannelFlowM3H] = useState<number>(initialQ > 0 ? initialQ : 20);
  const [channelWidthM, setChannelWidthM] = useState<number>(0.3); // Width B (m)
  const [channelDepthM, setChannelDepthM] = useState<number>(0.25); // Water depth h (m)
  const [channelSlopePerThousand, setChannelSlopePerThousand] = useState<number>(3.0); // Slope i (‰)
  const [manningN, setManningN] = useState<number>(0.013); // Smooth concrete

  // Channel Calculations
  const channelQM3S = Math.max(0, channelFlowM3H) / 3600;
  const channelAreaM2 = channelWidthM * channelDepthM;
  const wettedPerimeterM = channelWidthM + 2 * channelDepthM;
  const hydraulicRadiusM = wettedPerimeterM > 0 ? channelAreaM2 / wettedPerimeterM : 0;
  const slopeDecimal = Math.max(0.0001, channelSlopePerThousand / 1000);

  // Theoretical Manning flow capacity Q_cap = (1/n) * A * R^(2/3) * S^(1/2)
  const channelCapacityM3S =
    manningN > 0 && channelAreaM2 > 0
      ? (1 / manningN) * channelAreaM2 * Math.pow(hydraulicRadiusM, 2 / 3) * Math.sqrt(slopeDecimal)
      : 0;
  const channelCapacityM3H = channelCapacityM3S * 3600;
  const actualChannelVelocityMs = channelAreaM2 > 0 ? channelQM3S / channelAreaM2 : 0;
  const froudeNumber =
    channelDepthM > 0 && 9.81 * channelDepthM > 0
      ? actualChannelVelocityMs / Math.sqrt(9.81 * channelDepthM)
      : 0;

  // --- 3. THOMPSON WEIR (90° Triangular Notch) ---
  const [weirFlowM3H, setWeirFlowM3H] = useState<number>(initialQ > 0 ? initialQ : 10);
  const [targetNotchHeadCm, setTargetNotchHeadCm] = useState<number>(4.0); // Depth of water in V-notch (cm)
  const [notchPitchCm, setNotchPitchCm] = useState<number>(15); // Distance between notches (cm)

  // Thompson formula: Q_notch = 1.4 * H^(5/2) where H in meters, Q in m3/s
  const notchHeadM = Math.max(1, targetNotchHeadCm) / 100;
  const notchFlowM3S = 1.4 * Math.pow(notchHeadM, 2.5);
  const notchFlowM3H = notchFlowM3S * 3600;
  const notchFlowLS = notchFlowM3S * 1000;

  const numNotches = notchFlowM3H > 0 ? Math.ceil(weirFlowM3H / notchFlowM3H) : 1;
  const totalWeirLengthM = (numNotches * notchPitchCm) / 100;
  const weirOverflowRateM3MDay = totalWeirLengthM > 0 ? (weirFlowM3H * 24) / totalWeirLengthM : 0;

  const handleCopySummary = () => {
    let text = '';
    if (activeSubTab === 'pipe') {
      text = `THỦY LỰC ĐƯỜNG ỐNG DẪN:
- Lưu lượng Q: ${formatNumber(pipeFlowM3H)} m³/h (${formatNumber(pipeQM3S * 1000, 2)} L/s)
- Đường kính ống: Ø${pipeDiameterMm} mm (DN${pipeDiameterMm})
- Vận tốc dòng chảy: ${formatNumber(pipeVelocityMs, 2)} m/s
- Chiều dài ống: ${formatNumber(pipeLengthM)} m | Hệ số nhám C: ${pipeC}
- Tổn thất dọc đường: ${formatNumber(pipeHfM, 2)} m (${formatNumber(pipeSlopePerThousand, 2)} ‰)`;
    } else if (activeSubTab === 'channel') {
      text = `THỦY LỰC MƯƠNG DẪN HỞ (MANNING):
- Lưu lượng thiết kế Q: ${formatNumber(channelFlowM3H)} m³/h (${formatNumber(channelQM3S * 1000, 2)} L/s)
- Tiết diện mương: Rộng B = ${channelWidthM}m × Sâu nước h = ${channelDepthM}m
- Độ dốc đáy mương: ${channelSlopePerThousand} ‰ | Hệ số nhám n: ${manningN}
- Vận tốc thực tế: ${formatNumber(actualChannelVelocityMs, 2)} m/s (Số Froude Fr = ${formatNumber(froudeNumber, 2)})
- Khả năng tải tối đa: ${formatNumber(channelCapacityM3H, 1)} m³/h`;
    } else {
      text = `TÍNH MÁNG TRÀN RĂNG CƯA THOMPSON 90°:
- Lưu lượng tràn: ${formatNumber(weirFlowM3H)} m³/h (${formatNumber(weirFlowM3H * 24)} m³/ngày)
- Chiều cao mực nước ngập răng cưa: ${targetNotchHeadCm} cm
- Lưu lượng 1 răng cưa: ${formatNumber(notchFlowLS, 2)} L/s (${formatNumber(notchFlowM3H, 2)} m³/h·răng)
- Số răng cưa cần xẻ: ${numNotches} răng
- Chiều dài máng tràn tối thiểu: ${formatNumber(totalWeirLengthM, 2)} m (Bước răng ${notchPitchCm} cm)
- Tải trọng máng tràn: ${formatNumber(weirOverflowRateM3MDay, 1)} m³/(m·ngày) (TCVN ≤ 250)`;
    }
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
              🌊
            </span>
            <span>Tiện ích Tính toán Thủy lực Trạm Xử lý Nước thải</span>
          </h2>
          <p className="text-xs text-[#62776c] mt-0.5">
            Tính toán vận tốc & tổn thất áp lực đường ống, mương dẫn hở Manning và máng tràn răng cưa Thompson
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

      {/* 3 Sub-tabs */}
      <div className="flex border-b border-[#cbd8d0] gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('pipe')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'pipe'
              ? 'border-[#176b45] text-[#176b45]'
              : 'border-transparent text-[#5c7265] hover:text-[#183929]'
          }`}
        >
          1. Đường ống dẫn áp lực (Hazen-Williams)
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('channel')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'channel'
              ? 'border-[#176b45] text-[#176b45]'
              : 'border-transparent text-[#5c7265] hover:text-[#183929]'
          }`}
        >
          2. Mương hở tự chảy (Manning)
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('weir')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'weir'
              ? 'border-[#176b45] text-[#176b45]'
              : 'border-transparent text-[#5c7265] hover:text-[#183929]'
          }`}
        >
          3. Máng răng cưa Thompson (Weir)
        </button>
      </div>

      {/* --- TAB 1: PIPE --- */}
      {activeSubTab === 'pipe' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#1e3e2f] uppercase tracking-wider">
              Thông số đường ống
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Lưu lượng dòng chảy Q (m³/h)
                </label>
                <NumericInput
                  step={0.5}
                  min={0.1}
                  value={pipeFlowM3H}
                  fallbackValue={10}
                  onChange={(val) => setPipeFlowM3H(val ?? 10)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-sm font-bold"
                />
                <span className="text-[10px] text-[#708477]">
                  Tương đương: {formatNumber(pipeQM3S * 1000, 2)} L/s
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Đường kính trong ống D (mm)
                </label>
                <select
                  value={pipeDiameterMm}
                  onChange={(e) => setPipeDiameterMm(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs font-bold text-[#183929] bg-white"
                >
                  {[25, 32, 40, 50, 65, 80, 90, 100, 125, 150, 200, 250, 300, 400, 500].map((d) => (
                    <option key={d} value={d}>
                      Ø{d} mm (DN{d})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều dài tuyến ống L (m)</label>
                <NumericInput
                  step={10}
                  min={1}
                  value={pipeLengthM}
                  fallbackValue={100}
                  onChange={(val) => setPipeLengthM(val ?? 100)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Vật liệu ống (Hệ số C)</label>
                <select
                  value={pipeC}
                  onChange={(e) => setPipeC(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold bg-white"
                >
                  <option value={150}>Nhựa uPVC / HDPE (C = 150)</option>
                  <option value={140}>Nhựa chuẩn thiết kế (C = 140)</option>
                  <option value={130}>Ống Thép Inox (C = 130)</option>
                  <option value={120}>Ống Gang dẻo DI (C = 120)</option>
                  <option value={100}>Ống Thép cũ / Thép đen (C = 100)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#16603e] to-[#0f462c] text-white shadow-md space-y-3">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-200 block">
                Vận tốc dòng chảy trong ống v
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                  {formatNumber(pipeVelocityMs, 2)}
                </span>
                <span className="text-2xl font-bold text-emerald-200">m/s</span>
              </div>
              <p className="text-xs text-emerald-100">
                {pipeVelocityMs >= 0.8 && pipeVelocityMs <= 1.8
                  ? '✓ Vận tốc đạt chuẩn tự làm sạch và kinh tế theo TCVN 7957 (0.8 – 1.8 m/s)'
                  : pipeVelocityMs < 0.8
                  ? '⚠ Vận tốc thấp hơn 0.8 m/s: Cần giảm đường kính ống để tránh lắng bùn cặn!'
                  : '⚠ Vận tốc lớn hơn 1.8 m/s: Tổn thất cột áp tăng cao, cần tăng đường kính ống!'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-2 text-xs">
              <h4 className="font-bold text-[#18392b] uppercase text-[11px] pb-1 border-b">
                Kết quả tổn thất cột áp Hazen-Williams
              </h4>
              <div className="flex justify-between py-1 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Tổn thất ma sát dọc đường h<sub>f</sub>:</span>
                <strong className="font-mono text-[#183929]">{formatNumber(pipeHfM, 2)} m</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Độ dốc thủy lực i (‰):</span>
                <strong className="font-mono text-[#183929]">{formatNumber(pipeSlopePerThousand, 2)} ‰ ({formatNumber(pipeSlopePerThousand / 10, 3)} m/100m)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#556c5e]">Diện tích tiết diện ướt ống:</span>
                <strong className="font-mono text-[#183929]">{formatNumber(pipeAreaM2 * 10000, 1)} cm²</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: OPEN CHANNEL (MANNING) --- */}
      {activeSubTab === 'channel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#1e3e2f] uppercase tracking-wider">
              Kích thước mương & Độ dốc
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Lưu lượng thiết kế Q (m³/h)</label>
                <NumericInput
                  step={1}
                  min={0.1}
                  value={channelFlowM3H}
                  fallbackValue={20}
                  onChange={(val) => setChannelFlowM3H(val ?? 20)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-sm font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Độ dốc đáy mương i (‰)</label>
                <NumericInput
                  step={0.5}
                  min={0.5}
                  max={20}
                  value={channelSlopePerThousand}
                  fallbackValue={3.0}
                  onChange={(val) => setChannelSlopePerThousand(val ?? 3.0)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-sm font-bold"
                />
                <span className="text-[10px] text-[#708477]">Thường 2 – 5 ‰ (0.2 – 0.5%)</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Bề rộng mương B (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.1}
                  value={channelWidthM}
                  fallbackValue={0.3}
                  onChange={(val) => setChannelWidthM(val ?? 0.3)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu mực nước h (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.05}
                  value={channelDepthM}
                  fallbackValue={0.25}
                  onChange={(val) => setChannelDepthM(val ?? 0.25)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-[#234333]">Vật liệu mương (Hệ số nhám Manning n)</label>
                <select
                  value={manningN}
                  onChange={(e) => setManningN(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold bg-white"
                >
                  <option value={0.012}>Mương gạch tráng men / Composite láng (n = 0.012)</option>
                  <option value={0.013}>Mương bê tông láng mịn (n = 0.013)</option>
                  <option value={0.015}>Mương bê tông cốt thép thông thường (n = 0.015)</option>
                  <option value={0.017}>Mương xây gạch trát vữa thô (n = 0.017)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#125838] to-[#0d3f28] text-white shadow-md space-y-3">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-200 block">
                Vận tốc dòng chảy mương tự chảy
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                  {formatNumber(actualChannelVelocityMs, 2)}
                </span>
                <span className="text-2xl font-bold text-emerald-200">m/s</span>
              </div>
              <p className="text-xs text-emerald-100">
                {actualChannelVelocityMs >= 0.6 && actualChannelVelocityMs <= 1.2
                  ? '✓ Vận tốc đạt dải tối ưu cho mương dẫn nước thải (0.6 – 1.0 m/s)'
                  : actualChannelVelocityMs < 0.6
                  ? '⚠ Vận tốc < 0.6 m/s: Cặn lơ lửng và bùn cát có nguy cơ lắng đọng đáy mương!'
                  : '⚠ Vận tốc > 1.2 m/s: Dòng chảy cuộn xoáy gây xáo trộn và bắn tóe!'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-2 text-xs">
              <h4 className="font-bold text-[#18392b] uppercase text-[11px] pb-1 border-b">
                Kiểm tra thủy lực theo Manning
              </h4>
              <div className="flex justify-between py-1 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Khả năng tải tối đa của mương Q<sub>max</sub>:</span>
                <strong className="font-mono text-[#183929]">
                  {formatNumber(channelCapacityM3H, 1)} m³/h ({formatNumber(channelCapacityM3S * 1000, 1)} L/s)
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Bán kính thủy lực R:</span>
                <strong className="font-mono text-[#183929]">{formatNumber(hydraulicRadiusM, 3)} m</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Chu vi ướt P:</span>
                <strong className="font-mono text-[#183929]">{formatNumber(wettedPerimeterM, 2)} m</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#556c5e]">Trạng thái dòng chảy (Số Froude Fr):</span>
                <strong className={`font-mono font-bold ${froudeNumber < 1 ? 'text-[#176b45]' : 'text-amber-700'}`}>
                  Fr = {formatNumber(froudeNumber, 2)} ({froudeNumber < 1 ? 'Chảy êm / Subcritical' : 'Chảy xiết / Supercritical'})
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: WEIR --- */}
      {activeSubTab === 'weir' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#1e3e2f] uppercase tracking-wider">
              Thông số máng tràn răng cưa 90° (Thompson)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-[#234333]">
                  Lưu lượng nước tràn qua máng Q (m³/h)
                </label>
                <NumericInput
                  step={0.5}
                  min={0.1}
                  value={weirFlowM3H}
                  fallbackValue={10}
                  onChange={(val) => setWeirFlowM3H(val ?? 10)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-sm font-bold"
                />
                <span className="text-[10px] text-[#708477]">
                  Tương đương: {formatNumber(weirFlowM3H * 24)} m³/ngày
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Chiều cao nước tràn răng cưa H (cm)
                </label>
                <NumericInput
                  step={0.5}
                  min={1.5}
                  max={12}
                  value={targetNotchHeadCm}
                  fallbackValue={4.0}
                  onChange={(val) => setTargetNotchHeadCm(val ?? 4.0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Tối ưu: 3 – 6 cm để phân phối đều</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Khoảng cách giữa 2 răng cưa P (cm)
                </label>
                <NumericInput
                  step={1}
                  min={10}
                  max={30}
                  value={notchPitchCm}
                  fallbackValue={15}
                  onChange={(val) => setNotchPitchCm(val ?? 15)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Bước răng inox thường 15 – 20 cm</span>
              </div>
            </div>

            <div className="p-3 bg-[#f5faf7] border border-[#d2e6da] rounded-xl text-[11px] text-[#3c5446] space-y-1">
              <strong>Công thức Thompson (Góc 90°): </strong>
              <span>Q = 1.4 × H^(5/2) (m³/s với H đo bằng mét)</span>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#16603e] to-[#0f462c] text-white shadow-md space-y-3">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-200 block">
                Tổng số răng cưa tam giác cần thiết
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                  {numNotches}
                </span>
                <span className="text-2xl font-bold text-emerald-200">răng</span>
              </div>
              <p className="text-xs text-emerald-100">
                Lưu lượng qua 1 răng cưa: ~{formatNumber(notchFlowLS, 2)} L/s ({formatNumber(notchFlowM3H, 2)} m³/h·răng)
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-2 text-xs">
              <h4 className="font-bold text-[#18392b] uppercase text-[11px] pb-1 border-b">
                Kiểm tra chiều dài máng tràn máng lắng
              </h4>
              <div className="flex justify-between py-1 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Tổng chiều dài máng tràn tối thiểu L<sub>weir</sub>:</span>
                <strong className="font-mono text-sm text-[#176b45]">{formatNumber(totalWeirLengthM, 2)} m</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#edf3ef]">
                <span className="text-[#556c5e]">Tải trọng máng tràn tính toán q<sub>weir</sub>:</span>
                <strong className="font-mono text-[#183929]">
                  {formatNumber(weirOverflowRateM3MDay, 1)} m³/(m·ngày)
                </strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#556c5e]">Đánh giá theo TCVN 7957 (≤ 250 m³/m·d):</span>
                <strong className="font-mono text-[#176b45] font-bold">
                  {weirOverflowRateM3MDay <= 250 ? '✓ Đạt chuẩn thủy lực chống cuốn trôi bùn' : '⚠ Tải trọng quá cao, cần kéo dài máng tràn!'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

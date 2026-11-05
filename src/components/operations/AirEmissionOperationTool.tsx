import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Wind,
  Calculator,
  Copy,
  CheckCircle2,
  Activity,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { formatNumber, getDecimalDigits } from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

export type AirOperationToolType = 'scrubber' | 'baghouse';

interface AirEmissionOperationToolProps {
  onBack: () => void;
  initialTab?: AirOperationToolType;
}

export const AirEmissionOperationTool: React.FC<AirEmissionOperationToolProps> = ({
  onBack,
  initialTab = 'scrubber',
}) => {
  const precision = getDecimalDigits();
  const currentTool: AirOperationToolType = initialTab || 'scrubber';
  const [activeMode, setActiveMode] = useState<'calc' | 'result'>('calc');
  const [copied, setCopied] = useState(false);

  // Scrubber NaOH dosing inputs
  const [scrubberInputs, setScrubberInputs] = useState({
    gasFlowM3H: 10000, // m3/h
    so2InletMgM3: 800, // mg/m3
    hclInletMgM3: 150, // mg/m3
    targetRemovalEfficiency: 95, // %
    naohStockConcPercent: 32, // Xút 32%
    operatingHoursPerDay: 16,
  });

  // Baghouse filter monitoring
  const [baghouseInputs, setBaghouseInputs] = useState({
    inletDpMmH2O: 135, // mmH2O
    gasFlowM3H: 10000,
    airToClothRatioMMin: 1.2, // m/min
    filterBagCount: 120,
    bagDiameterMm: 130,
    bagLengthM: 3.0,
    pulseIntervalSeconds: 15,
    airPressureBar: 6.0,
  });

  // Calculations for Scrubber:
  // SO2: SO2 + 2 NaOH -> Na2SO3 + H2O (64g SO2 cần 80g NaOH = 1.25 kg NaOH/kg SO2)
  // HCl: HCl + NaOH -> NaCl + H2O (36.5g HCl cần 40g NaOH = 1.096 kg NaOH/kg HCl)
  const so2LoadKgH =
    (scrubberInputs.gasFlowM3H *
      scrubberInputs.so2InletMgM3 *
      (scrubberInputs.targetRemovalEfficiency / 100)) /
    1000000;
  const hclLoadKgH =
    (scrubberInputs.gasFlowM3H *
      scrubberInputs.hclInletMgM3 *
      (scrubberInputs.targetRemovalEfficiency / 100)) /
    1000000;

  const naohPureKgH = so2LoadKgH * 1.25 + hclLoadKgH * 1.096;
  const naohPureKgDay = naohPureKgH * scrubberInputs.operatingHoursPerDay;
  const naoh32KgDay = naohPureKgDay / (scrubberInputs.naohStockConcPercent / 100);
  const naoh32LitersDay = naoh32KgDay / 1.35; // Tỷ trọng xút 32% ~ 1.35 kg/L
  const naohPumpLh = naoh32LitersDay / scrubberInputs.operatingHoursPerDay;

  // Baghouse calculations
  const singleBagAreaM2 =
    Math.PI * (baghouseInputs.bagDiameterMm / 1000) * baghouseInputs.bagLengthM;
  const totalFiltrationAreaM2 = singleBagAreaM2 * baghouseInputs.filterBagCount;
  const actualFiltrationVelocityMMin =
    baghouseInputs.gasFlowM3H / 60 / (totalFiltrationAreaM2 || 1);

  let dpStatus: 'normal' | 'warning' | 'torn' = 'normal';
  let dpText = '';
  if (baghouseInputs.inletDpMmH2O < 50) {
    dpStatus = 'torn';
    dpText = 'Chênh áp quá thấp (< 50 mmH₂O): Nguy cơ rách hoặc hở túi vải lọc bụi!';
  } else if (baghouseInputs.inletDpMmH2O <= 150) {
    dpStatus = 'normal';
    dpText = 'Chênh áp trong dải tối ưu (80 - 150 mmH₂O): Túi vải thông thoáng, lớp bánh bụi hình thành tốt.';
  } else {
    dpStatus = 'warning';
    dpText = 'Chênh áp quá cao (> 150 mmH₂O): Túi lọc bị nghẹt bụi nghiêm trọng! Cần tăng tần suất giũ khí nén hoặc kiểm tra van rũ bụi.';
  }

  const toolMeta: Record<
    AirOperationToolType,
    { title: string; tag: string; desc: string; icon: any }
  > = {
    scrubber: {
      title: '1. Tháp Hấp Thụ Scrubber (Kiềm NaOH Khử SO₂, HCl)',
      tag: 'Scrubber / NaOH 32%',
      desc: 'Tính toán định lượng dung dịch xút NaOH 32% hấp thụ khí axit theo lưu lượng và nồng độ khí thải',
      icon: Wind,
    },
    baghouse: {
      title: '2. Giám Sát Chênh Áp & Giũ Bụi Túi Vải (Baghouse)',
      tag: 'ΔP mmH₂O / Khí nén',
      desc: 'Theo dõi độ sụt áp qua túi lọc bụi, cảnh báo nghẹt túi rách vải và kiểm soát chu kỳ giũ khí nén',
      icon: Activity,
    },
  };

  const meta = toolMeta[currentTool];
  const ToolIcon = meta.icon;

  const handleCopy = () => {
    let text = '';
    if (currentTool === 'scrubber') {
      text = `[VẬN HÀNH KHÍ THẢI: ĐỊNH LƯỢNG XÚT NAOH THÁP HẤP THỤ SCRUBBER]
• Lưu lượng khí Q: ${scrubberInputs.gasFlowM3H} m³/h | Hiệu suất khử: ${scrubberInputs.targetRemovalEfficiency}%
• Nồng độ đầu vào: SO2 (${scrubberInputs.so2InletMgM3} mg/m³), HCl (${scrubberInputs.hclInletMgM3} mg/m³)
• Tải lượng cần khử: SO2 (${formatNumber(so2LoadKgH, precision)} kg/h), HCl (${formatNumber(hclLoadKgH, precision)} kg/h)
• NaOH nguyên chất cần: ${formatNumber(naohPureKgDay, precision)} kg/ngày (${formatNumber(naohPureKgH, precision)} kg/h)
• Dung dịch NaOH 32% thương phẩm: ${formatNumber(naoh32KgDay, precision)} kg/ngày (~${formatNumber(naoh32LitersDay, precision)} Lít/ngày)
• Lưu lượng bơm định lượng xút: ${formatNumber(naohPumpLh, precision)} L/h (chạy ${scrubberInputs.operatingHoursPerDay}h/ngày)`;
    } else {
      text = `[VẬN HÀNH KHÍ THẢI: GIÁM SÁT CHÊNH ÁP TÚI VẢI LỌC BỤI BAGHOUSE]
• Lưu lượng khí xử lý: ${baghouseInputs.gasFlowM3H} m³/h
• Số lượng túi vải: ${baghouseInputs.filterBagCount} túi (Kích thước: D${baghouseInputs.bagDiameterMm} x L${baghouseInputs.bagLengthM}m)
• Tổng diện tích lọc: ${formatNumber(totalFiltrationAreaM2, precision)} m² | Tải lọc thực tế: ${formatNumber(actualFiltrationVelocityMMin, precision)} m/phút
• Độ sụt áp hiện tại ΔP: ${baghouseInputs.inletDpMmH2O} mmH₂O (${dpText})
• Chu kỳ giũ bụi khí nén: ${baghouseInputs.pulseIntervalSeconds} giây/lần | Áp suất khí nén: ${baghouseInputs.airPressureBar} bar`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3 border-b border-[#cfded4]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center justify-between sm:justify-start">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#cbd8d0] bg-white hover:bg-[#edf5f0] text-xs font-semibold text-[#193d2c] transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#176b45]" />
              <span>← Quay lại công cụ khí thải</span>
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs shrink-0">
              <ToolIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-base text-[#193d2c]">{meta.title}</h2>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  {meta.tag}
                </span>
              </div>
              <p className="text-xs text-[#63776d]">{meta.desc}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-[#176b45] hover:bg-[#125837] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Đã sao chép!' : 'Sao chép kết quả'}</span>
        </button>
      </div>

      {/* THANH CHUYỂN TÍNH TOÁN VÀ KẾT QUẢ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-[#f4f8f5] rounded-2xl border border-[#cfded4]">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 bg-[#e2ede6] p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveMode('calc')}
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'calc'
                ? 'bg-[#176b45] text-white shadow-xs'
                : 'text-[#385444] hover:bg-white/60'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Tính toán</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('result')}
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'result'
                ? 'bg-[#176b45] text-white shadow-xs'
                : 'text-[#385444] hover:bg-white/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kết quả</span>
          </button>
        </div>

        <div className="text-xs text-[#526b5d] font-medium px-2 text-center sm:text-left">
          {activeMode === 'calc'
            ? 'Nhập thông số vận hành thực tế & tải lượng khí ô nhiễm'
            : 'Xem kết quả định lượng hóa chất kiềm, chênh áp ΔP và cảnh báo an toàn'}
        </div>
      </div>

      {/* 1. SCRUBBER TÍNH TOÁN */}
      {currentTool === 'scrubber' && (
        <div className="animate-fadeIn">
          {activeMode === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
                <span>Thông số Khí Thải Đầu Vào & Nồng Độ Kiềm NaOH</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Lưu lượng khí thải Q (m³/h):</label>
                  <NumericInput
                    value={scrubberInputs.gasFlowM3H}
                    onChange={(val) => setScrubberInputs({ ...scrubberInputs, gasFlowM3H: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Nồng độ SO₂ đầu vào (mg/m³):</label>
                  <NumericInput
                    value={scrubberInputs.so2InletMgM3}
                    onChange={(val) => setScrubberInputs({ ...scrubberInputs, so2InletMgM3: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">QCVN 19: Cột B max 500 mg/m³</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Nồng độ HCl đầu vào (mg/m³):</label>
                  <NumericInput
                    value={scrubberInputs.hclInletMgM3}
                    onChange={(val) => setScrubberInputs({ ...scrubberInputs, hclInletMgM3: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">QCVN 19: Cột B max 50 mg/m³</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Hiệu suất hấp thụ mục tiêu (%):</label>
                  <NumericInput
                    value={scrubberInputs.targetRemovalEfficiency}
                    onChange={(val) => setScrubberInputs({ ...scrubberInputs, targetRemovalEfficiency: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Thường đạt 90 - 98%</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Nồng độ xút NaOH thương phẩm (%):</label>
                  <NumericInput
                    value={scrubberInputs.naohStockConcPercent}
                    onChange={(val) => setScrubberInputs({ ...scrubberInputs, naohStockConcPercent: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Xút lỏng công nghiệp 32% (tỷ trọng 1.35)</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Thời gian hoạt động (giờ/ngày):</label>
                  <NumericInput
                    value={scrubberInputs.operatingHoursPerDay}
                    onChange={(val) => setScrubberInputs({ ...scrubberInputs, operatingHoursPerDay: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Khối lượng Xút NaOH 32% cần châm:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-bold font-mono text-[#176b45]">
                      {formatNumber(naoh32KgDay, precision)} kg/ngày (~{formatNumber(naoh32LitersDay, precision)} Lít/ngày)
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">
                      Bơm châm: {formatNumber(naohPumpLh, precision)} L/h
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMode('result')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176b45] hover:bg-[#125837] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <span>Xem kết quả chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#183a2a]">
                  Bảng Kết Quả Định Lượng Xút Tháp Hấp Thụ Scrubber
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveMode('calc')}
                  className="text-xs font-semibold text-[#176b45] hover:underline cursor-pointer"
                >
                  ← Sửa đổi thông số tính toán
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Tải lượng SO₂ cần khử:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(so2LoadKgH, precision)} kg/h
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Tải lượng HCl cần khử:</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {formatNumber(hclLoadKgH, precision)} kg/h
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">NaOH nguyên chất cần:</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {formatNumber(naohPureKgDay, precision)} kg/ngày
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Bơm châm NaOH 32%:</span>
                  <span className="text-xl font-bold font-mono text-[#193d2c]">
                    {formatNumber(naohPumpLh, precision)} L/h
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Cơ sở phản ứng hóa học & Kiểm soát pH dung dịch tuần hoàn:</span>
                </div>
                <p className="leading-relaxed">
                  Phản ứng trung hòa diễn ra: SO₂ + 2NaOH → Na₂SO₃ + H₂O và HCl + NaOH → NaCl + H₂O. Để đảm bảo hiệu suất khử &gt; 95% và không làm phát thải mùi khí axit ra ngoài môi trường, dung dịch tuần hoàn ở đáy tháp cần duy trì pH tự động trong dải 7.5 - 8.5 bằng đầu đo pH điện cực nối điều khiển bơm xút.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. BAGHOUSE TÍNH TOÁN */}
      {currentTool === 'baghouse' && (
        <div className="animate-fadeIn">
          {activeMode === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
                <span>Thông số Giám Sát Chênh Áp & Giũ Khí Nén</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Chênh áp hiện tại ΔP (mmH₂O):</label>
                  <NumericInput
                    value={baghouseInputs.inletDpMmH2O}
                    onChange={(val) => setBaghouseInputs({ ...baghouseInputs, inletDpMmH2O: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Đo bằng đồng hồ chênh áp Magnehelic</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Lưu lượng khí qua lọc (m³/h):</label>
                  <NumericInput
                    value={baghouseInputs.gasFlowM3H}
                    onChange={(val) => setBaghouseInputs({ ...baghouseInputs, gasFlowM3H: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Số lượng túi lọc bụi:</label>
                  <NumericInput
                    value={baghouseInputs.filterBagCount}
                    onChange={(val) => setBaghouseInputs({ ...baghouseInputs, filterBagCount: Math.round(val) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Đường kính túi (mm):</label>
                  <NumericInput
                    value={baghouseInputs.bagDiameterMm}
                    onChange={(val) => setBaghouseInputs({ ...baghouseInputs, bagDiameterMm: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Chuẩn thông dụng 130 - 160 mm</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Chiều dài túi (m):</label>
                  <NumericInput
                    value={baghouseInputs.bagLengthM}
                    onChange={(val) => setBaghouseInputs({ ...baghouseInputs, bagLengthM: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Chu kỳ giũ khí nén (giây):</label>
                  <NumericInput
                    value={baghouseInputs.pulseIntervalSeconds}
                    onChange={(val) => setBaghouseInputs({ ...baghouseInputs, pulseIntervalSeconds: Math.round(val) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Cài đặt timer bộ điều khiển PLC</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Áp suất bình khí nén (bar):</label>
                  <NumericInput
                    value={baghouseInputs.airPressureBar}
                    onChange={(val) => setBaghouseInputs({ ...baghouseInputs, airPressureBar: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Tiêu chuẩn: 5.0 - 7.0 bar</span>
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Trạng thái chênh áp qua túi lọc:</span>
                  <div className="flex items-baseline gap-3">
                    <span
                      className={`text-xl font-bold font-mono ${
                        dpStatus === 'warning'
                          ? 'text-red-700'
                          : dpStatus === 'torn'
                          ? 'text-amber-700'
                          : 'text-[#176b45]'
                      }`}
                    >
                      ΔP = {baghouseInputs.inletDpMmH2O} mmH₂O
                    </span>
                    <span className="text-xs font-semibold text-[#526b5d]">{dpText}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMode('result')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176b45] hover:bg-[#125837] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <span>Xem kết quả chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#183a2a]">
                  Bảng Kết Quả & Đánh Giá Tải Lọc Bụi Túi Vải
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveMode('calc')}
                  className="text-xs font-semibold text-[#176b45] hover:underline cursor-pointer"
                >
                  ← Sửa đổi thông số tính toán
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Tổng diện tích bề mặt lọc:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(totalFiltrationAreaM2, precision)} m²
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Vận tốc lọc khí (A/C ratio):</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {formatNumber(actualFiltrationVelocityMMin, precision)} m/phút
                  </span>
                  <span className="text-[10px] text-[#63776d] block">Tiêu chuẩn: 1.0 - 1.5 m/phút</span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Độ sụt áp thực tế:</span>
                  <span
                    className={`text-xl font-bold font-mono ${
                      dpStatus === 'warning'
                        ? 'text-red-700'
                        : dpStatus === 'torn'
                        ? 'text-amber-700'
                        : 'text-[#176b45]'
                    }`}
                  >
                    {baghouseInputs.inletDpMmH2O} mmH₂O
                  </span>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  dpStatus === 'warning'
                    ? 'bg-red-50/80 border-red-200 text-red-950'
                    : dpStatus === 'torn'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {dpStatus === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  )}
                  <span>Khuyến nghị vận hành & Bảo dưỡng hệ thống lọc túi:</span>
                </div>
                <p className="leading-relaxed">
                  {dpStatus === 'warning'
                    ? 'Độ sụt áp vượt 150 mmH₂O làm tăng tổn thất áp suất, quạt hút bị giảm lưu lượng và động cơ tiêu thụ điện lớn. Cần giảm thời gian ngắt giữa các lần giũ xuống 10 - 12 giây, đồng thời kiểm tra xả nước đọng ở bình tích khí nén để tránh làm ẩm bết dính bề mặt vải lọc.'
                    : dpStatus === 'torn'
                    ? 'Cảnh báo: Áp suất quá thấp chứng tỏ có túi vải bị rách thủng hoặc tuột cổ ngàm venturi khiến bụi lọt thẳng qua ống khói. Cần tiến hành soi đèn kiểm tra buồng khí sạch để thay thế túi lọc bị hỏng ngay lập tức.'
                    : 'Hệ thống vận hành lý tưởng. Lớp màng bụi (dust cake) tự nhiên được duy trì ổn định giúp bắt giữ các hạt bụi mịn PM2.5 và PM10 đạt hiệu suất > 99.5% theo QCVN 19:2009/BTNMT.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

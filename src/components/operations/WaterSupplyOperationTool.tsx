import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Droplets,
  Calculator,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { formatNumber, getDecimalDigits } from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

export type WaterOperationToolType = 'pac' | 'chlorine' | 'filterWash';

interface WaterSupplyOperationToolProps {
  onBack: () => void;
  initialTab?: WaterOperationToolType;
}

export const WaterSupplyOperationTool: React.FC<WaterSupplyOperationToolProps> = ({
  onBack,
  initialTab = 'pac',
}) => {
  const precision = getDecimalDigits();
  const currentTool: WaterOperationToolType = initialTab || 'pac';
  const [activeMode, setActiveMode] = useState<'calc' | 'result'>('calc');
  const [copied, setCopied] = useState(false);

  // PAC Inputs
  const [pacInputs, setPacInputs] = useState({
    flowM3Day: 500,
    rawTurbidityNtu: 80,
    targetTurbidityNtu: 2,
    pacDosePpm: 25, // mg PAC/L
    pacStockConcPercent: 10, // PAC 10%
    dosingHoursPerDay: 24,
  });

  // Chlorine Inputs
  const [chlorineInputs, setChlorineInputs] = useState({
    flowM3Day: 500,
    chlorineDosePpm: 2.0, // mg Cl2/L
    targetResidualPpm: 0.5, // mg/L
    naoclStockConcPercent: 10, // Javel 10%
    dosingHoursPerDay: 24,
  });

  // Filter wash inputs
  const [filterInputs, setFilterInputs] = useState({
    filterAreaM2: 20,
    washIntensityLsM2: 14, // L/s.m2
    washDurationMinutes: 8,
    washesPerDay: 1,
  });

  // PAC Calculations
  const pacPureKg = (pacInputs.flowM3Day * pacInputs.pacDosePpm) / 1000;
  const pacCommercialKg = pacPureKg / (pacInputs.pacStockConcPercent / 100);
  const pacPumpLh = (pacCommercialKg / 1.1) / pacInputs.dosingHoursPerDay;

  // Chlorine Calculations
  const clPureKg = (chlorineInputs.flowM3Day * chlorineInputs.chlorineDosePpm) / 1000;
  const clCommercialLiters = (clPureKg / (chlorineInputs.naoclStockConcPercent / 100)) / 1.15;
  const clPumpLh = clCommercialLiters / chlorineInputs.dosingHoursPerDay;

  // Filter Wash Calculations
  const washFlowLs = filterInputs.filterAreaM2 * filterInputs.washIntensityLsM2;
  const washFlowM3H = (washFlowLs * 3600) / 1000;
  const washWaterVolumeM3PerWash = (washFlowM3H * filterInputs.washDurationMinutes) / 60;
  const washWaterDailyM3 = washWaterVolumeM3PerWash * filterInputs.washesPerDay;

  const toolMeta: Record<
    WaterOperationToolType,
    { title: string; tag: string; desc: string; icon: any }
  > = {
    pac: {
      title: '1. Châm Phèn Keo Tụ PAC',
      tag: 'PAC 10% / Độ đục NTU',
      desc: 'Tính toán định lượng phèn keo tụ PAC 10% theo độ đục nước thô và lưu lượng trạm cấp',
      icon: Droplets,
    },
    chlorine: {
      title: '2. Khử Trùng Clo Nước Sạch',
      tag: 'Javel 10% / QCVN 01-1:2018',
      desc: 'Kiểm soát liều lượng Clo hoạt tính nguyên chất và thể tích dung dịch Javel 10% thương phẩm',
      icon: Droplets,
    },
    filterWash: {
      title: '3. Thủy Lực Rửa Ngược Bể Lọc Cát',
      tag: '12 - 16 L/s·m²',
      desc: 'Tính toán cường độ rửa nước, lưu lượng bơm rửa lọc và lượng nước sạch tiêu hao',
      icon: Filter,
    },
  };

  const meta = toolMeta[currentTool];
  const ToolIcon = meta.icon;

  const handleCopy = () => {
    let text = '';
    if (currentTool === 'pac') {
      text = `[VẬN HÀNH NƯỚC CẤP: CHÂM PHÈN PAC]
• Lưu lượng Q: ${pacInputs.flowM3Day} m³/ngày | Độ đục thô: ${pacInputs.rawTurbidityNtu} NTU -> Mục tiêu: ${pacInputs.targetTurbidityNtu} NTU
• Liều lượng PAC: ${pacInputs.pacDosePpm} mg/L
• Khối lượng PAC nguyên chất: ${formatNumber(pacPureKg, precision)} kg/ngày
• Khối lượng PAC thương phẩm (10%): ${formatNumber(pacCommercialKg, precision)} kg/ngày
• Lưu lượng bơm định lượng: ${formatNumber(pacPumpLh, precision)} L/h (chạy ${pacInputs.dosingHoursPerDay}h/ngày)`;
    } else if (currentTool === 'chlorine') {
      text = `[VẬN HÀNH NƯỚC CẤP: KHỬ TRÙNG CLO NƯỚC SẠCH]
• Lưu lượng Q: ${chlorineInputs.flowM3Day} m³/ngày | Liều châm Clo: ${chlorineInputs.chlorineDosePpm} mg/L | Clo dư mục tiêu: ${chlorineInputs.targetResidualPpm} mg/L
• Clo hoạt tính nguyên chất: ${formatNumber(clPureKg, precision)} kg Cl2/ngày
• Thể tích Javel (10%): ${formatNumber(clCommercialLiters, precision)} Lít/ngày
• Lưu lượng bơm châm: ${formatNumber(clPumpLh, precision)} L/h (chạy ${chlorineInputs.dosingHoursPerDay}h/ngày)`;
    } else {
      text = `[VẬN HÀNH NƯỚC CẤP: RỬA LỌC NHANH CÁT THẠCH ANH]
• Diện tích bể lọc: ${filterInputs.filterAreaM2} m² | Cường độ rửa: ${filterInputs.washIntensityLsM2} L/s·m²
• Lưu lượng bơm rửa lọc: ${formatNumber(washFlowM3H, precision)} m³/h (${formatNumber(washFlowLs, precision)} L/s)
• Thời gian rửa 1 chu kỳ: ${filterInputs.washDurationMinutes} phút
• Nước tiêu hao 1 lần rửa: ${formatNumber(washWaterVolumeM3PerWash, precision)} m³
• Tổng nước rửa tiêu hao/ngày: ${formatNumber(washWaterDailyM3, precision)} m³/ngày`;
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
              <span>← Quay lại công cụ nước cấp</span>
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs shrink-0">
              <ToolIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-base text-[#193d2c]">{meta.title}</h2>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
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
            ? 'Nhập thông số vận hành thực tế & nồng độ hóa chất trạm nước cấp'
            : 'Xem kết quả định lượng, lưu lượng bơm châm và kiểm tra tiêu chuẩn QCVN'}
        </div>
      </div>

      {/* 1. CHÂM PHÈN PAC */}
      {currentTool === 'pac' && (
        <div className="animate-fadeIn">
          {activeMode === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
                <span>Thông số đầu vào & Chế độ châm phèn PAC</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Lưu lượng cấp Q (m³/ngày):</label>
                  <NumericInput
                    value={pacInputs.flowM3Day}
                    onChange={(val) => setPacInputs({ ...pacInputs, flowM3Day: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Độ đục nước thô (NTU):</label>
                  <NumericInput
                    value={pacInputs.rawTurbidityNtu}
                    onChange={(val) => setPacInputs({ ...pacInputs, rawTurbidityNtu: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Nước mặt thông thường 50 - 200 NTU</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Độ đục mục tiêu sau lắng (NTU):</label>
                  <NumericInput
                    value={pacInputs.targetTurbidityNtu}
                    onChange={(val) => setPacInputs({ ...pacInputs, targetTurbidityNtu: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Chuẩn sau lắng &lt; 2 NTU</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Liều lượng phèn PAC (mg/L):</label>
                  <NumericInput
                    value={pacInputs.pacDosePpm}
                    onChange={(val) => setPacInputs({ ...pacInputs, pacDosePpm: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Kinh nghiệm: 15 - 35 mg/L theo Jar-test</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Nồng độ bồn pha PAC (%):</label>
                  <NumericInput
                    value={pacInputs.pacStockConcPercent}
                    onChange={(val) => setPacInputs({ ...pacInputs, pacStockConcPercent: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Thường pha 5 - 10%</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Thời gian châm (giờ/ngày):</label>
                  <NumericInput
                    value={pacInputs.dosingHoursPerDay}
                    onChange={(val) => setPacInputs({ ...pacInputs, dosingHoursPerDay: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Khối lượng PAC cần châm:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-bold font-mono text-[#176b45]">
                      {formatNumber(pacCommercialKg, precision)} kg PAC 10%/ngày
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">
                      Bơm châm: {formatNumber(pacPumpLh, precision)} L/h
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
                  Bảng Kết Quả Định Lượng Phèn PAC Thương Phẩm
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
                  <span className="text-[#5b7264] block">Lượng PAC nguyên chất:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(pacPureKg, precision)} kg/ngày
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Khối lượng PAC thương phẩm ({pacInputs.pacStockConcPercent}%):</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {formatNumber(pacCommercialKg, precision)} kg/ngày
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Lưu lượng bơm định lượng:</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {formatNumber(pacPumpLh, precision)} L/h
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Hướng dẫn vận hành keo tụ tạo bông:</span>
                </div>
                <p className="leading-relaxed">
                  Khi độ đục nước thô thay đổi đột ngột sau mưa bão (&gt; 150 NTU), cần tăng liều lượng PAC lên 30 - 45 mg/L và theo dõi kích thước bông cặn tại bể phản ứng. Đảm bảo khuấy nhanh 1 - 2 phút ở bể trộn (G &gt; 500 s⁻¹) để phân tán đồng đều phèn trước khi vào bể tạo bông.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. KHỬ TRÙNG CLO */}
      {currentTool === 'chlorine' && (
        <div className="animate-fadeIn">
          {activeMode === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
                <span>Thông số đầu vào Khử trùng Clo Nước Sạch</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Lưu lượng cấp Q (m³/ngày):</label>
                  <NumericInput
                    value={chlorineInputs.flowM3Day}
                    onChange={(val) => setChlorineInputs({ ...chlorineInputs, flowM3Day: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Liều châm Clo hoạt tính (mg/L):</label>
                  <NumericInput
                    value={chlorineInputs.chlorineDosePpm}
                    onChange={(val) => setChlorineInputs({ ...chlorineInputs, chlorineDosePpm: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">TCVN: 1.5 - 3.0 mg Cl₂/L</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Clo dư mục tiêu cuối mạng lưới (mg/L):</label>
                  <NumericInput
                    value={chlorineInputs.targetResidualPpm}
                    onChange={(val) => setChlorineInputs({ ...chlorineInputs, targetResidualPpm: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">QCVN 01-1:2018/BYT: 0.2 - 1.0 mg/L</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Nồng độ Javel thương phẩm (%):</label>
                  <NumericInput
                    value={chlorineInputs.naoclStockConcPercent}
                    onChange={(val) => setChlorineInputs({ ...chlorineInputs, naoclStockConcPercent: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Nước Javel công nghiệp ~ 10 - 12%</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Thời gian châm (giờ/ngày):</label>
                  <NumericInput
                    value={chlorineInputs.dosingHoursPerDay}
                    onChange={(val) => setChlorineInputs({ ...chlorineInputs, dosingHoursPerDay: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Lượng Javel tiêu hao ngày:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-bold font-mono text-[#176b45]">
                      {formatNumber(clCommercialLiters, precision)} Lít Javel 10%/ngày
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">
                      Bơm châm: {formatNumber(clPumpLh, precision)} L/h
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
                  Bảng Kết Quả Định Lượng Clo Khử Trùng
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
                  <span className="text-[#5b7264] block">Clo hoạt tính nguyên chất:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(clPureKg, precision)} kg Cl₂/ngày
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Thể tích dung dịch Javel 10%:</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {formatNumber(clCommercialLiters, precision)} Lít/ngày
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Lưu lượng bơm định lượng Clo:</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {formatNumber(clPumpLh, precision)} L/h
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Quy chuẩn chất lượng nước sinh hoạt QCVN 01-1:2018/BYT:</span>
                </div>
                <p className="leading-relaxed">
                  Hàm lượng Clo dư tự do trong nước ăn uống sinh hoạt tại vòi sử dụng phải duy trì trong khoảng 0.2 - 1.0 mg/L để ngăn ngừa sự tái nhiễm vi sinh vật trong đường ống mạng lưới phân phối. Thời gian tiếp xúc giữa Clo và nước trong bể chứa nước sạch trước khi bơm cấp tối thiểu là 30 phút.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. RỬA NGƯỢC BỂ LỌC CÁT */}
      {currentTool === 'filterWash' && (
        <div className="animate-fadeIn">
          {activeMode === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
                <span>Thông số Thủy lực Rửa Ngược Bể Lọc Cát</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Diện tích 1 ngăn lọc (m²):</label>
                  <NumericInput
                    value={filterInputs.filterAreaM2}
                    onChange={(val) => setFilterInputs({ ...filterInputs, filterAreaM2: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Cường độ rửa nước (L/s·m²):</label>
                  <NumericInput
                    value={filterInputs.washIntensityLsM2}
                    onChange={(val) => setFilterInputs({ ...filterInputs, washIntensityLsM2: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">TCVN 33:2006: 12 - 16 L/s·m²</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Thời gian rửa (phút):</label>
                  <NumericInput
                    value={filterInputs.washDurationMinutes}
                    onChange={(val) => setFilterInputs({ ...filterInputs, washDurationMinutes: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Thường 6 - 10 phút</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Số lần rửa / ngày:</label>
                  <NumericInput
                    value={filterInputs.washesPerDay}
                    onChange={(val) => setFilterInputs({ ...filterInputs, washesPerDay: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Chu kỳ lọc 24 - 48h</span>
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Bơm rửa lọc & Tiêu hao nước:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-bold font-mono text-[#176b45]">
                      Q_bơm = {formatNumber(washFlowM3H, precision)} m³/h
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">
                      Nước rửa: {formatNumber(washWaterVolumeM3PerWash, precision)} m³/lần ({formatNumber(washWaterDailyM3, precision)} m³/ngày)
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
                  Bảng Kết Quả Thủy Lực Rửa Bể Lọc Nhanh
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
                  <span className="text-[#5b7264] block">Lưu lượng rửa (L/s):</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(washFlowLs, precision)} L/s
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Công suất bơm rửa lọc:</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {formatNumber(washFlowM3H, precision)} m³/h
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Lượng nước 1 lần rửa:</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {formatNumber(washWaterVolumeM3PerWash, precision)} m³
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Tổng nước rửa ngày:</span>
                  <span className="text-xl font-bold font-mono text-[#193d2c]">
                    {formatNumber(washWaterDailyM3, precision)} m³/ngày
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Quy trình kỹ thuật rửa bể lọc trọng lực:</span>
                </div>
                <p className="leading-relaxed">
                  Áp lực bơm rửa lọc thường từ 8 - 12 m cột nước. Trước khi rửa bằng nước, nên tiến hành sục khí nén cường độ 15 - 20 L/s·m² trong 2 - 3 phút để làm tơi lớp cát thạch anh và tách lớp bùn kết dính, sau đó mới bật bơm nước rửa ngược nhằm tiết kiệm nước sạch và tăng hiệu quả rửa sạch màng lọc.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  Calculator,
  Copy,
  CheckCircle2,
  FileText,
  Leaf,
  Droplets,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { formatNumber, getDecimalDigits } from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

export type SolidWasteOperationToolType = 'compost' | 'moisture';

interface SolidWasteOperationToolProps {
  onBack: () => void;
  initialTab?: string;
}

export const SolidWasteOperationTool: React.FC<SolidWasteOperationToolProps> = ({
  onBack,
  initialTab = 'compost',
}) => {
  const precision = getDecimalDigits();
  const currentTool: SolidWasteOperationToolType =
    initialTab === 'moisture' ? 'moisture' : 'compost';
  const [activeMode, setActiveMode] = useState<'calc' | 'result'>('calc');
  const [copied, setCopied] = useState(false);

  // Compost C/N blending inputs
  const [compost, setCompost] = useState({
    organicWasteTonsDay: 10, // tấn/ngày
    organicMoisturePercent: 75, // % độ ẩm rác hữu cơ
    organicCarbonPercent: 42, // % C tính theo chất khô
    organicNitrogenPercent: 2.2, // % N tính theo chất khô (C/N ~ 19)
    targetCnRatio: 28, // Tỷ lệ C/N tối ưu 25-30
    bulkingType: 'sawdust', // mùn cưa, rơm rạ, trấu
    bulkingCarbonPercent: 50, // Mùn cưa/tro trấu: C ~ 50%
    bulkingNitrogenPercent: 0.5, // N ~ 0.5% (C/N ~ 100)
    bulkingMoisturePercent: 12, // Khô ~ 12%
  });

  // Moisture adjustment inputs
  const [moistureInputs, setMoistureInputs] = useState({
    batchWeightTons: 15, // Khối lượng đống ủ (tấn)
    currentMoisturePercent: 40, // Độ ẩm đo thực tế (%)
    targetMoisturePercent: 55, // Độ ẩm mục tiêu tối ưu (%)
  });

  // Dry mass calculations for C/N
  const organicDryTons = compost.organicWasteTonsDay * (1 - compost.organicMoisturePercent / 100);
  const organicCKg = organicDryTons * 1000 * (compost.organicCarbonPercent / 100);
  const organicNKg = organicDryTons * 1000 * (compost.organicNitrogenPercent / 100);
  const currentCn = organicNKg > 0 ? organicCKg / organicNKg : 0;

  // Cần thêm mùn cưa (M_b kg chất khô) sao cho: (C_org + M_b * C_b) / (N_org + M_b * N_b) = targetCN
  const numerator = compost.targetCnRatio * organicNKg - organicCKg;
  const denominator =
    compost.bulkingCarbonPercent / 100 - compost.targetCnRatio * (compost.bulkingNitrogenPercent / 100);
  const bulkingDryKgNeeded = denominator > 0 ? Math.max(0, numerator / denominator) : 0;
  const bulkingWetKgNeeded = bulkingDryKgNeeded / (1 - compost.bulkingMoisturePercent / 100);
  const bulkingWetTonsNeeded = bulkingWetKgNeeded / 1000;

  // Resulting blended moisture
  const totalWetTons = compost.organicWasteTonsDay + bulkingWetTonsNeeded;
  const totalWaterTons =
    compost.organicWasteTonsDay * (compost.organicMoisturePercent / 100) +
    bulkingWetTonsNeeded * (compost.bulkingMoisturePercent / 100);
  const blendedMoisture = totalWetTons > 0 ? (totalWaterTons / totalWetTons) * 100 : 0;

  // Moisture calculations for tool 2
  // M_water_add = W_current * (target - current) / (100 - target)
  const currentWaterWeightTons =
    moistureInputs.batchWeightTons * (moistureInputs.currentMoisturePercent / 100);
  const drySolidWeightTons = moistureInputs.batchWeightTons - currentWaterWeightTons;
  const waterDifferenceTons =
    moistureInputs.currentMoisturePercent < moistureInputs.targetMoisturePercent
      ? (drySolidWeightTons / (1 - moistureInputs.targetMoisturePercent / 100)) -
        moistureInputs.batchWeightTons
      : 0;
  const waterToAddLiters = Math.max(0, waterDifferenceTons * 1000);

  // If too wet, dry bulking needed to drop moisture down to target
  // (W_water) / (W_total + W_dry) = target/100  =>  W_dry = (W_water - target/100 * W_total) / (target/100)
  const dryBulkingToDryOutTons =
    moistureInputs.currentMoisturePercent > moistureInputs.targetMoisturePercent
      ? (currentWaterWeightTons -
          (moistureInputs.targetMoisturePercent / 100) * moistureInputs.batchWeightTons) /
        (moistureInputs.targetMoisturePercent / 100)
      : 0;

  const toolMeta: Record<
    SolidWasteOperationToolType,
    { title: string; tag: string; desc: string; icon: any }
  > = {
    compost: {
      title: '1. Phối Trộn Tỷ Lệ C/N Ủ Phân Compost',
      tag: 'C/N = 25 - 30:1',
      desc: 'Cân bằng tỷ lệ C/N tối ưu cho đống ủ rác hữu cơ sinh hoạt kết hợp chất độn phụ gia giàu Carbon',
      icon: Leaf,
    },
    moisture: {
      title: '2. Cân Bằng & Điều Chỉnh Độ Ẩm Cơ Chất Đống Ủ',
      tag: 'Độ ẩm 50 - 60%',
      desc: 'Kiểm soát và tính toán lượng nước tưới bổ sung hoặc lượng phụ gia khô để đưa độ ẩm về dải vi sinh phân giải tối đa',
      icon: Droplets,
    },
  };

  const meta = toolMeta[currentTool];
  const ToolIcon = meta.icon;

  const handleCopy = () => {
    let text = '';
    if (currentTool === 'compost') {
      text = `[VẬN HÀNH Ủ PHÂN COMPOST CHẤT THẢI RẮN - PHỐI TRỘN C/N]
• Khối lượng rác hữu cơ tiếp nhận: ${compost.organicWasteTonsDay} tấn/ngày (Độ ẩm: ${compost.organicMoisturePercent}%)
• Tỷ lệ C/N ban đầu của rác: ${formatNumber(currentCn, precision)} (Mục tiêu khuyến nghị: ${compost.targetCnRatio}:1)
• Khối lượng phụ gia độn cần phối trộn: ${formatNumber(bulkingWetTonsNeeded, precision)} tấn/ngày (~${formatNumber(bulkingWetKgNeeded, precision)} kg/ngày)
• Tổng khối lượng hỗn hợp sau phối trộn: ${formatNumber(totalWetTons, precision)} tấn/ngày
• Độ ẩm hỗn hợp sau phối trộn: ${formatNumber(blendedMoisture, precision)}% (Chuẩn vi sinh tối ưu: 50 - 60%)`;
    } else {
      text = `[VẬN HÀNH CHẤT THẢI RẮN: CÂN BẰNG ĐỘ ẨM CƠ CHẤT ĐỐNG Ủ COMPOST]
• Khối lượng đống ủ: ${moistureInputs.batchWeightTons} tấn | Độ ẩm hiện tại: ${moistureInputs.currentMoisturePercent}%
• Độ ẩm mục tiêu: ${moistureInputs.targetMoisturePercent}% (Dải khuyến nghị: 50 - 60%)
${
  moistureInputs.currentMoisturePercent < moistureInputs.targetMoisturePercent
    ? `• Đánh giá: Đống ủ bị thiếu ẩm. Cần bổ sung phun tưới: ${formatNumber(waterDifferenceTons, precision)} m³ nước (${formatNumber(waterToAddLiters, precision)} Lít)`
    : moistureInputs.currentMoisturePercent > 65
    ? `• Đánh giá: Đống ủ quá ướt (> 65%), có nguy cơ yếm khí sinh mùi hôi. Cần đảo luống và bổ sung: ${formatNumber(dryBulkingToDryOutTons, precision)} tấn chất độn khô`
    : `• Đánh giá: Độ ẩm đạt yêu cầu tiêu chuẩn, duy trì chế độ sục khí bình thường`
}`;
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
              <span>← Quay lại công cụ chất thải rắn</span>
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-xs shrink-0">
              <ToolIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-base text-[#193d2c]">{meta.title}</h2>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
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
            ? 'Nhập thành phần rác hữu cơ, độ ẩm & chỉ tiêu phối trộn ủ vi sinh'
            : 'Xem lượng phụ gia cần trộn, độ ẩm sau hòa hợp và hướng dẫn TCVN 6696'}
        </div>
      </div>

      {/* 1. TÍNH PHỐI TRỘN C/N */}
      {currentTool === 'compost' && (
        <div className="animate-fadeIn">
          {activeMode === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
                <span>Thành Phần Rác Hữu Cơ & Thông Số Phụ Gia Phối Trộn</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Rác hữu cơ vào ủ (tấn/ngày):</label>
                    <NumericInput
                      step={0.5}
                      min={0}
                      value={compost.organicWasteTonsDay}
                      fallbackValue={0}
                      onChange={(val) => setCompost({ ...compost, organicWasteTonsDay: val ?? 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Độ ẩm rác hữu cơ (%):</label>
                    <NumericInput
                      step={1}
                      min={0}
                      max={100}
                      value={compost.organicMoisturePercent}
                      fallbackValue={0}
                      onChange={(val) => setCompost({ ...compost, organicMoisturePercent: val ?? 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                    <span className="text-[10px] text-[#718779]">Rác chợ/sinh hoạt VN ~ 70 - 80%</span>
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Hàm lượng Carbon rác (% C):</label>
                    <NumericInput
                      step={0.5}
                      min={0}
                      max={100}
                      value={compost.organicCarbonPercent}
                      fallbackValue={0}
                      onChange={(val) => setCompost({ ...compost, organicCarbonPercent: val ?? 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                    <span className="text-[10px] text-[#718779]">Tính theo % chất khô (40 - 45%)</span>
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Hàm lượng Nitơ rác (% N):</label>
                    <NumericInput
                      step={0.1}
                      min={0}
                      max={100}
                      value={compost.organicNitrogenPercent}
                      fallbackValue={0}
                      onChange={(val) => setCompost({ ...compost, organicNitrogenPercent: val ?? 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                    <span className="text-[10px] text-[#718779]">Tính theo % chất khô (1.8 - 2.5%)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-[#edf3ef]">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Tỷ lệ C/N mục tiêu:</label>
                    <NumericInput
                      step={1}
                      min={10}
                      max={60}
                      value={compost.targetCnRatio}
                      fallbackValue={28}
                      onChange={(val) => setCompost({ ...compost, targetCnRatio: val ?? 28 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                    <span className="text-[10px] text-[#718779]">Khoảng tối ưu: 25 - 30:1</span>
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Chất độn phụ gia:</label>
                    <select
                      value={compost.bulkingType}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'sawdust') {
                          setCompost({ ...compost, bulkingType: val, bulkingCarbonPercent: 50, bulkingNitrogenPercent: 0.5, bulkingMoisturePercent: 12 });
                        } else if (val === 'rice_husk') {
                          setCompost({ ...compost, bulkingType: val, bulkingCarbonPercent: 42, bulkingNitrogenPercent: 0.4, bulkingMoisturePercent: 10 });
                        } else {
                          setCompost({ ...compost, bulkingType: val, bulkingCarbonPercent: 45, bulkingNitrogenPercent: 0.8, bulkingMoisturePercent: 15 });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] text-xs font-semibold bg-white"
                    >
                      <option value="sawdust">Mùn cưa gỗ (C=50%, N=0.5%)</option>
                      <option value="rice_husk">Vỏ trấu / Tro trấu (C=42%, N=0.4%)</option>
                      <option value="straw">Rơm rạ băm nhỏ (C=45%, N=0.8%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Carbon phụ gia (% C):</label>
                    <NumericInput
                      step={0.5}
                      min={0}
                      max={100}
                      value={compost.bulkingCarbonPercent}
                      fallbackValue={0}
                      onChange={(val) => setCompost({ ...compost, bulkingCarbonPercent: val ?? 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Độ ẩm phụ gia (%):</label>
                    <NumericInput
                      step={0.5}
                      min={0}
                      max={100}
                      value={compost.bulkingMoisturePercent}
                      fallbackValue={0}
                      onChange={(val) => setCompost({ ...compost, bulkingMoisturePercent: val ?? 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Lượng phụ gia mùn cưa/trấu cần phối trộn:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-bold font-mono text-[#176b45]">
                      {formatNumber(bulkingWetTonsNeeded, precision)} tấn/ngày (~{Math.round(bulkingWetKgNeeded).toLocaleString()} kg/ngày)
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">
                      C/N ban đầu: {formatNumber(currentCn, precision)}:1 → Sau trộn: {compost.targetCnRatio}:1
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
                  Bảng Kết Quả Phối Trộn & Độ Ẩm Hỗn Hợp Ủ Compost
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
                  <span className="text-[#5b7264] block">Tỷ lệ C/N ban đầu của rác:</span>
                  <span className="text-xl font-bold font-mono text-amber-700">
                    {formatNumber(currentCn, precision)}:1
                  </span>
                  <span className="text-[10px] text-[#63776d] block">Thiếu hụt Carbon</span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Phụ gia cần bổ sung:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(bulkingWetTonsNeeded, precision)} tấn/ngày
                  </span>
                  <span className="text-[10px] text-[#63776d] block font-mono">
                    ~ {Math.round(bulkingWetKgNeeded).toLocaleString()} kg/ngày
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Tổng khối lượng đống ủ:</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {formatNumber(totalWetTons, precision)} tấn/ngày
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Độ ẩm hỗn hợp sau trộn:</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {formatNumber(blendedMoisture, precision)}%
                  </span>
                  <span className="text-[10px] text-[#63776d] block">Khoảng tối ưu 50 - 60%</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Ý nghĩa kỹ thuật của tỷ lệ C/N và chất độn tạo cấu trúc xốp:</span>
                </div>
                <p className="leading-relaxed">
                  Nếu tỷ lệ C/N &lt; 20:1, lượng Nitơ thừa sẽ bị phân hủy sinh ra khí Amoniac (NH₃) gây mùi khai hôi nồng nặc và làm mất đạm trong phân vi sinh. Việc phối trộn mùn cưa hoặc vỏ trấu không những nâng tỷ lệ C/N lên mức 25 - 30:1 mà còn tạo khung xương xốp giúp khí oxy dễ dàng lưu thông vào sâu trong lòng đống ủ, đẩy nhanh quá trình sinh nhiệt 55 - 65°C tiêu diệt mầm bệnh và hạt cỏ dại.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. CÂN BẰNG ĐỘ ẨM */}
      {currentTool === 'moisture' && (
        <div className="animate-fadeIn">
          {activeMode === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
                <span>Thông số Khối Lượng & Đo Đạc Độ Ẩm Thực Tế</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Khối lượng đống ủ (tấn):</label>
                  <NumericInput
                    step={0.5}
                    min={0}
                    value={moistureInputs.batchWeightTons}
                    fallbackValue={0}
                    onChange={(val) => setMoistureInputs({ ...moistureInputs, batchWeightTons: val ?? 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Độ ẩm đo đạc thực tế (%):</label>
                  <NumericInput
                    step={1}
                    min={0}
                    max={100}
                    value={moistureInputs.currentMoisturePercent}
                    fallbackValue={0}
                    onChange={(val) => setMoistureInputs({ ...moistureInputs, currentMoisturePercent: val ?? 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Đo bằng ẩm kế kim đâm đống ủ</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Độ ẩm tối ưu mong muốn (%):</label>
                  <NumericInput
                    step={1}
                    min={10}
                    max={90}
                    value={moistureInputs.targetMoisturePercent}
                    fallbackValue={55}
                    onChange={(val) => setMoistureInputs({ ...moistureInputs, targetMoisturePercent: val ?? 55 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Khuyến nghị: 50 - 60%</span>
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Nhu cầu điều chỉnh độ ẩm:</span>
                  <div className="flex items-baseline gap-3">
                    {moistureInputs.currentMoisturePercent < moistureInputs.targetMoisturePercent ? (
                      <span className="text-xl font-bold font-mono text-[#176b45]">
                        Cần tưới thêm: {formatNumber(waterDifferenceTons, precision)} m³ nước (~{Math.round(waterToAddLiters).toLocaleString()} Lít)
                      </span>
                    ) : moistureInputs.currentMoisturePercent > 65 ? (
                      <span className="text-xl font-bold font-mono text-red-700">
                        Quá ướt: Cần bổ sung {formatNumber(dryBulkingToDryOutTons, precision)} tấn chất độn khô
                      </span>
                    ) : (
                      <span className="text-xl font-bold font-mono text-[#176b45]">
                        Độ ẩm tối ưu ({moistureInputs.currentMoisturePercent}%): Không cần bổ sung nước
                      </span>
                    )}
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
                  Bảng Kết Quả Tính Lượng Nước Tưới Hoặc Phụ Gia Làm Khô
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
                  <span className="text-[#5b7264] block">Trạng thái độ ẩm đống ủ:</span>
                  <span
                    className={`text-xl font-bold font-mono ${
                      moistureInputs.currentMoisturePercent < 45
                        ? 'text-amber-700'
                        : moistureInputs.currentMoisturePercent > 65
                        ? 'text-red-700'
                        : 'text-[#176b45]'
                    }`}
                  >
                    {moistureInputs.currentMoisturePercent < 45
                      ? 'Khô (< 45%)'
                      : moistureInputs.currentMoisturePercent > 65
                      ? 'Quá ướt (> 65%)'
                      : 'Đạt chuẩn (50 - 60%)'}
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Lượng nước tưới bổ sung:</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {formatNumber(waterDifferenceTons, precision)} m³
                  </span>
                  <span className="text-[10px] text-[#63776d] block font-mono">
                    ~ {Math.round(waterToAddLiters).toLocaleString()} Lít nước sạch
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Lượng chất độn hút ẩm (nếu ướt):</span>
                  <span className="text-xl font-bold font-mono text-[#193d2c]">
                    {formatNumber(dryBulkingToDryOutTons, precision)} tấn
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Kinh nghiệm kiểm tra độ ẩm thực địa (Squeeze Test):</span>
                </div>
                <p className="leading-relaxed">
                  Lấy một nắm vật liệu ở độ sâu 30 - 50 cm trong lòng luống ủ và bóp chặt trong lòng bàn tay:
                  <br />• <strong>Quá khô (&lt; 40%):</strong> Mở tay ra vật liệu bị vỡ vụn, không kết dính và lòng bàn tay khô ráo. Vi sinh bị ức chế hoạt tính.
                  <br />• <strong>Lý tưởng (50 - 60%):</strong> Cảm giác ẩm ướt như miếng bọt biển vắt ráo nước, xuất hiện giọt ẩm ở kẽ ngón tay nhưng không chảy nhỏ giọt thành dòng.
                  <br />• <strong>Quá ướt (&gt; 65%):</strong> Nước bẩn chảy nhỏ giọt ròng ròng qua kẽ ngón tay. Các lỗ rỗng bị nước bịt kín gây yếm khí sinh khí H₂S và mùi xú uế.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

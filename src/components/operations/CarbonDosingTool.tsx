import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Info, CheckCircle2, Copy, FileText, AlertCircle, Droplets } from 'lucide-react';
import { formatNumber, getDecimalDigits } from '../../utils/calculations';
import {
  CarbonDosingInputs,
  CarbonDosingResults,
  calculateCarbonDosing,
} from '../../utils/operationCalculations';
import { NumericInput } from '../common/NumericInput';

interface CarbonDosingToolProps {
  onBack: () => void;
  designFlowM3Day?: number;
  designCodMgL?: number;
  designTnMgL?: number;
}

const STORAGE_KEY = 'ecs_op_carbon_inputs';

export const CarbonDosingTool: React.FC<CarbonDosingToolProps> = ({
  onBack,
  designFlowM3Day = 100,
  designCodMgL = 500,
  designTnMgL = 40,
}) => {
  const precision = getDecimalDigits();

  const [inputs, setInputs] = useState<CarbonDosingInputs>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      flowM3Day: designFlowM3Day,
      no3NToDenitrifyMgL: Math.max(10, (designTnMgL || 40) * 0.75),
      availableRbCodMgL: Math.max(0, (designCodMgL || 500) * 0.2), // rbCOD thường chiếm 15-25% COD
      targetCodToNRatio: 4.5,
      carbonSource: 'methanol',
      purityOrConcentrationPercent: 99.5,
      operatingHoursPerDay: 24,
    };
  });

  const [results, setResults] = useState<CarbonDosingResults>(() => calculateCarbonDosing(inputs));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const res = calculateCarbonDosing(inputs);
    setResults(res);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {}
  }, [inputs]);

  const handleResetToDesign = () => {
    setInputs((prev) => ({
      ...prev,
      flowM3Day: designFlowM3Day,
      no3NToDenitrifyMgL: Math.max(10, (designTnMgL || 40) * 0.75),
      availableRbCodMgL: Math.max(0, (designCodMgL || 500) * 0.2),
    }));
  };

  const handleCopySummary = () => {
    const text = `[KẾT QUẢ TÍNH TOÁN BỔ SUNG COD / NGUỒN CARBON - ECS]
• Lưu lượng Q: ${formatNumber(inputs.flowM3Day, precision)} m³/ngày
• NO3-N cần khử: ${formatNumber(inputs.no3NToDenitrifyMgL, precision)} mg/L
• rbCOD có sẵn: ${formatNumber(inputs.availableRbCodMgL, precision)} mg/L
• Tỷ lệ COD/N mục tiêu: ${inputs.targetCodToNRatio} kg COD / kg NO3-N
• Tổng COD cần thiết: ${formatNumber(results.codRequiredTotalKgDay, precision)} kg COD/ngày
• Nhu cầu COD thiếu hụt: ${formatNumber(results.codDeficitKgDay, precision)} kg COD/ngày
• Nguồn Carbon: ${results.carbonSourceName}
• Khối lượng thương phẩm: ${formatNumber(results.commercialWeightKgDay, precision)} kg/ngày
• Thể tích thương phẩm: ${formatNumber(results.commercialVolumeLDay, precision)} Lít/ngày (Bơm: ${formatNumber(results.dosingPumpRateLh, precision)} L/h)
• Lưu ý: ${results.practicalNotes}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dce7e1]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-[#cfdcd4] bg-white hover:bg-[#edf5f0] text-xs font-semibold text-[#183b2b] transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#176b45]" />
            <span>Quay lại</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#eaf4ee] text-[#176b45] flex items-center justify-center font-bold text-base shrink-0">
              C
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm sm:text-base text-[#183b2b] truncate sm:whitespace-normal">Tính toán Bổ sung COD (Nguồn Carbon Thiếu khí)</h2>
              <p className="text-[11px] sm:text-xs text-[#667a6e] line-clamp-1 sm:line-clamp-none">
                Bổ sung cơ chất Carbon cho bể Anoxic khử Nitrat (Denitrification) khi nước thải thiếu hụt BOD/COD
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetToDesign}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-[#cfdcd4] bg-white hover:bg-[#edf5f0] text-xs font-medium text-[#465d50] transition-colors cursor-pointer"
            title="Lấy lại giá trị từ thông số thiết kế dự án"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#176b45]" />
            <span>Lấy từ dự án</span>
          </button>
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg bg-[#176b45] hover:bg-[#125837] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép kết quả'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs Left, Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card: Thông số nước thải & Nhu cầu Khử Nitrat */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b] flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 text-[#176b45]" />
              <span>1. Thông số Khử Nitrat & COD có sẵn</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[#43594d] font-medium mb-1">
                  Lưu lượng xử lý Q thực tế (m³/ngày):
                </label>
                <NumericInput
                  step={10}
                  min={0}
                  value={inputs.flowM3Day}
                  fallbackValue={0}
                  onChange={(val) => setInputs({ ...inputs, flowM3Day: val ?? 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-[#cfdcd4] focus:outline-none focus:border-[#176b45] font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">NO₃⁻-N cần khử (mg/L):</label>
                  <NumericInput
                    step={1}
                    min={0}
                    value={inputs.no3NToDenitrifyMgL}
                    fallbackValue={0}
                    onChange={(val) => setInputs({ ...inputs, no3NToDenitrifyMgL: val ?? 0 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Nồng độ Nitrat sau oxy hóa</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">rbCOD sẵn có (mg/L):</label>
                  <NumericInput
                    step={5}
                    min={0}
                    value={inputs.availableRbCodMgL}
                    fallbackValue={0}
                    onChange={(val) => setInputs({ ...inputs, availableRbCodMgL: val ?? 0 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">COD dễ phân hủy trong nước</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">Tỷ lệ COD/NO₃⁻-N mục tiêu:</label>
                  <NumericInput
                    step={0.1}
                    min={1}
                    max={10}
                    value={inputs.targetCodToNRatio}
                    fallbackValue={4.5}
                    onChange={(val) => setInputs({ ...inputs, targetCodToNRatio: val ?? 4.5 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Chuẩn Metcalf & Eddy (4.0 - 5.0)</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">Thời gian bơm châm (h/ngày):</label>
                  <NumericInput
                    step={1}
                    min={1}
                    max={24}
                    value={inputs.operatingHoursPerDay}
                    fallbackValue={24}
                    onChange={(val) => setInputs({ ...inputs, operatingHoursPerDay: val ?? 24 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Lựa chọn nguồn Carbon */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b] flex items-center gap-2">
              <span className="font-bold font-mono text-[#176b45]">C</span>
              <span>2. Lựa chọn nguồn cơ chất Carbon bổ sung</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[#43594d] font-medium mb-1">Loại nguồn Carbon:</label>
                <select
                  value={inputs.carbonSource}
                  onChange={(e) => {
                    const src = e.target.value as any;
                    let defaultPurity = 99.5;
                    if (src === 'molasses') defaultPurity = 80;
                    if (src === 'sodium_acetate') defaultPurity = 98;
                    if (src === 'ethanol') defaultPurity = 96;
                    setInputs({ ...inputs, carbonSource: src, purityOrConcentrationPercent: defaultPurity });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#cfdcd4] bg-white font-medium text-xs text-[#183b2b]"
                >
                  <option value="methanol">Methanol CH3OH (1.07 kg COD/kg - Phổ biến cho trạm lớn)</option>
                  <option value="ethanol">Ethanol C2H5OH (2.09 kg COD/kg - Tốc độ khử cực nhanh, an toàn)</option>
                  <option value="molasses">Mật rỉ đường (0.85 kg COD/kg - Rẻ tiền, dễ mua)</option>
                  <option value="sodium_acetate">Natri Axetat CH3COONa (0.78 kg COD/kg - Phản ứng tức thì)</option>
                  <option value="acetic_acid">Axit Axetic CH3COOH (1.07 kg COD/kg - Dạng lỏng)</option>
                  <option value="glucose">Đường Glucose / Dextrose (1.07 kg COD/kg - Dễ dùng)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#43594d] font-medium mb-1">Nồng độ / Độ tinh khiết thương mại (%):</label>
                <NumericInput
                  step={0.5}
                  min={1}
                  max={100}
                  value={inputs.purityOrConcentrationPercent}
                  fallbackValue={99}
                  onChange={(val) => setInputs({ ...inputs, purityOrConcentrationPercent: val ?? 99 })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                />
              </div>

              <div className="p-2.5 bg-[#f5f9f6] rounded-lg border border-[#d2e4d8] text-[11px] text-[#446050] leading-relaxed">
                <span className="font-bold text-[#183b2b]">Đặc tính vận hành thực tế: </span>
                {results.practicalNotes}
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-7 space-y-4">
          {/* Summary Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            results.codDeficitKgDay > 0
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            {results.codDeficitKgDay > 0 ? (
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            )}
            <div className="text-xs text-[#2c4737] leading-relaxed">
              {results.codDeficitKgDay > 0 ? (
                <span>
                  <strong className="text-amber-800">THIẾU NGUỒN CARBON ĐỆM:</strong> Nước thải cần bổ sung thêm{' '}
                  <strong className="font-mono text-amber-900">{formatNumber(results.codDeficitKgDay, precision)} kg COD/ngày</strong>{' '}
                  để các vi khuẩn khử nitrat dị dưỡng (Heterotrophic Denitrifiers) có đủ cơ chất chuyển hóa sạch NO₃⁻ thành khí N₂.
                </span>
              ) : (
                <span>
                  <strong className="text-emerald-800">ĐỦ NGUỒN CARBON:</strong> Lượng COD sẵn có trong nước thải ({formatNumber(results.codAvailableKgDay, precision)} kg COD/ngày) đã đủ đáp ứng cho quá trình khử Nitrat. Không cần châm thêm nguồn carbon bên ngoài.
                </span>
              )}
            </div>
          </div>

          {/* Cân bằng COD chi tiết */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b] pb-2 border-b border-[#e5eee8]">
              Cân bằng Tải lượng COD cho Bể Thiếu khí Anoxic
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-[#fbfdfb] border border-[#dce7e1] rounded-lg">
                <span className="text-[10px] text-[#718779] block">Tổng COD yêu cầu</span>
                <strong className="font-mono text-sm text-[#183b2b]">{formatNumber(results.codRequiredTotalKgDay, precision)} kg/ngày</strong>
                <span className="text-[10px] text-[#8ea096] block mt-0.5">Ratio: {inputs.targetCodToNRatio}</span>
              </div>
              <div className="p-2.5 bg-[#fbfdfb] border border-blue-200 rounded-lg">
                <span className="text-[10px] text-blue-700 block">COD có sẵn trong nước</span>
                <strong className="font-mono text-sm text-blue-700">{formatNumber(results.codAvailableKgDay, precision)} kg/ngày</strong>
                <span className="text-[10px] text-[#8ea096] block mt-0.5">rbCOD {inputs.availableRbCodMgL} mg/L</span>
              </div>
              <div className="p-2.5 bg-[#fbfdfb] border border-amber-200 rounded-lg">
                <span className="text-[10px] text-amber-800 block">Nhu cầu COD thiếu hụt</span>
                <strong className="font-mono text-sm text-amber-800">{formatNumber(results.codDeficitKgDay, precision)} kg/ngày</strong>
                <span className="text-[10px] text-amber-700 block mt-0.5 font-bold">Cần châm bổ sung</span>
              </div>
            </div>
          </div>

          {/* Khối lượng & thể tích hóa chất thương phẩm cần châm */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b]">
              Liều lượng & Bơm định lượng: {results.carbonSourceName}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-[#f8faf8] border border-[#d6e5dc] rounded-lg">
                <span className="text-[#64796e] block text-[11px]">Khối lượng thương phẩm:</span>
                <div className="text-xl font-bold font-mono text-[#176b45] mt-0.5">
                  {formatNumber(results.commercialWeightKgDay, precision)} <span className="text-xs">kg/ngày</span>
                </div>
                <span className="text-[10px] text-[#718779] block mt-1">
                  (Đương lượng: {results.codEquivalentKgCodPerKg} kg COD/kg)
                </span>
              </div>

              <div className="p-3 bg-[#f8faf8] border border-[#d6e5dc] rounded-lg">
                <span className="text-[#64796e] block text-[11px]">Thể tích thương phẩm:</span>
                <div className="text-xl font-bold font-mono text-[#183b2b] mt-0.5">
                  {formatNumber(results.commercialVolumeLDay, precision)} <span className="text-xs">Lít/ngày</span>
                </div>
                <span className="text-[10px] text-[#718779] block mt-1">
                  (Khối lượng riêng: {results.densityKgL} kg/L)
                </span>
              </div>

              <div className="p-3 bg-[#f8faf8] border border-[#d6e5dc] rounded-lg">
                <span className="text-[#64796e] block text-[11px]">Lưu lượng bơm định lượng:</span>
                <div className="text-xl font-bold font-mono text-[#176b45] mt-0.5">
                  {formatNumber(results.dosingPumpRateLh, precision)} <span className="text-xs">L/h</span>
                </div>
                <span className="text-[10px] text-[#718779] block mt-1">
                  (Chạy liên tục: {inputs.operatingHoursPerDay} h/ngày)
                </span>
              </div>
            </div>
          </div>

          {/* Cơ sở khoa học */}
          <div className="p-4 bg-white rounded-xl border border-[#cfdcd4] shadow-xs space-y-2 text-xs text-[#51675a]">
            <h4 className="font-bold text-xs text-[#183b2b] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#176b45]" />
              <span>Phương trình Khử Nitrat bằng cơ chất Carbon ngoài (Metcalf & Eddy):</span>
            </h4>
            <div className="space-y-1 pl-2 font-mono text-[11px] text-[#334e3f]">
              <p>• Khử bằng Methanol: NO₃⁻ + 1.08 CH₃OH + 0.24 H₂CO₃ → 0.056 C₅H₇NO₂ + 0.47 N₂↑ + 1.68 H₂O + HCO₃⁻</p>
              <p>• Nhu cầu oxy lý thuyết: 2.86 mg O₂ tương đương cho mỗi 1 mg NO₃⁻-N được khử thành N₂.</p>
              <p>• Nhu cầu thực tế (tính cả sinh khối tế bào vi sinh): 3.7 - 5.0 kg COD / kg NO₃⁻-N.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Scale, Calculator, RefreshCw, Info, CheckCircle2, Copy, FileText, AlertCircle } from 'lucide-react';
import { formatNumber, getDecimalDigits } from '../../utils/calculations';
import {
  AlkalinityDosingInputs,
  AlkalinityDosingResults,
  calculateAlkalinityDosing,
} from '../../utils/operationCalculations';
import { NumericInput } from '../common/NumericInput';

interface AlkalinityDosingToolProps {
  onBack: () => void;
  designFlowM3Day?: number;
  designAlkalinityMgL?: number;
  designNh4MgL?: number;
}

const STORAGE_KEY = 'ecs_op_alkalinity_inputs';

export const AlkalinityDosingTool: React.FC<AlkalinityDosingToolProps> = ({
  onBack,
  designFlowM3Day = 100,
  designAlkalinityMgL = 150,
  designNh4MgL = 30,
}) => {
  const precision = getDecimalDigits();

  const [inputs, setInputs] = useState<AlkalinityDosingInputs>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      flowM3Day: designFlowM3Day,
      influentAlkalinityMgL: designAlkalinityMgL,
      nh4NToOxidizeMgL: designNh4MgL,
      targetResidualAlkalinityMgL: 80,
      denitrificationRecoveryEnabled: true,
      no3NDenitrifiedMgL: Math.max(0, designNh4MgL * 0.8),
      alkalinityChemical: 'nahco3',
      chemicalPurityPercent: 99,
      solutionBatchM3: 0.5,
      operatingHoursPerDay: 24,
    };
  });

  const [results, setResults] = useState<AlkalinityDosingResults>(() => calculateAlkalinityDosing(inputs));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const res = calculateAlkalinityDosing(inputs);
    setResults(res);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {}
  }, [inputs]);

  const handleResetToDesign = () => {
    setInputs((prev) => ({
      ...prev,
      flowM3Day: designFlowM3Day,
      influentAlkalinityMgL: designAlkalinityMgL,
      nh4NToOxidizeMgL: designNh4MgL,
      no3NDenitrifiedMgL: Math.max(0, designNh4MgL * 0.8),
    }));
  };

  const handleCopySummary = () => {
    const text = `[KẾT QUẢ TÍNH TOÁN BỔ SUNG KIỀM - ECS]
• Lưu lượng Q: ${formatNumber(inputs.flowM3Day, precision)} m³/ngày
• Kiềm đầu vào: ${formatNumber(inputs.influentAlkalinityMgL, precision)} mg CaCO3/L
• NH4-N cần nitrat hóa: ${formatNumber(inputs.nh4NToOxidizeMgL, precision)} mg/L (Tiêu hao kiềm: ${formatNumber(results.alkalinityConsumedMgL, precision)} mg CaCO3/L)
• Kiềm thu hồi từ khử Nitrat: +${formatNumber(results.alkalinityRecoveredMgL, precision)} mg CaCO3/L
• Kiềm đệm dư mục tiêu: ${formatNumber(inputs.targetResidualAlkalinityMgL, precision)} mg CaCO3/L
• Nồng độ kiềm thiếu hụt: ${formatNumber(results.alkalinityDeficitMgL, precision)} mg CaCO3/L
• Tương đương CaCO3 nguyên chất: ${formatNumber(results.pureCaCO3RequiredKgDay, precision)} kg/ngày
• Hóa chất sử dụng: ${results.chemicalName}
• Khối lượng thương phẩm cần châm: ${formatNumber(results.commercialChemicalKgDay, precision)} kg/ngày (Bơm: ${formatNumber(results.chemicalPumpLh, precision)} L/h)`;
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
            <div className="w-8 h-8 rounded-lg bg-[#eaf4ee] text-[#176b45] flex items-center justify-center font-bold shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm sm:text-base text-[#183b2b] truncate sm:whitespace-normal">Tính toán Bổ sung Kiềm (Alkalinity Dosing)</h2>
              <p className="text-[11px] sm:text-xs text-[#667a6e] line-clamp-1 sm:line-clamp-none">
                Kiểm soát độ kiềm duy trì pH tối ưu cho vi sinh vật nitrat hóa (Nitrosomonas & Nitrobacter)
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
          {/* Card: Thông số nước thải & Nitrat hóa */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b] flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
              <span>1. Thông số nước thải & Nhu cầu Nitrat hóa</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[#43594d] font-medium mb-1">
                  Lưu lượng xử lý Q thực tế (m³/ngày):
                </label>
                <NumericInput
                  min={0}
                  defaultValue={100}
                  value={inputs.flowM3Day}
                  onChange={(val) => setInputs({ ...inputs, flowM3Day: val })}
                  className="w-full px-3 py-2 rounded-lg border border-[#cfdcd4] focus:outline-none focus:border-[#176b45] font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">Độ kiềm đầu vào (mg CaCO₃/L):</label>
                  <NumericInput
                    min={0}
                    defaultValue={120}
                    value={inputs.influentAlkalinityMgL}
                    onChange={(val) => setInputs({ ...inputs, influentAlkalinityMgL: val })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">NH₄⁺-N cần oxy hóa (mg/L):</label>
                  <NumericInput
                    min={0}
                    defaultValue={30}
                    value={inputs.nh4NToOxidizeMgL}
                    onChange={(val) => setInputs({ ...inputs, nh4NToOxidizeMgL: val })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">Kiềm đệm dư mục tiêu (mg/L):</label>
                  <NumericInput
                    min={0}
                    defaultValue={80}
                    value={inputs.targetResidualAlkalinityMgL}
                    onChange={(val) => setInputs({ ...inputs, targetResidualAlkalinityMgL: val })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Khuyến nghị 70 - 100 mg/L</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">Thời gian bơm châm (h/ngày):</label>
                  <NumericInput
                    min={1}
                    max={24}
                    defaultValue={24}
                    value={inputs.operatingHoursPerDay}
                    onChange={(val) => setInputs({ ...inputs, operatingHoursPerDay: val })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                  />
                </div>
              </div>

              {/* Thu hồi kiềm từ Anoxic */}
              <div className="pt-2 border-t border-[#edf4f0] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inputs.denitrificationRecoveryEnabled}
                    onChange={(e) => setInputs({ ...inputs, denitrificationRecoveryEnabled: e.target.checked })}
                    className="rounded text-[#176b45] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-semibold text-xs text-[#183b2b]">
                    Tính thu hồi kiềm từ bể thiếu khí Anoxic (+3.57 g CaCO₃/g N)
                  </span>
                </label>
                {inputs.denitrificationRecoveryEnabled && (
                  <div>
                    <label className="block text-[#43594d] font-medium mb-1">NO₃⁻-N được khử nitrat (mg/L):</label>
                    <NumericInput
                      min={0}
                      defaultValue={0}
                      value={inputs.no3NDenitrifiedMgL}
                      onChange={(val) => setInputs({ ...inputs, no3NDenitrifiedMgL: val })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card: Lựa chọn loại hóa chất kiềm */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b] flex items-center gap-2">
              <Scale className="w-3.5 h-3.5 text-[#176b45]" />
              <span>2. Lựa chọn hóa chất bổ sung kiềm</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[#43594d] font-medium mb-1">Loại hóa chất kiềm:</label>
                <select
                  value={inputs.alkalinityChemical}
                  onChange={(e) => setInputs({ ...inputs, alkalinityChemical: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-[#cfdcd4] bg-white font-medium text-xs text-[#183b2b]"
                >
                  <option value="nahco3">Natri Bicarbonat NaHCO3 (Baking soda - 1.68 kg/kg CaCO3 - An toàn nhất)</option>
                  <option value="na2co3">Soda Ash Na2CO3 (1.06 kg/kg CaCO3 - Hòa tan tốt)</option>
                  <option value="naoh">Xút ăn da NaOH (0.80 kg/kg CaCO3 - Nâng pH cực nhanh)</option>
                  <option value="caoh2">Vôi tôi Ca(OH)2 (0.74 kg/kg CaCO3 - Tiết kiệm chi phí)</option>
                  <option value="cao">Vôi sống CaO (0.56 kg/kg CaCO3 - Tỏa nhiệt mạnh)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#43594d] font-medium mb-1">Độ tinh khiết thương mại (%):</label>
                <NumericInput
                  min={10}
                  max={100}
                  defaultValue={95}
                  value={inputs.chemicalPurityPercent}
                  onChange={(val) => setInputs({ ...inputs, chemicalPurityPercent: val })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                />
              </div>

              <div className="p-2.5 bg-[#f5f9f6] rounded-lg border border-[#d2e4d8] text-[11px] text-[#446050] leading-relaxed">
                <span className="font-bold text-[#183b2b]">Đặc tính hóa chất: </span>
                {results.phImpactNote}
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-7 space-y-4">
          {/* Summary Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            results.alkalinityDeficitMgL > 0
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            {results.alkalinityDeficitMgL > 0 ? (
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            )}
            <div className="text-xs text-[#2c4737] leading-relaxed">
              {results.alkalinityDeficitMgL > 0 ? (
                <span>
                  <strong className="text-amber-800">CẢNH BÁO THIẾU KIỀM:</strong> Nước thải bị thiếu{' '}
                  <strong className="font-mono text-amber-900">{formatNumber(results.alkalinityDeficitMgL, precision)} mg CaCO₃/L</strong>.
                  Nếu không châm kiềm bổ sung, pH bể hiếu khí sẽ tụt xuống dưới 6.5 làm ức chế hoàn toàn vi sinh nitrat hóa.
                </span>
              ) : (
                <span>
                  <strong className="text-emerald-800">ĐỘ KIỀM ĐẠT CHUẨN:</strong> Độ kiềm sẵn có trong nước thải đủ đệm cho quá trình Nitrat hóa (pH ổn định trên 7.0 - 7.5). Không cần châm thêm kiềm.
                </span>
              )}
            </div>
          </div>

          {/* Cân bằng độ kiềm chi tiết */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b] pb-2 border-b border-[#e5eee8]">
              Cân bằng Độ kiềm (mg CaCO₃/L)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-[#fbfdfb] border border-[#dce7e1] rounded-lg">
                <span className="text-[10px] text-[#718779] block">Đầu vào (Alk_in)</span>
                <strong className="font-mono text-sm text-[#183b2b]">+{formatNumber(inputs.influentAlkalinityMgL, precision)}</strong>
              </div>
              <div className="p-2.5 bg-[#fbfdfb] border border-red-200 rounded-lg">
                <span className="text-[10px] text-red-700 block">Tiêu hao Nitrat hóa</span>
                <strong className="font-mono text-sm text-red-700">-{formatNumber(results.alkalinityConsumedMgL, precision)}</strong>
              </div>
              <div className="p-2.5 bg-[#fbfdfb] border border-blue-200 rounded-lg">
                <span className="text-[10px] text-blue-700 block">Thu hồi Khử Nitrat</span>
                <strong className="font-mono text-sm text-blue-700">+{formatNumber(results.alkalinityRecoveredMgL, precision)}</strong>
              </div>
              <div className="p-2.5 bg-[#fbfdfb] border border-amber-200 rounded-lg">
                <span className="text-[10px] text-amber-800 block">Đệm dư mục tiêu</span>
                <strong className="font-mono text-sm text-amber-800">{formatNumber(inputs.targetResidualAlkalinityMgL, precision)}</strong>
              </div>
            </div>

            <div className="p-3 bg-[#f6faf7] rounded-xl border border-[#c4e0ce] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#435c4e] font-medium block">Nồng độ kiềm thiếu hụt cần châm:</span>
                <span className="text-[11px] text-[#6d8174]">Tổng lượng CaCO₃ nguyên chất tương đương:</span>
              </div>
              <div className="text-right">
                <div className="font-mono font-extrabold text-lg text-[#176b45]">
                  {formatNumber(results.alkalinityDeficitMgL, precision)} <span className="text-xs">mg CaCO₃/L</span>
                </div>
                <div className="font-mono text-xs text-[#2a4635] font-bold">
                  {formatNumber(results.pureCaCO3RequiredKgDay, precision)} kg CaCO₃/ngày
                </div>
              </div>
            </div>
          </div>

          {/* Khối lượng hóa chất thương phẩm cần châm */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b]">
              Chỉ dẫn Pha chế & Châm hóa chất: {results.chemicalName}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#f8faf8] border border-[#d6e5dc] rounded-lg">
                <span className="text-[#64796e] block text-[11px]">Khối lượng thương phẩm/ngày:</span>
                <div className="text-xl font-bold font-mono text-[#176b45] mt-0.5">
                  {formatNumber(results.commercialChemicalKgDay, precision)} <span className="text-xs">kg/ngày</span>
                </div>
                <span className="text-[10px] text-[#718779] block mt-1">
                  (Độ tinh khiết: {inputs.chemicalPurityPercent}%)
                </span>
              </div>

              <div className="p-3 bg-[#f8faf8] border border-[#d6e5dc] rounded-lg">
                <span className="text-[#64796e] block text-[11px]">Lưu lượng bơm định lượng (pha 5%):</span>
                <div className="text-xl font-bold font-mono text-[#183b2b] mt-0.5">
                  {formatNumber(results.chemicalPumpLh, precision)} <span className="text-xs">L/h</span>
                </div>
                <span className="text-[10px] text-[#718779] block mt-1">
                  (Thời gian bơm: {inputs.operatingHoursPerDay} h/ngày)
                </span>
              </div>
            </div>
          </div>

          {/* Công thức tính toán */}
          <div className="p-4 bg-white rounded-xl border border-[#cfdcd4] shadow-xs space-y-2 text-xs text-[#51675a]">
            <h4 className="font-bold text-xs text-[#183b2b] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#176b45]" />
              <span>Phương trình stoichiometric theo Metcalf & Eddy:</span>
            </h4>
            <div className="space-y-1 pl-2 font-mono text-[11px] text-[#334e3f]">
              <p>• NH₄⁺ + 1.98 HCO₃⁻ + 1.86 O₂ → 0.98 NO₃⁻ + 0.02 C₅H₇NO₂ + 1.88 H₂CO₃ + 1.04 H₂O</p>
              <p>• Tiêu thụ: 7.14 mg CaCO₃ cho mỗi 1 mg NH₄⁺-N bị oxy hóa.</p>
              <p>• Khử Nitrat thu hồi: +3.57 mg CaCO₃ cho mỗi 1 mg NO₃⁻-N được khử thành khí N₂.</p>
              <p>• Tỷ lệ khối lượng: 1.68 NaHCO₃ | 1.06 Na₂CO₃ | 0.80 NaOH | 0.74 Ca(OH)₂ tương đương 1.0 CaCO₃.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

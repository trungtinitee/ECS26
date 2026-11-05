import React, { useState, useEffect } from 'react';
import { ArrowLeft, Beaker, Calculator, RefreshCw, Info, CheckCircle2, AlertTriangle, Copy, FileText } from 'lucide-react';
import { formatNumber, getDecimalDigits } from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';
import {
  NutrientDosingInputs,
  NutrientDosingResults,
  calculateNutrientDosing,
} from '../../utils/operationCalculations';

interface NutrientDosingToolProps {
  onBack: () => void;
  designFlowM3Day?: number;
  designBodMgL?: number;
  designTnMgL?: number;
  designTpMgL?: number;
}

const STORAGE_KEY = 'ecs_op_nutrient_inputs';

export const NutrientDosingTool: React.FC<NutrientDosingToolProps> = ({
  onBack,
  designFlowM3Day = 100,
  designBodMgL = 250,
  designTnMgL = 40,
  designTpMgL = 8,
}) => {
  const precision = getDecimalDigits();

  const [inputs, setInputs] = useState<NutrientDosingInputs>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      flowM3Day: designFlowM3Day,
      bodMgL: designBodMgL,
      tnMgL: designTnMgL,
      tpMgL: designTpMgL,
      targetRatioBOD: 100,
      targetRatioN: 5,
      targetRatioP: 1,
      nitrogenChem: 'urea',
      phosphorusChem: 'h3po4',
      ureaPurityPercent: 98,
      h3po4ConcentrationPercent: 85,
      solutionTankVolumeM3: 0.5,
      operatingHoursPerDay: 24,
    };
  });

  const [results, setResults] = useState<NutrientDosingResults>(() => calculateNutrientDosing(inputs));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const res = calculateNutrientDosing(inputs);
    setResults(res);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {}
  }, [inputs]);

  const handleResetToDesign = () => {
    setInputs((prev) => ({
      ...prev,
      flowM3Day: designFlowM3Day,
      bodMgL: designBodMgL,
      tnMgL: designTnMgL,
      tpMgL: designTpMgL,
      targetRatioBOD: 100,
      targetRatioN: 5,
      targetRatioP: 1,
    }));
  };

  const handleCopySummary = () => {
    const text = `[KẾT QUẢ TÍNH TOÁN DINH DƯỠNG BỔ SUNG - ECS]
• Lưu lượng Q: ${formatNumber(inputs.flowM3Day, precision)} m³/ngày
• Nồng độ đầu vào: BOD = ${formatNumber(inputs.bodMgL, precision)} mg/L, N = ${formatNumber(inputs.tnMgL, precision)} mg/L, P = ${formatNumber(inputs.tpMgL, precision)} mg/L
• Tỷ lệ mục tiêu (BOD:N:P): ${inputs.targetRatioBOD}:${inputs.targetRatioN}:${inputs.targetRatioP}
• Thiếu hụt Nitơ: ${formatNumber(results.nDeficitKgDay, precision)} kg N/ngày => Cần châm: ${formatNumber(results.nitrogenChemKgDay, precision)} kg ${results.nitrogenChemName}/ngày (Bơm: ${formatNumber(results.nitrogenChemPumpLh, precision)} L/h)
• Thiếu hụt Phốt pho: ${formatNumber(results.pDeficitKgDay, precision)} kg P/ngày => Cần châm: ${formatNumber(results.phosphorusChemKgDay, precision)} kg ${results.phosphorusChemName}/ngày (Bơm: ${formatNumber(results.phosphorusChemPumpLh, precision)} L/h)
• Đánh giá: ${results.recommendation}`;
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
              <Beaker className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm sm:text-base text-[#183b2b] truncate sm:whitespace-normal">Tính toán Dinh dưỡng Bổ sung (N & P)</h2>
              <p className="text-[11px] sm:text-xs text-[#667a6e] line-clamp-1 sm:line-clamp-none">
                Kiểm soát tỷ lệ cân bằng sinh học BOD:N:P trong nước thải phục vụ vi sinh hiếu khí / kỵ khí
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
          {/* Card: Thông số nước thải đầu vào */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b] flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
              <span>1. Thông số nước thải đầu vào</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[#43594d] font-medium mb-1">
                  Lưu lượng xử lý Q thực tế (m³/ngày):
                </label>
                <NumericInput
                  value={inputs.flowM3Day}
                  onChange={(val) => setInputs({ ...inputs, flowM3Day: val })}
                  className="w-full px-3 py-2 rounded-lg border border-[#cfdcd4] focus:outline-none focus:border-[#176b45] font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">BOD₅ (mg/L):</label>
                  <NumericInput
                    value={inputs.bodMgL}
                    onChange={(val) => setInputs({ ...inputs, bodMgL: val })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] focus:outline-none focus:border-[#176b45] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">N-NH₄/TN (mg/L):</label>
                  <NumericInput
                    value={inputs.tnMgL}
                    onChange={(val) => setInputs({ ...inputs, tnMgL: val })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] focus:outline-none focus:border-[#176b45] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">P-PO₄/TP (mg/L):</label>
                  <NumericInput
                    value={inputs.tpMgL}
                    onChange={(val) => setInputs({ ...inputs, tpMgL: val })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] focus:outline-none focus:border-[#176b45] font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Tỷ lệ mục tiêu & Hóa chất */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b] flex items-center gap-2">
              <Beaker className="w-3.5 h-3.5 text-[#176b45]" />
              <span>2. Tỷ lệ dinh dưỡng & Lựa chọn hóa chất</span>
            </h3>

            {/* Presets */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInputs({ ...inputs, targetRatioBOD: 100, targetRatioN: 5, targetRatioP: 1 })}
                className={`flex-1 py-1 px-2 rounded text-xs font-semibold border transition-all cursor-pointer ${
                  inputs.targetRatioBOD === 100 && inputs.targetRatioN === 5 && inputs.targetRatioP === 1
                    ? 'bg-[#eaf4ee] text-[#176b45] border-[#176b45]'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Hiếu khí (100:5:1)
              </button>
              <button
                type="button"
                onClick={() => setInputs({ ...inputs, targetRatioBOD: 250, targetRatioN: 5, targetRatioP: 1 })}
                className={`flex-1 py-1 px-2 rounded text-xs font-semibold border transition-all cursor-pointer ${
                  inputs.targetRatioBOD === 250 && inputs.targetRatioN === 5 && inputs.targetRatioP === 1
                    ? 'bg-[#eaf4ee] text-[#176b45] border-[#176b45]'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Kỵ khí (250:5:1)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[#43594d] font-medium mb-1">Tỷ lệ BOD:</label>
                <NumericInput
                  value={inputs.targetRatioBOD}
                  onChange={(val) => setInputs({ ...inputs, targetRatioBOD: val })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-[#43594d] font-medium mb-1">Tỷ lệ N:</label>
                <NumericInput
                  value={inputs.targetRatioN}
                  onChange={(val) => setInputs({ ...inputs, targetRatioN: val })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-[#43594d] font-medium mb-1">Tỷ lệ P:</label>
                <NumericInput
                  value={inputs.targetRatioP}
                  onChange={(val) => setInputs({ ...inputs, targetRatioP: val })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-1 text-xs border-t border-[#edf4f0]">
              <div>
                <label className="block text-[#43594d] font-medium mb-1">Hóa chất bổ sung Nitơ (N):</label>
                <select
                  value={inputs.nitrogenChem}
                  onChange={(e) => setInputs({ ...inputs, nitrogenChem: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#cfdcd4] bg-white font-medium text-xs text-[#183b2b]"
                >
                  <option value="urea">Phân Urê (NH2)2CO (46% N - Phổ biến nhất)</option>
                  <option value="dap">Phân DAP (18% N, 46% P2O5 - Bù cả N và P)</option>
                  <option value="nh4cl">Amoni Clorua NH4Cl (26.2% N)</option>
                  <option value="ammonium_sulfate">Amoni Sunfat (NH4)2SO4 (21.2% N)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#43594d] font-medium mb-1">Hóa chất bổ sung Phốt pho (P):</label>
                <select
                  value={inputs.phosphorusChem}
                  onChange={(e) => setInputs({ ...inputs, phosphorusChem: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#cfdcd4] bg-white font-medium text-xs text-[#183b2b]"
                >
                  <option value="h3po4">Axit Photphoric H3PO4 85% (Dạng lỏng, hòa tan nhanh)</option>
                  <option value="dap">Phân DAP (18% N, 46% P2O5)</option>
                  <option value="superphosphate">Supe lân đơn (16% P2O5)</option>
                  <option value="kh2po4">Kali Dihydrophotphat KH2PO4 (22.8% P)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#43594d] font-medium mb-1">Thời gian châm bơm định lượng (h/ngày):</label>
                <NumericInput
                  min={1}
                  max={24}
                  value={inputs.operatingHoursPerDay}
                  onChange={(val) => setInputs({ ...inputs, operatingHoursPerDay: val })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-7 space-y-4">
          {/* Summary Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            results.nDeficitKgDay > 0 || results.pDeficitKgDay > 0
              ? 'bg-[#f7fbf8] border-[#c5e2d1]'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <Info className="w-5 h-5 text-[#176b45] shrink-0 mt-0.5" />
            <div className="text-xs text-[#2c4737] leading-relaxed">
              <span className="font-bold text-[#183b2b]">Khuyến nghị vận hành: </span>
              {results.recommendation}
            </div>
          </div>

          {/* Results Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cột Nitơ */}
            <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e5eee8]">
                <div className="font-bold text-xs uppercase tracking-wider text-[#183b2b]">
                  Cân bằng Nitơ (N)
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  results.nDeficitKgDay > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {results.nDeficitKgDay > 0 ? 'Cần bổ sung' : 'Đủ dinh dưỡng'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64796e]">Nhu cầu N cần thiết:</span>
                  <strong className="font-mono text-[#183b2b]">{formatNumber(results.nRequiredKgDay, precision)} kg N/ngày</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64796e]">Lượng N có sẵn trong nước:</span>
                  <strong className="font-mono text-[#183b2b]">{formatNumber(results.nAvailableKgDay, precision)} kg N/ngày</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#edf4f0]">
                  <span className="text-[#64796e] font-semibold">Lượng N thiếu hụt:</span>
                  <strong className={`font-mono text-sm ${results.nDeficitKgDay > 0 ? 'text-amber-700 font-extrabold' : 'text-[#176b45]'}`}>
                    {formatNumber(results.nDeficitKgDay, precision)} kg N/ngày
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-[#f8faf8] rounded-lg border border-[#d6e5dc] space-y-1.5 text-xs">
                <div className="text-[11px] font-semibold text-[#183b2b]">{results.nitrogenChemName}</div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[#64796e]">Khối lượng cần châm:</span>
                  <span className="font-bold font-mono text-base text-[#176b45]">
                    {formatNumber(results.nitrogenChemKgDay, precision)} <span className="text-xs">kg/ngày</span>
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-[11px]">
                  <span className="text-[#64796e]">Lưu lượng bơm định lượng (pha 5%):</span>
                  <span className="font-bold font-mono text-[#183b2b]">
                    {formatNumber(results.nitrogenChemPumpLh, precision)} L/h
                  </span>
                </div>
              </div>
            </div>

            {/* Cột Phốt pho */}
            <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e5eee8]">
                <div className="font-bold text-xs uppercase tracking-wider text-[#183b2b]">
                  Cân bằng Phốt pho (P)
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  results.pDeficitKgDay > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {results.pDeficitKgDay > 0 ? 'Cần bổ sung' : 'Đủ dinh dưỡng'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64796e]">Nhu cầu P cần thiết:</span>
                  <strong className="font-mono text-[#183b2b]">{formatNumber(results.pRequiredKgDay, precision)} kg P/ngày</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64796e]">Lượng P có sẵn trong nước:</span>
                  <strong className="font-mono text-[#183b2b]">{formatNumber(results.pAvailableKgDay, precision)} kg P/ngày</strong>
                </div>
                {results.dapContributionPKgDay && (
                  <div className="flex justify-between text-[11px] text-blue-700">
                    <span>P bổ sung sẵn từ phân DAP:</span>
                    <strong className="font-mono">+{formatNumber(results.dapContributionPKgDay, precision)} kg P/ngày</strong>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-[#edf4f0]">
                  <span className="text-[#64796e] font-semibold">Lượng P thiếu hụt:</span>
                  <strong className={`font-mono text-sm ${results.pDeficitKgDay > 0 ? 'text-amber-700 font-extrabold' : 'text-[#176b45]'}`}>
                    {formatNumber(results.pDeficitKgDay, precision)} kg P/ngày
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-[#f8faf8] rounded-lg border border-[#d6e5dc] space-y-1.5 text-xs">
                <div className="text-[11px] font-semibold text-[#183b2b]">{results.phosphorusChemName}</div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[#64796e]">Khối lượng cần châm:</span>
                  <span className="font-bold font-mono text-base text-[#176b45]">
                    {formatNumber(results.phosphorusChemKgDay, precision)} <span className="text-xs">kg/ngày</span>
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-[11px]">
                  <span className="text-[#64796e]">Lưu lượng bơm định lượng (pha 5%):</span>
                  <span className="font-bold font-mono text-[#183b2b]">
                    {formatNumber(results.phosphorusChemPumpLh, precision)} L/h
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Công thức & Hướng dẫn kỹ thuật */}
          <div className="p-4 bg-white rounded-xl border border-[#cfdcd4] shadow-xs space-y-2 text-xs text-[#51675a]">
            <h4 className="font-bold text-xs text-[#183b2b] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#176b45]" />
              <span>Cơ sở lý thuyết & Công thức tính toán (TCVN & Metcalf & Eddy):</span>
            </h4>
            <div className="space-y-1 pl-2 font-mono text-[11px] text-[#334e3f]">
              <p>• Nhu cầu Nitơ: N_req = (Q × BOD₅ × (rN / rBOD)) / 1000  [kg N/ngày]</p>
              <p>• Nhu cầu Phốt pho: P_req = (Q × BOD₅ × (rP / rBOD)) / 1000  [kg P/ngày]</p>
              <p>• Lượng hóa chất = ΔN / (% Hoạt tính nguyên chất × Độ tinh khiết)</p>
              <p>• Lưu lượng bơm định lượng: q_pump = (W_hóa_chất / (C_bồn × 1.0)) / T_bơm  [L/h]</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

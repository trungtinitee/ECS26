import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Copy, CheckCircle2, AlertTriangle, Layers, FileText, Check, ShieldAlert } from 'lucide-react';
import { formatNumber, getDecimalDigits } from '../../utils/calculations';
import {
  MbrCleaningInputs,
  MbrCleaningResults,
  calculateMbrCleaning,
} from '../../utils/operationCalculations';
import { NumericInput } from '../common/NumericInput';

interface MbrCleaningToolProps {
  onBack: () => void;
  designMembraneAreaM2?: number;
}

const STORAGE_KEY = 'ecs_op_mbr_cleaning_inputs';

export const MbrCleaningTool: React.FC<MbrCleaningToolProps> = ({
  onBack,
  designMembraneAreaM2 = 250,
}) => {
  const precision = getDecimalDigits();

  const [inputs, setInputs] = useState<MbrCleaningInputs>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      membraneAreaM2: designMembraneAreaM2,
      cleaningType: 'maintenance',
      chemicalAgent: 'naocl',
      chemicalStockConcentrationPercent: 10,
      specificSolutionVolumeLM2: 2.5,
      targetSolutionConcentrationPpm: 400,
      currentTmpKpa: 16,
      soakingDurationMinutes: 60,
    };
  });

  const [results, setResults] = useState<MbrCleaningResults>(() => calculateMbrCleaning(inputs));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const res = calculateMbrCleaning(inputs);
    setResults(res);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {}
  }, [inputs]);

  const handleCleaningTypeChange = (type: 'maintenance' | 'recovery') => {
    if (type === 'maintenance') {
      setInputs((prev) => ({
        ...prev,
        cleaningType: type,
        targetSolutionConcentrationPpm: prev.chemicalAgent === 'naocl' ? 400 : 1500,
        soakingDurationMinutes: 60,
      }));
    } else {
      setInputs((prev) => ({
        ...prev,
        cleaningType: type,
        targetSolutionConcentrationPpm: prev.chemicalAgent === 'naocl' ? 2000 : 3000,
        soakingDurationMinutes: 180,
      }));
    }
  };

  const handleChemicalAgentChange = (agent: 'naocl' | 'citric_acid' | 'oxalic_acid') => {
    const isMaintenance = inputs.cleaningType === 'maintenance';
    let defaultPpm = 400;
    let defaultStockConc = 10;

    if (agent === 'naocl') {
      defaultPpm = isMaintenance ? 400 : 2000;
      defaultStockConc = 10;
    } else if (agent === 'citric_acid') {
      defaultPpm = isMaintenance ? 1500 : 3000;
      defaultStockConc = 99.5;
    } else {
      defaultPpm = isMaintenance ? 1000 : 2000;
      defaultStockConc = 99.0;
    }

    setInputs((prev) => ({
      ...prev,
      chemicalAgent: agent,
      chemicalStockConcentrationPercent: defaultStockConc,
      targetSolutionConcentrationPpm: defaultPpm,
    }));
  };

  const handleCopySummary = () => {
    const text = `[QUY TRÌNH & ĐỊNH LƯỢNG RỬA MÀNG MBR - ECS]
• Diện tích màng: ${formatNumber(inputs.membraneAreaM2, precision)} m²
• Chế độ rửa: ${inputs.cleaningType === 'maintenance' ? 'Rửa duy trì (Maintenance Cleaning)' : 'Rửa phục hồi (Recovery Cleaning)'}
• Tác nhân hóa chất: ${inputs.chemicalAgent === 'naocl' ? 'Javel NaOCl' : inputs.chemicalAgent === 'citric_acid' ? 'Axit Citric' : 'Axit Oxalic'}
• Nồng độ ngâm mục tiêu: ${formatNumber(inputs.targetSolutionConcentrationPpm, precision)} ppm (mg/L)
• Tổng dung dịch rửa cần chuẩn bị: ${formatNumber(results.totalSolutionVolumeM3, precision)} m³ (${formatNumber(results.totalSolutionVolumeLiters, precision)} Lít)
• Hóa chất gốc cần lấy: ${formatNumber(results.stockChemicalRequiredKg, precision)} kg (${formatNumber(results.stockChemicalRequiredLiters, precision)} Lít)
• Nước sạch cần nạp: ${formatNumber(results.waterVolumeM3, precision)} m³
• Lưu lượng bơm rửa ngược: ${formatNumber(results.backwashFlowRateM3H, precision)} m³/h
• Thời gian ngâm: ${inputs.soakingDurationMinutes} phút
• Tình trạng màng TMP = ${inputs.currentTmpKpa} kPa: ${results.foulingStatusText}`;
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
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm sm:text-base text-[#183b2b] truncate sm:whitespace-normal">Vận hành & Tính toán Rửa màng MBR</h2>
              <p className="text-[11px] sm:text-xs text-[#667a6e] line-clamp-1 sm:line-clamp-none">
                Quy trình ngâm rửa hóa chất định kỳ (MC) và phục hồi sâu (RC) duy trì thông lượng lọc và kiểm soát áp suất TMP
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setInputs((prev) => ({ ...prev, membraneAreaM2: designMembraneAreaM2 }))}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-[#cfdcd4] bg-white hover:bg-[#edf5f0] text-xs font-medium text-[#465d50] transition-colors cursor-pointer"
            title="Lấy diện tích màng từ thiết kế bể MBR"
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
            <span>{copied ? 'Đã sao chép!' : 'Sao chép quy trình'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs Left, Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card: Chế độ rửa & Áp suất TMP */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#176b45]" />
              <span>1. Chế độ rửa & Trạng thái màng</span>
            </h3>

            {/* Chế độ rửa */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCleaningTypeChange('maintenance')}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  inputs.cleaningType === 'maintenance'
                    ? 'bg-[#eaf4ee] border-[#176b45] ring-2 ring-[#176b45]/15'
                    : 'bg-white border-[#d2ded6] hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-xs text-[#183b2b]">Rửa duy trì (MC)</div>
                <div className="text-[10px] text-[#63776d] mt-0.5">1-2 lần/tuần, ngâm 30-60 phút</div>
              </button>

              <button
                type="button"
                onClick={() => handleCleaningTypeChange('recovery')}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  inputs.cleaningType === 'recovery'
                    ? 'bg-[#eaf4ee] border-[#176b45] ring-2 ring-[#176b45]/15'
                    : 'bg-white border-[#d2ded6] hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-xs text-[#183b2b]">Rửa phục hồi (RC)</div>
                <div className="text-[10px] text-[#63776d] mt-0.5">1-3 tháng/lần, ngâm 2-4 giờ</div>
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[#43594d] font-medium mb-1">Tổng diện tích bề mặt màng Am (m²):</label>
                <NumericInput
                  step={1}
                  min={1}
                  value={inputs.membraneAreaM2}
                  fallbackValue={10}
                  onChange={(val) => setInputs({ ...inputs, membraneAreaM2: val ?? 10 })}
                  className="w-full px-3 py-2 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">Áp suất xuyên màng TMP (kPa):</label>
                  <NumericInput
                    step={1}
                    min={0}
                    value={inputs.currentTmpKpa}
                    fallbackValue={0}
                    onChange={(val) => setInputs({ ...inputs, currentTmpKpa: val ?? 0 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">TMP bình thường 10 - 25 kPa</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">Thời gian ngâm hóa chất (phút):</label>
                  <NumericInput
                    step={5}
                    min={5}
                    value={inputs.soakingDurationMinutes}
                    fallbackValue={60}
                    onChange={(val) => setInputs({ ...inputs, soakingDurationMinutes: Math.round(val ?? 60) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Hóa chất & Nồng độ ngâm */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b] flex items-center gap-2">
              <span className="font-bold font-mono text-[#176b45]">🧪</span>
              <span>2. Lựa chọn hóa chất ngâm rửa</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[#43594d] font-medium mb-1">Tác nhân hóa chất:</label>
                <select
                  value={inputs.chemicalAgent}
                  onChange={(e) => handleChemicalAgentChange(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-[#cfdcd4] bg-white font-medium text-xs text-[#183b2b]"
                >
                  <option value="naocl">Javel NaOCl (Khử cặn bẩn hữu cơ, vi sinh & biofilm màng)</option>
                  <option value="citric_acid">Axit Citric C6H8O7 (Tẩy rửa cặn khoáng vô cơ, kết tủa kim loại)</option>
                  <option value="oxalic_acid">Axit Oxalic H2C2O4 (Chuyên xử lý cáu cặn sắt Fe/Mangan)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">Nồng độ ngâm mục tiêu (ppm):</label>
                  <NumericInput
                    step={50}
                    min={10}
                    value={inputs.targetSolutionConcentrationPpm}
                    fallbackValue={300}
                    onChange={(val) => setInputs({ ...inputs, targetSolutionConcentrationPpm: val ?? 300 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">
                    {inputs.cleaningType === 'maintenance' ? 'MC: 300 - 500 ppm' : 'RC: 1000 - 3000 ppm'}
                  </span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">Nồng độ hóa chất gốc (%):</label>
                  <NumericInput
                    step={1}
                    min={0.1}
                    max={100}
                    value={inputs.chemicalStockConcentrationPercent}
                    fallbackValue={10}
                    onChange={(val) => setInputs({ ...inputs, chemicalStockConcentrationPercent: val ?? 10 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Javel ~ 10%, Citric ~ 99%</span>
                </div>
              </div>

              <div>
                <label className="block text-[#43594d] font-medium mb-1">
                  Suất thể tích dung dịch ngâm (L/m² màng):
                </label>
                <NumericInput
                  step={0.1}
                  min={0.5}
                  value={inputs.specificSolutionVolumeLM2}
                  fallbackValue={2.5}
                  onChange={(val) => setInputs({ ...inputs, specificSolutionVolumeLM2: val ?? 2.5 })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] font-mono text-sm"
                />
                <span className="text-[10px] text-[#718779]">Chuẩn thông dụng 2.0 - 2.5 L dung dịch / 1 m² màng</span>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-7 space-y-4">
          {/* Status TMP Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            results.foulingStatus === 'severe'
              ? 'bg-rose-50 border-rose-200'
              : results.foulingStatus === 'moderate'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}>
            {results.foulingStatus === 'severe' ? (
              <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            ) : results.foulingStatus === 'moderate' ? (
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed text-[#2c4737]">
              <strong className="block text-[#183b2b] uppercase tracking-wide text-[11px] mb-0.5">
                Đánh giá áp suất xuyên màng TMP ({inputs.currentTmpKpa} kPa):
              </strong>
              {results.foulingStatusText}
            </div>
          </div>

          {/* Card: Bảng khối lượng hóa chất cần chuẩn bị */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b] pb-2 border-b border-[#e5eee8]">
              Khối lượng Hóa chất & Nước sạch cần chuẩn bị cho 1 chu kỳ rửa
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-[#f8faf8] border border-[#dce7e1] rounded-lg">
                <span className="text-[10px] text-[#718779] block">Tổng dung dịch rửa</span>
                <strong className="font-mono text-base text-[#176b45]">{formatNumber(results.totalSolutionVolumeM3, precision)} m³</strong>
                <span className="text-[10px] text-[#6d8276] block mt-0.5">({formatNumber(results.totalSolutionVolumeLiters, precision)} Lít)</span>
              </div>

              <div className="p-3 bg-[#f8faf8] border border-[#dce7e1] rounded-lg">
                <span className="text-[10px] text-[#718779] block">Hóa chất gốc cần lấy</span>
                <strong className="font-mono text-base text-amber-800">{formatNumber(results.stockChemicalRequiredKg, precision)} kg</strong>
                <span className="text-[10px] text-[#6d8276] block mt-0.5">({formatNumber(results.stockChemicalRequiredLiters, precision)} Lít)</span>
              </div>

              <div className="p-3 bg-[#f8faf8] border border-[#dce7e1] rounded-lg">
                <span className="text-[10px] text-[#718779] block">Nước sạch hòa tan</span>
                <strong className="font-mono text-base text-blue-700">{formatNumber(results.waterVolumeM3, precision)} m³</strong>
                <span className="text-[10px] text-[#6d8276] block mt-0.5">Nạp vào bồn pha</span>
              </div>

              <div className="p-3 bg-[#f8faf8] border border-[#dce7e1] rounded-lg">
                <span className="text-[10px] text-[#718779] block">Lưu lượng bơm rửa</span>
                <strong className="font-mono text-base text-[#183b2b]">{formatNumber(results.backwashFlowRateM3H, precision)} m³/h</strong>
                <span className="text-[10px] text-[#6d8276] block mt-0.5">Bơm ngâm 30 phút</span>
              </div>
            </div>
          </div>

          {/* Card: Quy trình thao tác rửa màng chuẩn kỹ thuật */}
          <div className="bg-white p-4 rounded-xl border border-[#cfdcd4] shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#183b2b] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#176b45]" />
              <span>Quy trình thao tác rửa màng 6 bước chuẩn kỹ thuật:</span>
            </h3>

            <div className="space-y-2 text-xs">
              {results.cleaningProcedure.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-[#fbfdfb] border border-[#e8efe9]">
                  <span className="w-5 h-5 rounded-full bg-[#eaf4ee] text-[#176b45] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-[#3b5345] leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

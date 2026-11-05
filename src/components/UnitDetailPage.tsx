import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Calculator,
  Layers,
  Wrench,
  HelpCircle,
  X,
} from 'lucide-react';
import {
  TechnologyUnit,
  UnitTab,
  UnitGeometry,
  PumpWellData,
  EqualizationTankData,
  AerotankData,
  SecondaryClarifierData,
  DisinfectionTankData,
  AnoxicTankData,
  SludgeTankData,
  GenericUnitData,
} from '../types/ecs';
import {
  formatNumber,
  roundTo,
  calculatePumpWell,
  calculateEqualization,
  calculateAerotank,
  updateAutoPumpDimensions,
  updateAutoEqualizationDimensions,
  defaultPumpWellData,
  defaultEqualizationData,
  defaultAerotankData,
  defaultSecondaryClarifierData,
  defaultDisinfectionData,
  defaultAnoxicData,
  defaultSludgeTankData,
  defaultGenericUnitData,
} from '../utils/calculations';
import { AerotankSection } from './units/AerotankSection';
import { ClarifierSection } from './units/ClarifierSection';
import { DisinfectionSection } from './units/DisinfectionSection';
import { AnoxicSection } from './units/AnoxicSection';
import { SludgeTankSection } from './units/SludgeTankSection';
import { GenericUnitSection } from './units/GenericUnitSection';
import { MechanicalUnitsSection } from './units/MechanicalUnitsSection';
import { PhysChemUnitsSection } from './units/PhysChemUnitsSection';
import { AdvancedBioSection } from './units/AdvancedBioSection';
import { ClarifierFiltrationSection } from './units/ClarifierFiltrationSection';
import { NumericInput } from './common/NumericInput';

interface UnitDetailPageProps {
  unit: TechnologyUnit;
  qPeakHour: number;
  qAverageDay: number;
  bodIn: number;
  codIn?: number;
  onUpdateUnitData: (unitId: string, updatedData: any, status: 'pending' | 'done') => void;
  onBack: () => void;
}

export const UnitDetailPage: React.FC<UnitDetailPageProps> = ({
  unit,
  qPeakHour,
  qAverageDay,
  bodIn,
  codIn = 500,
  onUpdateUnitData,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<UnitTab>('input');
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [formulaDetails, setFormulaDetails] = useState<{ title: string; lines: string[] }>({
    title: '',
    lines: [],
  });
  const [, setPrecisionTick] = useState(0);

  useEffect(() => {
    const handler = () => setPrecisionTick((t) => t + 1);
    window.addEventListener('ecs-decimal-precision-changed', handler);
    return () => window.removeEventListener('ecs-decimal-precision-changed', handler);
  }, []);

  const showFormula = (title: string, lines: string[]) => {
    setFormulaDetails({ title, lines });
    setFormulaModalOpen(true);
  };

  // Determine unit type
  const isPumpWell = unit.catalogName === 'Hầm bơm';
  const isEqualization = unit.catalogName === 'Bể điều hòa';
  const isAerotank = unit.catalogName === 'Bể Aerotank';
  const isSecondaryClarifier = unit.catalogName === 'Bể lắng sinh học';
  const isDisinfection = unit.catalogName === 'Bể khử trùng';
  const isAnoxic = unit.catalogName === 'Bể Anoxic';
  const isSludgeTank = ['Bể chứa bùn', 'Bể nén bùn'].includes(unit.catalogName);
  const isMechanical = ['Song chắn rác', 'Bể lắng cát', 'Bể tách dầu mỡ'].includes(unit.catalogName);
  const isPhysChem = ['Bể phản ứng', 'Bể keo tụ', 'Bể tạo bông', 'Bể tuyển nổi DAF'].includes(unit.catalogName);
  const isAdvancedBio = ['Bể SBR', 'Bể MBR', 'Bể MBBR', 'Bể UASB'].includes(unit.catalogName);
  const isClarifierFiltration = ['Bể lắng hóa lý', 'Bể lọc áp lực', 'Lọc than hoạt tính', 'Máy ép bùn'].includes(unit.catalogName);
  const isGeneric =
    !isPumpWell &&
    !isEqualization &&
    !isAerotank &&
    !isSecondaryClarifier &&
    !isDisinfection &&
    !isAnoxic &&
    !isSludgeTank &&
    !isMechanical &&
    !isPhysChem &&
    !isAdvancedBio &&
    !isClarifierFiltration;

  // Ensure default data exists and sanitize against floating-point precision leaks
  const rawPump = unit.data?.pumpWell || defaultPumpWellData(qPeakHour);
  const pumpData: PumpWellData = {
    ...rawPump,
    qmaxh: rawPump.qmaxh !== null && rawPump.qmaxh !== undefined ? roundTo(rawPump.qmaxh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
    width: roundTo(rawPump.width, 2),
    length: roundTo(rawPump.length, 2),
    diameter: roundTo(rawPump.diameter, 2),
    waterDepth: roundTo(rawPump.waterDepth, 2),
    freeboard: roundTo(rawPump.freeboard, 2),
  };

  const rawEq = unit.data?.equalizationTank || defaultEqualizationData(qAverageDay > 0 ? roundTo(qAverageDay / 24, 2) : 5);
  const eqData: EqualizationTankData = {
    ...rawEq,
    qHour: rawEq.qHour !== null && rawEq.qHour !== undefined ? roundTo(rawEq.qHour, 2) : (qAverageDay > 0 ? roundTo(qAverageDay / 24, 2) : null),
    width: roundTo(rawEq.width, 2),
    length: roundTo(rawEq.length, 2),
    waterDepth: roundTo(rawEq.waterDepth, 2),
    freeboard: roundTo(rawEq.freeboard, 2),
    mixingPowerRate: roundTo(rawEq.mixingPowerRate, 2),
    airSupplyRate: roundTo(rawEq.airSupplyRate, 2),
    pumpHead: roundTo(rawEq.pumpHead, 2),
  };

  const rawAero = unit.data?.aerotank || defaultAerotankData(qAverageDay, bodIn);
  const aeroData: AerotankData = {
    ...rawAero,
    q: rawAero.q !== null && rawAero.q !== undefined ? roundTo(rawAero.q, 2) : (qAverageDay ? roundTo(qAverageDay, 2) : null),
    length: roundTo(rawAero.length, 2),
    width: roundTo(rawAero.width, 2),
    waterDepth: roundTo(rawAero.waterDepth, 2),
    freeboard: roundTo(rawAero.freeboard, 2),
  };

  const rawClarifier = unit.data?.secondaryClarifier || defaultSecondaryClarifierData(qPeakHour);
  const clarifierData: SecondaryClarifierData = {
    ...rawClarifier,
    qh: rawClarifier.qh !== null && rawClarifier.qh !== undefined ? roundTo(rawClarifier.qh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
    diameter: roundTo(rawClarifier.diameter, 2),
    length: roundTo(rawClarifier.length, 2),
    width: roundTo(rawClarifier.width, 2),
    waterDepth: roundTo(rawClarifier.waterDepth, 2),
    freeboard: roundTo(rawClarifier.freeboard, 2),
  };

  const rawDisinfection = unit.data?.disinfectionTank || defaultDisinfectionData(qPeakHour);
  const disinfectionData: DisinfectionTankData = {
    ...rawDisinfection,
    qh: rawDisinfection.qh !== null && rawDisinfection.qh !== undefined ? roundTo(rawDisinfection.qh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
    length: roundTo(rawDisinfection.length, 2),
    width: roundTo(rawDisinfection.width, 2),
    waterDepth: roundTo(rawDisinfection.waterDepth, 2),
    freeboard: roundTo(rawDisinfection.freeboard, 2),
  };

  const rawAnoxic = unit.data?.anoxicTank || defaultAnoxicData(qAverageDay > 0 ? roundTo(qAverageDay / 24, 2) : 5);
  const anoxicData: AnoxicTankData = {
    ...rawAnoxic,
    qHour: rawAnoxic.qHour !== null && rawAnoxic.qHour !== undefined ? roundTo(rawAnoxic.qHour, 2) : (qAverageDay > 0 ? roundTo(qAverageDay / 24, 2) : null),
    length: roundTo(rawAnoxic.length, 2),
    width: roundTo(rawAnoxic.width, 2),
    waterDepth: roundTo(rawAnoxic.waterDepth, 2),
    freeboard: roundTo(rawAnoxic.freeboard, 2),
  };

  const aeroResForSludge = calculateAerotank(aeroData);
  const rawSludge = unit.data?.sludgeTank || defaultSludgeTankData(aeroResForSludge.excessSludgeM3Day || 2.5);
  const sludgeData: SludgeTankData = {
    ...rawSludge,
    sludgeVolumePerDay:
      rawSludge.sludgeVolumePerDay !== null && rawSludge.sludgeVolumePerDay !== undefined
        ? roundTo(rawSludge.sludgeVolumePerDay, 2)
        : (aeroResForSludge.excessSludgeM3Day ? roundTo(aeroResForSludge.excessSludgeM3Day, 2) : 2.5),
    length: roundTo(rawSludge.length, 2),
    width: roundTo(rawSludge.width, 2),
    diameter: roundTo(rawSludge.diameter, 2),
    waterDepth: roundTo(rawSludge.waterDepth, 2),
    freeboard: roundTo(rawSludge.freeboard, 2),
    hopperDepth: roundTo(rawSludge.hopperDepth, 2),
  };

  const rawGeneric = unit.data?.genericUnit || defaultGenericUnitData(unit.catalogName, qPeakHour, qAverageDay);
  const genericData: GenericUnitData = {
    ...rawGeneric,
    flowRate: rawGeneric.flowRate !== null && rawGeneric.flowRate !== undefined ? roundTo(rawGeneric.flowRate, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
    length: roundTo(rawGeneric.length, 2),
    width: roundTo(rawGeneric.width, 2),
    diameter: roundTo(rawGeneric.diameter, 2),
    waterDepth: roundTo(rawGeneric.waterDepth, 2),
    freeboard: roundTo(rawGeneric.freeboard, 2),
  };

  // ----------------- PUMP WELL HANDLERS -----------------
  const handlePumpChange = (updates: Partial<typeof pumpData>) => {
    const merged = { ...pumpData, ...updates };
    const autoAdjusted = updateAutoPumpDimensions(merged);
    const res = calculatePumpWell(autoAdjusted);
    onUpdateUnitData(
      unit.id,
      { ...unit.data, pumpWell: autoAdjusted },
      res.valid && res.pass ? 'done' : 'pending'
    );
  };

  const handlePumpDimensionDirectChange = (updates: Partial<typeof pumpData>) => {
    const merged = { ...pumpData, ...updates, dimensionsOverride: true };
    const res = calculatePumpWell(merged);
    onUpdateUnitData(
      unit.id,
      { ...unit.data, pumpWell: merged },
      res.valid && res.pass ? 'done' : 'pending'
    );
  };

  const resetPumpQmaxh = () => {
    const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 10;
    handlePumpChange({ qmaxh: qh, qmaxhOverride: false });
  };

  const pumpResult = calculatePumpWell(pumpData);

  // ----------------- EQUALIZATION HANDLERS -----------------
  const handleEqChange = (updates: Partial<typeof eqData>) => {
    const merged = { ...eqData, ...updates };
    const autoAdjusted = updateAutoEqualizationDimensions(merged);
    const res = calculateEqualization(autoAdjusted);
    onUpdateUnitData(
      unit.id,
      { ...unit.data, equalizationTank: autoAdjusted },
      res.valid && res.pass ? 'done' : 'pending'
    );
  };

  const handleEqDimensionDirectChange = (updates: Partial<typeof eqData>) => {
    const merged = { ...eqData, ...updates, dimensionsOverride: true };
    const res = calculateEqualization(merged);
    onUpdateUnitData(
      unit.id,
      { ...unit.data, equalizationTank: merged },
      res.valid && res.pass ? 'done' : 'pending'
    );
  };

  const resetEqQh = () => {
    const qh = qAverageDay > 0 ? roundTo(qAverageDay / 24, 2) : 5;
    handleEqChange({ qHour: qh, qHourOverride: false });
  };

  const eqResult = calculateEqualization(eqData);

  // ----------------- AEROTANK HANDLERS -----------------
  const handleAeroChange = (updates: Partial<typeof aeroData>) => {
    const merged = { ...aeroData, ...updates };
    const res = calculateAerotank(merged);
    onUpdateUnitData(
      unit.id,
      { ...unit.data, aerotank: merged },
      res.valid && res.pass ? 'done' : 'pending'
    );
  };
  const aeroResult = calculateAerotank(aeroData);

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 pb-20 animate-fadeIn space-y-6">
      {/* Top back action */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Quay lại danh sách công trình</span>
        </button>
      </div>

      {/* Intro Header */}
      <div className="bg-gradient-to-br from-[#f2f7f4] to-[#e7f0ea] border border-[#d3dfd7] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#193d2c]">{unit.name}</h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#176b45] text-white">
              {unit.catalogName}
            </span>
          </div>
          <p className="text-xs text-[#5d7366] mt-0.5">
            {isPumpWell
              ? 'Tính toán thông thủy hầm bơm, kiểm tra thể tích chứa và công suất bơm chìm.'
              : isEqualization
              ? 'Tính toán thời gian lưu, thể tích điều hòa và công suất khuấy trộn/sục khí.'
              : isAerotank
              ? 'Tính toán thể tích bể sinh học hiếu khí theo F/M, nhu cầu oxy và đĩa cấp khí.'
              : isSecondaryClarifier
              ? 'Tính toán tải trọng bề mặt thủy lực q₀, cầu gạt bùn và máng thu nước răng cưa.'
              : isDisinfection
              ? 'Tính toán thời gian tiếp xúc khử trùng, liều lượng Clo và bơm định lượng Javel.'
              : isAnoxic
              ? 'Tính toán thời gian lưu thiếu khí HRT, tỷ lệ tuần hoàn Nitrat và máy khuấy chìm.'
              : isSludgeTank
              ? 'Tính toán dung tích lưu trữ bùn, bùn nén trọng lực và bơm trục vít ép bùn.'
              : `Tính toán thông số công nghệ, kích thước hình học và thiết bị cho ${unit.catalogName}.`}
          </p>
        </div>

        {/* 4 Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 p-1 bg-[#dbe8df] rounded-xl border border-[#c8d8cd] shrink-0 gap-1">
          {(['input', 'calc', 'dimensions', 'equipment'] as UnitTab[]).map((tab) => {
            const labels: Record<UnitTab, string> = {
              input: 'Đầu vào',
              calc: 'Tính toán',
              dimensions: 'Kích thước',
              equipment: 'Thiết bị',
            };
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                  isActive
                    ? 'bg-white text-[#176b45] shadow-xs'
                    : 'text-[#486354] hover:text-[#183a2a]'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CASE 1: HẦM BƠM (PUMP WELL) */}
      {/* ========================================================================= */}
      {isPumpWell && (
        <div className="space-y-6">
          {/* TAB 1: ĐẦU VÀO */}
          {activeTab === 'input' && (
            <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#183b2b]">Thông số đầu vào hầm bơm</h2>
                  <p className="text-xs text-[#63776d]">
                    Lưu lượng giờ đỉnh liên kết từ Tải lượng hoặc nhập giá trị riêng
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetPumpQmaxh}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>↻ Lấy lại Q<sub>maxh</sub> từ Tải lượng</span>
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Lưu lượng giờ đỉnh Q<sub>maxh</sub> (m³/giờ)
                    </label>
                    <NumericInput
                      allowNull
                      value={pumpData.qmaxh}
                      onChange={(val) =>
                        handlePumpChange({
                          qmaxh: val === null ? null : roundTo(val, 2),
                          qmaxhOverride: true,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                    />
                    <span className="text-[10px] text-[#708477]">
                      {pumpData.qmaxhOverride
                        ? 'Đang dùng giá trị nhập riêng'
                        : `Liên kết từ Tải lượng (${formatNumber(qPeakHour)} m³/h)`}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Thời gian tích nước giữa 2 lần bơm t (phút)
                    </label>
                    <NumericInput
                      min={1}
                      defaultValue={30}
                      value={pumpData.storageMinutes}
                      onChange={(val) => handlePumpChange({ storageMinutes: val })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                    />
                    <span className="text-[10px] text-[#708477]">Tiêu chuẩn thiết kế: 15 – 30 phút</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Chiều sâu nước hữu dụng H (m)
                    </label>
                    <NumericInput
                      step="0.1"
                      min={0.5}
                      defaultValue={2.0}
                      value={pumpData.waterDepth}
                      onChange={(val) => handlePumpChange({ waterDepth: val })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                    />
                    <span className="text-[10px] text-[#708477]">Thường chọn từ 1.5 – 3.0 m</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Chiều cao an toàn / bảo vệ (m)
                    </label>
                    <NumericInput
                      step="0.05"
                      min={0}
                      defaultValue={0.3}
                      value={pumpData.freeboard}
                      onChange={(val) => handlePumpChange({ freeboard: val })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                    />
                    <span className="text-[10px] text-[#708477]">Khoảng cách chống tràn: 0.3 – 0.5 m</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Hình dạng công trình
                    </label>
                    <select
                      value={pumpData.geometry}
                      onChange={(e) =>
                        handlePumpChange({
                          geometry: e.target.value as UnitGeometry,
                          dimensionsOverride: false,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-medium"
                    >
                      <option value="square">Hình vuông (L = B)</option>
                      <option value="rectangle">Hình chữ nhật (L × B)</option>
                      <option value="circle">Hình tròn (Đường kính D)</option>
                    </select>
                  </div>

                  {pumpData.geometry === 'rectangle' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#234333]">
                        Chiều rộng thông thủy B (m)
                      </label>
                      <NumericInput
                        step="0.1"
                        min={0.5}
                        defaultValue={1.5}
                        value={pumpData.width}
                        onChange={(val) => handlePumpChange({ width: val })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TÍNH TOÁN */}
          {activeTab === 'calc' && (
            <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#183b2b]">Kết quả tính toán thể tích hầm bơm</h2>
                  <p className="text-xs text-[#63776d]">
                    Kiểm tra độ đáp ứng giữa thể tích yêu cầu và thể tích hình học thực tế
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    showFormula('Cơ sở tính toán hầm bơm', [
                      '1. Thể tích yêu cầu: V_req = Qmaxh × t / 60 (m³)',
                      `2. Thay số: V_req = ${formatNumber(pumpData.qmaxh)} × ${formatNumber(
                        pumpData.storageMinutes
                      )} / 60 = ${formatNumber(pumpResult.required)} m³`,
                      '3. Thể tích hình học thực tế: V_thực = S_đáy × H_nước (m³)',
                      '4. Điều kiện đạt: V_thực ≥ V_req.',
                      '5. Chiều cao tổng thành bể: H_tổng = H_nước + Chiều cao bảo vệ (m).',
                    ])
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-[#f5f8f6] text-[#244f37] text-xs font-semibold hover:bg-[#eaf3ee]"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Xem công thức</span>
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Status banner */}
                <div
                  className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-3 ${
                    pumpResult.pass
                      ? 'bg-[#e7f3ec] border-[#b8dbc3] text-[#176b45]'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {pumpResult.pass ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-[#176b45]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {pumpResult.pass
                        ? 'ĐẠT YÊU CẦU THIẾT KẾ'
                        : 'CHƯA ĐẠT: THỂ TÍCH HÌNH HỌC NHỎ HƠN YÊU CẦU'}
                    </div>
                    <div className="font-normal mt-0.5">
                      {pumpResult.pass
                        ? `Thể tích hình học (${formatNumber(
                            pumpResult.actual
                          )} m³) đáp ứng ${formatNumber(pumpResult.ratio * 100)}% dung tích yêu cầu (${formatNumber(
                            pumpResult.required
                          )} m³).`
                        : `Thiếu ${formatNumber(
                            pumpResult.deficit
                          )} m³ so với yêu cầu. Vui lòng tăng kích thước ở tab Kích thước.`}
                    </div>
                  </div>
                </div>

                {/* Calculation Table */}
                <div className="border border-[#e2ede6] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#f3f7f4] border-b border-[#e2ece5] text-[#4d6356] font-bold">
                        <th className="py-3 px-5">Đại lượng tính toán</th>
                        <th className="py-3 px-5 text-right">Giá trị</th>
                        <th className="py-3 px-5 text-right">Đơn vị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf3ef] text-[#20362b]">
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-3 px-5">Lưu lượng giờ đỉnh tính toán Q<sub>maxh</sub></td>
                        <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                          {formatNumber(pumpData.qmaxh)}
                        </td>
                        <td className="py-3 px-5 text-right text-[#728578]">m³/giờ</td>
                      </tr>
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-3 px-5">Thời gian lưu tích nước giữa 2 lần bơm (t)</td>
                        <td className="py-3 px-5 text-right font-bold tabular-nums">
                          {formatNumber(pumpData.storageMinutes)}
                        </td>
                        <td className="py-3 px-5 text-right text-[#728578]">phút</td>
                      </tr>
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-3 px-5 font-bold text-[#183b2b]">Thể tích hữu ích yêu cầu (V<sub>req</sub>)</td>
                        <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                          {formatNumber(pumpResult.required)}
                        </td>
                        <td className="py-3 px-5 text-right text-[#728578]">m³</td>
                      </tr>
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-3 px-5 font-bold text-[#183b2b]">Thể tích hình học thực tế (V<sub>thực</sub>)</td>
                        <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#183a2a]">
                          {formatNumber(pumpResult.actual)}
                        </td>
                        <td className="py-3 px-5 text-right text-[#728578]">m³</td>
                      </tr>
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-3 px-5">Tỷ lệ đáp ứng thể tích</td>
                        <td className="py-3 px-5 text-right font-bold tabular-nums">
                          {formatNumber(pumpResult.ratio * 100)}%
                        </td>
                        <td className="py-3 px-5 text-right text-[#728578]">—</td>
                      </tr>
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-3 px-5">Chiều cao tổng công trình H<sub>tổng</sub></td>
                        <td className="py-3 px-5 text-right font-bold tabular-nums">
                          {formatNumber(pumpResult.totalHeight)}
                        </td>
                        <td className="py-3 px-5 text-right text-[#728578]">m</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KÍCH THƯỚC */}
          {activeTab === 'dimensions' && (
            <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#183b2b]">Kích thước thông thủy hầm bơm</h2>
                  <p className="text-xs text-[#63776d]">
                    Kích thước lọt lòng trong công trình, chưa bao gồm chiều dày kết cấu BTCT
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    showFormula('Công thức hình học hầm bơm', [
                      pumpData.geometry === 'square'
                        ? '• Hình vuông: Cạnh B = L = √(V / H)'
                        : pumpData.geometry === 'rectangle'
                        ? '• Hình chữ nhật: Chiều dài L = V / (B × H)'
                        : '• Hình tròn: Đường kính D = √(4 × V / (π × H))',
                      '• Chiều cao tổng thành bể: H_tổng = H_nước + H_bảo_vệ.',
                    ])
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-[#f5f8f6] text-[#244f37] text-xs font-semibold hover:bg-[#eaf3ee]"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Công thức</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pumpData.geometry === 'circle' ? (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#234333]">
                        Đường kính thông thủy D (m)
                      </label>
                      <NumericInput
                        min={0.5}
                        value={pumpData.diameter}
                        onChange={(val) =>
                          handlePumpDimensionDirectChange({
                            diameter: val,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                      />
                    </div>
                  ) : pumpData.geometry === 'rectangle' ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#234333]">
                          Chiều dài thông thủy L (m)
                        </label>
                        <NumericInput
                          min={0.5}
                          value={pumpData.length}
                          onChange={(val) =>
                            handlePumpDimensionDirectChange({
                              length: val,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#234333]">
                          Chiều rộng thông thủy B (m)
                        </label>
                        <NumericInput
                          min={0.5}
                          value={pumpData.width}
                          onChange={(val) =>
                            handlePumpDimensionDirectChange({
                              width: val,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#234333]">
                        Cạnh thông thủy L = B (m)
                      </label>
                      <NumericInput
                        min={0.5}
                        value={pumpData.width}
                        onChange={(val) => {
                          handlePumpDimensionDirectChange({ width: val, length: val });
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Chiều sâu nước hữu ích H (m)
                    </label>
                    <NumericInput
                      min={0.5}
                      value={pumpData.waterDepth}
                      onChange={(val) =>
                        handlePumpDimensionDirectChange({
                          waterDepth: val,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Chiều cao an toàn (m)
                    </label>
                    <NumericInput
                      min={0}
                      value={pumpData.freeboard}
                      onChange={(val) =>
                        handlePumpDimensionDirectChange({
                          freeboard: val,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                    />
                  </div>
                </div>

                {/* Dimension Comparison Table */}
                {(() => {
                  const autoDim = updateAutoPumpDimensions({ ...pumpData, dimensionsOverride: false });
                  return (
                    <div className="border border-[#e2ede6] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#f3f7f4] border-b border-[#e2ece5] text-[#4d6356] font-bold">
                            <th className="py-2.5 px-4">Thông số hình học</th>
                            <th className="py-2.5 px-4 text-right">Tính toán lý thuyết (m)</th>
                            <th className="py-2.5 px-4 text-right">Thực tế điều chỉnh (m)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#edf3ef] text-[#20362b]">
                          {pumpData.geometry === 'circle' ? (
                            <tr className="hover:bg-[#fbfdfc]">
                              <td className="py-2.5 px-4 font-semibold">Đường kính D (m)</td>
                              <td className="py-2.5 px-4 text-right tabular-nums text-[#677b6f]">
                                {formatNumber(autoDim.diameter)}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#176b45]">
                                {formatNumber(pumpData.diameter)}
                              </td>
                            </tr>
                          ) : pumpData.geometry === 'rectangle' ? (
                            <>
                              <tr className="hover:bg-[#fbfdfc]">
                                <td className="py-2.5 px-4 font-semibold">Chiều dài L (m)</td>
                                <td className="py-2.5 px-4 text-right tabular-nums text-[#677b6f]">
                                  {formatNumber(autoDim.length)}
                                </td>
                                <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#176b45]">
                                  {formatNumber(pumpData.length)}
                                </td>
                              </tr>
                              <tr className="hover:bg-[#fbfdfc]">
                                <td className="py-2.5 px-4 font-semibold">Chiều rộng B (m)</td>
                                <td className="py-2.5 px-4 text-right tabular-nums text-[#677b6f]">
                                  {formatNumber(autoDim.width)}
                                </td>
                                <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#176b45]">
                                  {formatNumber(pumpData.width)}
                                </td>
                              </tr>
                            </>
                          ) : (
                            <tr className="hover:bg-[#fbfdfc]">
                              <td className="py-2.5 px-4 font-semibold">Cạnh vuông L = B (m)</td>
                              <td className="py-2.5 px-4 text-right tabular-nums text-[#677b6f]">
                                {formatNumber(autoDim.width)}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#176b45]">
                                {formatNumber(pumpData.width)}
                              </td>
                            </tr>
                          )}
                          <tr className="hover:bg-[#fbfdfc]">
                            <td className="py-2.5 px-4 font-semibold">Chiều sâu nước H (m)</td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-[#677b6f]">
                              {formatNumber(pumpData.waterDepth)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#176b45]">
                              {formatNumber(pumpData.waterDepth)}
                            </td>
                          </tr>
                          <tr className="hover:bg-[#fbfdfc]">
                            <td className="py-2.5 px-4 font-semibold">Chiều cao bảo vệ (m)</td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-[#677b6f]">
                              {formatNumber(pumpData.freeboard)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#176b45]">
                              {formatNumber(pumpData.freeboard)}
                            </td>
                          </tr>
                          <tr className="bg-[#f7faf8] font-bold">
                            <td className="py-2.5 px-4 text-[#176b45]">Chiều cao tổng thành bể H_tổng</td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-[#176b45]">
                              {formatNumber(pumpResult.totalHeight)}
                            </td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-[#176b45]">
                              {formatNumber(pumpResult.totalHeight)} m
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                <div className="p-4 rounded-xl bg-[#f4f8f5] border border-[#d6e5dc] text-xs text-[#3b5245] space-y-1">
                  <div className="font-bold text-[#183c2b]">
                    Tổng kết kích thước xây dựng lọt lòng:
                  </div>
                  <div>
                    {pumpData.geometry === 'circle'
                      ? `Đường kính D = ${formatNumber(pumpData.diameter)} m × Chiều sâu H_tổng = ${formatNumber(
                          pumpResult.totalHeight
                        )} m`
                      : `Chiều dài L = ${formatNumber(pumpData.length)} m × Chiều rộng B = ${formatNumber(
                          pumpData.width
                        )} m × Chiều sâu H_tổng = ${formatNumber(pumpResult.totalHeight)} m`}
                  </div>
                  <div className="text-[11px] text-[#6d8075]">
                    Thể tích thực tế đạt {formatNumber(pumpResult.actual)} m³ (yêu cầu {formatNumber(pumpResult.required)} m³).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: THIẾT BỊ */}
          {activeTab === 'equipment' && (
            <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị bơm chìm nước thải</h2>
                  <p className="text-xs text-[#63776d]">
                    Khuyến nghị thông số kỹ thuật phục vụ lập danh mục thiết bị (BOM)
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-[#d5e0d8] bg-[#fbfdfb] space-y-1">
                    <span className="text-[11px] font-semibold text-[#667a6e]">Lưu lượng mỗi bơm (Q)</span>
                    <div className="text-xl font-extrabold text-[#173a29] tabular-nums">
                      {formatNumber(pumpData.qmaxh)} m³/h
                    </div>
                    <span className="text-[10px] text-[#788e81]">Bằng lưu lượng giờ đỉnh Qmaxh</span>
                  </div>

                  <div className="p-4 rounded-xl border border-[#d5e0d8] bg-[#fbfdfb] space-y-1">
                    <span className="text-[11px] font-semibold text-[#667a6e]">Cột áp thiết kế ước tính (H)</span>
                    <div className="text-xl font-extrabold text-[#173a29] tabular-nums">8 – 12 m</div>
                    <span className="text-[10px] text-[#788e81]">Tùy độ sâu hầm và cao trình bể tiếp theo</span>
                  </div>

                  <div className="p-4 rounded-xl border border-[#d5e0d8] bg-[#fbfdfb] space-y-1">
                    <span className="text-[11px] font-semibold text-[#667a6e]">Số lượng bơm lắp đặt</span>
                    <div className="text-xl font-extrabold text-[#176b45] tabular-nums">
                      2 bơm (1 Hoạt động + 1 Dự phòng)
                    </div>
                    <span className="text-[10px] text-[#788e81]">Đổi luân phiên theo phao báo mức</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#f4f7f5] border border-[#d6e3da] text-xs text-[#415649] space-y-1.5">
                  <div className="font-bold text-[#183b2b] flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-[#176b45]" />
                    Phụ kiện đi kèm hầm bơm:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#546b5e]">
                    <li>Khớp nối tự động (Auto-coupling) và thanh trượt dẫn hướng inox 304</li>
                    <li>Cụm phao kiểm soát mức nước 3 vị trí (Mức dừng, Mức chạy 1 bơm, Mức sự cố/chạy 2 bơm)</li>
                    <li>Van một chiều cánh lật cao su và van khóa chặn gang dẻo D50 – D100</li>
                    <li>Nắp đậy đan composite / inox có thông hơi chống mùi hôi</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE 2: BỂ ĐIỀU HÒA (EQUALIZATION TANK) */}
      {/* ========================================================================= */}
      {isEqualization && (
        <div className="space-y-6">
          {/* TAB 1: ĐẦU VÀO */}
          {activeTab === 'input' && (
            <div className="space-y-5">
              {/* Card 1: Thông số thủy lực & Dung tích */}
              <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#183b2b]">Thông số thủy lực & thời gian lưu</h2>
                    <p className="text-xs text-[#63776d]">
                      Lưu lượng giờ liên kết từ Tải lượng và thời gian lưu nước thiết kế HRT
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetEqQh}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>↻ Lấy lại Q<sub>giờ</sub> từ Tải lượng</span>
                  </button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#234333]">
                        Lưu lượng giờ tính toán Q<sub>giờ</sub> (m³/h)
                      </label>
                      <NumericInput
                        allowNull
                        value={eqData.qHour}
                        onChange={(val) =>
                          handleEqChange({
                            qHour: val === null ? null : roundTo(val, 2),
                            qHourOverride: true,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                      />
                      <span className="text-[10px] text-[#708477]">
                        {eqData.qHourOverride
                          ? 'Đang dùng giá trị nhập riêng'
                          : `Liên kết từ Tải lượng (${formatNumber(qAverageDay / 24)} m³/h)`}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#234333]">
                        Thời gian lưu nước thiết kế HRT (giờ)
                      </label>
                      <NumericInput
                        step="0.5"
                        min={1}
                        max={48}
                        defaultValue={8}
                        value={eqData.hrtHours}
                        onChange={(val) => handleEqChange({ hrtHours: val })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                      />
                      <span className="text-[10px] text-[#708477]">
                        Tiêu chuẩn kỹ thuật: 6 – 12 giờ (nước thải sinh hoạt/công nghiệp)
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#234333]">
                        Chiều sâu nước hữu dụng H (m)
                      </label>
                      <NumericInput
                        step="0.1"
                        min={1}
                        max={10}
                        defaultValue={3.5}
                        value={eqData.waterDepth}
                        onChange={(val) => handleEqChange({ waterDepth: val })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                      />
                      <span className="text-[10px] text-[#708477]">Thường chọn từ 3.0 – 4.5 m</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#234333]">
                        Chiều cao bảo vệ / an toàn (m)
                      </label>
                      <NumericInput
                        step="0.05"
                        min={0}
                        defaultValue={0.5}
                        value={eqData.freeboard}
                        onChange={(val) => handleEqChange({ freeboard: val })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                      />
                      <span className="text-[10px] text-[#708477]">Khoảng cách chống tràn: 0.5 m</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#234333]">
                        Hình dạng công trình
                      </label>
                      <select
                        value={eqData.geometry}
                        onChange={(e) =>
                          handleEqChange({
                            geometry: e.target.value as UnitGeometry,
                            dimensionsOverride: false,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-medium"
                      >
                        <option value="rectangle">Hình chữ nhật (L × B)</option>
                        <option value="square">Hình vuông (L = B)</option>
                        <option value="circle">Hình tròn (Đường kính D)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Phương pháp xáo trộn & Bơm cấp */}
              <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb]">
                  <h2 className="text-sm font-bold text-[#183b2b]">Phương pháp xáo trộn & Bơm cấp</h2>
                  <p className="text-xs text-[#63776d]">
                    Chọn xáo trộn bằng máy khuấy chìm hoặc sục khí và thông số bơm cấp
                  </p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#234333]">
                        Hình thức xáo trộn chống lắng
                      </label>
                      <select
                        value={eqData.mixingMethod}
                        onChange={(e) =>
                          handleEqChange({ mixingMethod: e.target.value as any })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white font-semibold"
                      >
                        <option value="mixer">Máy khuấy chìm (Submersible Mixer)</option>
                        <option value="aeration">Sục khí bọt thô (Coarse Bubble Aeration)</option>
                      </select>
                    </div>

                    {eqData.mixingMethod === 'mixer' ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-[#234333]">
                            Suất năng lượng khuấy trộn (W/m³)
                          </label>
                          <NumericInput
                            min={5}
                            max={25}
                            value={eqData.mixingPowerRate}
                            onChange={(val) =>
                              handleEqChange({ mixingPowerRate: val })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                          />
                          <span className="text-[10px] text-[#708477]">Khuyến nghị: 10 – 15 W/m³</span>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-[#234333]">
                            Số lượng máy khuấy chìm
                          </label>
                          <NumericInput
                            min={1}
                            max={6}
                            value={eqData.numMixers}
                            onChange={(val) =>
                              handleEqChange({ numMixers: Math.round(val) })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                          />
                          <span className="text-[10px] text-[#708477]">1 máy cho bể &lt;160m³; 2 máy cho bể lớn hơn</span>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#234333]">
                          Suất cấp khí xáo trộn (m³ khí / m³ bể / giờ)
                        </label>
                        <NumericInput
                          min={0.4}
                          max={2.0}
                          value={eqData.airSupplyRate}
                          onChange={(val) =>
                            handleEqChange({ airSupplyRate: val })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                        />
                        <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 0.6 – 1.0 m³ khí/m³ bể.giờ</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#234333]">
                        Cột áp bơm nước thải H (m)
                      </label>
                      <NumericInput
                        min={5}
                        value={eqData.pumpHead}
                        onChange={(val) =>
                          handleEqChange({ pumpHead: val })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                      />
                      <span className="text-[10px] text-[#708477]">Bao gồm tổn thất áp suất & độ cao bể sau</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#234333]">
                        Số lượng bơm hoạt động
                      </label>
                      <NumericInput
                        min={1}
                        max={4}
                        value={eqData.numPumpsWork}
                        onChange={(val) =>
                          handleEqChange({ numPumpsWork: Math.round(val) })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#234333]">
                        Số lượng bơm dự phòng
                      </label>
                      <NumericInput
                        step={1}
                        min={1}
                        max={3}
                        value={eqData.numPumpsStandby}
                        fallbackValue={1}
                        onChange={(val) =>
                          handleEqChange({ numPumpsStandby: Math.round(val ?? 1) })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TÍNH TOÁN */}
          {activeTab === 'calc' && (
            <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#183b2b]">Kết quả tính toán Bể điều hòa</h2>
                  <p className="text-xs text-[#63776d]">
                    Dung tích yêu cầu, thời gian lưu thực tế và công suất động cơ thiết bị
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    showFormula('Cơ sở tính toán Bể điều hòa', [
                      '1. Thể tích hữu ích yêu cầu: V_req = Q_giờ × HRT (m³).',
                      `2. Thay số: V_req = ${formatNumber(eqData.qHour)} × ${formatNumber(
                        eqData.hrtHours
                      )} = ${formatNumber(eqResult.required)} m³.`,
                      '3. Thể tích hình học thực tế: V_thực = S_mặt × H_nước (m³).',
                      `4. Thời gian lưu thực tế: HRT_thực = V_thực / Q_giờ = ${formatNumber(
                        eqResult.actualHrt
                      )} giờ.`,
                      eqData.mixingMethod === 'mixer'
                        ? `5. Công suất khuấy: P = V_thực × ${eqData.mixingPowerRate} / 1000 = ${formatNumber(
                            eqResult.powerKwTotal
                          )} kW.`
                        : `5. Lưu lượng khí xáo trộn: Q_air = V_thực × ${eqData.airSupplyRate} = ${formatNumber(
                            eqResult.airFlowTotalM3h
                          )} m³/h (${formatNumber(eqResult.airFlowTotalM3min)} m³/phút).`,
                      `6. Công suất bơm nước thải: P_bơm = (ρ × g × Q × H) / (3600 × 1000 × η) × 1.25 = ${formatNumber(
                        eqResult.pumpPowerMotor
                      )} kW.`,
                    ])
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-[#f5f8f6] text-[#244f37] text-xs font-semibold hover:bg-[#eaf3ee]"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Xem công thức</span>
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Status banner */}
                <div
                  className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-3 ${
                    eqResult.pass
                      ? 'bg-[#e7f3ec] border-[#b8dbc3] text-[#176b45]'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {eqResult.pass ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-[#176b45]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {eqResult.pass
                        ? 'ĐẠT YÊU CẦU THIẾT KẾ DUNG TÍCH'
                        : 'CHƯA ĐẠT: THỂ TÍCH HÌNH HỌC NHỎ HƠN YÊU CẦU'}
                    </div>
                    <div className="font-normal mt-0.5">
                      {eqResult.pass
                        ? `Thể tích hình học (${formatNumber(
                            eqResult.actual
                          )} m³) đáp ứng ${formatNumber(eqResult.ratio * 100)}% dung tích yêu cầu (${formatNumber(
                            eqResult.required
                          )} m³). Thời gian lưu thực tế đạt ${formatNumber(eqResult.actualHrt)} giờ.`
                        : `Thiếu ${formatNumber(
                            eqResult.deficit
                          )} m³ so với dung tích yêu cầu. Vui lòng tăng kích thước chiều dài/rộng ở tab Kích thước.`}
                    </div>
                  </div>
                </div>

                {/* Calculation Table */}
                <div className="border border-[#e2ede6] rounded-xl overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead>
                      <tr className="bg-[#f3f7f4] border-b border-[#e2ece5] text-[#4d6356] font-bold">
                        <th className="py-3 px-5">Thông số tính toán</th>
                        <th className="py-3 px-5 text-right">Giá trị tính toán</th>
                        <th className="py-3 px-5 text-right">Đơn vị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf3ef] text-[#20362b]">
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-2.5 px-5">Lưu lượng giờ thiết kế Q<sub>giờ</sub></td>
                        <td className="py-2.5 px-5 text-right font-bold tabular-nums text-[#176b45]">
                          {formatNumber(eqData.qHour)}
                        </td>
                        <td className="py-2.5 px-5 text-right text-[#728578]">m³/giờ</td>
                      </tr>
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-2.5 px-5">Thời gian lưu nước thiết kế HRT</td>
                        <td className="py-2.5 px-5 text-right font-bold tabular-nums">
                          {formatNumber(eqData.hrtHours)}
                        </td>
                        <td className="py-2.5 px-5 text-right text-[#728578]">giờ</td>
                      </tr>
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-2.5 px-5 font-bold text-[#183b2b]">
                          Thể tích điều hòa yêu cầu (V<sub>req</sub>)
                        </td>
                        <td className="py-2.5 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                          {formatNumber(eqResult.required)}
                        </td>
                        <td className="py-2.5 px-5 text-right text-[#728578]">m³</td>
                      </tr>
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-2.5 px-5 font-bold text-[#183b2b]">
                          Thể tích hình học thực tế (V<sub>thực</sub>)
                        </td>
                        <td className="py-2.5 px-5 text-right font-extrabold tabular-nums text-[#183a2a]">
                          {formatNumber(eqResult.actual)}
                        </td>
                        <td className="py-2.5 px-5 text-right text-[#728578]">m³</td>
                      </tr>
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-2.5 px-5">Thời gian lưu nước thực tế (HRT<sub>thực</sub>)</td>
                        <td className="py-2.5 px-5 text-right font-bold tabular-nums text-[#176b45]">
                          {formatNumber(eqResult.actualHrt)}
                        </td>
                        <td className="py-2.5 px-5 text-right text-[#728578]">giờ</td>
                      </tr>
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-2.5 px-5">Tỷ lệ đáp ứng thể tích</td>
                        <td className="py-2.5 px-5 text-right font-bold tabular-nums">
                          {formatNumber(eqResult.ratio * 100)}%
                        </td>
                        <td className="py-2.5 px-5 text-right text-[#728578]">—</td>
                      </tr>

                      {eqData.mixingMethod === 'mixer' ? (
                        <>
                          <tr className="hover:bg-[#fbfdfc]">
                            <td className="py-2.5 px-5">Tổng công suất khuấy trộn yêu cầu</td>
                            <td className="py-2.5 px-5 text-right font-bold tabular-nums text-[#183a2a]">
                              {formatNumber(eqResult.powerKwTotal)}
                            </td>
                            <td className="py-2.5 px-5 text-right text-[#728578]">kW</td>
                          </tr>
                          <tr className="hover:bg-[#fbfdfc]">
                            <td className="py-2.5 px-5">Công suất mỗi máy khuấy chìm ({eqData.numMixers} máy)</td>
                            <td className="py-2.5 px-5 text-right font-bold tabular-nums text-[#176b45]">
                              {formatNumber(eqResult.powerPerMixer)}
                            </td>
                            <td className="py-2.5 px-5 text-right text-[#728578]">kW</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr className="hover:bg-[#fbfdfc]">
                            <td className="py-2.5 px-5">Lưu lượng khí cấp xáo trộn (giờ)</td>
                            <td className="py-2.5 px-5 text-right font-bold tabular-nums text-[#183a2a]">
                              {formatNumber(eqResult.airFlowTotalM3h)}
                            </td>
                            <td className="py-2.5 px-5 text-right text-[#728578]">m³/giờ</td>
                          </tr>
                          <tr className="hover:bg-[#fbfdfc]">
                            <td className="py-2.5 px-5">Lưu lượng khí cấp xáo trộn (phút)</td>
                            <td className="py-2.5 px-5 text-right font-bold tabular-nums text-[#176b45]">
                              {formatNumber(eqResult.airFlowTotalM3min)}
                            </td>
                            <td className="py-2.5 px-5 text-right text-[#728578]">m³/phút</td>
                          </tr>
                        </>
                      )}

                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-2.5 px-5">Lưu lượng mỗi bơm cấp nước thải ({eqData.numPumpsWork} bơm chạy)</td>
                        <td className="py-2.5 px-5 text-right font-bold tabular-nums text-[#183a2a]">
                          {formatNumber(eqResult.pumpFlowRate)}
                        </td>
                        <td className="py-2.5 px-5 text-right text-[#728578]">m³/giờ</td>
                      </tr>
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-2.5 px-5">Công suất động cơ mỗi bơm (ước tính)</td>
                        <td className="py-2.5 px-5 text-right font-bold tabular-nums text-[#176b45]">
                          {formatNumber(eqResult.pumpPowerMotor)}
                        </td>
                        <td className="py-2.5 px-5 text-right text-[#728578]">kW</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KÍCH THƯỚC */}
          {activeTab === 'dimensions' && (
            <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#183b2b]">Kích thước thông thủy Bể điều hòa</h2>
                  <p className="text-xs text-[#63776d]">
                    Kích thước lọt lòng trong công trình, chưa bao gồm chiều dày kết cấu bê tông cốt thép
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    showFormula('Công thức hình học Bể điều hòa', [
                      '• Diện tích mặt thoáng: S_mặt = V_req / H (m²).',
                      eqData.geometry === 'rectangle'
                        ? '• Hình chữ nhật: B = √(S_mặt / 2); L = S_mặt / B (tỷ lệ L/B ≈ 2 để dòng chảy điều hòa tốt).'
                        : eqData.geometry === 'square'
                        ? '• Hình vuông: L = B = √S_mặt (m).'
                        : '• Hình tròn: D = √(4 × S_mặt / π) (m).',
                      '• Chiều cao tổng thành bể: H_tổng = H_nước + H_bảo_vệ (m).',
                    ])
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-[#f5f8f6] text-[#244f37] text-xs font-semibold hover:bg-[#eaf3ee]"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Công thức</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {eqData.geometry === 'circle' ? (
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs font-bold text-[#234333]">
                        Đường kính thông thủy D (m)
                      </label>
                      <NumericInput
                        min={1}
                        value={eqData.width}
                        onChange={(val) =>
                          handleEqDimensionDirectChange({
                            width: val,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                      />
                    </div>
                  ) : eqData.geometry === 'rectangle' ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#234333]">
                          Chiều dài thông thủy L (m)
                        </label>
                        <NumericInput
                          min={1}
                          value={eqData.length}
                          onChange={(val) =>
                            handleEqDimensionDirectChange({
                              length: val,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#234333]">
                          Chiều rộng thông thủy B (m)
                        </label>
                        <NumericInput
                          min={1}
                          value={eqData.width}
                          onChange={(val) =>
                            handleEqDimensionDirectChange({
                              width: val,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs font-bold text-[#234333]">
                        Cạnh vuông thông thủy L = B (m)
                      </label>
                      <NumericInput
                        min={1}
                        value={eqData.width}
                        onChange={(val) => {
                          handleEqDimensionDirectChange({ width: val, length: val });
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Chiều sâu nước hữu ích H (m)
                    </label>
                    <NumericInput
                      min={1.5}
                      value={eqData.waterDepth}
                      onChange={(val) =>
                        handleEqDimensionDirectChange({
                          waterDepth: val,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Chiều cao an toàn (m)
                    </label>
                    <NumericInput
                      min={0}
                      value={eqData.freeboard}
                      onChange={(val) =>
                        handleEqDimensionDirectChange({
                          freeboard: val,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                    />
                  </div>
                </div>

                {/* Dimension Comparison Table */}
                {(() => {
                  const autoDim = updateAutoEqualizationDimensions({
                    ...eqData,
                    dimensionsOverride: false,
                  });
                  return (
                    <div className="border border-[#e2ede6] rounded-xl overflow-x-auto">
                      <table className="w-full min-w-[460px] text-left text-xs">
                        <thead>
                          <tr className="bg-[#f3f7f4] border-b border-[#e2ece5] text-[#4d6356] font-bold">
                            <th className="py-2.5 px-4">Thông số hình học</th>
                            <th className="py-2.5 px-4 text-right">Tính toán lý thuyết (m)</th>
                            <th className="py-2.5 px-4 text-right">Thực tế điều chỉnh (m)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#edf3ef] text-[#20362b]">
                          {eqData.geometry === 'circle' ? (
                            <tr className="hover:bg-[#fbfdfc]">
                              <td className="py-2.5 px-4 font-semibold">Đường kính D (m)</td>
                              <td className="py-2.5 px-4 text-right tabular-nums text-[#677b6f]">
                                {formatNumber(autoDim.width)}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#176b45]">
                                {formatNumber(eqData.width)}
                              </td>
                            </tr>
                          ) : eqData.geometry === 'rectangle' ? (
                            <>
                              <tr className="hover:bg-[#fbfdfc]">
                                <td className="py-2.5 px-4 font-semibold">Chiều dài L (m)</td>
                                <td className="py-2.5 px-4 text-right tabular-nums text-[#677b6f]">
                                  {formatNumber(autoDim.length)}
                                </td>
                                <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#176b45]">
                                  {formatNumber(eqData.length)}
                                </td>
                              </tr>
                              <tr className="hover:bg-[#fbfdfc]">
                                <td className="py-2.5 px-4 font-semibold">Chiều rộng B (m)</td>
                                <td className="py-2.5 px-4 text-right tabular-nums text-[#677b6f]">
                                  {formatNumber(autoDim.width)}
                                </td>
                                <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#176b45]">
                                  {formatNumber(eqData.width)}
                                </td>
                              </tr>
                            </>
                          ) : (
                            <tr className="hover:bg-[#fbfdfc]">
                              <td className="py-2.5 px-4 font-semibold">Cạnh vuông L = B (m)</td>
                              <td className="py-2.5 px-4 text-right tabular-nums text-[#677b6f]">
                                {formatNumber(autoDim.width)}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#176b45]">
                                {formatNumber(eqData.width)}
                              </td>
                            </tr>
                          )}

                          <tr className="hover:bg-[#fbfdfc]">
                            <td className="py-2.5 px-4 font-semibold">Chiều sâu nước H (m)</td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-[#677b6f]">
                              {formatNumber(eqData.waterDepth)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#176b45]">
                              {formatNumber(eqData.waterDepth)}
                            </td>
                          </tr>

                          <tr className="hover:bg-[#fbfdfc]">
                            <td className="py-2.5 px-4 font-semibold">Chiều cao bảo vệ (m)</td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-[#677b6f]">
                              {formatNumber(eqData.freeboard)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#176b45]">
                              {formatNumber(eqData.freeboard)}
                            </td>
                          </tr>

                          <tr className="bg-[#f7faf8] font-bold">
                            <td className="py-2.5 px-4 text-[#176b45]">Chiều cao tổng thành bể H_tổng</td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-[#176b45]">
                              {formatNumber(eqResult.totalHeight)}
                            </td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-[#176b45]">
                              {formatNumber(eqResult.totalHeight)} m
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                <div className="p-4 rounded-xl bg-[#f4f8f5] border border-[#d6e5dc] text-xs text-[#3b5245] space-y-1.5">
                  <div className="font-bold text-[#183c2b]">
                    Tổng kết kích thước xây dựng lọt lòng Bể điều hòa:
                  </div>
                  <div>
                    {eqData.geometry === 'circle'
                      ? `Đường kính D = ${formatNumber(eqData.width)} m × Chiều sâu H_tổng = ${formatNumber(
                          eqResult.totalHeight
                        )} m`
                      : `Chiều dài L = ${formatNumber(eqData.length)} m × Chiều rộng B = ${formatNumber(
                          eqData.width
                        )} m × Chiều sâu H_tổng = ${formatNumber(eqResult.totalHeight)} m (Tỷ lệ L/B = ${formatNumber(
                          eqResult.aspectRatio
                        )})`}
                  </div>
                  <div className="text-[11px] text-[#6d8075]">
                    Diện tích mặt thoáng: {formatNumber(eqResult.surfaceArea)} m² | Thể tích hữu dụng: {formatNumber(eqResult.actual)} m³ (yêu cầu {formatNumber(eqResult.required)} m³).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: THIẾT BỊ & BẢNG BOM */}
          {activeTab === 'equipment' && (
            <div className="space-y-6">
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-[#d5e0d8] shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-[#667a6e]">Bơm chìm nước thải (Mỗi bơm)</span>
                  <div className="text-xl font-extrabold text-[#173a29] tabular-nums">
                    Q = {formatNumber(eqResult.pumpFlowRate)} m³/h
                  </div>
                  <span className="text-[10px] text-[#788e81]">
                    Cột áp H = {formatNumber(eqData.pumpHead)} m | P động cơ ~ {formatNumber(eqResult.pumpPowerMotor)} kW
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#d5e0d8] shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-[#667a6e]">
                    {eqData.mixingMethod === 'mixer' ? 'Máy khuấy chìm' : 'Máy thổi khí sục khí'}
                  </span>
                  <div className="text-xl font-extrabold text-[#176b45] tabular-nums">
                    {eqData.mixingMethod === 'mixer'
                      ? `${eqData.numMixers} máy × ${formatNumber(eqResult.powerPerMixer)} kW`
                      : `Q = ${formatNumber(eqResult.airFlowTotalM3h)} m³/h`}
                  </div>
                  <span className="text-[10px] text-[#788e81]">
                    {eqData.mixingMethod === 'mixer'
                      ? `Tổng công suất khuấy: ${formatNumber(eqResult.powerKwTotal)} kW`
                      : `Áp lực cột nước: ~ ${formatNumber(eqData.waterDepth + 0.8)} m H₂O`}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#d5e0d8] shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-[#667a6e]">Chế độ vận hành dự phòng</span>
                  <div className="text-xl font-extrabold text-[#176b45] tabular-nums">
                    {eqData.numPumpsWork} Chạy + {eqData.numPumpsStandby} Dự phòng
                  </div>
                  <span className="text-[10px] text-[#788e81]">
                    Tự động đảo bơm luân phiên và kiểm soát phao mức
                  </span>
                </div>
              </div>

              {/* Comprehensive BOM Table */}
              <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h2 className="text-sm font-bold text-[#183b2b]">
                      Bảng danh mục thiết bị công nghệ (BOM - Bill of Materials)
                    </h2>
                    <p className="text-xs text-[#63776d]">
                      Bảng tổng hợp chi tiết thông số kỹ thuật, số lượng và xuất xứ thiết bị Bể điều hòa
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e8f3ec] text-[#176b45] border border-[#c6dbcd] self-start sm:self-auto">
                    Chuẩn thiết kế thi công
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f3f7f4] border-b border-[#e2ece5] text-[#4d6356] font-bold">
                        <th className="py-3 px-4">Ký hiệu (Tag No.)</th>
                        <th className="py-3 px-4">Tên thiết bị</th>
                        <th className="py-3 px-4">Thông số kỹ thuật chi tiết</th>
                        <th className="py-3 px-4 text-center">SL (Chạy / DP)</th>
                        <th className="py-3 px-4 text-center">Tổng SL</th>
                        <th className="py-3 px-4">Đơn vị</th>
                        <th className="py-3 px-4">Hãng đề xuất / Xuất xứ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf3ef] text-[#20362b]">
                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-3 px-4 font-mono font-bold text-[#176b45]">P-01A/B</td>
                        <td className="py-3 px-4 font-semibold">Bơm chìm nước thải cấp công đoạn sau</td>
                        <td className="py-3 px-4 text-[#445b4e]">
                          Q = {formatNumber(eqResult.pumpFlowRate)} m³/h, H = {formatNumber(eqData.pumpHead)} m, P ~ {formatNumber(
                            eqResult.pumpPowerMotor
                          )} kW, điện áp 3 pha 380V, thân gang cánh xoáy inox/gang chống nghẹt
                        </td>
                        <td className="py-3 px-4 text-center font-bold">{eqData.numPumpsWork} / {eqData.numPumpsStandby}</td>
                        <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">
                          {eqData.numPumpsWork + eqData.numPumpsStandby}
                        </td>
                        <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                        <td className="py-3 px-4">Tsurumi / Ebara / GSD</td>
                      </tr>

                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-3 px-4 font-mono font-bold text-[#176b45]">AC-01</td>
                        <td className="py-3 px-4 font-semibold">Khớp nối tự động (Auto-coupling) & Thanh trượt</td>
                        <td className="py-3 px-4 text-[#445b4e]">
                          Đồng bộ theo bơm chìm P-01, gồm ngàm nối gang dẻo, xích kéo inox 304, thanh trượt dẫn hướng D34 inox 304
                        </td>
                        <td className="py-3 px-4 text-center font-bold">{eqData.numPumpsWork} / {eqData.numPumpsStandby}</td>
                        <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">
                          {eqData.numPumpsWork + eqData.numPumpsStandby}
                        </td>
                        <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                        <td className="py-3 px-4">Đồng bộ theo bơm</td>
                      </tr>

                      {eqData.mixingMethod === 'mixer' ? (
                        <>
                          <tr className="hover:bg-[#fbfdfc]">
                            <td className="py-3 px-4 font-mono font-bold text-[#176b45]">MIX-01</td>
                            <td className="py-3 px-4 font-semibold">Máy khuấy chìm chống lắng cặn</td>
                            <td className="py-3 px-4 text-[#445b4e]">
                              P = {formatNumber(eqResult.powerPerMixer)} kW, cánh khuấy inox 304/316 góc nghiêng tối ưu, tốc độ ~ 750 - 950 rpm, cấp bảo vệ IP68
                            </td>
                            <td className="py-3 px-4 text-center font-bold">{eqData.numMixers} / 0</td>
                            <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">{eqData.numMixers}</td>
                            <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                            <td className="py-3 px-4">Faggiolati / Flygt / Evergush</td>
                          </tr>
                          <tr className="hover:bg-[#fbfdfc]">
                            <td className="py-3 px-4 font-mono font-bold text-[#176b45]">GUIDE-01</td>
                            <td className="py-3 px-4 font-semibold">Thanh trượt & Giá đỡ máy khuấy chìm</td>
                            <td className="py-3 px-4 text-[#445b4e]">
                              Thép không gỉ inox 304 hộp 50×50mm, chân đế cố định đáy bể và gối đỡ đỉnh thành bể
                            </td>
                            <td className="py-3 px-4 text-center font-bold">{eqData.numMixers} / 0</td>
                            <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">{eqData.numMixers}</td>
                            <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                            <td className="py-3 px-4">Việt Nam / Gia công Inox 304</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr className="hover:bg-[#fbfdfc]">
                            <td className="py-3 px-4 font-mono font-bold text-[#176b45]">BL-01A/B</td>
                            <td className="py-3 px-4 font-semibold">Máy thổi khí xáo trộn (Root Blower)</td>
                            <td className="py-3 px-4 text-[#445b4e]">
                              Q = {formatNumber(eqResult.airFlowTotalM3min)} m³/phút, áp suất P = {formatNumber(
                                (eqData.waterDepth + 0.8) * 10,
                                0
                              )} kPa, động cơ 380V/3P
                            </td>
                            <td className="py-3 px-4 text-center font-bold">1 / 1</td>
                            <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">2</td>
                            <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                            <td className="py-3 px-4">Anlet / Longtech / Heywel</td>
                          </tr>
                          <tr className="hover:bg-[#fbfdfc]">
                            <td className="py-3 px-4 font-mono font-bold text-[#176b45]">DIFF-01</td>
                            <td className="py-3 px-4 font-semibold">Đĩa/Ống phân phối khí bọt thô chống nghẹt</td>
                            <td className="py-3 px-4 text-[#445b4e]">
                              Chất liệu màng EPDM / đĩa nhựa PP D200 - D300 mm, đầu nối ren 3/4 inch
                            </td>
                            <td className="py-3 px-4 text-center font-bold">Toàn bộ</td>
                            <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">
                              {Math.max(4, Math.round(eqResult.surfaceArea / 2.5))}
                            </td>
                            <td className="py-3 px-4 text-[#63776d]">Cái</td>
                            <td className="py-3 px-4">Jaeger / EDI / Heywel</td>
                          </tr>
                        </>
                      )}

                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-3 px-4 font-mono font-bold text-[#176b45]">LS-01</td>
                        <td className="py-3 px-4 font-semibold">Bộ phao kiểm soát mức nước (Float Switch)</td>
                        <td className="py-3 px-4 text-[#445b4e]">
                          Cụm 3 phao chống cạn, mức chạy bơm, mức báo tràn cao cấp dây cáp bọc neoprene 10m
                        </td>
                        <td className="py-3 px-4 text-center font-bold">1 / 0</td>
                        <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                        <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                        <td className="py-3 px-4">Mac3 (Ý) / Finetek</td>
                      </tr>

                      <tr className="hover:bg-[#fbfdfc]">
                        <td className="py-3 px-4 font-mono font-bold text-[#176b45]">VAL-01</td>
                        <td className="py-3 px-4 font-semibold">Cụm van chặn cổng & Van một chiều cánh lật</td>
                        <td className="py-3 px-4 text-[#445b4e]">
                          Đường kính D65 - D100 gang dẻo tráng epoxy, đĩa đồng/cao su NBR
                        </td>
                        <td className="py-3 px-4 text-center font-bold">Theo tuyến bơm</td>
                        <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">
                          {eqData.numPumpsWork + eqData.numPumpsStandby}
                        </td>
                        <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                        <td className="py-3 px-4">ARV / ShinYi / Arita</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE 3: BỂ AEROTANK */}
      {/* ========================================================================= */}
      {isAerotank && (
        <AerotankSection
          data={aeroData}
          activeTab={activeTab}
          qAverageDay={qAverageDay}
          bodInAvg={bodIn}
          onUpdate={(updated, status) => {
            onUpdateUnitData(unit.id, { ...unit.data, aerotank: updated }, status);
          }}
          showFormula={showFormula}
        />
      )}

      {/* ========================================================================= */}
      {/* CASE 4: BỂ LẮNG SINH HỌC */}
      {/* ========================================================================= */}
      {isSecondaryClarifier && (
        <ClarifierSection
          data={clarifierData}
          activeTab={activeTab}
          qPeakHour={qPeakHour}
          onUpdate={(updated, status) => {
            onUpdateUnitData(unit.id, { ...unit.data, secondaryClarifier: updated }, status);
          }}
          showFormula={showFormula}
        />
      )}

      {/* ========================================================================= */}
      {/* CASE 5: BỂ KHỬ TRÙNG */}
      {/* ========================================================================= */}
      {isDisinfection && (
        <DisinfectionSection
          data={disinfectionData}
          activeTab={activeTab}
          qPeakHour={qPeakHour}
          onUpdate={(updated, status) => {
            onUpdateUnitData(unit.id, { ...unit.data, disinfectionTank: updated }, status);
          }}
          showFormula={showFormula}
        />
      )}

      {/* ========================================================================= */}
      {/* CASE 6: BỂ ANOXIC */}
      {/* ========================================================================= */}
      {isAnoxic && (
        <AnoxicSection
          data={anoxicData}
          activeTab={activeTab}
          qAverageHour={qAverageDay > 0 ? roundTo(qAverageDay / 24, 2) : 5}
          onUpdate={(updated, status) => {
            onUpdateUnitData(unit.id, { ...unit.data, anoxicTank: updated }, status);
          }}
          showFormula={showFormula}
        />
      )}

      {/* ========================================================================= */}
      {/* CASE 7: BỂ CHỨA BÙN / NÉN BÙN */}
      {/* ========================================================================= */}
      {isSludgeTank && (
        <SludgeTankSection
          data={sludgeData}
          activeTab={activeTab}
          estimatedSludgeM3Day={aeroResForSludge.excessSludgeM3Day || 2.5}
          onUpdate={(updated, status) => {
            onUpdateUnitData(unit.id, { ...unit.data, sludgeTank: updated }, status);
          }}
          showFormula={showFormula}
        />
      )}

      {/* ========================================================================= */}
      {/* CASE 8: CÔNG TRÌNH CƠ HỌC (SONG CHẮN RÁC, LẮNG CÁT, TÁCH DẦU MỠ) */}
      {/* ========================================================================= */}
      {isMechanical && (
        <MechanicalUnitsSection
          unit={unit}
          activeTab={activeTab}
          qPeakHour={qPeakHour}
          onUpdate={(updatedData, status) => {
            onUpdateUnitData(unit.id, updatedData, status);
          }}
          showFormula={showFormula}
        />
      )}

      {/* ========================================================================= */}
      {/* CASE 9: CÔNG TRÌNH HÓA LÝ (KEO TỤ, TẠO BÔNG, TUYỂN NỔI DAF) */}
      {/* ========================================================================= */}
      {isPhysChem && (
        <PhysChemUnitsSection
          unit={unit}
          activeTab={activeTab}
          qPeakHour={qPeakHour}
          onUpdate={(updatedData, status) => {
            onUpdateUnitData(unit.id, updatedData, status);
          }}
          showFormula={showFormula}
        />
      )}

      {/* ========================================================================= */}
      {/* CASE 10: CÔNG TRÌNH SINH HỌC NÂNG CAO (SBR, MBR, MBBR, UASB) */}
      {/* ========================================================================= */}
      {isAdvancedBio && (
        <AdvancedBioSection
          unit={unit}
          activeTab={activeTab}
          qAverageDay={qAverageDay}
          qPeakHour={qPeakHour}
          bodIn={bodIn}
          codIn={codIn}
          onUpdate={(updatedData, status) => {
            onUpdateUnitData(unit.id, updatedData, status);
          }}
          showFormula={showFormula}
        />
      )}

      {/* ========================================================================= */}
      {/* CASE 11: LẮNG HÓA LÝ, LỌC ÁP LỰC, LỌC THAN, MÁY ÉP BÙN */}
      {/* ========================================================================= */}
      {isClarifierFiltration && (
        <ClarifierFiltrationSection
          unit={unit}
          activeTab={activeTab}
          qPeakHour={qPeakHour}
          excessSludgeM3Day={aeroResForSludge.excessSludgeM3Day || 2.5}
          onUpdate={(updatedData, status) => {
            onUpdateUnitData(unit.id, updatedData, status);
          }}
          showFormula={showFormula}
        />
      )}

      {/* ========================================================================= */}
      {/* CASE 12: CÔNG TRÌNH ĐƠN VỊ KHÁC TRONG CATALOG */}
      {/* ========================================================================= */}
      {isGeneric && (
        <GenericUnitSection
          unitCatalogName={unit.catalogName}
          data={genericData}
          activeTab={activeTab}
          qPeakHour={qPeakHour}
          qAverageDay={qAverageDay}
          onUpdate={(updated, status) => {
            onUpdateUnitData(unit.id, { ...unit.data, genericUnit: updated }, status);
          }}
          showFormula={showFormula}
        />
      )}

      {/* Formula Modal */}
      {formulaModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) setFormulaModalOpen(false);
            }}
          >
            <div
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#cfded4] overflow-hidden animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[#e5ece8] bg-[#fbfdfb] flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#183a2a]">{formulaDetails.title}</h3>
                <button
                  type="button"
                  onClick={() => setFormulaModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-3 text-xs text-[#2a4536] leading-relaxed max-h-[70vh] overflow-y-auto">
                {formulaDetails.lines.map((line, idx) => (
                  <p key={idx} className="bg-[#f6faf7] p-2.5 rounded-lg border border-[#e3ece6]">
                    {line}
                  </p>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-[#e5ece8] bg-[#fbfdfb] flex justify-end">
                <button
                  type="button"
                  onClick={() => setFormulaModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#176b45] text-white text-xs font-semibold hover:bg-[#105a39] shadow-sm transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

import React from 'react';
import { RotateCcw, Calculator, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  TechnologyUnit,
  UnitTab,
  CoagulationTankData,
  FlocculationTankData,
  DafData,
} from '../../types/ecs';
import {
  formatNumber,
  roundTo,
  calculateCoagulation,
  updateAutoCoagulationDimensions,
  calculateFlocculation,
  updateAutoFlocculationDimensions,
  calculateDaf,
  updateAutoDafDimensions,
} from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface PhysChemUnitsSectionProps {
  unit: TechnologyUnit;
  activeTab: UnitTab;
  qPeakHour: number;
  onUpdate: (updatedData: any, status: 'pending' | 'done') => void;
  showFormula: (title: string, lines: string[]) => void;
}

export const PhysChemUnitsSection: React.FC<PhysChemUnitsSectionProps> = ({
  unit,
  activeTab,
  qPeakHour,
  onUpdate,
  showFormula,
}) => {
  const isCoagulation = ['Bể keo tụ', 'Bể phản ứng'].includes(unit.catalogName);
  const isFlocculation = unit.catalogName === 'Bể tạo bông';
  const isDaf = unit.catalogName === 'Bể tuyển nổi DAF';

  // ----------------- 1. BỂ KEO TỤ / BỂ PHẢN ỨNG -----------------
  if (isCoagulation) {
    const rawData = unit.data?.coagulationTank || {
      qh: qPeakHour ? roundTo(qPeakHour, 2) : 5,
      qhOverride: false,
      retentionSeconds: 45,
      velocityGradientG: 800,
      length: 1.0,
      width: 1.0,
      waterDepth: 1.5,
      freeboard: 0.3,
      dimensionsOverride: false,
    };

    const data: CoagulationTankData = {
      ...rawData,
      qh: rawData.qh !== null && rawData.qh !== undefined ? roundTo(rawData.qh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
      retentionSeconds: roundTo(rawData.retentionSeconds, 0),
      velocityGradientG: roundTo(rawData.velocityGradientG, 0),
      length: roundTo(rawData.length, 2),
      width: roundTo(rawData.width, 2),
      waterDepth: roundTo(rawData.waterDepth, 2),
      freeboard: roundTo(rawData.freeboard, 2),
    };

    const result = calculateCoagulation(data);

    const handleChange = (updates: Partial<CoagulationTankData>) => {
      const merged = { ...data, ...updates };
      const auto = updateAutoCoagulationDimensions(merged);
      const res = calculateCoagulation(auto);
      onUpdate({ ...unit.data, coagulationTank: auto }, res.valid && res.pass ? 'done' : 'pending');
    };

    const handleDimensionDirect = (updates: Partial<CoagulationTankData>) => {
      const merged = { ...data, ...updates, dimensionsOverride: true };
      const res = calculateCoagulation(merged);
      onUpdate({ ...unit.data, coagulationTank: merged }, res.valid && res.pass ? 'done' : 'pending');
    };

    const resetFlow = () => {
      const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5;
      handleChange({ qh, qhOverride: false });
    };

    const autoDimension = () => {
      const adjusted = updateAutoCoagulationDimensions({ ...data, dimensionsOverride: false });
      const res = calculateCoagulation(adjusted);
      onUpdate({ ...unit.data, coagulationTank: adjusted }, res.valid && res.pass ? 'done' : 'pending');
    };

    return (
      <div className="space-y-6">
        {activeTab === 'input' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế Bể keo tụ / Phản ứng nhanh</h2>
                <p className="text-xs text-[#63776d]">
                  TCVN 7957 & Metcalf & Eddy: Khuấy trộn thủy lực nhanh để phân tán phèn PAC / Phèn sắt
                </p>
              </div>
              <button
                type="button"
                onClick={resetFlow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>↻ Lấy lại Q<sub>h</sub> từ Tải lượng</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Lưu lượng giờ tính toán Q<sub>h</sub> (m³/h)
                  </label>
                  <NumericInput
                    allowNull
                    value={data.qh}
                    onChange={(val) =>
                      handleChange({
                        qh: val === null ? null : roundTo(val, 2),
                        qhOverride: true,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">
                    {data.qhOverride ? 'Đang dùng giá trị nhập riêng' : `Liên kết từ Tải lượng (${formatNumber(qPeakHour)} m³/h)`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Thời gian khuấy nhanh t (giây)
                  </label>
                  <NumericInput
                    min={15}
                    max={120}
                    value={data.retentionSeconds}
                    onChange={(val) => handleChange({ retentionSeconds: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                  <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 30 – 60 giây</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Gradient vận tốc khuấy G (s⁻¹)
                  </label>
                  <NumericInput
                    min={500}
                    max={1500}
                    value={data.velocityGradientG}
                    onChange={(val) => handleChange({ velocityGradientG: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                  <span className="text-[10px] text-[#708477]">Khuấy nhanh: 700 – 1000 s⁻¹</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calc' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kết quả kiểm tra thủy lực & Công suất khuấy</h2>
                <p className="text-xs text-[#63776d]">Tính theo Camp & Stein: P = G² · μ · V (μ = 0.001 Pa·s)</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  showFormula('Công thức tính Bể keo tụ', [
                    'Thể tích yêu cầu: Vyc = (Qh / 3600) · t (m³)',
                    'Thể tích thực tế: Vtt = L · B · H (m³)',
                    'Công suất thủy lực cần truyền vào chất lỏng: P = G² · μ · V (W)',
                    'Công suất động cơ máy khuấy (kèm hiệu suất truyền động η = 0.75): Pdc = (P / η) · 1.3 (kW)',
                    'Thời gian lưu thực tế: ttt = (Vtt / Qh) · 3600 (s)',
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-[#fbfdfb] text-[#1b3d2c] text-xs font-semibold hover:bg-[#eef5f1]"
              >
                <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
                <span>Xem công thức</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích yêu cầu V<sub>yc</sub></span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.requiredVolume)} m³</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Thời gian lưu {formatNumber(data.retentionSeconds)} s</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích thực tế V<sub>tt</sub></span>
                <span className={`text-lg font-bold ${result.pass ? 'text-[#176b45]' : 'text-amber-600'}`}>
                  {formatNumber(result.actualVolume)} m³
                </span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Lưu thực tế: {formatNumber(result.actualRetentionSec)} s</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Công suất máy khuấy đề xuất</span>
                <span className="text-lg font-bold text-[#176b45]">{formatNumber(result.mixingPowerKw)} kW</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Gradient G = {formatNumber(data.velocityGradientG)} s⁻¹</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Tổng chiều cao thành bể</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.totalHeight)} m</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">An toàn: {formatNumber(data.freeboard)} m</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
              {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
              <div className="text-xs space-y-1">
                <span className="font-bold">{result.pass ? 'Bể keo tụ đạt yêu cầu thể tích và khuấy trộn' : 'Chưa đạt thể tích yêu cầu'}</span>
                <p>
                  Thời gian khuấy thực tế {formatNumber(result.actualRetentionSec)} giây (yêu cầu ≥ {formatNumber(data.retentionSeconds)} s). Công suất khuấy tính toán {formatNumber(result.mixingPowerKw)} kW.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dimensions' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học Bể keo tụ</h2>
                <p className="text-xs text-[#63776d]">Kích thước buồng khuấy vuông hoặc tròn để dòng chảy đồng đều</p>
              </div>
              <button
                type="button"
                onClick={autoDimension}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tự động tính kích thước đề xuất</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều dài L (m)</label>
                <NumericInput
                  min={0.4}
                  value={data.length}
                  onChange={(val) => handleDimensionDirect({ length: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều rộng B (m)</label>
                <NumericInput
                  min={0.4}
                  value={data.width}
                  onChange={(val) => handleDimensionDirect({ width: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                <NumericInput
                  min={0.5}
                  value={data.waterDepth}
                  onChange={(val) => handleDimensionDirect({ waterDepth: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao bảo vệ H<sub>bv</sub> (m)</label>
                <NumericInput
                  min={0.2}
                  value={data.freeboard}
                  onChange={(val) => handleDimensionDirect({ freeboard: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9] grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] text-[#5a7264] block">Tổng chiều cao thành bể</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.totalHeight)} m</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Thể tích thực tế</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.actualVolume)} m³</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Động cơ máy khuấy</span>
                <span className="text-base font-bold text-[#176b45]">{formatNumber(result.mixingPowerKw)} kW</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & phụ kiện Bể keo tụ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">1. Máy khuấy nhanh cánh tuabin / chân vịt</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Trang bị 01 máy khuấy nhanh công suất {formatNumber(result.mixingPowerKw)} kW, tốc độ vòng quay 150 – 300 rpm, trục và cánh khuấy bằng thép không gỉ SUS 304/316 bọc composite chống ăn mòn hóa chất.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">2. Hệ thống châm PAC / Phèn sắt & Bơm định lượng</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Bao gồm 01 bồn pha hóa chất thể tích 500 – 1000 L bằng nhựa LLDPE kháng hóa chất, 02 bơm định lượng màng (01 hoạt động, 01 dự phòng) điều chỉnh lưu lượng điện tử.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------- 2. BỂ TẠO BÔNG -----------------
  if (isFlocculation) {
    const rawData = unit.data?.flocculationTank || {
      qh: qPeakHour ? roundTo(qPeakHour, 2) : 5,
      qhOverride: false,
      retentionMinutes: 25,
      stages: 3,
      length: 2.0,
      width: 1.2,
      waterDepth: 2.0,
      freeboard: 0.4,
      dimensionsOverride: false,
    };

    const data: FlocculationTankData = {
      ...rawData,
      qh: rawData.qh !== null && rawData.qh !== undefined ? roundTo(rawData.qh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
      retentionMinutes: roundTo(rawData.retentionMinutes, 0),
      stages: roundTo(rawData.stages, 0),
      length: roundTo(rawData.length, 2),
      width: roundTo(rawData.width, 2),
      waterDepth: roundTo(rawData.waterDepth, 2),
      freeboard: roundTo(rawData.freeboard, 2),
    };

    const result = calculateFlocculation(data);

    const handleChange = (updates: Partial<FlocculationTankData>) => {
      const merged = { ...data, ...updates };
      const auto = updateAutoFlocculationDimensions(merged);
      const res = calculateFlocculation(auto);
      onUpdate({ ...unit.data, flocculationTank: auto }, res.valid && res.pass ? 'done' : 'pending');
    };

    const handleDimensionDirect = (updates: Partial<FlocculationTankData>) => {
      const merged = { ...data, ...updates, dimensionsOverride: true };
      const res = calculateFlocculation(merged);
      onUpdate({ ...unit.data, flocculationTank: merged }, res.valid && res.pass ? 'done' : 'pending');
    };

    const resetFlow = () => {
      const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5;
      handleChange({ qh, qhOverride: false });
    };

    const autoDimension = () => {
      const adjusted = updateAutoFlocculationDimensions({ ...data, dimensionsOverride: false });
      const res = calculateFlocculation(adjusted);
      onUpdate({ ...unit.data, flocculationTank: adjusted }, res.valid && res.pass ? 'done' : 'pending');
    };

    return (
      <div className="space-y-6">
        {activeTab === 'input' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế Bể tạo bông (Flocculation Tank)</h2>
                <p className="text-xs text-[#63776d]">
                  TCVN 7957 & Metcalf & Eddy: Khuấy chậm đa bậc để tạo điều kiện liên kết bông cặn lớn
                </p>
              </div>
              <button
                type="button"
                onClick={resetFlow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>↻ Lấy lại Q<sub>h</sub> từ Tải lượng</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Lưu lượng giờ tính toán Q<sub>h</sub> (m³/h)
                  </label>
                  <NumericInput
                    allowNull
                    value={data.qh}
                    onChange={(val) =>
                      handleChange({
                        qh: val === null ? null : roundTo(val, 2),
                        qhOverride: true,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">
                    {data.qhOverride ? 'Đang dùng giá trị nhập riêng' : `Liên kết từ Tải lượng (${formatNumber(qPeakHour)} m³/h)`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Thời gian tạo bông t (phút)
                  </label>
                  <NumericInput
                    min={15}
                    max={45}
                    value={data.retentionMinutes}
                    onChange={(val) => handleChange({ retentionMinutes: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                  <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 20 – 30 phút</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Số ngăn khuấy chậm (bậc)
                  </label>
                  <NumericInput
                    min={1}
                    max={4}
                    value={data.stages}
                    onChange={(val) => handleChange({ stages: Math.round(val) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                  <span className="text-[10px] text-[#708477]">Thường chia 2 – 3 ngăn (G giảm dần từ 70 về 20 s⁻¹)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calc' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kết quả kiểm tra thủy lực Bể tạo bông</h2>
                <p className="text-xs text-[#63776d]">Kiểm tra thể tích tổng thể và thể tích từng ngăn khuấy</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  showFormula('Công thức tính Bể tạo bông', [
                    'Thể tích yêu cầu: Vyc = Qh · (t / 60) (m³)',
                    'Thể tích thực tế: Vtt = L · B · H (m³)',
                    'Thể tích mỗi ngăn: Vngan = Vtt / n (n: số ngăn tạo bông)',
                    'Gradient vận tốc khuấy giảm dần qua các ngăn (ngăn 1: G ~ 60 s⁻¹, ngăn 2: G ~ 40 s⁻¹, ngăn 3: G ~ 20 s⁻¹)',
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-[#fbfdfb] text-[#1b3d2c] text-xs font-semibold hover:bg-[#eef5f1]"
              >
                <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
                <span>Xem công thức</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích yêu cầu V<sub>yc</sub></span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.requiredVolume)} m³</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Thời gian lưu {formatNumber(data.retentionMinutes)} phút</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích thực tế V<sub>tt</sub></span>
                <span className={`text-lg font-bold ${result.pass ? 'text-[#176b45]' : 'text-amber-600'}`}>
                  {formatNumber(result.actualVolume)} m³
                </span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Lưu thực tế: {formatNumber(result.actualRetentionMin)} phút</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích mỗi ngăn ({data.stages} ngăn)</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.compartmentVolume)} m³</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Bố trí vách zíc zắc</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Tổng chiều cao thành bể</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.totalHeight)} m</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">An toàn: {formatNumber(data.freeboard)} m</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
              {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
              <div className="text-xs space-y-1">
                <span className="font-bold">{result.pass ? 'Bể tạo bông đạt tiêu chuẩn thời gian lưu' : 'Chưa đạt thể tích yêu cầu'}</span>
                <p>
                  Thời gian lưu thực tế đạt {formatNumber(result.actualRetentionMin)} phút (yêu cầu ≥ {formatNumber(data.retentionMinutes)} phút). Chia thành {data.stages} ngăn tạo bông liên tiếp.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dimensions' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học Bể tạo bông</h2>
                <p className="text-xs text-[#63776d]">Chiều dài, chiều rộng, chiều sâu nước và vách ngăn hướng dòng</p>
              </div>
              <button
                type="button"
                onClick={autoDimension}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tự động tính kích thước đề xuất</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều dài L (m)</label>
                <NumericInput
                  min={0.5}
                  value={data.length}
                  onChange={(val) => handleDimensionDirect({ length: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều rộng B (m)</label>
                <NumericInput
                  min={0.5}
                  value={data.width}
                  onChange={(val) => handleDimensionDirect({ width: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                <NumericInput
                  min={1.0}
                  value={data.waterDepth}
                  onChange={(val) => handleDimensionDirect({ waterDepth: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao bảo vệ H<sub>bv</sub> (m)</label>
                <NumericInput
                  min={0.2}
                  value={data.freeboard}
                  onChange={(val) => handleDimensionDirect({ freeboard: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9] grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] text-[#5a7264] block">Tổng chiều cao thành bể</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.totalHeight)} m</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Thể tích thực tế</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.actualVolume)} m³</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Tỉ lệ L/B</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber(data.length / (data.width || 1))}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & phụ kiện Bể tạo bông</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">1. Máy khuấy chậm cánh bản phẳng (Paddle mixer)</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Trang bị {data.stages} máy khuấy chậm cánh bản inox SUS 304, tốc độ quay 15 – 45 rpm (điều khiển biến tần giảm dần qua các ngăn) để tránh làm vỡ bông cặn đã hình thành.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">2. Hệ thống châm Polymer trợ keo tụ</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Bao gồm 01 bồn pha polymer tự động 500 L có cánh khuấy chậm chống cắt mạch polymer, 02 bơm định lượng châm trực tiếp vào đầu ngăn tạo bông.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------- 3. BỂ TUYỂN NỔI DAF -----------------
  const rawData = unit.data?.daf || {
    qh: qPeakHour ? roundTo(qPeakHour, 2) : 5,
    qhOverride: false,
    recycleRatio: 30,
    surfaceLoadingRate: 5.0,
    saturationPressureBar: 5.0,
    length: 3.0,
    width: 1.5,
    waterDepth: 2.0,
    freeboard: 0.5,
    dimensionsOverride: false,
  };

  const data: DafData = {
    ...rawData,
    qh: rawData.qh !== null && rawData.qh !== undefined ? roundTo(rawData.qh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
    recycleRatio: roundTo(rawData.recycleRatio, 0),
    surfaceLoadingRate: roundTo(rawData.surfaceLoadingRate, 1),
    saturationPressureBar: roundTo(rawData.saturationPressureBar, 1),
    length: roundTo(rawData.length, 2),
    width: roundTo(rawData.width, 2),
    waterDepth: roundTo(rawData.waterDepth, 2),
    freeboard: roundTo(rawData.freeboard, 2),
  };

  const result = calculateDaf(data);

  const handleChange = (updates: Partial<DafData>) => {
    const merged = { ...data, ...updates };
    const auto = updateAutoDafDimensions(merged);
    const res = calculateDaf(auto);
    onUpdate({ ...unit.data, daf: auto }, res.valid && res.pass ? 'done' : 'pending');
  };

  const handleDimensionDirect = (updates: Partial<DafData>) => {
    const merged = { ...data, ...updates, dimensionsOverride: true };
    const res = calculateDaf(merged);
    onUpdate({ ...unit.data, daf: merged }, res.valid && res.pass ? 'done' : 'pending');
  };

  const resetFlow = () => {
    const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5;
    handleChange({ qh, qhOverride: false });
  };

  const autoDimension = () => {
    const adjusted = updateAutoDafDimensions({ ...data, dimensionsOverride: false });
    const res = calculateDaf(adjusted);
    onUpdate({ ...unit.data, daf: adjusted }, res.valid && res.pass ? 'done' : 'pending');
  };

  return (
    <div className="space-y-6">
      {activeTab === 'input' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế Bể tuyển nổi DAF (Dissolved Air Flotation)</h2>
              <p className="text-xs text-[#63776d]">
                Metcalf & Eddy: Tuyển nổi bọt khí hòa tan vi mô để tách dầu mỡ, cặn nhẹ khó lắng
              </p>
            </div>
            <button
              type="button"
              onClick={resetFlow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>↻ Lấy lại Q<sub>h</sub> từ Tải lượng</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Lưu lượng giờ Q<sub>h</sub> (m³/h)
                </label>
                <NumericInput
                  allowNull
                  value={data.qh}
                  onChange={(val) =>
                    handleChange({
                      qh: val === null ? null : roundTo(val, 2),
                      qhOverride: true,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">
                  {data.qhOverride ? 'Đang dùng giá trị nhập riêng' : `Liên kết từ Tải lượng (${formatNumber(qPeakHour)} m³/h)`}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Tỉ lệ nước tuần hoàn R (%)
                </label>
                <NumericInput
                  min={15}
                  max={60}
                  value={data.recycleRatio}
                  onChange={(val) => handleChange({ recycleRatio: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                />
                <span className="text-[10px] text-[#708477]">Khuyên dùng: 20 – 40%</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Tải trọng bề mặt q₀ (m³/m²·h)
                </label>
                <NumericInput
                  min={3.0}
                  max={12.0}
                  value={data.surfaceLoadingRate}
                  onChange={(val) => handleChange({ surfaceLoadingRate: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                />
                <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 4.0 – 8.0 m³/m²·h</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Áp suất bão hòa khí (bar)
                </label>
                <NumericInput
                  min={3.0}
                  max={7.0}
                  value={data.saturationPressureBar}
                  onChange={(val) => handleChange({ saturationPressureBar: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                />
                <span className="text-[10px] text-[#708477]">Thường chọn: 4.5 – 6.0 bar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calc' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Kết quả kiểm tra thủy lực Tuyển nổi DAF</h2>
              <p className="text-xs text-[#63776d]">Tính toán lưu lượng tuần hoàn khí hòa tan và diện tích mặt thoáng</p>
            </div>
            <button
              type="button"
              onClick={() =>
                showFormula('Công thức tính Bể tuyển nổi DAF', [
                  'Lưu lượng tuần hoàn: Qth = Qh · (R / 100) (m³/h)',
                  'Tổng lưu lượng thủy lực: Qtong = Qh + Qth (m³/h)',
                  'Diện tích mặt thoáng tuyển nổi yêu cầu: Fyc = Qtong / q0 (m²)',
                  'Tải trọng thủy lực thực tế: q0_tt = Qtong / (L · B) (m³/m²·h)',
                  'Thể tích hữu dụng bể DAF: V = F · H (m³)',
                ])
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-[#fbfdfb] text-[#1b3d2c] text-xs font-semibold hover:bg-[#eef5f1]"
            >
              <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
              <span>Xem công thức</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
              <span className="text-[11px] font-semibold text-[#5a7264] block">Lưu lượng tuần hoàn Q<sub>th</sub></span>
              <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.recycleFlowM3h)} m³/h</span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">Tỉ lệ {formatNumber(data.recycleRatio)}%</span>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
              <span className="text-[11px] font-semibold text-[#5a7264] block">Tổng lưu lượng qua bể Q<sub>tổng</sub></span>
              <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.totalFlowM3h)} m³/h</span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">Qh + Qth</span>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
              <span className="text-[11px] font-semibold text-[#5a7264] block">Diện tích tuyển nổi yêu cầu</span>
              <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.requiredArea)} m²</span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">q₀ = {formatNumber(data.surfaceLoadingRate)} m³/m²·h</span>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
              <span className="text-[11px] font-semibold text-[#5a7264] block">Diện tích thực tế</span>
              <span className={`text-lg font-bold ${result.pass ? 'text-[#176b45]' : 'text-amber-600'}`}>
                {formatNumber(result.actualArea)} m²
              </span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">q₀ thực tế: {formatNumber(result.actualSlr)} m³/m²·h</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
            {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
            <div className="text-xs space-y-1">
              <span className="font-bold">{result.pass ? 'Bể tuyển nổi DAF thỏa mãn tiêu chuẩn tải trọng' : 'Diện tích mặt thoáng nhỏ hơn yêu cầu'}</span>
              <p>
                Tải trọng thủy lực bề mặt thực tế đạt {formatNumber(result.actualSlr)} m³/m²·h (yêu cầu ≤ {formatNumber(data.surfaceLoadingRate)} m³/m²·h). Thể tích bể {formatNumber(result.volumeM3)} m³.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dimensions' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học Bể DAF</h2>
              <p className="text-xs text-[#63776d]">Chiều dài, chiều rộng, chiều sâu nước và khoang gạt bọt váng nổi</p>
            </div>
            <button
              type="button"
              onClick={autoDimension}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tự động tính kích thước đề xuất</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Chiều dài L (m)</label>
              <NumericInput
                min={1.0}
                value={data.length}
                onChange={(val) => handleDimensionDirect({ length: val })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Chiều rộng B (m)</label>
              <NumericInput
                min={0.8}
                value={data.width}
                onChange={(val) => handleDimensionDirect({ width: val })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
              <NumericInput
                min={1.2}
                value={data.waterDepth}
                onChange={(val) => handleDimensionDirect({ waterDepth: val })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Chiều cao bảo vệ H<sub>bv</sub> (m)</label>
              <NumericInput
                min={0.3}
                value={data.freeboard}
                onChange={(val) => handleDimensionDirect({ freeboard: val })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9] grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] text-[#5a7264] block">Tổng chiều cao thành bể</span>
              <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.totalHeight)} m</span>
            </div>
            <div>
              <span className="text-[11px] text-[#5a7264] block">Thể tích thực tế</span>
              <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.volumeM3)} m³</span>
            </div>
            <div>
              <span className="text-[11px] text-[#5a7264] block">Tỉ lệ L/B</span>
              <span className="text-base font-bold text-[#193a2a]">{formatNumber(data.length / (data.width || 1))}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & phụ kiện công nghệ Bể tuyển nổi DAF</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
              <span className="text-xs font-bold text-[#1e4532]">1. Bồn bão hòa khí áp lực & Bơm tuần hoàn</span>
              <p className="text-xs text-[#52665a] leading-relaxed">
                Bồn chịu áp lực 4 – 6 bar bằng thép carbon sơn epoxy hoặc inox SUS 304, 01 bơm tăng áp tuần hoàn lưu lượng {formatNumber(result.recycleFlowM3h)} m³/h (cột áp 50 – 60 m), 01 máy nén khí piston kèm van điều áp và van giảm áp tạo vi bọt kích thước 20 – 50 μm.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
              <span className="text-xs font-bold text-[#1e4532]">2. Hệ thống gạt váng bọt bề mặt & Xả cặn đáy</span>
              <p className="text-xs text-[#52665a] leading-relaxed">
                Cơ cấu gạt váng tự động dạng băng chuyền xích hoặc cánh xoay gạt bọt nổi vào máng gom bùn nổi, phễu gom cặn đáy kèm van xả tự động.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

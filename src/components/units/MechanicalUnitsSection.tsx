import React from 'react';
import { RotateCcw, Calculator, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  TechnologyUnit,
  UnitTab,
  BarScreenData,
  GritChamberData,
  GreaseTrapData,
} from '../../types/ecs';
import {
  formatNumber,
  roundTo,
  calculateBarScreen,
  updateAutoBarScreenDimensions,
  calculateGritChamber,
  updateAutoGritChamberDimensions,
  calculateGreaseTrap,
  updateAutoGreaseTrapDimensions,
} from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface MechanicalUnitsSectionProps {
  unit: TechnologyUnit;
  activeTab: UnitTab;
  qPeakHour: number;
  onUpdate: (updatedData: any, status: 'pending' | 'done') => void;
  showFormula: (title: string, lines: string[]) => void;
}

export const MechanicalUnitsSection: React.FC<MechanicalUnitsSectionProps> = ({
  unit,
  activeTab,
  qPeakHour,
  onUpdate,
  showFormula,
}) => {
  const isBarScreen = unit.catalogName === 'Song chắn rác';
  const isGritChamber = unit.catalogName === 'Bể lắng cát';
  const isGreaseTrap = unit.catalogName === 'Bể tách dầu mỡ';

  // ----------------- 1. SONG CHẮN RÁC -----------------
  if (isBarScreen) {
    const rawData = unit.data?.barScreen || {
      qh: qPeakHour ? roundTo(qPeakHour, 2) : 5,
      qhOverride: false,
      velocity: 0.8,
      barSpacingMm: 15,
      barWidthMm: 6,
      angleDeg: 60,
      channelWidth: 0.4,
      waterDepth: 0.35,
      freeboard: 0.25,
      dimensionsOverride: false,
    };

    const data: BarScreenData = {
      ...rawData,
      qh: rawData.qh !== null && rawData.qh !== undefined ? roundTo(rawData.qh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
      velocity: roundTo(rawData.velocity, 2),
      barSpacingMm: roundTo(rawData.barSpacingMm, 1),
      barWidthMm: roundTo(rawData.barWidthMm, 1),
      angleDeg: roundTo(rawData.angleDeg, 0),
      channelWidth: roundTo(rawData.channelWidth, 2),
      waterDepth: roundTo(rawData.waterDepth, 2),
      freeboard: roundTo(rawData.freeboard, 2),
    };

    const result = calculateBarScreen(data);

    const handleChange = (updates: Partial<BarScreenData>) => {
      const merged = { ...data, ...updates };
      const auto = updateAutoBarScreenDimensions(merged);
      const res = calculateBarScreen(auto);
      onUpdate({ ...unit.data, barScreen: auto }, res.valid && res.pass ? 'done' : 'pending');
    };

    const handleDimensionDirect = (updates: Partial<BarScreenData>) => {
      const merged = { ...data, ...updates, dimensionsOverride: true };
      const res = calculateBarScreen(merged);
      onUpdate({ ...unit.data, barScreen: merged }, res.valid && res.pass ? 'done' : 'pending');
    };

    const resetFlow = () => {
      const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5;
      handleChange({ qh, qhOverride: false });
    };

    const autoDimension = () => {
      const adjusted = updateAutoBarScreenDimensions({ ...data, dimensionsOverride: false });
      const res = calculateBarScreen(adjusted);
      onUpdate({ ...unit.data, barScreen: adjusted }, res.valid && res.pass ? 'done' : 'pending');
    };

    return (
      <div className="space-y-6">
        {activeTab === 'input' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế Song chắn rác (Bar Screen)</h2>
                <p className="text-xs text-[#63776d]">
                  Tiêu chuẩn TCVN 7957:2008 & Metcalf & Eddy: Giữ rác thô, bảo vệ bơm và hệ thống phía sau
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
                    Lưu lượng giờ cực đại Q<sub>h</sub> (m³/h)
                  </label>
                  <NumericInput
                    step={0.01}
                    min={0}
                    allowNull
                    value={data.qh !== null && data.qh !== undefined ? data.qh : null}
                    onChange={(val) =>
                      handleChange({
                        qh: val,
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
                    Vận tốc dòng chảy qua khe v (m/s)
                  </label>
                  <NumericInput
                    step={0.05}
                    min={0.1}
                    value={data.velocity}
                    fallbackValue={0.8}
                    onChange={(val) => handleChange({ velocity: val ?? 0.8 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">TCVN 7957 khuyên dùng 0.6 – 1.0 m/s</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Khoảng cách khe hở b (mm)
                  </label>
                  <NumericInput
                    step={1}
                    min={1}
                    value={data.barSpacingMm}
                    fallbackValue={15}
                    onChange={(val) => handleChange({ barSpacingMm: val ?? 15 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Song thô: 16–40 mm; Song tinh: 5–15 mm</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Bề dày thanh thép s (mm)
                  </label>
                  <NumericInput
                    step={1}
                    min={1}
                    value={data.barWidthMm}
                    fallbackValue={6}
                    onChange={(val) => handleChange({ barWidthMm: val ?? 6 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Thường dùng thanh inox dày 5 – 8 mm</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Góc đặt nghiêng song α (độ)
                  </label>
                  <NumericInput
                    step={5}
                    min={30}
                    max={90}
                    value={data.angleDeg}
                    fallbackValue={60}
                    onChange={(val) => handleChange({ angleDeg: val ?? 60 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Cào thủ công: 45°–60°; Cào cơ giới: 60°–80°</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calc' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kết quả kiểm tra thủy lực Song chắn rác</h2>
                <p className="text-xs text-[#63776d]">Tính toán theo công thức Kirschmer & TCVN 7957:2008</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  showFormula('Công thức tính thủy lực Song chắn rác', [
                    'Lưu lượng giây: Qs = Qh / 3600 (m³/s)',
                    'Hệ số co hẹp do thanh chắn: k = b / (b + s)',
                    'Diện tích ướt khe hở yêu cầu: Fkhe = Qs / v (m²)',
                    'Bề rộng máng yêu cầu: B = Fkhe / (k · h)',
                    'Tổn thất áp lực qua song (Kirschmer): hL = β · (s/b)^(4/3) · (v² / 2g) · sin(α)',
                    'Trong đó: β = 2.42 (tiết diện thanh chữ nhật), g = 9.81 m/s²',
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
                <span className="text-[11px] font-semibold text-[#5a7264] block">Lưu lượng giây Q<sub>s</sub></span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.qM3s * 1000)} L/s</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">({formatNumber(result.qM3s)} m³/s)</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Diện tích khe hở yêu cầu</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.openAreaReq)} m²</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Đảm bảo v ≤ {formatNumber(data.velocity)} m/s</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Vận tốc thực tế qua khe</span>
                <span className={`text-lg font-bold ${result.actualVelocity <= 1.0 ? 'text-[#176b45]' : 'text-amber-600'}`}>
                  {formatNumber(result.actualVelocity)} m/s
                </span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Tiêu chuẩn: 0.6 – 1.0 m/s</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Tổn thất cột áp h<sub>L</sub></span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.headLossMm)} mm</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Kirschmer (sạch)</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
              {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
              <div className="text-xs space-y-1">
                <span className="font-bold">{result.pass ? 'Thiết kế song chắn rác đạt tiêu chuẩn thủy lực' : 'Chưa đạt yêu cầu vận tốc qua khe'}</span>
                <p>
                  Vận tốc dòng chảy qua khe đạt {formatNumber(result.actualVelocity)} m/s. Số thanh chắn ước tính: {result.numBars} thanh, bề rộng máng {formatNumber(data.channelWidth)} m.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dimensions' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học kênh dẫn & Song chắn rác</h2>
                <p className="text-xs text-[#63776d]">Bề rộng máng dẫn, chiều sâu ngập nước và chiều cao an toàn</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Bề rộng máng dẫn B (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.1}
                  value={data.channelWidth}
                  fallbackValue={0.4}
                  onChange={(val) => handleDimensionDirect({ channelWidth: val ?? 0.4 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Chiều rộng kênh đặt song</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu mực nước h (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.05}
                  value={data.waterDepth}
                  fallbackValue={0.35}
                  onChange={(val) => handleDimensionDirect({ waterDepth: val ?? 0.35 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Mực nước ngập ứng với Q cực đại</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao an toàn h<sub>bv</sub> (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.1}
                  value={data.freeboard}
                  fallbackValue={0.25}
                  onChange={(val) => handleDimensionDirect({ freeboard: val ?? 0.25 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Chiều cao thành kênh bảo vệ</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9] grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] text-[#5a7264] block">Tổng chiều cao thành kênh H</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.totalHeight)} m</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Số thanh chắn ước tính</span>
                <span className="text-base font-bold text-[#193a2a]">{result.numBars} thanh inox</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Tổn thất áp lực khi nghẹt 50%</span>
                <span className="text-base font-bold text-amber-700">{formatNumber(result.headLossMm * 3)} mm</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & phụ kiện công nghệ Song chắn rác</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">1. Khung & Thanh song chắn rác</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Vật liệu Inox SUS 304, kích thước khe {formatNumber(data.barSpacingMm)} mm, độ dày thanh {formatNumber(data.barWidthMm)} mm, góc đặt nghiêng {formatNumber(data.angleDeg)}°. Gia công định hình chịu lực, có tay nắm cào rác.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">2. Thùng chứa rác inox đục lỗ & Cào rác</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Trang bị 01 thùng hứng rác inox SUS 304 có lỗ thoát nước đáy (thể tích ~ 0.2 m³) và cào rác thủ công cán dài chuyên dụng inox để vớt rác dễ dàng.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------- 2. BỂ LẮNG CÁT -----------------
  if (isGritChamber) {
    const rawData = unit.data?.gritChamber || {
      qh: qPeakHour ? roundTo(qPeakHour, 2) : 5,
      qhOverride: false,
      retentionSeconds: 60,
      horizontalVelocity: 0.3,
      settlingVelocityMmS: 20,
      waterDepth: 0.6,
      freeboard: 0.3,
      length: 2.0,
      width: 0.8,
      dimensionsOverride: false,
    };

    const data: GritChamberData = {
      ...rawData,
      qh: rawData.qh !== null && rawData.qh !== undefined ? roundTo(rawData.qh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
      retentionSeconds: roundTo(rawData.retentionSeconds, 0),
      horizontalVelocity: roundTo(rawData.horizontalVelocity, 2),
      settlingVelocityMmS: roundTo(rawData.settlingVelocityMmS, 1),
      waterDepth: roundTo(rawData.waterDepth, 2),
      freeboard: roundTo(rawData.freeboard, 2),
      length: roundTo(rawData.length, 2),
      width: roundTo(rawData.width, 2),
    };

    const result = calculateGritChamber(data);

    const handleChange = (updates: Partial<GritChamberData>) => {
      const merged = { ...data, ...updates };
      const auto = updateAutoGritChamberDimensions(merged);
      const res = calculateGritChamber(auto);
      onUpdate({ ...unit.data, gritChamber: auto }, res.valid && res.pass ? 'done' : 'pending');
    };

    const handleDimensionDirect = (updates: Partial<GritChamberData>) => {
      const merged = { ...data, ...updates, dimensionsOverride: true };
      const res = calculateGritChamber(merged);
      onUpdate({ ...unit.data, gritChamber: merged }, res.valid && res.pass ? 'done' : 'pending');
    };

    const resetFlow = () => {
      const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5;
      handleChange({ qh, qhOverride: false });
    };

    const autoDimension = () => {
      const adjusted = updateAutoGritChamberDimensions({ ...data, dimensionsOverride: false });
      const res = calculateGritChamber(adjusted);
      onUpdate({ ...unit.data, gritChamber: adjusted }, res.valid && res.pass ? 'done' : 'pending');
    };

    return (
      <div className="space-y-6">
        {activeTab === 'input' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế Bể lắng cát (Grit Chamber)</h2>
                <p className="text-xs text-[#63776d]">
                  Tiêu chuẩn TCVN 7957:2008 & Metcalf & Eddy: Lắng hạt cát có kích thước d ≥ 0.2 mm
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
                    step={0.01}
                    min={0}
                    allowNull
                    value={data.qh !== null && data.qh !== undefined ? data.qh : null}
                    onChange={(val) =>
                      handleChange({
                        qh: val,
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
                    Thời gian lưu nước t (giây)
                  </label>
                  <NumericInput
                    step={5}
                    min={10}
                    value={data.retentionSeconds}
                    fallbackValue={60}
                    onChange={(val) => handleChange({ retentionSeconds: val ?? 60 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 45 – 90 giây</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Vận tốc dòng ngang v<sub>h</sub> (m/s)
                  </label>
                  <NumericInput
                    step={0.05}
                    min={0.05}
                    value={data.horizontalVelocity}
                    fallbackValue={0.3}
                    onChange={(val) => handleChange({ horizontalVelocity: val ?? 0.3 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Khuyên dùng 0.25 – 0.3 m/s để tránh lắng chất hữu cơ</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calc' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kết quả kiểm tra thủy lực Bể lắng cát</h2>
                <p className="text-xs text-[#63776d]">Kiểm tra thể tích, tải trọng bề mặt và sản lượng cát thu gom</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  showFormula('Công thức tính thủy lực Bể lắng cát', [
                    'Thể tích hữu dụng: Vyc = (Qh / 3600) · t (m³)',
                    'Diện tích mặt bằng: F = Vyc / H (m²)',
                    'Vận tốc dòng chảy ngang: vh = Qs / (B · H) (m/s)',
                    'Lượng cát lắng ước tính: Wcat = 0.03 · Qngay / 1000 (m³/ngày) theo TCVN 7957',
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
                <span className="text-[10px] text-[#788e81] block mt-0.5">Lưu thực tế: {formatNumber(result.actualRetentionSeconds)} s</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Vận tốc ngang thực tế</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.actualVelocity)} m/s</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Tiêu chuẩn: ~ 0.3 m/s</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Lượng cát dự kiến sinh ra</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.gritYieldPerDayLiters)} L/ngày</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Định mức 0.03 L/m³</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
              {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
              <div className="text-xs space-y-1">
                <span className="font-bold">{result.pass ? 'Kích thước bể lắng cát thỏa mãn yêu cầu' : 'Thể tích thực tế nhỏ hơn thể tích yêu cầu'}</span>
                <p>
                  Thời gian lưu thực tế đạt {formatNumber(result.actualRetentionSeconds)} giây (yêu cầu ≥ {formatNumber(data.retentionSeconds)} giây).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dimensions' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học Bể lắng cát</h2>
                <p className="text-xs text-[#63776d]">Chiều dài, chiều rộng, chiều sâu nước và chiều cao an toàn</p>
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
                  step={0.1}
                  min={0.3}
                  value={data.length}
                  fallbackValue={2.0}
                  onChange={(val) => handleDimensionDirect({ length: val ?? 2.0 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều rộng B (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.2}
                  value={data.width}
                  fallbackValue={0.8}
                  onChange={(val) => handleDimensionDirect({ width: val ?? 0.8 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.1}
                  value={data.waterDepth}
                  fallbackValue={0.6}
                  onChange={(val) => handleDimensionDirect({ waterDepth: val ?? 0.6 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao bảo vệ H<sub>bv</sub> (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.1}
                  value={data.freeboard}
                  fallbackValue={0.3}
                  onChange={(val) => handleDimensionDirect({ freeboard: val ?? 0.3 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9] grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] text-[#5a7264] block">Tổng chiều cao thành bể H<sub>tổng</sub></span>
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
            <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & phụ kiện Bể lắng cát</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">1. Phễu lắng & Bơm hút cát</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Đáy bể có bố trí hố vát thu cát góc 45°–60°. Đối với hệ thống tự động, trang bị 01 bơm chìm hút cát cánh hở chống mài mòn cao (High Chrome Alloy) hoặc van xả cát đáy thủ công.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">2. Máng tràn thu nước trong</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Máng thu nước sau lắng bằng Inox SUS 304 có tấm chắn váng bề mặt ở đầu ra để ngăn chất nổi trôi sang công trình kế tiếp.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------- 3. BỂ TÁCH DẦU MỠ -----------------
  const rawData = unit.data?.greaseTrap || {
    qh: qPeakHour ? roundTo(qPeakHour, 2) : 5,
    qhOverride: false,
    retentionMinutes: 20,
    surfaceOverflowRate: 3.5,
    waterDepth: 1.2,
    freeboard: 0.3,
    length: 2.5,
    width: 0.9,
    dimensionsOverride: false,
  };

  const data: GreaseTrapData = {
    ...rawData,
    qh: rawData.qh !== null && rawData.qh !== undefined ? roundTo(rawData.qh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
    retentionMinutes: roundTo(rawData.retentionMinutes, 0),
    surfaceOverflowRate: roundTo(rawData.surfaceOverflowRate, 1),
    waterDepth: roundTo(rawData.waterDepth, 2),
    freeboard: roundTo(rawData.freeboard, 2),
    length: roundTo(rawData.length, 2),
    width: roundTo(rawData.width, 2),
  };

  const result = calculateGreaseTrap(data);

  const handleChange = (updates: Partial<GreaseTrapData>) => {
    const merged = { ...data, ...updates };
    const auto = updateAutoGreaseTrapDimensions(merged);
    const res = calculateGreaseTrap(auto);
    onUpdate({ ...unit.data, greaseTrap: auto }, res.valid && res.pass ? 'done' : 'pending');
  };

  const handleDimensionDirect = (updates: Partial<GreaseTrapData>) => {
    const merged = { ...data, ...updates, dimensionsOverride: true };
    const res = calculateGreaseTrap(merged);
    onUpdate({ ...unit.data, greaseTrap: merged }, res.valid && res.pass ? 'done' : 'pending');
  };

  const resetFlow = () => {
    const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5;
    handleChange({ qh, qhOverride: false });
  };

  const autoDimension = () => {
    const adjusted = updateAutoGreaseTrapDimensions({ ...data, dimensionsOverride: false });
    const res = calculateGreaseTrap(adjusted);
    onUpdate({ ...unit.data, greaseTrap: adjusted }, res.valid && res.pass ? 'done' : 'pending');
  };

  return (
    <div className="space-y-6">
      {activeTab === 'input' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế Bể tách dầu mỡ (Grease Trap)</h2>
              <p className="text-xs text-[#63776d]">
                Tiêu chuẩn TCVN 7957:2008 & Metcalf & Eddy: Tách dầu mỡ khoáng và mỡ động thực vật tự nhiên
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
                  step={0.01}
                  min={0}
                  allowNull
                  value={data.qh !== null && data.qh !== undefined ? data.qh : null}
                  onChange={(val) =>
                    handleChange({
                      qh: val,
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
                  Thời gian lưu nước t (phút)
                </label>
                <NumericInput
                  step={1}
                  min={5}
                  value={data.retentionMinutes}
                  fallbackValue={20}
                  onChange={(val) => handleChange({ retentionMinutes: val ?? 20 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Khuyên dùng: 15 – 30 phút</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Tải trọng bề mặt q₀ (m³/m²·h)
                </label>
                <NumericInput
                  step={0.1}
                  min={1.0}
                  value={data.surfaceOverflowRate}
                  fallbackValue={3.5}
                  onChange={(val) => handleChange({ surfaceOverflowRate: val ?? 3.5 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Tiêu chuẩn: ≤ 4.5 m³/m²·h</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calc' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Kết quả kiểm tra thủy lực Bể tách dầu mỡ</h2>
              <p className="text-xs text-[#63776d]">Tính toán theo TCVN 7957:2008 & Metcalf & Eddy</p>
            </div>
            <button
              type="button"
              onClick={() =>
                showFormula('Công thức tính Bể tách dầu mỡ', [
                  'Thể tích hữu dụng theo thời gian lưu: V = Qh · (t / 60) (m³)',
                  'Diện tích bề mặt theo tải trọng thủy lực: F = Qh / q0 (m²)',
                  'Kiểm tra thời gian nổi của giọt dầu đường kính d ≥ 100 μm',
                  'Vận tốc dòng chảy ngang: vh ≤ 0.01 m/s (tránh cuốn trôi váng dầu)',
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
              <span className="text-[11px] font-semibold text-[#5a7264] block">Tải trọng bề mặt thực tế</span>
              <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.actualQ0)} m³/m²·h</span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">Yêu cầu ≤ {formatNumber(data.surfaceOverflowRate)}</span>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
              <span className="text-[11px] font-semibold text-[#5a7264] block">Hiệu suất tách mỡ dự kiến</span>
              <span className="text-lg font-bold text-[#176b45]">70 – 85 %</span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">Tách mỡ tự do nổi</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
            {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
            <div className="text-xs space-y-1">
              <span className="font-bold">{result.pass ? 'Bể tách dầu mỡ đạt yêu cầu thủy lực' : 'Chưa đạt thể tích yêu cầu'}</span>
              <p>
                Thể tích thực tế {formatNumber(result.actualVolume)} m³ (yêu cầu {formatNumber(result.requiredVolume)} m³). Thời gian lưu đạt {formatNumber(result.actualRetentionMin)} phút.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dimensions' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học Bể tách dầu mỡ</h2>
              <p className="text-xs text-[#63776d]">Chiều dài, chiều rộng, chiều sâu nước và vách ngăn nổi</p>
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
                step={0.1}
                min={0.5}
                value={data.length}
                fallbackValue={2.5}
                onChange={(val) => handleDimensionDirect({ length: val ?? 2.5 })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Chiều rộng B (m)</label>
              <NumericInput
                step={0.05}
                min={0.3}
                value={data.width}
                fallbackValue={0.9}
                onChange={(val) => handleDimensionDirect({ width: val ?? 0.9 })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
              <NumericInput
                step={0.05}
                min={0.3}
                value={data.waterDepth}
                fallbackValue={1.2}
                onChange={(val) => handleDimensionDirect({ waterDepth: val ?? 1.2 })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Chiều cao bảo vệ H<sub>bv</sub> (m)</label>
              <NumericInput
                step={0.05}
                min={0.1}
                value={data.freeboard}
                fallbackValue={0.3}
                onChange={(val) => handleDimensionDirect({ freeboard: val ?? 0.3 })}
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
          <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & phụ kiện Bể tách dầu mỡ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
              <span className="text-xs font-bold text-[#1e4532]">1. Vách ngăn bán ngập Inox SUS 304</span>
              <p className="text-xs text-[#52665a] leading-relaxed">
                Hệ 03 ngăn: Ngăn thu rác - Ngăn tách mỡ chính - Ngăn nước trong ra. Vách chắn ngập 2/3 chiều sâu nước để giữ hoàn toàn váng mỡ trên bề mặt và cho nước trong luồn xuống đáy thoát ra.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
              <span className="text-xs font-bold text-[#1e4532]">2. Giỏ lọc rác & Cần vớt mỡ / Cần hút mỡ</span>
              <p className="text-xs text-[#52665a] leading-relaxed">
                Trang bị 01 giỏ chắn cặn thức ăn đầu vào, nắp thăm kín gioăng chống mùi hôi phát tán, và máng gom dầu mỡ bề mặt có van xả mỡ định kỳ.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Wind,
  Calculator,
  CheckCircle2,
  FileText,
  Sliders,
  Layers,
  Activity,
  Fan,
  FileSpreadsheet,
  FileCheck2,
} from 'lucide-react';
import { formatNumber, getDecimalDigits } from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface AirEmissionDesignPageProps {
  onBackToDomains: () => void;
  projectName?: string;
}

type AirDesignTool = 'hood' | 'ductFan' | 'scrubber' | 'baghouse' | 'summary';

export const AirEmissionDesignPage: React.FC<AirEmissionDesignPageProps> = ({
  onBackToDomains,
  projectName = 'Dự án xử lý khí thải',
}) => {
  const precision = getDecimalDigits();
  const [selectedTool, setSelectedTool] = useState<AirDesignTool | null>(null);
  const [activeTab, setActiveTab] = useState<'calc' | 'result'>('calc');

  // 1. CAPTURE HOOD (CHỤP HÚT & LƯU LƯỢNG)
  const [hood, setHood] = useState({
    sourceType: 'Bể mạ / Bể tẩy gỉ axit nóng',
    hoodType: 'Chụp loe trên mặt thoáng (Canopy Hood)',
    sourceLengthM: 1.5, // m
    sourceWidthM: 1.0, // m
    distanceFromSourceX: 0.5, // m (khoảng cách từ nguồn đến miệng chụp)
    captureVelocityVc: 0.8, // m/s (ACGIH: 0.5 - 1.2 m/s)
    safetyFactor: 1.15,
  });

  // ACGIH Canopy Hood formula: Q = 1.4 * P * X * Vc or Q = Vc * (10*X^2 + A)
  const hoodAreaM2 =
    (hood.sourceLengthM + 2 * hood.distanceFromSourceX * 0.4) *
    (hood.sourceWidthM + 2 * hood.distanceFromSourceX * 0.4);
  const hoodFlowM3S =
    hood.captureVelocityVc *
    (10 * Math.pow(hood.distanceFromSourceX, 2) + hoodAreaM2) *
    hood.safetyFactor;
  const designAirFlowM3H = Math.round(hoodFlowM3S * 3600); // m3/h

  // 2. DUCT SIZING & FAN SELECTION (MẠNG ĐƯỜNG ỐNG & QUẠT)
  const [duct, setDuct] = useState({
    gasVelocityMs: 16, // m/s (14-18 m/s cho khí, 18-22 m/s cho bụi)
    ductLengthM: 35, // m
    elbowCount90: 4, // co 90 độ
    damperCount: 2, // van gió
    airDensityKgM3: 1.2, // kg/m3 (ở 25°C)
    fanEfficiency: 0.72,
    motorSafetyFactor: 1.2,
  });

  const ductDiamMeter = Math.sqrt((4 * (designAirFlowM3H / 3600)) / (Math.PI * duct.gasVelocityMs));
  const ductDiamMm = Math.round(ductDiamMeter * 1000);
  const standardDuctMm = Math.ceil(ductDiamMm / 50) * 50; // Quy chuẩn ống tròn mm

  // Pressure drops
  const frictionFactorLambda = 0.02; // Hệ số ma sát ống tôn/nhựa
  const dynamicPressurePa = 0.5 * duct.airDensityKgM3 * Math.pow(duct.gasVelocityMs, 2);
  const straightFrictionDropPa =
    frictionFactorLambda * (duct.ductLengthM / (standardDuctMm / 1000)) * dynamicPressurePa;
  const localLossCoeffZeta = duct.elbowCount90 * 0.35 + duct.damperCount * 0.25 + 0.5;
  const localDropPa = localLossCoeffZeta * dynamicPressurePa;
  const equipmentDropPa = 1250; // Tổn thất qua tháp đệm / túi lọc (Pa)
  const totalPressureDropPa = straightFrictionDropPa + localDropPa + equipmentDropPa;
  const fanTotalPressurePa = Math.round(totalPressureDropPa * 1.15); // Dự phòng 15%
  const fanMotorPowerKw =
    ((designAirFlowM3H / 3600) * fanTotalPressurePa) /
    (1000 * duct.fanEfficiency) *
    duct.motorSafetyFactor;

  // 3. PACKED BED ABSORPTION SCRUBBER (THÁP ĐỆM HẤP THỤ)
  const [scrubber, setScrubber] = useState({
    targetGas: 'SO₂ & HCl (Khí axit)',
    superficialVelocityMs: 1.4, // m/s (1.0 - 1.8 m/s)
    packingType: 'Đệm cầu Tellerette / Vòng Pall Ring PP 50mm',
    specificSurfaceAreaM2M3: 125, // m2/m3
    packingHeightM: 2.2, // m (chiều cao lớp đệm)
    liquidToGasRatioLperM3: 2.8, // L dung dịch / m3 khí
    operatingHoursDay: 16,
    naohStockPercent: 32, // Xút 32%
  });

  const scrubberTowerDiamM = Math.sqrt(
    (4 * (designAirFlowM3H / 3600)) / (Math.PI * scrubber.superficialVelocityMs)
  );
  const scrubberTotalHeightM = scrubber.packingHeightM + 1.2 + 0.8 + 0.6;
  const recircPumpFlowM3H = (designAirFlowM3H * scrubber.liquidToGasRatioLperM3) / 1000;
  const naohDailyKg =
    (designAirFlowM3H * 0.00065 * scrubber.operatingHoursDay * 1.25) / 0.32;

  // 4. BAGHOUSE DUST COLLECTOR (LỌC BỤI TÚI VẢI)
  const [baghouse, setBaghouse] = useState({
    airToClothRatioMMin: 1.2, // m/min (1.0 - 1.4)
    bagDiameterMm: 135, // mm
    bagLengthM: 2.8, // m
    pulsePressureBar: 5.0, // bar khí nén
    cleaningIntervalSec: 20, // giây
  });

  const baghouseTotalFilterAreaM2 = designAirFlowM3H / 60 / baghouse.airToClothRatioMMin;
  const singleBagAreaM2 = Math.PI * (baghouse.bagDiameterMm / 1000) * baghouse.bagLengthM;
  const totalBagsCount = Math.ceil(baghouseTotalFilterAreaM2 / singleBagAreaM2);
  const rowsCount = 8;
  const colsCount = Math.ceil(totalBagsCount / rowsCount);
  const actualBagsCount = rowsCount * colsCount;

  // -------------------------------------------------------------------------
  // MỨC 1: DANH MỤC CÁC Ô CHỨC NĂNG THIẾT KẾ KHÍ THẢI (GIỐNG NƯỚC THẢI)
  // -------------------------------------------------------------------------
  if (selectedTool === null) {
    return (
      <div className="max-w-[1180px] mx-auto px-4 py-8 pb-20 animate-fadeIn space-y-8">
        {/* Back button */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={onBackToDomains}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Quay lại 4 lĩnh vực</span>
          </button>
        </div>

        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#176b45]">
            PHÂN HỆ KỸ THUẬT KHÍ THẢI
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#193d2c] tracking-tight">
            Công cụ thiết kế xử lý khí thải
          </h1>
          <p className="text-xs sm:text-sm text-[#64786d] leading-relaxed">
            Chọn nhóm chức năng để tiếp tục làm việc trong dự án hiện tại.
          </p>
        </div>

        {/* Grid of Tools (Giống hoàn toàn cấu trúc ô của Nước thải) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Ô 1: CHỤP HÚT & LƯU LƯỢNG */}
          <div
            onClick={() => setSelectedTool('hood')}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Chụp hút & Lưu lượng
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    ACGIH Standard
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Thiết kế chụp loe Canopy, chụp khe hở hoặc buồng kín, tính toán vận tốc bắt khí Vc và lưu lượng khí hút thiết kế Q (m³/h).
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở tính chụp hút</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 2: MẠNG ĐƯỜNG ỐNG & QUẠT HÚT */}
          <div
            onClick={() => setSelectedTool('ductFan')}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Fan className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Đường ống & Quạt hút
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                    v = 14-18 m/s
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Tính toán đường kính ống tiêu chuẩn Φ mm, tổn thất áp suất ma sát + cục bộ, tổng cột áp quạt hút Hquat (Pa) và công suất động cơ (kW).
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở thủy lực ống & quạt</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 3: THÁP HẤP THỤ SCRUBBER */}
          <div
            onClick={() => setSelectedTool('scrubber')}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Tháp hấp thụ Scrubber
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                    Khử SOx/HCl/Mùi
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Thiết kế tháp đệm hấp thụ Pall Ring/Tellerette, đường kính tháp, chiều cao đệm, bơm tuần hoàn dung dịch và định lượng xút NaOH 32%.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở thiết kế Scrubber</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 4: LỌC BỤI TÚI VẢI */}
          <div
            onClick={() => setSelectedTool('baghouse')}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Lọc bụi túi vải Baghouse
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    Pulse-Jet
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Tính toán diện tích vải lọc (Air-to-Cloth ratio), số lượng túi lọc Φ135 x 2.8m, bố trí ma trận hàng x cột và giũ bụi khí nén 5 bar.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở thiết kế túi lọc vải</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 5: BÁO CÁO THUYẾT MINH TỔNG HỢP */}
          <div
            onClick={() => setSelectedTool('summary')}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group md:col-span-2 lg:col-span-2"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Báo cáo & Bảng thông số hệ thống khí thải
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                    QCVN 19:2009
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Tổng hợp thông số kích thước cơ bản, thông số lưu lượng, cột áp quạt và thiết bị phục vụ hồ sơ thẩm định môi trường.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Xem bảng tổng hợp thông số kỹ thuật</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tool Titles & Metadata
  const toolMeta: Record<AirDesignTool, { title: string; tag: string; icon: any }> = {
    hood: {
      title: '1. Chụp Hút & Xác Định Lưu Lượng Khí Thải',
      tag: 'ACGIH Standard',
      icon: FileSpreadsheet,
    },
    ductFan: {
      title: '2. Mạng Đường Ống & Chọn Quạt Hút Khí Thải',
      tag: 'v = 14-18 m/s',
      icon: Fan,
    },
    scrubber: {
      title: '3. Thiết Kế Tháp Đệm Hấp Thụ Scrubber',
      tag: 'Khử SOx/HCl/Mùi',
      icon: Layers,
    },
    baghouse: {
      title: '4. Hệ Thống Lọc Bụi Túi Vải Baghouse',
      tag: 'Pulse-Jet 5 bar',
      icon: Activity,
    },
    summary: {
      title: '5. Báo Cáo Kỹ Thuật & Bảng Kích Thước Tổng Hợp',
      tag: 'QCVN 19:2009/BTNMT',
      icon: FileCheck2,
    },
  };

  const currentToolMeta = selectedTool ? toolMeta[selectedTool] : toolMeta.hood;
  const ToolIcon = currentToolMeta.icon;

  // -------------------------------------------------------------------------
  // MỨC 2: MÀN HÌNH TÍNH TOÁN CHI TIẾT TỪNG CHỨC NĂNG
  // -------------------------------------------------------------------------
  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 pb-24 animate-fadeIn space-y-6">
      {/* Top Header with Back to Tools button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-[#cfded4]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setSelectedTool(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#cbd8d0] bg-white hover:bg-[#edf5f0] text-[#193d2c] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
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
                <h1 className="text-base sm:text-lg font-extrabold text-[#193d2c]">
                  {currentToolMeta.title}
                </h1>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  {currentToolMeta.tag}
                </span>
              </div>
              <p className="text-xs text-[#63776d]">
                Dự án: <strong className="text-[#193d2c]">{projectName}</strong> | Phân hệ Xử lý Khí Thải & Bụi
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* THANH CHUYỂN TÍNH TOÁN VÀ KẾT QUẢ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-[#f4f8f5] rounded-2xl border border-[#cfded4]">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 bg-[#e2ede6] p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('calc')}
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'calc'
                ? 'bg-[#176b45] text-white shadow-xs'
                : 'text-[#385444] hover:bg-white/60'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Tính toán</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('result')}
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'result'
                ? 'bg-[#176b45] text-white shadow-xs'
                : 'text-[#385444] hover:bg-white/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kết quả</span>
          </button>
        </div>

        <div className="text-xs text-[#526b5d] font-medium px-2 text-center sm:text-left">
          {activeTab === 'calc'
            ? 'Nhập và hiệu chỉnh thông số thiết kế kỹ thuật'
            : 'Xem kết quả tính toán chi tiết, quy cách thiết bị & kiểm tra chuẩn'}
        </div>
      </div>

      {/* 1. HOOD & FLOW */}
      {selectedTool === 'hood' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#176b45]" />
                <span>Thông Số Nguồn Thải & Chụp Hút ACGIH</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Nguồn phát thải khí:</label>
                    <input
                      type="text"
                      value={hood.sourceType}
                      onChange={(e) => setHood({ ...hood, sourceType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Kiểu chụp hút:</label>
                    <select
                      value={hood.hoodType}
                      onChange={(e) => setHood({ ...hood, hoodType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-medium"
                    >
                      <option value="Chụp loe trên mặt thoáng (Canopy Hood)">Chụp loe trên mặt thoáng (Canopy Hood)</option>
                      <option value="Chụp hút bên cạnh khe hở (Side/Slot Hood)">Chụp hút bên cạnh khe hở (Side/Slot Hood)</option>
                      <option value="Buồng kín có cửa thao tác (Enclosure Booth)">Buồng kín có cửa thao tác (Enclosure Booth)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Chiều dài nguồn (m):</label>
                    <NumericInput
                      step="0.1"
                      min={0}
                      defaultValue={1}
                      value={hood.sourceLengthM}
                      onChange={(val) => setHood({ ...hood, sourceLengthM: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Chiều rộng nguồn (m):</label>
                    <NumericInput
                      step="0.1"
                      min={0}
                      defaultValue={1}
                      value={hood.sourceWidthM}
                      onChange={(val) => setHood({ ...hood, sourceWidthM: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Khoảng cách hút X (m):</label>
                    <NumericInput
                      step="0.05"
                      min={0}
                      defaultValue={0.3}
                      value={hood.distanceFromSourceX}
                      onChange={(val) => setHood({ ...hood, distanceFromSourceX: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                    <span className="text-[10px] text-[#718779]">Khoảng cách từ nguồn đến miệng chụp</span>
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Vận tốc bắt khí Vc (m/s):</label>
                    <NumericInput
                      step="0.1"
                      min={0}
                      defaultValue={0.5}
                      value={hood.captureVelocityVc}
                      onChange={(val) => setHood({ ...hood, captureVelocityVc: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                    <span className="text-[10px] text-[#718779]">ACGIH: 0.5 - 1.2 m/s</span>
                  </div>
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Lưu lượng khí hút tính toán sơ bộ:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold font-mono text-[#176b45]">
                      {designAirFlowM3H.toLocaleString()} m³/h
                    </span>
                    <span className="text-xs text-[#526b5d]">({formatNumber(hoodFlowM3S, precision)} m³/s)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
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
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a]">
                  Kết Quả Tính Toán Chụp Hút & Lưu Lượng Thiết Kế
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('calc')}
                  className="text-xs font-semibold text-[#176b45] hover:underline cursor-pointer"
                >
                  ← Sửa đổi thông số tính toán
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[#f8faf8] border border-[#d8e6de] rounded-xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-[#556b5d] block">Lưu lượng khí hút thiết kế (Q):</span>
                    <span className="text-3xl font-extrabold font-mono text-[#176b45]">
                      {designAirFlowM3H.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-[#176b45] ml-1.5">m³/h</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#556b5d] block">Lưu lượng theo giây:</span>
                    <span className="text-2xl font-extrabold font-mono text-blue-700">
                      {formatNumber(hoodFlowM3S, precision)}
                    </span>
                    <span className="text-xs font-semibold text-blue-700 ml-1.5">m³/s</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-[#f8faf8] border border-[#dce8e0] rounded-xl">
                    <span className="text-[#64796e] block">Diện tích miệng chụp hút:</span>
                    <strong className="text-base font-mono text-[#183b2a]">
                      {formatNumber(hoodAreaM2, precision)} m²
                    </strong>
                  </div>
                  <div className="p-3.5 bg-[#f8faf8] border border-[#dce8e0] rounded-xl">
                    <span className="text-[#64796e] block">Hệ số dự phòng an toàn:</span>
                    <strong className="text-base font-mono text-[#183b2a]">
                      {(hood.safetyFactor * 100).toFixed(0)}%
                    </strong>
                  </div>
                  <div className="p-3.5 bg-[#f8faf8] border border-[#dce8e0] rounded-xl">
                    <span className="text-[#64796e] block">Vận tốc bắt khí kiểm tra:</span>
                    <strong className="text-base font-mono text-[#176b45]">
                      {hood.captureVelocityVc} m/s (Đạt ACGIH)
                    </strong>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <strong className="font-bold block mb-1">Khuyến nghị kỹ thuật chụp hút:</strong>
                  Chụp hút cần bố trí mép vát nghiêng 45° - 60° và phủ rộng hơn mép nguồn phát thải tối thiểu 100 - 150 mm mỗi bên để ngăn khói/hơi độc tản ra xưởng làm việc.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. DUCT & FAN SIZING */}
      {selectedTool === 'ductFan' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Fan className="w-4 h-4 text-[#176b45]" />
                <span>Thông Số Mạng Đường Ống & Quạt Hút</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Vận tốc gió trong ống (m/s):</label>
                  <NumericInput
                    step="0.5"
                    min={1}
                    defaultValue={16}
                    value={duct.gasVelocityMs}
                    onChange={(val) => setDuct({ ...duct, gasVelocityMs: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                  <span className="text-[10px] text-[#718779]">Khí: 14-18 m/s | Bụi: 18-22 m/s</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Chiều dài ống dẫn (m):</label>
                  <NumericInput
                    min={1}
                    defaultValue={20}
                    value={duct.ductLengthM}
                    onChange={(val) => setDuct({ ...duct, ductLengthM: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Số lượng co cút 90°:</label>
                  <NumericInput
                    min={0}
                    defaultValue={0}
                    value={duct.elbowCount90}
                    onChange={(val) => setDuct({ ...duct, elbowCount90: Math.round(val) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Hiệu suất quạt hút (η):</label>
                  <NumericInput
                    step="0.05"
                    min={0.1}
                    max={1}
                    defaultValue={0.7}
                    value={duct.fanEfficiency}
                    onChange={(val) => setDuct({ ...duct, fanEfficiency: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Tính toán nhanh:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold font-mono text-[#183a2a]">
                      Ống Φ {standardDuctMm} mm
                    </span>
                    <span className="text-lg font-bold font-mono text-blue-700">
                      Cột áp: {fanTotalPressurePa} Pa
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-800">
                      Động cơ: {formatNumber(fanMotorPowerKw, precision)} kW
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
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
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a]">
                  Kết Quả Đường Kính Ống & Công Suất Quạt Hút
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('calc')}
                  className="text-xs font-semibold text-[#176b45] hover:underline cursor-pointer"
                >
                  ← Sửa đổi thông số tính toán
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Đường kính ống tính toán:</span>
                  <span className="text-xl font-bold font-mono text-[#183a2a]">
                    Φ {ductDiamMm} mm
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Quy chuẩn ống chế tạo:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    Φ {standardDuctMm} mm
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Tổng cột áp quạt hút (Hquat):</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {fanTotalPressurePa} Pa
                  </span>
                  <span className="text-[11px] text-[#63776d] block font-mono">
                    ~ {formatNumber(fanTotalPressurePa / 9.81, precision)} mmH₂O
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Công suất động cơ quạt:</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {formatNumber(fanMotorPowerKw, precision)} kW
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SCRUBBER */}
      {selectedTool === 'scrubber' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#176b45]" />
                <span>Thông Số Thiết Kế Tháp Hấp Thụ Dạng Đệm (Scrubber)</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Khí ô nhiễm xử lý:</label>
                  <select
                    value={scrubber.targetGas}
                    onChange={(e) => setScrubber({ ...scrubber, targetGas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-medium"
                  >
                    <option value="SO₂ & HCl (Khí axit)">SO₂ & HCl (Khí axit lò đốt / tẩy rửa mạ)</option>
                    <option value="H₂S & Mercaptan (Khí mùi hữu cơ)">H₂S & Mercaptan (Khí mùi hữu cơ rác / phân bón)</option>
                    <option value="NH₃ (Khí amoniac kiềm)">NH₃ (Khí amoniac kiềm - hấp thụ bằng nước/axit)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Vận tốc khí trong tháp (m/s):</label>
                    <NumericInput
                      step="0.1"
                      min={0.1}
                      defaultValue={1.4}
                      value={scrubber.superficialVelocityMs}
                      onChange={(val) => setScrubber({ ...scrubber, superficialVelocityMs: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                    <span className="text-[10px] text-[#718779]">Chuẩn: 1.0 - 1.8 m/s</span>
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Chiều cao lớp đệm H (m):</label>
                    <NumericInput
                      step="0.1"
                      min={0.5}
                      defaultValue={2}
                      value={scrubber.packingHeightM}
                      onChange={(val) => setScrubber({ ...scrubber, packingHeightM: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Tỷ lệ tưới lỏng/khí L/G (L/m³):</label>
                    <NumericInput
                      step="0.2"
                      min={0.5}
                      defaultValue={2.5}
                      value={scrubber.liquidToGasRatioLperM3}
                      onChange={(val) => setScrubber({ ...scrubber, liquidToGasRatioLperM3: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                    <span className="text-[10px] text-[#718779]">Chuẩn: 2.0 - 4.0 L/m³</span>
                  </div>
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Tính toán nhanh kích thước tháp:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold font-mono text-[#176b45]">
                      Φ {formatNumber(scrubberTowerDiamM, precision)} m
                    </span>
                    <span className="text-lg font-bold font-mono text-[#183a2a]">
                      Cao {formatNumber(scrubberTotalHeightM, precision)} m
                    </span>
                    <span className="text-lg font-bold font-mono text-blue-700">
                      Bơm tưới: {formatNumber(recircPumpFlowM3H, precision)} m³/h
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
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
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a]">
                  Kết Quả Kích Thước Tháp & Bơm Tuần Hoàn Scrubber
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('calc')}
                  className="text-xs font-semibold text-[#176b45] hover:underline cursor-pointer"
                >
                  ← Sửa đổi thông số tính toán
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Đường kính tháp Scrubber (D):</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    Φ {formatNumber(scrubberTowerDiamM, precision)} m
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Chiều cao toàn tháp (H):</span>
                  <span className="text-xl font-bold font-mono text-[#183a2a]">
                    {formatNumber(scrubberTotalHeightM, precision)} m
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Lưu lượng bơm tuần hoàn:</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {formatNumber(recircPumpFlowM3H, precision)} m³/h
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Ước tính NaOH 32% bổ sung:</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    ~ {formatNumber(naohDailyKg, precision)} kg/ngày
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. BAGHOUSE */}
      {selectedTool === 'baghouse' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#176b45]" />
                <span>Thông Số Thiết Kế Hệ Thống Lọc Bụi Túi Vải (Baghouse)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Tải trọng lọc vải (m/min):</label>
                  <NumericInput
                    step="0.1"
                    min={0.1}
                    defaultValue={1.2}
                    value={baghouse.airToClothRatioMMin}
                    onChange={(val) => setBaghouse({ ...baghouse, airToClothRatioMMin: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                  <span className="text-[10px] text-[#718779]">Chuẩn: 1.0 - 1.4 m/min</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Đường kính túi lọc (mm):</label>
                  <NumericInput
                    min={50}
                    defaultValue={135}
                    value={baghouse.bagDiameterMm}
                    onChange={(val) => setBaghouse({ ...baghouse, bagDiameterMm: Math.round(val) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Chiều dài túi lọc L (m):</label>
                  <NumericInput
                    step="0.1"
                    min={0.5}
                    defaultValue={2.5}
                    value={baghouse.bagLengthM}
                    onChange={(val) => setBaghouse({ ...baghouse, bagLengthM: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Áp lực khí nén giũ bụi (bar):</label>
                  <NumericInput
                    step="0.5"
                    min={1}
                    defaultValue={5}
                    value={baghouse.pulsePressureBar}
                    onChange={(val) => setBaghouse({ ...baghouse, pulsePressureBar: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Tính toán nhanh túi lọc:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold font-mono text-[#176b45]">
                      Diện tích lọc: {formatNumber(baghouseTotalFilterAreaM2, precision)} m²
                    </span>
                    <span className="text-lg font-bold font-mono text-blue-700">
                      Số túi: {actualBagsCount} ({rowsCount}x{colsCount})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
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
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a]">
                  Kết Quả Quy Cách & Số Lượng Túi Lọc Vải
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('calc')}
                  className="text-xs font-semibold text-[#176b45] hover:underline cursor-pointer"
                >
                  ← Sửa đổi thông số tính toán
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Tổng diện tích lọc vải cần:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(baghouseTotalFilterAreaM2, precision)} m²
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Diện tích 1 túi lọc:</span>
                  <span className="text-xl font-bold font-mono text-[#183a2a]">
                    {formatNumber(singleBagAreaM2, precision)} m²
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Số lượng túi lọc bố trí:</span>
                  <span className="text-2xl font-extrabold font-mono text-blue-700">
                    {actualBagsCount} túi
                  </span>
                  <span className="text-xs text-[#55695e] block mt-0.5">
                    (Bố trí ma trận {rowsCount} hàng x {colsCount} cột, van giũ khí nén xung kích Pulse-Jet)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. SUMMARY TABLE */}
      {selectedTool === 'summary' && (
        <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#193d2c]">
              Bảng Tổng Hợp Kích Thước & Thông Số Kỹ Thuật Hệ Thống Khí Thải
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f0f6f2] text-[#183b2a] border-y border-[#d2e2d8]">
                  <th className="p-2.5 font-bold">STT</th>
                  <th className="p-2.5 font-bold">Hạng mục công trình</th>
                  <th className="p-2.5 font-bold">Số lượng</th>
                  <th className="p-2.5 font-bold">Quy cách & Kích thước</th>
                  <th className="p-2.5 font-bold">Thông số công nghệ chính</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4ede8] text-[#2c4035]">
                <tr>
                  <td className="p-2.5 font-mono">1</td>
                  <td className="p-2.5 font-semibold">Chụp hút khí ô nhiễm ACGIH</td>
                  <td className="p-2.5">1 cụm</td>
                  <td className="p-2.5 font-mono">Miệng chụp S = {formatNumber(hoodAreaM2, precision)} m²</td>
                  <td className="p-2.5">Vc = {hood.captureVelocityVc} m/s, Q = {designAirFlowM3H.toLocaleString()} m³/h</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono">2</td>
                  <td className="p-2.5 font-semibold">Mạng đường ống dẫn khí</td>
                  <td className="p-2.5">Tuyến ống {duct.ductLengthM} m</td>
                  <td className="p-2.5 font-mono">Ống tròn Φ{standardDuctMm} mm</td>
                  <td className="p-2.5">v = {duct.gasVelocityMs} m/s, Tổn thất áp suất tổng = {fanTotalPressurePa} Pa</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono">3</td>
                  <td className="p-2.5 font-semibold">Quạt hút khí ly tâm</td>
                  <td className="p-2.5">1 quạt chính (+1 dự phòng)</td>
                  <td className="p-2.5 font-mono">Động cơ {formatNumber(fanMotorPowerKw, precision)} kW</td>
                  <td className="p-2.5">Q = {designAirFlowM3H.toLocaleString()} m³/h, H = {fanTotalPressurePa} Pa (~ {formatNumber(fanTotalPressurePa / 9.81, precision)} mmH₂O)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono">4</td>
                  <td className="p-2.5 font-semibold">Tháp đệm hấp thụ Scrubber</td>
                  <td className="p-2.5">1 tháp</td>
                  <td className="p-2.5 font-mono">Φ{formatNumber(scrubberTowerDiamM, precision)} m x Cao {formatNumber(scrubberTotalHeightM, precision)} m</td>
                  <td className="p-2.5">Đệm Tellerette 50mm dày {scrubber.packingHeightM}m, Bơm tưới {formatNumber(recircPumpFlowM3H, precision)} m³/h</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono">5</td>
                  <td className="p-2.5 font-semibold">Thiết bị lọc bụi túi vải Pulse-Jet</td>
                  <td className="p-2.5">{actualBagsCount} túi lọc</td>
                  <td className="p-2.5 font-mono">Φ{baghouse.bagDiameterMm} x L={baghouse.bagLengthM} m</td>
                  <td className="p-2.5">Diện tích lọc {formatNumber(baghouseTotalFilterAreaM2, precision)} m², Khí nén {baghouse.pulsePressureBar} bar</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

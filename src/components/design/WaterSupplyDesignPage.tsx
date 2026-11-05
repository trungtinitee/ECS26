import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Droplets,
  Calculator,
  CheckCircle2,
  FileText,
  Sliders,
  Layers,
  Activity,
  ShieldCheck,
  FileSpreadsheet,
  Workflow,
  Compass,
  FileCheck2,
} from 'lucide-react';
import { formatNumber, getDecimalDigits } from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface WaterSupplyDesignPageProps {
  onBackToDomains: () => void;
  projectName?: string;
}

type WaterDesignTool =
  | 'capacity'
  | 'mixing'
  | 'flocculation'
  | 'lamella'
  | 'filter'
  | 'disinfection'
  | 'summary';

export const WaterSupplyDesignPage: React.FC<WaterSupplyDesignPageProps> = ({
  onBackToDomains,
  projectName = 'Dự án cấp nước',
}) => {
  const precision = getDecimalDigits();
  const [selectedTool, setSelectedTool] = useState<WaterDesignTool | null>(null);
  const [activeTab, setActiveTab] = useState<'calc' | 'result'>('calc');

  // 1. CAPACITY & DEMAND
  const [capacity, setCapacity] = useState({
    waterSource: 'Nước mặt (Sông/Hồ)',
    population: 25000, // người
    waterStandardLDay: 150, // L/người.ngày
    lossPercent: 12, // % thất thoát rò rỉ mạng lưới
    plantUsePercent: 6, // % nước dùng cho bản thân trạm xử lý
    industrialWaterM3Day: 500, // Nhu cầu CN/thương mại
    kDayMax: 1.25, // Hệ số không điều hòa ngày Kngày.max
    kHourMax: 1.4, // Hệ số không điều hòa giờ Kgiờ.max
    operatingHours: 24, // giờ/ngày
  });

  // Calculations for Capacity
  const domesticWaterM3Day = (capacity.population * capacity.waterStandardLDay) / 1000;
  const netWaterM3Day = domesticWaterM3Day + capacity.industrialWaterM3Day;
  const grossFactor = 1 + (capacity.lossPercent + capacity.plantUsePercent) / 100;
  const qAverageDay = netWaterM3Day * grossFactor; // m3/ngày
  const qMaxDay = qAverageDay * capacity.kDayMax; // m3/ngày
  const qMaxHour = (qMaxDay / capacity.operatingHours) * capacity.kHourMax; // m3/h
  const qDesignSec = (qMaxDay / (capacity.operatingHours * 3600)) * 1000; // L/s

  // 2. RAPID MIXING TANK (BỂ TRỘN)
  const [mixing, setMixing] = useState({
    mixingType: 'Cơ học cánh khuấy trục đứng',
    retentionTimeSec: 45, // 30-60s
    tankDepthM: 2.0, // m
    velocityGradientG: 850, // s-1 (700-1000)
    waterViscosityMu: 0.001002, // Pa.s (ở 20°C)
    motorEfficiency: 0.82,
  });

  const mixingVolumeM3 = (qMaxDay / (capacity.operatingHours * 3600)) * mixing.retentionTimeSec;
  const mixingAreaM2 = mixingVolumeM3 / mixing.tankDepthM;
  const mixingSideM = Math.sqrt(mixingAreaM2);
  const mixingPowerWatts =
    Math.pow(mixing.velocityGradientG, 2) * mixing.waterViscosityMu * mixingVolumeM3;
  const mixingMotorKw = mixingPowerWatts / (1000 * mixing.motorEfficiency);

  // 3. FLOCCULATION TANK (BỂ TẠO BÔNG)
  const [floc, setFloc] = useState({
    flocType: 'Cơ học cánh khuấy 3 ngăn nối tiếp',
    retentionTimeMin: 25, // 20-30 phút
    chamberCount: 3,
    waterDepthM: 3.0, // m
    tankWidthM: 3.5, // m
    g1: 55, // s-1 (ngăn 1)
    g2: 35, // s-1 (ngăn 2)
    g3: 20, // s-1 (ngăn 3)
  });

  const flocVolumeM3 = (qMaxDay / (capacity.operatingHours * 60)) * floc.retentionTimeMin;
  const flocTotalLengthM = flocVolumeM3 / (floc.tankWidthM * floc.waterDepthM);
  const flocChamberLengthM = flocTotalLengthM / floc.chamberCount;

  // 4. LAMELLA CLARIFIER (BỂ LẮNG LAMEN)
  const [lamella, setLamella] = useState({
    tankCount: 2, // Đơn nguyên
    surfaceLoadingRateMh: 7.5, // u0 = 6-9 m/h
    plateAngleDeg: 60, // 60 độ
    plateSpacingMm: 50, // mm
    sludgeHopperHeightM: 1.5, // m
    freeboardM: 0.5,
  });

  const lamellaFlowPerTankM3H = (qMaxDay / capacity.operatingHours) / lamella.tankCount;
  const lamellaNetAreaM2 = lamellaFlowPerTankM3H / lamella.surfaceLoadingRateMh;
  const lamellaWidthM = 3.5;
  const lamellaLengthM = lamellaNetAreaM2 / lamellaWidthM;
  const lamellaTotalHeightM = 3.2 + lamella.sludgeHopperHeightM + lamella.freeboardM;

  // 5. RAPID SAND FILTER (BỂ LỌC NHANH CÁT THẠCH ANH)
  const [filter, setFilter] = useState({
    filterCount: 4, // Số bể lọc
    filtrationRateMh: 7.0, // Tốc độ lọc danh định 6-8 m/h
    sandDepthM: 0.65, // Cát thạch anh 0.5-0.7m
    anthraciteDepthM: 0.35, // Than antraxít 0.3-0.4m
    gravelSupportDepthM: 0.4, // Sỏi đỡ 4 tầng
    washWaterIntensityLsM2: 14, // Cường độ rửa nước 12-16 L/s.m2
    washAirIntensityLsM2: 18, // Cường độ rửa gió 15-20 L/s.m2
    washWaterMinutes: 6,
    washAirMinutes: 4,
  });

  const totalFilterAreaM2 = (qMaxDay / capacity.operatingHours) / filter.filtrationRateMh;
  const areaPerFilterM2 = totalFilterAreaM2 / filter.filterCount;
  const filterWidthM = 2.8;
  const filterLengthM = areaPerFilterM2 / filterWidthM;
  const washPumpFlowM3H = areaPerFilterM2 * filter.washWaterIntensityLsM2 * 3.6;
  const washAirBlowerM3Min = (areaPerFilterM2 * filter.washAirIntensityLsM2 * 60) / 1000;

  // 6. DISINFECTION & CLEAR WATER CONTACT (BỂ TIẾP XÚC CLO)
  const [disinfection, setDisinfection] = useState({
    chlorineDosePpm: 2.2, // mg Cl2/L (1.5 - 2.5)
    contactTimeMinutes: 30, // >= 30 phút
    waterDepthM: 3.0,
    tankWidthM: 4.0,
    bafflePasses: 4, // Vách ngăn zíc-zắc chống ngắn mạch
    naoclStockPercent: 10, // Javel thương phẩm 10%
  });

  const disinfectionVolumeM3 =
    (qMaxDay / (capacity.operatingHours * 60)) * disinfection.contactTimeMinutes;
  const disinfectionLengthM =
    disinfectionVolumeM3 / (disinfection.tankWidthM * disinfection.waterDepthM);
  const pureChlorineKgDay = (qMaxDay * disinfection.chlorineDosePpm) / 1000;
  const naocl10KgDay = pureChlorineKgDay / (disinfection.naoclStockPercent / 100);
  const naocl10LitersDay = naocl10KgDay / 1.15; // Tỷ trọng Javel 10% ~ 1.15 kg/L



  // -------------------------------------------------------------------------
  // MỨC 1: DANH MỤC CÁC Ô CHỨC NĂNG THIẾT KẾ NƯỚC CẤP (GIỐNG NƯỚC THẢI)
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
            PHÂN HỆ KỸ THUẬT NƯỚC CẤP
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#193d2c] tracking-tight">
            Công cụ thiết kế nước cấp
          </h1>
          <p className="text-xs sm:text-sm text-[#64786d] leading-relaxed">
            Chọn nhóm chức năng để tiếp tục làm việc trong dự án hiện tại.
          </p>
        </div>

        {/* Grid of Tools (Giống hoàn toàn cấu trúc ô của Nước thải) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Ô 1: NHU CẦU & CÔNG SUẤT TRẠM */}
          <div
            onClick={() => {
              setSelectedTool('capacity');
              setActiveTab('calc');
            }}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Công suất & Nhu cầu
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    TCVN 33:2006
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Tính toán nhu cầu nước sinh hoạt đô thị, nước công nghiệp, tỷ lệ thất thoát mạng lưới và xác định Qngày.tb, Qngày.max, Qgiờ.max.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở tính công suất trạm</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 2: BỂ TRỘN NHANH */}
          <div
            onClick={() => {
              setSelectedTool('mixing');
              setActiveTab('calc');
            }}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Bể trộn nhanh hóa chất
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                    G = 700-1000 s⁻¹
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Thiết kế bể trộn cơ học cánh khuấy trục đứng hoặc vách ngăn thủy lực, thời gian lưu 30-60s, gradient vận tốc G và công suất động cơ.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở thiết kế bể trộn</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 3: BỂ TẠO BÔNG */}
          <div
            onClick={() => {
              setSelectedTool('flocculation');
              setActiveTab('calc');
            }}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sliders className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Bể phản ứng tạo bông
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                    3 ngăn giảm tốc
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Bể tạo bông cánh khuấy 3 ngăn nối tiếp với gradient vận tốc giảm dần (G1=55, G2=35, G3=20 s⁻¹), thời gian tạo bông 20-30 phút.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở thiết kế bể tạo bông</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 4: BỂ LẮNG LAMEN */}
          <div
            onClick={() => {
              setSelectedTool('lamella');
              setActiveTab('calc');
            }}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Bể lắng Lamen tải trọng cao
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                    u₀ = 6 - 9 m/h
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Thiết kế bể lắng tấm nghiêng 60°, diện tích biểu kiến, kích thước mặt bằng đơn nguyên và thể tích hố thu bùn đáy côn.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở thiết kế bể lắng lamen</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 5: BỂ LỌC NHANH */}
          <div
            onClick={() => {
              setSelectedTool('filter');
              setActiveTab('calc');
            }}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Droplets className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Bể lọc nhanh cát thạch anh
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    v = 6 - 8 m/h
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Thiết kế bể lọc cát nhanh hai lớp (than antraxít + cát thạch anh + sỏi đỡ), hệ thống phân phối nước đáy và thủy lực rửa ngược nước + gió.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở thiết kế bể lọc cát</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 6: KHỬ TRÙNG CLO */}
          <div
            onClick={() => {
              setSelectedTool('disinfection');
              setActiveTab('calc');
            }}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Khử trùng Clo & Bể tiếp xúc
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    t ≥ 30 phút
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Bể tiếp xúc có vách ngăn zíc-zắc chống ngắn mạch, tính toán liều lượng Clo hoạt tính nguyên chất và thể tích dung dịch Javel 10% tiêu hao.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở thiết kế khử trùng</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 7: BÁO CÁO THUYẾT MINH TỔNG HỢP */}
          <div
            onClick={() => {
              setSelectedTool('summary');
              setActiveTab('calc');
            }}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group lg:col-span-3"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Báo cáo & Bảng kích thước tổng hợp trạm cấp nước
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                    TCVN 33:2006
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Tổng hợp toàn bộ bảng thông số kích thước cơ bản, thể tích, công suất thiết bị của toàn bộ trạm nước cấp.
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
  const toolMeta: Record<WaterDesignTool, { title: string; tag: string; icon: any }> = {
    capacity: {
      title: '1. Tính Toán Công Suất Trạm & Nhu Cầu Nước',
      tag: 'TCVN 33:2006',
      icon: FileSpreadsheet,
    },
    mixing: {
      title: '2. Thiết Kế Bể Trộn Nhanh Hóa Chất Keo Tụ',
      tag: 'G = 700 - 1000 s⁻¹',
      icon: Activity,
    },
    flocculation: {
      title: '3. Thiết Kế Bể Phản Ứng Tạo Bông 3 Ngăn',
      tag: 'Giảm tốc 3 ngăn',
      icon: Sliders,
    },
    lamella: {
      title: '4. Thiết Kế Bể Lắng Lamen Tải Trọng Cao',
      tag: 'u₀ = 6 - 9 m/h',
      icon: Layers,
    },
    filter: {
      title: '5. Thiết Kế Bể Lọc Nhanh Cát Thạch Anh',
      tag: 'v = 6 - 8 m/h',
      icon: Droplets,
    },
    disinfection: {
      title: '6. Thiết Kế Hệ Thống Khử Trùng Clo & Bể Tiếp Xúc',
      tag: 't ≥ 30 phút',
      icon: ShieldCheck,
    },
    summary: {
      title: '7. Báo Cáo & Bảng Kích Thước Tổng Hợp Trạm Cấp Nước',
      tag: 'TCVN 33:2006',
      icon: FileCheck2,
    },
  };

  const currentToolMeta = selectedTool ? toolMeta[selectedTool] : toolMeta.capacity;
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
              <span>← Quay lại công cụ nước cấp</span>
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs shrink-0">
              <ToolIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-[#193d2c]">
                  {currentToolMeta.title}
                </h1>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  {currentToolMeta.tag}
                </span>
              </div>
              <p className="text-xs text-[#63776d]">
                Dự án: <strong className="text-[#193d2c]">{projectName}</strong> | Phân hệ Xử lý Nước Cấp
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
            : 'Xem kết quả tính toán chi tiết, quy cách công trình & kiểm tra chuẩn'}
        </div>
      </div>

      {/* 1. CAPACITY & DEMAND */}
      {selectedTool === 'capacity' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#176b45]" />
                <span>Thông số Nguồn nước & Nhu cầu Cấp nước</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Nguồn nước thô:</label>
                  <select
                    value={capacity.waterSource}
                    onChange={(e) => setCapacity({ ...capacity, waterSource: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] bg-[#fcfdfc] font-medium"
                  >
                    <option value="Nước mặt (Sông/Hồ)">Nước mặt (Sông / Hồ - Độ đục & TSS biến động)</option>
                    <option value="Nước ngầm (Giếng khoan)">Nước ngầm (Giếng khoan - Cần xử lý Sắt/Mangan/Độ cứng)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Quy mô dân số (người):</label>
                    <NumericInput
                      min={0}
                      defaultValue={10000}
                      value={capacity.population}
                      onChange={(val) => setCapacity({ ...capacity, population: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Tiêu chuẩn dùng nước (L/người·ngày):</label>
                    <NumericInput
                      min={0}
                      defaultValue={150}
                      value={capacity.waterStandardLDay}
                      onChange={(val) => setCapacity({ ...capacity, waterStandardLDay: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                    <span className="text-[10px] text-[#718779]">Đô thị loại II-IV: 120-180 L/người·ngày</span>
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Nhu cầu CN/thương mại (m³/ngày):</label>
                    <NumericInput
                      min={0}
                      defaultValue={0}
                      value={capacity.industrialWaterM3Day}
                      onChange={(val) => setCapacity({ ...capacity, industrialWaterM3Day: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Hệ số Kngày.max:</label>
                    <NumericInput
                      step="0.05"
                      min={1}
                      defaultValue={1.25}
                      value={capacity.kDayMax}
                      onChange={(val) => setCapacity({ ...capacity, kDayMax: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                    <span className="text-[10px] text-[#718779]">TCVN: 1.2 - 1.35</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Tỷ lệ rò rỉ mạng lưới (%):</label>
                    <NumericInput
                      min={0}
                      max={100}
                      defaultValue={10}
                      value={capacity.lossPercent}
                      onChange={(val) => setCapacity({ ...capacity, lossPercent: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Nước bản thân trạm (%):</label>
                    <NumericInput
                      min={0}
                      max={100}
                      defaultValue={5}
                      value={capacity.plantUsePercent}
                      onChange={(val) => setCapacity({ ...capacity, plantUsePercent: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                    <span className="text-[10px] text-[#718779]">Nước rửa lọc, pha hóa chất (5-8%)</span>
                  </div>
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Công suất tính toán:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-extrabold font-mono text-[#176b45]">
                      Qngày.max = {formatNumber(qMaxDay, precision)} m³/ngày
                    </span>
                    <span className="text-xs text-[#526b5d]">({formatNumber(qMaxHour, precision)} m³/h | {formatNumber(qDesignSec, precision)} L/s)</span>
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
                  Kết Quả Tính Toán Công Suất Trạm Cấp Nước
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
                    <span className="text-xs text-[#556b5d] block">Công suất thiết kế trung bình ngày:</span>
                    <span className="text-2xl font-extrabold font-mono text-[#176b45]">
                      {formatNumber(qAverageDay, precision)}
                    </span>
                    <span className="text-xs font-semibold text-[#176b45] ml-1.5">m³/ngày</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#556b5d] block">Qngày.max (Tính chọn công nghệ):</span>
                    <span className="text-2xl font-extrabold font-mono text-blue-700">
                      {formatNumber(qMaxDay, precision)}
                    </span>
                    <span className="text-xs font-semibold text-blue-700 ml-1.5">m³/ngày</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#f8faf8] border border-[#dce8e0] rounded-xl">
                    <span className="text-[#64796e] block">Lưu lượng giờ lớn nhất (Qmax.h):</span>
                    <strong className="text-base font-mono text-[#183b2a]">
                      {formatNumber(qMaxHour, precision)} m³/h
                    </strong>
                  </div>
                  <div className="p-3 bg-[#f8faf8] border border-[#dce8e0] rounded-xl">
                    <span className="text-[#64796e] block">Lưu lượng giây thiết kế (qgiây):</span>
                    <strong className="text-base font-mono text-[#183b2a]">
                      {formatNumber(qDesignSec, precision)} L/s
                    </strong>
                  </div>
                  <div className="p-3 bg-[#f8faf8] border border-[#dce8e0] rounded-xl">
                    <span className="text-[#64796e] block">Phân loại trạm theo TCVN 33:</span>
                    <strong className="text-base font-mono text-[#176b45]">
                      Trạm quy mô {qMaxDay > 30000 ? 'Lớn' : qMaxDay > 5000 ? 'Vừa' : 'Nhỏ'}
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed">
                  <strong className="font-bold block mb-1">Dây chuyền công nghệ đề xuất:</strong>
                  Song chắn rác → Bể trộn cơ học nhanh → Bể phản ứng tạo bông có tầng cặn/cánh khuấy → Bể lắng lamen tải trọng cao → Bể lọc nhanh cát thạch anh hai lớp → Bể tiếp xúc khử trùng Clo → Bể chứa nước sạch & Trạm bơm cấp 2.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. RAPID MIXING TANK */}
      {selectedTool === 'mixing' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#176b45]" />
                <span>Thiết kế Bể Trộn Nhanh Hóa Chất</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Loại bể trộn:</label>
                  <select
                    value={mixing.mixingType}
                    onChange={(e) => setMixing({ ...mixing, mixingType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-medium"
                  >
                    <option value="Cơ học cánh khuấy trục đứng">Cơ học cánh khuấy trục đứng (Hiệu quả cao, kiểm soát G tốt)</option>
                    <option value="Thủy lực vách ngăn zíc-zắc">Thủy lực vách ngăn zíc-zắc (Không tốn điện năng khuấy)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Thời gian lưu nước t (giây):</label>
                    <NumericInput
                      min={10}
                      defaultValue={30}
                      value={mixing.retentionTimeSec}
                      onChange={(val) => setMixing({ ...mixing, retentionTimeSec: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                    <span className="text-[10px] text-[#718779]">Tiêu chuẩn: 30 - 60 giây</span>
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Chiều sâu nước H (m):</label>
                    <NumericInput
                      step="0.1"
                      min={0.5}
                      defaultValue={2}
                      value={mixing.tankDepthM}
                      onChange={(val) => setMixing({ ...mixing, tankDepthM: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Gradient vận tốc G (s⁻¹):</label>
                    <NumericInput
                      min={100}
                      defaultValue={700}
                      value={mixing.velocityGradientG}
                      onChange={(val) => setMixing({ ...mixing, velocityGradientG: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                    <span className="text-[10px] text-[#718779]">Chuẩn: 700 - 1000 s⁻¹</span>
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Hiệu suất động cơ khuấy (η):</label>
                    <NumericInput
                      step="0.05"
                      min={0.1}
                      max={1}
                      defaultValue={0.8}
                      value={mixing.motorEfficiency}
                      onChange={(val) => setMixing({ ...mixing, motorEfficiency: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Tính toán nhanh bể trộn:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold font-mono text-[#176b45]">
                      V = {formatNumber(mixingVolumeM3, precision)} m³
                    </span>
                    <span className="text-lg font-bold font-mono text-[#183a2a]">
                      {formatNumber(mixingSideM, precision)} x {formatNumber(mixingSideM, precision)} m
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-800">
                      Động cơ: {formatNumber(mixingMotorKw, precision)} kW
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
                  Kết Quả Kích Thước & Thông Số Bể Trộn
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
                  <span className="text-[#5b7264] block">Thể tích làm việc V:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(mixingVolumeM3, precision)} m³
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Kích thước mặt bằng (Dài x Rộng):</span>
                  <span className="text-xl font-bold font-mono text-[#183a2a]">
                    {formatNumber(mixingSideM, precision)} x {formatNumber(mixingSideM, precision)} m
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Công suất thủy lực P:</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {formatNumber(mixingPowerWatts, precision)} W
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Động cơ cánh khuấy đề xuất:</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {formatNumber(mixingMotorKw, precision)} kW
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. FLOCCULATION TANK */}
      {selectedTool === 'flocculation' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#176b45]" />
                <span>Thiết kế Bể Phản Ứng Tạo Bông</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Thời gian tạo bông (phút):</label>
                    <NumericInput
                      min={5}
                      defaultValue={20}
                      value={floc.retentionTimeMin}
                      onChange={(val) => setFloc({ ...floc, retentionTimeMin: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                    <span className="text-[10px] text-[#718779]">Chuẩn: 20 - 30 phút</span>
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Số ngăn nối tiếp:</label>
                    <NumericInput
                      min={1}
                      defaultValue={3}
                      value={floc.chamberCount}
                      onChange={(val) => setFloc({ ...floc, chamberCount: Math.round(val) })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Chiều rộng bể W (m):</label>
                    <NumericInput
                      step="0.1"
                      min={0.5}
                      defaultValue={3}
                      value={floc.tankWidthM}
                      onChange={(val) => setFloc({ ...floc, tankWidthM: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Chiều sâu nước H (m):</label>
                    <NumericInput
                      step="0.1"
                      min={0.5}
                      defaultValue={3}
                      value={floc.waterDepthM}
                      onChange={(val) => setFloc({ ...floc, waterDepthM: val })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#f8faf8] border border-[#d6e5dc] rounded-xl space-y-2">
                  <span className="font-semibold text-xs text-[#193d2c] block">
                    Gradient vận tốc giảm dần qua 3 ngăn:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-[#63776d] block">G1 (s⁻¹):</label>
                      <NumericInput
                        min={10}
                        defaultValue={50}
                        value={floc.g1}
                        onChange={(val) => setFloc({ ...floc, g1: val })}
                        className="w-full px-2 py-1 rounded border text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#63776d] block">G2 (s⁻¹):</label>
                      <NumericInput
                        min={10}
                        defaultValue={30}
                        value={floc.g2}
                        onChange={(val) => setFloc({ ...floc, g2: val })}
                        className="w-full px-2 py-1 rounded border text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#63776d] block">G3 (s⁻¹):</label>
                      <NumericInput
                        min={5}
                        defaultValue={20}
                        value={floc.g3}
                        onChange={(val) => setFloc({ ...floc, g3: val })}
                        className="w-full px-2 py-1 rounded border text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Kích thước tạo bông nhanh:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold font-mono text-[#176b45]">
                      Tổng V = {formatNumber(flocVolumeM3, precision)} m³
                    </span>
                    <span className="text-lg font-bold font-mono text-[#183a2a]">
                      Dài tổng: {formatNumber(flocTotalLengthM, precision)} m
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
                  Kết Quả Kích Thước Bể Tạo Bông
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
                  <span className="text-[#5b7264] block">Tổng thể tích V:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(flocVolumeM3, precision)} m³
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Tổng chiều dài bể:</span>
                  <span className="text-xl font-bold font-mono text-[#183a2a]">
                    {formatNumber(flocTotalLengthM, precision)} m
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Kích thước mỗi ngăn ({floc.chamberCount} ngăn):</span>
                  <span className="text-base font-bold font-mono text-[#183a2a]">
                    {formatNumber(flocChamberLengthM, precision)} x {floc.tankWidthM} x {floc.waterDepthM} m
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. LAMELLA CLARIFIER */}
      {selectedTool === 'lamella' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#176b45]" />
                <span>Thiết kế Bể Lắng Lamen (Lamella Clarifier)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Số đơn nguyên bể:</label>
                  <NumericInput
                    min={1}
                    defaultValue={1}
                    value={lamella.tankCount}
                    onChange={(val) => setLamella({ ...lamella, tankCount: Math.round(val) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                  <span className="text-[10px] text-[#718779]">Nên chia 2 bể song song</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Tải trọng bề mặt u0 (m/h):</label>
                  <NumericInput
                    step="0.5"
                    min={1}
                    defaultValue={7.5}
                    value={lamella.surfaceLoadingRateMh}
                    onChange={(val) => setLamella({ ...lamella, surfaceLoadingRateMh: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                  <span className="text-[10px] text-[#718779]">Tiêu chuẩn: 6.0 - 9.0 m/h</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Góc nghiêng tấm lamen (°):</label>
                  <input
                    type="text"
                    value={lamella.plateAngleDeg}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] bg-gray-50 font-mono"
                  />
                  <span className="text-[10px] text-[#718779]">Tối ưu trượt bùn: 60°</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Chiều cao hố bùn côn (m):</label>
                  <NumericInput
                    step="0.1"
                    min={0.5}
                    defaultValue={1.5}
                    value={lamella.sludgeHopperHeightM}
                    onChange={(val) => setLamella({ ...lamella, sludgeHopperHeightM: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Tính toán nhanh bể lắng:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold font-mono text-[#176b45]">
                      {lamella.tankCount} đơn nguyên x {formatNumber(lamellaNetAreaM2, precision)} m²
                    </span>
                    <span className="text-lg font-bold font-mono text-[#183a2a]">
                      {formatNumber(lamellaLengthM, precision)} x {lamellaWidthM} x {formatNumber(lamellaTotalHeightM, precision)} m
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
                  Kết Quả Kích Thước Bể Lắng Lamen
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
                  <span className="text-[#5b7264] block">Lưu lượng 1 bể:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(lamellaFlowPerTankM3H, precision)} m³/h
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Diện tích bề mặt 1 bể:</span>
                  <span className="text-xl font-bold font-mono text-[#183a2a]">
                    {formatNumber(lamellaNetAreaM2, precision)} m²
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Kích thước 1 đơn nguyên:</span>
                  <span className="text-base font-bold font-mono text-[#183a2a]">
                    {formatNumber(lamellaLengthM, precision)} x {lamellaWidthM} x {formatNumber(lamellaTotalHeightM, precision)} m
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. RAPID SAND FILTER */}
      {selectedTool === 'filter' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#176b45]" />
                <span>Thiết kế Bể Lọc Nhanh Trọng Lực</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Số lượng bể lọc:</label>
                  <NumericInput
                    min={2}
                    defaultValue={2}
                    value={filter.filterCount}
                    onChange={(val) => setFilter({ ...filter, filterCount: Math.round(val) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                  <span className="text-[10px] text-[#718779]">Tối thiểu 2 bể</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Tốc độ lọc danh định (m/h):</label>
                  <NumericInput
                    step="0.5"
                    min={2}
                    defaultValue={7}
                    value={filter.filtrationRateMh}
                    onChange={(val) => setFilter({ ...filter, filtrationRateMh: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                  <span className="text-[10px] text-[#718779]">Tiêu chuẩn: 6.0 - 8.0 m/h</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Cường độ rửa nước (L/s·m²):</label>
                  <NumericInput
                    min={5}
                    defaultValue={14}
                    value={filter.washWaterIntensityLsM2}
                    onChange={(val) => setFilter({ ...filter, washWaterIntensityLsM2: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Cường độ rửa gió (L/s·m²):</label>
                  <NumericInput
                    min={5}
                    defaultValue={18}
                    value={filter.washAirIntensityLsM2}
                    onChange={(val) => setFilter({ ...filter, washAirIntensityLsM2: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Tính toán nhanh bể lọc:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold font-mono text-[#176b45]">
                      Tổng F = {formatNumber(totalFilterAreaM2, precision)} m² ({filter.filterCount} bể)
                    </span>
                    <span className="text-lg font-bold font-mono text-blue-700">
                      Bơm rửa: {formatNumber(washPumpFlowM3H, precision)} m³/h
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
                  Kết Quả Kích Thước & Thiết Bị Rửa Lọc
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
                  <span className="text-[#5b7264] block">Tổng diện tích lọc:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(totalFilterAreaM2, precision)} m²
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Diện tích 1 bể ({filter.filterCount} bể):</span>
                  <span className="text-xl font-bold font-mono text-[#183a2a]">
                    {formatNumber(areaPerFilterM2, precision)} m²
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Lưu lượng bơm rửa lọc:</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {formatNumber(washPumpFlowM3H, precision)} m³/h
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Lưu lượng quạt gió rửa lọc:</span>
                  <span className="text-xl font-bold font-mono text-amber-700">
                    {formatNumber(washAirBlowerM3Min, precision)} m³/phút
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. DISINFECTION */}
      {selectedTool === 'disinfection' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#176b45]" />
                <span>Thiết kế Bể Tiếp Xúc Khử Trùng Clo</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Thời gian tiếp xúc t (phút):</label>
                  <NumericInput
                    min={10}
                    defaultValue={30}
                    value={disinfection.contactTimeMinutes}
                    onChange={(val) => setDisinfection({ ...disinfection, contactTimeMinutes: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                  <span className="text-[10px] text-[#718779]">Tiêu chuẩn: tối thiểu 30 phút</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Liều lượng Clo hoạt tính (mg/L):</label>
                  <NumericInput
                    step="0.1"
                    min={0.1}
                    defaultValue={2}
                    value={disinfection.chlorineDosePpm}
                    onChange={(val) => setDisinfection({ ...disinfection, chlorineDosePpm: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                  <span className="text-[10px] text-[#718779]">Tiêu chuẩn: 1.5 - 2.5 mg/L</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Chiều sâu nước H (m):</label>
                  <NumericInput
                    step="0.1"
                    min={0.5}
                    defaultValue={3}
                    value={disinfection.waterDepthM}
                    onChange={(val) => setDisinfection({ ...disinfection, waterDepthM: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Chiều rộng bể W (m):</label>
                  <NumericInput
                    step="0.1"
                    min={0.5}
                    defaultValue={4}
                    value={disinfection.tankWidthM}
                    onChange={(val) => setDisinfection({ ...disinfection, tankWidthM: val })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono"
                  />
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Tính toán nhanh khử trùng:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold font-mono text-[#176b45]">
                      V = {formatNumber(disinfectionVolumeM3, precision)} m³
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-800">
                      Javel 10%: {formatNumber(naocl10KgDay, precision)} kg/ngày (~{formatNumber(naocl10LitersDay, precision)} L/ngày)
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
                  Kết Quả Kích Thước & Tiêu Hao Clo
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
                  <span className="text-[#5b7264] block">Thể tích bể tiếp xúc V:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(disinfectionVolumeM3, precision)} m³
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Chiều dài bể (Rộng {disinfection.tankWidthM}m):</span>
                  <span className="text-xl font-bold font-mono text-[#183a2a]">
                    {formatNumber(disinfectionLengthM, precision)} m
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Clo nguyên chất tiêu thụ:</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {formatNumber(pureChlorineKgDay, precision)} kg/ngày
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Javel 10% tiêu hao:</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {formatNumber(naocl10KgDay, precision)} kg/ngày
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. SUMMARY TABLE */}
      {selectedTool === 'summary' && (
        <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#193d2c]">
              Bảng Tổng Hợp Kích Thước & Thông Số Kỹ Thuật Trạm Nước Cấp
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f0f6f2] text-[#183b2a] border-y border-[#d2e2d8]">
                  <th className="p-2.5 font-bold">STT</th>
                  <th className="p-2.5 font-bold">Hạng mục công trình</th>
                  <th className="p-2.5 font-bold">Số lượng</th>
                  <th className="p-2.5 font-bold">Kích thước cơ bản (D x R x C)</th>
                  <th className="p-2.5 font-bold">Thể tích (m³)</th>
                  <th className="p-2.5 font-bold">Thông số công nghệ chính</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4ede8] text-[#2c4035]">
                <tr>
                  <td className="p-2.5 font-mono">1</td>
                  <td className="p-2.5 font-semibold">Bể trộn nhanh cơ học</td>
                  <td className="p-2.5">1 bể</td>
                  <td className="p-2.5 font-mono">{formatNumber(mixingSideM, precision)} x {formatNumber(mixingSideM, precision)} x {mixing.tankDepthM} m</td>
                  <td className="p-2.5 font-mono">{formatNumber(mixingVolumeM3, precision)}</td>
                  <td className="p-2.5">t = {mixing.retentionTimeSec}s, G = {mixing.velocityGradientG} s⁻¹, Động cơ {formatNumber(mixingMotorKw, precision)} kW</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono">2</td>
                  <td className="p-2.5 font-semibold">Bể tạo bông cánh khuấy</td>
                  <td className="p-2.5">3 ngăn</td>
                  <td className="p-2.5 font-mono">{formatNumber(flocTotalLengthM, precision)} x {floc.tankWidthM} x {floc.waterDepthM} m</td>
                  <td className="p-2.5 font-mono">{formatNumber(flocVolumeM3, precision)}</td>
                  <td className="p-2.5">t = {floc.retentionTimeMin} phút, G1-G2-G3 giảm dần</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono">3</td>
                  <td className="p-2.5 font-semibold">Bể lắng Lamen tải trọng cao</td>
                  <td className="p-2.5">{lamella.tankCount} đơn nguyên</td>
                  <td className="p-2.5 font-mono">{formatNumber(lamellaLengthM, precision)} x {lamellaWidthM} x {formatNumber(lamellaTotalHeightM, precision)} m/bể</td>
                  <td className="p-2.5 font-mono">{formatNumber(lamellaNetAreaM2 * 3.0, precision)}</td>
                  <td className="p-2.5">u0 = {lamella.surfaceLoadingRateMh} m/h, Tấm nghiêng 60°</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono">4</td>
                  <td className="p-2.5 font-semibold">Bể lọc nhanh cát thạch anh</td>
                  <td className="p-2.5">{filter.filterCount} bể</td>
                  <td className="p-2.5 font-mono">{formatNumber(filterLengthM, precision)} x {filterWidthM} x 3.5 m/bể</td>
                  <td className="p-2.5 font-mono">{formatNumber(totalFilterAreaM2, precision)} m² lọc</td>
                  <td className="p-2.5">v = {filter.filtrationRateMh} m/h, Rửa nước {formatNumber(washPumpFlowM3H, precision)} m³/h + Gió {formatNumber(washAirBlowerM3Min, precision)} m³/phút</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono">5</td>
                  <td className="p-2.5 font-semibold">Bể tiếp xúc khử trùng Clo</td>
                  <td className="p-2.5">1 bể (zíc-zắc)</td>
                  <td className="p-2.5 font-mono">{formatNumber(disinfectionLengthM, precision)} x {disinfection.tankWidthM} x {disinfection.waterDepthM} m</td>
                  <td className="p-2.5 font-mono">{formatNumber(disinfectionVolumeM3, precision)}</td>
                  <td className="p-2.5">t = {disinfection.contactTimeMinutes} phút, Liều Clo {disinfection.chlorineDosePpm} mg/L ({formatNumber(naocl10KgDay, precision)} kg Javel 10%/ngày)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
